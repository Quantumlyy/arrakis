import type { DuneMCP } from "../client.js";
import { DuneExecutionTimeoutError, DuneToolError } from "../errors.js";
import {
  EXECUTION_SUCCESS_STATES,
  EXECUTION_TERMINAL_STATES,
  ExecutionHandleSchema,
  ExecutionResultSchema,
  QueryMetaSchema,
  type ExecutionHandle,
  type ExecutionResult,
  type QueryMeta,
} from "../schemas.js";
import type { RunQueryAndWaitOptions } from "../types.js";

export const TOOL_EXECUTE_QUERY_BY_ID = "executeQueryById";
export const TOOL_GET_EXECUTION_RESULTS = "getExecutionResults";
export const TOOL_CREATE_DUNE_QUERY = "createDuneQuery";
export const TOOL_GET_DUNE_QUERY = "getDuneQuery";
export const TOOL_UPDATE_DUNE_QUERY = "updateDuneQuery";

const DEFAULT_POLL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Kick off an execution of a saved query. Returns a handle whose
 * `executionId` can be fed to {@link getExecutionResults} or resolved via
 * {@link runQueryAndWait}.
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

export interface CreateQueryInput {
  name: string;
  query: string;
  description?: string;
  isPrivate?: boolean;
  parameters?: Array<Record<string, unknown>>;
  tags?: string[];
}

/**
 * Create and save a new Dune query. The returned metadata carries the
 * `queryId` used by {@link executeQueryById}.
 */
export async function createDuneQuery(
  client: DuneMCP,
  input: CreateQueryInput,
): Promise<QueryMeta> {
  return client.callParsed(TOOL_CREATE_DUNE_QUERY, QueryMetaSchema, { ...input });
}

/** Fetch SQL and metadata for a saved query. */
export async function getDuneQuery(client: DuneMCP, id: number): Promise<QueryMeta> {
  return client.callParsed(TOOL_GET_DUNE_QUERY, QueryMetaSchema, { queryId: id });
}

export interface UpdateQueryInput {
  name?: string;
  description?: string;
  query?: string;
  isPrivate?: boolean;
  parameters?: Array<Record<string, unknown>>;
  tags?: string[];
}

/** Update SQL, title, description, tags, or parameters of an existing query. */
export async function updateDuneQuery(
  client: DuneMCP,
  id: number,
  patch: UpdateQueryInput,
): Promise<QueryMeta> {
  return client.callParsed(TOOL_UPDATE_DUNE_QUERY, QueryMetaSchema, {
    queryId: id,
    ...patch,
  });
}

/**
 * Execute a saved query and poll `getExecutionResults` until a terminal
 * state. Throws {@link DuneExecutionTimeoutError} if `timeoutMs` elapses
 * first, or `DuneToolError` on a non-success terminal state.
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
