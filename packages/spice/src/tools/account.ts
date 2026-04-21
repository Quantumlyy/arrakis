import type { DuneMCP } from "../client.js";
import { UsageInfoSchema, type UsageInfo } from "../schemas.js";

export const TOOL_GET_USAGE = "get_usage";

/**
 * Returns the caller's plan + credit-usage counters.
 *
 * The MCP tool name and field names are best-guess snake_case until verified
 * against the live Dune MCP server; the underlying schema is `passthrough()`
 * so unknown fields survive.
 */
export async function getUsage(client: DuneMCP): Promise<UsageInfo> {
  return client.callParsed(TOOL_GET_USAGE, UsageInfoSchema);
}
