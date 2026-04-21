import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DuneAuthError, DuneRateLimitError } from "./errors.js";

export const DEFAULT_MCP_URL = "https://api.dune.com/mcp/v1";

export type TokenProvider = () => Promise<string>;

type FetchLike = typeof fetch;

/**
 * Wraps a base `fetch` implementation so every call injects a fresh bearer
 * token from `getAccessToken()`, and maps 401 / 429 responses to typed
 * errors before they reach the SDK.
 */
export function createAuthedFetch(opts: {
  getAccessToken: TokenProvider;
  baseFetch?: FetchLike;
}): FetchLike {
  const base = opts.baseFetch ?? fetch;
  return async (input, init) => {
    const token = await opts.getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
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
 * Build a Streamable HTTP transport for the Dune MCP server with a fresh
 * bearer token on every request.
 */
export function createDuneTransport(opts: {
  url: URL;
  getAccessToken: TokenProvider;
}): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(opts.url, {
    fetch: createAuthedFetch({ getAccessToken: opts.getAccessToken }),
  });
}
