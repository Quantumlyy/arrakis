import type { DuneMCP } from "../client.js";
import { UsageInfoSchema, type UsageInfo } from "../schemas.js";

export const TOOL_GET_USAGE = "getUsage";

/**
 * Returns the caller's plan + credit-usage counters.
 *
 * Field names are validated with a `.passthrough()` Zod schema so unknown
 * keys survive.
 */
export async function getUsage(client: DuneMCP): Promise<UsageInfo> {
  return client.callParsed(TOOL_GET_USAGE, UsageInfoSchema);
}
