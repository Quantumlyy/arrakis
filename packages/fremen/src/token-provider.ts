import {
  refreshIfNeeded,
  type DuneAccountTokens,
  type RefreshedTokens,
} from "./refresh.js";

export interface RefreshingTokenProviderOptions {
  /** The token state observed when the provider was built. */
  initial: DuneAccountTokens;
  /** DCR-resolved client_id used for the refresh grant. */
  clientId: string;
  /**
   * Write fresh tokens back to the host's account store. Called only when
   * `refreshIfNeeded` actually hit Dune — i.e. `refreshed === true`.
   */
  persist: (refreshed: RefreshedTokens) => Promise<void>;
  /** Override current time for tests. */
  now?: () => number;
  /** Override the refresh endpoint's `fetch` for tests. */
  fetchImpl?: typeof fetch;
}

/**
 * Build a `getAccessToken` closure suitable for `new DuneMCP({ getAccessToken })`.
 *
 * The provider re-checks the stored expiry on every call, so a long-lived
 * `DuneMCP` instance keeps sending valid tokens past Dune's 5-minute access
 * token life. Concurrent callers share one in-flight refresh cycle rather
 * than each firing their own round-trip.
 */
export function createRefreshingTokenProvider(
  opts: RefreshingTokenProviderOptions,
): () => Promise<string> {
  let state: DuneAccountTokens = { ...opts.initial };
  let inFlight: Promise<string> | undefined;

  async function cycle(): Promise<string> {
    const result = await refreshIfNeeded({
      account: state,
      clientId: opts.clientId,
      now: opts.now,
      fetchImpl: opts.fetchImpl,
    });
    if (result.refreshed) {
      state = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      };
      await opts.persist(result);
    }
    return result.accessToken;
  }

  return async function getAccessToken(): Promise<string> {
    if (!inFlight) {
      inFlight = cycle().finally(() => {
        inFlight = undefined;
      });
    }
    return inFlight;
  };
}
