import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DuneAuthError, DuneRateLimitError } from "./errors.js";

export const DEFAULT_MCP_URL = "https://api.dune.com/mcp/v1";
export const API_KEY_HEADER = "x-dune-api-key";

export type TokenProvider = () => Promise<string>;

type FetchLike = typeof fetch;

export type AuthMode =
  | { kind: "oauth"; getAccessToken: TokenProvider }
  | { kind: "apiKey"; apiKey: string };

/**
 * Wraps a base `fetch` so every outgoing call carries Dune auth — either a
 * bearer token from `getAccessToken()` (OAuth) or a static `x-dune-api-key`
 * header. 401 / 429 responses are translated into typed spice errors before
 * they reach the MCP SDK so callers see `DuneAuthError` / `DuneRateLimitError`
 * instead of opaque transport failures.
 */
export function createAuthedFetch(opts: {
  auth: AuthMode;
  baseFetch?: FetchLike;
}): FetchLike {
  const base = opts.baseFetch ?? fetch;
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (opts.auth.kind === "oauth") {
      const token = await opts.auth.getAccessToken();
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.set(API_KEY_HEADER, opts.auth.apiKey);
    }
    const response = await base(input, { ...init, headers });

    if (response.status === 401) {
      throw new DuneAuthError();
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      throw new DuneRateLimitError(Number.isFinite(retryAfter) ? retryAfter : undefined);
    }

    return response;
  };
}

/**
 * Build a Streamable HTTP transport for the Dune MCP server, injecting the
 * selected auth mode on every request.
 */
export function createDuneTransport(opts: {
  url: URL;
  auth: AuthMode;
}): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(opts.url, {
    fetch: createAuthedFetch({ auth: opts.auth }),
  });
}
