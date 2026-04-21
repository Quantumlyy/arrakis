import { DUNE_OAUTH_TOKEN_ENDPOINT, REFRESH_BUFFER_MS } from "./constants.js";
import { DuneRefreshError } from "./errors.js";

/**
 * The subset of a Better Auth `account` row this module cares about. Keeping
 * the interface local means tests don't depend on Better Auth's full types.
 */
export interface DuneAccountTokens {
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
}

export interface RefreshIfNeededOptions {
  account: DuneAccountTokens;
  clientId: string;
  /** Override for unit tests and private deployments. */
  endpoint?: string;
  fetchImpl?: typeof fetch;
  /** Override current time in unit tests. Defaults to `Date.now()`. */
  now?: () => number;
}

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshed: boolean;
}

/**
 * If the stored access token is valid for more than {@link REFRESH_BUFFER_MS},
 * return it as-is. Otherwise POST a `refresh_token` grant to Dune and return
 * the fresh pair. Callers are expected to persist the result back to their
 * account row when `refreshed === true`.
 */
export async function refreshIfNeeded(
  opts: RefreshIfNeededOptions,
): Promise<RefreshedTokens> {
  const now = opts.now ?? Date.now;
  const { account } = opts;

  const expiresAtMs = account.accessTokenExpiresAt?.getTime();
  const stillFresh =
    expiresAtMs !== undefined && expiresAtMs - REFRESH_BUFFER_MS > now();

  if (stillFresh && account.refreshToken) {
    return {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt!,
      refreshed: false,
    };
  }

  if (!account.refreshToken) {
    throw new DuneRefreshError(
      "Dune access token is stale and no refresh token is available — user must reconnect.",
    );
  }

  return refreshTokens({
    refreshToken: account.refreshToken,
    clientId: opts.clientId,
    endpoint: opts.endpoint,
    fetchImpl: opts.fetchImpl,
    now,
  });
}

interface RefreshTokensOptions {
  refreshToken: string;
  clientId: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  now: () => number;
}

async function refreshTokens(opts: RefreshTokensOptions): Promise<RefreshedTokens> {
  const endpoint = opts.endpoint ?? DUNE_OAUTH_TOKEN_ENDPOINT;
  const fetchImpl = opts.fetchImpl ?? fetch;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
  });

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (cause) {
    throw new DuneRefreshError(
      "Network error refreshing Dune access token.",
      undefined,
      cause,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DuneRefreshError(
      `Dune refresh endpoint returned ${response.status}: ${text}`,
      response.status,
    );
  }

  const parsed = (await response.json().catch(() => null)) as
    | {
        access_token?: unknown;
        refresh_token?: unknown;
        expires_in?: unknown;
      }
    | null;

  if (
    !parsed ||
    typeof parsed.access_token !== "string" ||
    typeof parsed.refresh_token !== "string" ||
    typeof parsed.expires_in !== "number"
  ) {
    throw new DuneRefreshError(
      "Dune refresh response missing required fields (access_token / refresh_token / expires_in).",
    );
  }

  const expiresAt = new Date(opts.now() + parsed.expires_in * 1_000);
  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    accessTokenExpiresAt: expiresAt,
    refreshed: true,
  };
}
