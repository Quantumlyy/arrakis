export type { TokenProvider } from "./transport.js";

interface DuneMCPBaseOptions {
  /**
   * Override the MCP endpoint. Defaults to `https://api.dune.com/mcp/v1`.
   */
  mcpUrl?: string;
  /**
   * Identify this client to the Dune MCP server. Purely informational.
   */
  clientInfo?: {
    name: string;
    version: string;
  };
}

export interface DuneMCPOAuthOptions extends DuneMCPBaseOptions {
  /**
   * Returns a fresh Dune OAuth access token for each request. Called on every
   * HTTP round-trip so upstream refresh logic can run transparently — this is
   * the path `@arrakis/fremen` takes for per-user connections.
   */
  getAccessToken: () => Promise<string>;
  apiKey?: never;
}

export interface DuneMCPApiKeyOptions extends DuneMCPBaseOptions {
  /**
   * Static Dune API key sent as `x-dune-api-key` on every request. Suitable
   * for single-tenant server-side usage where no per-user OAuth is needed.
   */
  apiKey: string;
  getAccessToken?: never;
}

export type DuneMCPOptions = DuneMCPOAuthOptions | DuneMCPApiKeyOptions;

export interface RunQueryAndWaitOptions {
  pollMs?: number;
  timeoutMs?: number;
  params?: Record<string, unknown>;
}
