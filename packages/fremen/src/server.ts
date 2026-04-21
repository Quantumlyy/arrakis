import { DuneMCP } from "@arrakis/spice";

import { DUNE_MCP_URL, DUNE_PROVIDER_ID } from "./constants.js";
import { DuneNotConnectedError } from "./errors.js";
import type { DuneFremenMeta } from "./plugin.js";
import { refreshIfNeeded, type DuneAccountTokens } from "./refresh.js";

/**
 * The subset of Better Auth's account row shape this module cares about.
 */
export interface DuneConnectedAccount extends DuneAccountTokens {
  providerId: string;
  accountId?: string;
}

/**
 * Account-table bridge used by {@link getDuneClientWithStore}. Hosts only
 * need to wire this when they want to sidestep the `auth`-instance-driven
 * default (e.g. for unit tests).
 */
export interface AccountStore {
  findDuneAccount(userId: string): Promise<DuneConnectedAccount | null>;
  persistRefreshedAccount(
    userId: string,
    next: DuneConnectedAccount,
  ): Promise<void>;
}

/**
 * Shape of a Better Auth instance we actually touch. Kept narrow so we don't
 * have to import `better-auth`'s full return type — the real thing exposes
 * both `$context` and `options` and is entirely compatible.
 */
export interface BetterAuthLike {
  $context: Promise<{
    adapter: Parameters<
      NonNullable<DuneFremenMeta["resolveClientId"]>
    >[0] extends infer A
      ? A
      : unknown;
    internalAdapter: {
      findAccountByProviderId(
        accountId: string,
        providerId: string,
      ): Promise<{
        id: string;
        userId: string;
        providerId: string;
        accountId?: string | null;
        accessToken?: string | null;
        refreshToken?: string | null;
        accessTokenExpiresAt?: Date | null;
      } | null>;
      findAccountByUserId(userId: string): Promise<
        Array<{
          id: string;
          userId: string;
          providerId: string;
          accountId?: string | null;
          accessToken?: string | null;
          refreshToken?: string | null;
          accessTokenExpiresAt?: Date | null;
        }>
      >;
      updateAccount(
        id: string,
        data: Record<string, unknown>,
      ): Promise<unknown>;
    };
  }>;
  options: {
    plugins?: Array<{ id?: string } & Record<string, unknown>>;
  };
}

export interface GetDuneClientOptions {
  /**
   * The Better Auth instance returned from `betterAuth({...})`. fremen reads
   * the DCR-resolved `client_id` and the account row via this.
   */
  auth: BetterAuthLike;
  /** The authenticated session. Only `user.id` is required. */
  session: { user: { id: string } } | null | undefined;
  /** Override MCP URL for sovereign deployments / tests. */
  mcpUrl?: string;
  /** Override current-time source for tests. */
  now?: () => number;
}

/**
 * Return a `DuneMCP` instance scoped to the current user. The returned
 * client uses the user's OAuth access token (refreshing it if needed) so
 * every tool call burns *their* Dune credits.
 *
 * Throws {@link DuneNotConnectedError} when the session has no linked Dune
 * account. Host apps should catch this and render their connect UI rather
 * than treating it as a server error.
 *
 * @example
 * ```ts
 * // apps/muaddib/src/app/page.tsx
 * const session = await auth.api.getSession({ headers: await headers() });
 * try {
 *   const dune = await getDuneClient({ auth, session });
 *   const rows = await dune.runQueryAndWait(queryId);
 * } catch (err) {
 *   if (err instanceof DuneNotConnectedError) {
 *     // fall back to the anonymous path
 *   } else throw err;
 * }
 * ```
 */
export async function getDuneClient(
  opts: GetDuneClientOptions,
): Promise<DuneMCP> {
  if (!opts.session?.user?.id) {
    throw new DuneNotConnectedError(
      "No authenticated session — user must sign in before connecting Dune.",
    );
  }

  const meta = findDuneFremenMeta(opts.auth);
  if (!meta) {
    throw new Error(
      "@arrakis/fremen: duneConnection() plugin not found on the provided `auth` instance.",
    );
  }

  const authCtx = await opts.auth.$context;
  const clientId = await meta.resolveClientId(authCtx.adapter);

  const userId = opts.session.user.id;
  const row = await authCtx.internalAdapter.findAccountByProviderId(
    userId,
    DUNE_PROVIDER_ID,
  );
  if (!row || row.userId !== userId) {
    throw new DuneNotConnectedError();
  }
  if (!row.accessToken) {
    throw new DuneNotConnectedError(
      "Dune account row is missing an access token — user must reconnect.",
    );
  }

  const tokens = await refreshIfNeeded({
    account: {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken ?? null,
      accessTokenExpiresAt: row.accessTokenExpiresAt ?? null,
    },
    clientId,
    now: opts.now,
  });

  if (tokens.refreshed) {
    await authCtx.internalAdapter.updateAccount(row.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    });
  }

  return new DuneMCP({
    mcpUrl: opts.mcpUrl ?? DUNE_MCP_URL,
    getAccessToken: async () => tokens.accessToken,
  });
}

function findDuneFremenMeta(auth: BetterAuthLike): DuneFremenMeta | undefined {
  const plugin = auth.options.plugins?.find(
    (p): p is typeof p & { $duneFremen: DuneFremenMeta } =>
      Boolean(p && typeof p === "object" && "$duneFremen" in p),
  );
  return plugin?.$duneFremen;
}

/**
 * Lower-level variant of {@link getDuneClient} that lets the caller wire an
 * arbitrary `AccountStore` and `clientId`. Useful in unit tests; host apps
 * should prefer {@link getDuneClient}.
 */
export interface GetDuneClientWithStoreOptions {
  session: { user: { id: string } } | null | undefined;
  accountStore: AccountStore;
  clientId: string;
  mcpUrl?: string;
  now?: () => number;
}

export async function getDuneClientWithStore(
  opts: GetDuneClientWithStoreOptions,
): Promise<DuneMCP> {
  if (!opts.session?.user?.id) {
    throw new DuneNotConnectedError(
      "No authenticated session — user must sign in before connecting Dune.",
    );
  }
  const account = await opts.accountStore.findDuneAccount(opts.session.user.id);
  if (!account || account.providerId !== DUNE_PROVIDER_ID) {
    throw new DuneNotConnectedError();
  }

  const tokens = await refreshIfNeeded({
    account,
    clientId: opts.clientId,
    now: opts.now,
  });

  if (tokens.refreshed) {
    await opts.accountStore.persistRefreshedAccount(opts.session.user.id, {
      ...account,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    });
  }

  return new DuneMCP({
    mcpUrl: opts.mcpUrl ?? DUNE_MCP_URL,
    getAccessToken: async () => tokens.accessToken,
  });
}
