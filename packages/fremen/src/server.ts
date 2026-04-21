import { DuneMCP } from "@arrakis/spice";

import { DUNE_MCP_URL, DUNE_PROVIDER_ID } from "./constants.js";
import { DuneNotConnectedError } from "./errors.js";
import { refreshIfNeeded, type DuneAccountTokens } from "./refresh.js";

/**
 * The subset of Better Auth's account row shape this module cares about.
 */
export interface DuneConnectedAccount extends DuneAccountTokens {
  providerId: string;
  accountId?: string;
}

/**
 * Read Dune tokens for a given user from Better Auth's account table and
 * persist any refresh result back. Hosts wire this to the `account` table
 * via their chosen adapter; the default implementation below assumes
 * Better Auth's standard adapter shape.
 */
export interface AccountStore {
  findDuneAccount(userId: string): Promise<DuneConnectedAccount | null>;
  persistRefreshedAccount(
    userId: string,
    next: DuneConnectedAccount,
  ): Promise<void>;
}

export interface GetDuneClientOptions {
  /**
   * The authenticated session (Better Auth). Only `user.id` is required.
   */
  session: { user: { id: string } } | null | undefined;
  accountStore: AccountStore;
  /**
   * DCR'd client_id for the current deployment's redirectURI. Obtainable
   * via `plugin.$duneFremen.resolveClientId(...)`.
   */
  clientId: string;
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
 * // apps/muaddib/src/app/actions.ts
 * "use server";
 * import { getDuneClient } from "@arrakis/fremen";
 *
 * export async function fetchLiveGas() {
 *   const dune = await getDuneClient({ session, accountStore, clientId });
 *   return dune.runQueryAndWait(QUERY_ID);
 * }
 * ```
 */
export async function getDuneClient(opts: GetDuneClientOptions): Promise<DuneMCP> {
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
