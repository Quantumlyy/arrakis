export { DuneMCP } from "./client.js";
export {
  DuneSpiceError,
  DuneAuthError,
  DuneRateLimitError,
  DuneToolError,
  DuneExecutionTimeoutError,
} from "./errors.js";
export { DEFAULT_MCP_URL } from "./transport.js";
export type {
  DuneMCPOptions,
  RunQueryAndWaitOptions,
  UsageInfo,
  ExecutionHandle,
  ExecutionResult,
  TokenProvider,
} from "./types.js";
