import { z } from "zod";

/**
 * Dune returns usage counters as key/value pairs. We validate only the fields
 * the tonight-minimum slice depends on and preserve the rest as passthrough.
 */
export const UsageInfoSchema = z
  .object({
    plan: z.string().optional(),
    creditsUsed: z.number().optional(),
    creditsIncluded: z.number().optional(),
    creditsRemaining: z.number().optional(),
    resetAt: z.string().optional(),
  })
  .passthrough();

export type UsageInfo = z.infer<typeof UsageInfoSchema>;

/**
 * Response from `execute_query` — a handle you can later resolve via
 * `get_execution_results`.
 */
export const ExecutionHandleSchema = z
  .object({
    executionId: z.string(),
    state: z.string().optional(),
  })
  .passthrough();

export type ExecutionHandle = z.infer<typeof ExecutionHandleSchema>;

/**
 * Execution result payload. The row shape is query-specific; we validate the
 * envelope and let callers interpret `rows`.
 */
export const ExecutionResultSchema = z
  .object({
    executionId: z.string(),
    state: z.string(),
    rows: z.array(z.record(z.string(), z.unknown())).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const EXECUTION_TERMINAL_STATES = new Set([
  "QUERY_STATE_COMPLETED",
  "QUERY_STATE_FAILED",
  "QUERY_STATE_CANCELLED",
  "QUERY_STATE_EXPIRED",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);

export const EXECUTION_SUCCESS_STATES = new Set([
  "QUERY_STATE_COMPLETED",
  "completed",
]);
