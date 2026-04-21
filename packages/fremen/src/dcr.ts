import {
  DUNE_OAUTH_REGISTRATION_ENDPOINT,
} from "./constants.js";
import { DuneRegistrationError } from "./errors.js";
import type { DuneOAuthClientRow } from "./schema.js";

/**
 * Minimal surface over Better Auth's adapter that `getOrRegisterDuneClient`
 * needs. Keeping it small here lets unit tests pass a plain object; in the
 * plugin we bind a real Better Auth adapter to these methods.
 */
export interface DuneClientStore {
  findByRedirectUri(redirectUri: string): Promise<DuneOAuthClientRow | null>;
  insert(row: Omit<DuneOAuthClientRow, "id">): Promise<DuneOAuthClientRow>;
}

/**
 * Better Auth's `ctx.context.adapter` surface we actually touch. Keeping a
 * local type means we don't have to import `@better-auth/core` at build time
 * just for this bridge.
 */
interface AdapterLike {
  findOne<T>(input: {
    model: string;
    where: { field: string; value: string | number | boolean | Date }[];
  }): Promise<T | null>;
  create<T extends Record<string, unknown>, R = T>(input: {
    model: string;
    data: Omit<T, "id">;
  }): Promise<R>;
}

/**
 * Build a `DuneClientStore` backed by a Better Auth adapter. The plugin uses
 * this to persist DCR results to the host's `duneOAuthClient` table.
 */
export function duneClientStoreFromAdapter(
  adapter: AdapterLike,
): DuneClientStore {
  return {
    async findByRedirectUri(redirectUri) {
      return await adapter.findOne<DuneOAuthClientRow>({
        model: "duneOAuthClient",
        where: [{ field: "redirectUri", value: redirectUri }],
      });
    },
    async insert(row) {
      return await adapter.create<DuneOAuthClientRow>({
        model: "duneOAuthClient",
        data: row,
      });
    },
  };
}

export interface GetOrRegisterOptions {
  store: DuneClientStore;
  redirectUri: string;
  appName: string;
  /** Override the registration endpoint for testing / sovereign deployments. */
  endpoint?: string;
  /** Injected `fetch` implementation for unit tests. */
  fetchImpl?: typeof fetch;
}

const inFlight = new Map<string, Promise<string>>();

/**
 * Return the Dune `client_id` registered for `redirectUri`, running DCR on
 * miss. Concurrent calls for the same redirectUri in the same process share
 * one registration round-trip via an in-memory promise map; multi-instance
 * deployments may register twice, which is benign — the extra client_id is
 * harmless and the store's `redirectUri` unique index keeps reads
 * deterministic.
 *
 * @example
 * ```ts
 * const clientId = await getOrRegisterDuneClient({
 *   store,
 *   redirectUri: "https://example.com/api/auth/oauth2/callback/dune",
 *   appName: "My App",
 * });
 * ```
 */
export async function getOrRegisterDuneClient(
  opts: GetOrRegisterOptions,
): Promise<string> {
  const cached = await opts.store.findByRedirectUri(opts.redirectUri);
  if (cached) return cached.clientId;

  const existing = inFlight.get(opts.redirectUri);
  if (existing) return existing;

  const promise = registerOnce(opts).finally(() => {
    inFlight.delete(opts.redirectUri);
  });
  inFlight.set(opts.redirectUri, promise);
  return promise;
}

async function registerOnce(opts: GetOrRegisterOptions): Promise<string> {
  // Re-check after await boundary — another call may have registered while
  // we were queued.
  const cached = await opts.store.findByRedirectUri(opts.redirectUri);
  if (cached) return cached.clientId;

  const endpoint = opts.endpoint ?? DUNE_OAUTH_REGISTRATION_ENDPOINT;
  const fetchImpl = opts.fetchImpl ?? fetch;

  const body = {
    client_name: opts.appName,
    redirect_uris: [opts.redirectUri],
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  };

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new DuneRegistrationError("DCR request to Dune failed at the network layer.", {
      cause,
    });
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new DuneRegistrationError(
      `DCR rejected by Dune (HTTP ${response.status}).`,
      { status: response.status, body: bodyText },
    );
  }

  const parsed = (await response.json().catch(() => null)) as
    | { client_id?: unknown }
    | null;
  const clientId = parsed?.client_id;
  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new DuneRegistrationError("DCR response did not include a client_id.", {
      status: response.status,
      body: parsed,
    });
  }

  await opts.store.insert({
    clientId,
    redirectUri: opts.redirectUri,
    appName: opts.appName,
    createdAt: new Date(),
  });

  return clientId;
}

/**
 * Test-only: flush the in-memory DCR concurrency cache. Shouldn't be needed
 * in application code.
 */
export function __resetDcrCacheForTests(): void {
  inFlight.clear();
}
