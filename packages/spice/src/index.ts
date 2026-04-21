export { DuneMCP } from "./client.js";
export {
  DuneSpiceError,
  DuneAuthError,
  DuneRateLimitError,
  DuneToolError,
  DuneExecutionTimeoutError,
} from "./errors.js";
export { DEFAULT_MCP_URL, API_KEY_HEADER } from "./transport.js";

export type {
  DuneMCPOptions,
  DuneMCPOAuthOptions,
  DuneMCPApiKeyOptions,
  RunQueryAndWaitOptions,
  TokenProvider,
} from "./types.js";

export type {
  UsageInfo,
  ExecutionHandle,
  ExecutionResult,
  QueryMeta,
  TableResult,
  TableSearchResults,
  BlockchainInfo,
  BlockchainList,
  TableSizeEstimate,
  DocResult,
  DocSearchResults,
  VisualizationMeta,
  VisualizationList,
  DashboardMeta,
  DeleteResult,
} from "./schemas.js";

export type { CreateQueryInput, UpdateQueryInput } from "./tools/queries.js";
export type {
  GenerateVisualizationInput,
  UpdateVisualizationInput,
} from "./tools/visualizations.js";
export type {
  CreateDashboardInput,
  UpdateDashboardInput,
} from "./tools/dashboards.js";
