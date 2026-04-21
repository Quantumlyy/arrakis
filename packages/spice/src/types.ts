export type { UsageInfo, ExecutionHandle, ExecutionResult } from "./schemas.js";
export type { TokenProvider } from "./transport.js";

export interface DuneMCPOptions {
  /**
   * Returns a fresh Dune access token for each request. Called on every HTTP
   * round-trip so upstream token-refresh logic can run transparently.
   */
  getAccessToken: () => Promise<string>;
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

export interface RunQueryAndWaitOptions {
  pollMs?: number;
  timeoutMs?: number;
  params?: Record<string, unknown>;
}
