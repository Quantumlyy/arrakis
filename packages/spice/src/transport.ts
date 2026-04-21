import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { DuneAuthError, DuneRateLimitError } from "./errors.js";

export const DEFAULT_MCP_URL = "https://api.dune.com/mcp/v1";

export type TokenProvider = () => Promise<string>;

/**
 * Build a Streamable HTTP transport that injects a fresh bearer token into
 * every request. The token is resolved via the caller-supplied provider, so
 * long-lived transports can refresh without being reconstructed.
 */
export function createDuneTransport(opts: {
  url: URL;
  getAccessToken: TokenProvider;
}): StreamableHTTPClientTransport {
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const token = await opts.getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
      throw new DuneAuthError();
    }
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      throw new DuneRateLimitError(
        Number.isFinite(retryAfter) ? retryAfter : undefined,
      );
    }

    return response;
  };

  return new StreamableHTTPClientTransport(opts.url, {
    fetch: fetchWithAuth,
  });
}
