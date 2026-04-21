import type { DuneMCP } from "../client.js";
import { DuneExecutionTimeoutError, DuneToolError } from "../errors.js";
import {
  EXECUTION_SUCCESS_STATES,
  EXECUTION_TERMINAL_STATES,
  ExecutionHandleSchema,
  ExecutionResultSchema,
  type ExecutionHandle,
  type ExecutionResult,
} from "../schemas.js";
import type { RunQueryAndWaitOptions } from "../types.js";

export const TOOL_EXECUTE_QUERY_BY_ID = "executeQueryById";
export const TOOL_GET_EXECUTION_RESULTS = "getExecutionResults";

const DEFAULT_POLL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Kicks off an execution of a saved Dune query. Returns a handle containing
 * `executionId`, which can be fed to `getExecutionResults` or resolved via
 * `runQueryAndWait`.
 */
export async function executeQueryById(
  client: DuneMCP,
  id: number,
  params?: Record<string, unknown>,
): Promise<ExecutionHandle> {
  const args: Record<string, unknown> = { queryId: id };
  if (params && Object.keys(params).length > 0) {
    args.parameters = params;
  }
  return client.callParsed(TOOL_EXECUTE_QUERY_BY_ID, ExecutionHandleSchema, args);
}

export async function getExecutionResults(
  client: DuneMCP,
  executionId: string,
): Promise<ExecutionResult> {
  return client.callParsed(TOOL_GET_EXECUTION_RESULTS, ExecutionResultSchema, {
    executionId,
  });
}

/**
 * Executes a saved query and polls `getExecutionResults` until a terminal
 * state is reached. Throws `DuneExecutionTimeoutError` if `timeoutMs` elapses
 * first, or `DuneToolError` if the execution ends in a non-success state.
 */
export async function runQueryAndWait(
  client: DuneMCP,
  id: number,
  opts: RunQueryAndWaitOptions = {},
): Promise<ExecutionResult> {
  const pollMs = opts.pollMs ?? DEFAULT_POLL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const handle = await executeQueryById(client, id, opts.params);

  const deadline = Date.now() + timeoutMs;
  while (true) {
    const result = await getExecutionResults(client, handle.executionId);

    if (EXECUTION_TERMINAL_STATES.has(result.state)) {
      if (EXECUTION_SUCCESS_STATES.has(result.state)) return result;
      throw new DuneToolError(
        TOOL_GET_EXECUTION_RESULTS,
        { executionId: handle.executionId },
        `execution ended in non-success state: ${result.state}`,
      );
    }

    if (Date.now() >= deadline) {
      throw new DuneExecutionTimeoutError(handle.executionId, timeoutMs);
    }

    await sleep(pollMs);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
