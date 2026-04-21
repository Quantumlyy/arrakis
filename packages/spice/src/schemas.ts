import { z } from "zod";

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Query execution
// ---------------------------------------------------------------------------

export const ExecutionHandleSchema = z
  .object({
    executionId: z.string(),
    state: z.string().optional(),
  })
  .passthrough();
export type ExecutionHandle = z.infer<typeof ExecutionHandleSchema>;

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

export const EXECUTION_SUCCESS_STATES = new Set(["QUERY_STATE_COMPLETED", "completed"]);

// ---------------------------------------------------------------------------
// Queries (createDuneQuery, getDuneQuery, updateDuneQuery)
// ---------------------------------------------------------------------------

export const QueryMetaSchema = z
  .object({
    queryId: z.number().optional(),
    id: z.number().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    query: z.string().optional(),
    sql: z.string().optional(),
    isPrivate: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    parameters: z.array(z.record(z.string(), z.unknown())).optional(),
    owner: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();
export type QueryMeta = z.infer<typeof QueryMetaSchema>;

// ---------------------------------------------------------------------------
// Discovery (searchTables, listBlockchains, etc.)
// ---------------------------------------------------------------------------

export const TableResultSchema = z
  .object({
    schema: z.string().optional(),
    name: z.string().optional(),
    fullName: z.string().optional(),
    description: z.string().optional(),
    chain: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();
export type TableResult = z.infer<typeof TableResultSchema>;

export const TableSearchResultsSchema = z
  .object({
    tables: z.array(TableResultSchema).optional(),
    results: z.array(TableResultSchema).optional(),
  })
  .passthrough();
export type TableSearchResults = z.infer<typeof TableSearchResultsSchema>;

export const BlockchainInfoSchema = z
  .object({
    name: z.string().optional(),
    chain: z.string().optional(),
    tableCount: z.number().optional(),
  })
  .passthrough();
export type BlockchainInfo = z.infer<typeof BlockchainInfoSchema>;

export const BlockchainListSchema = z
  .object({
    chains: z.array(BlockchainInfoSchema).optional(),
    blockchains: z.array(BlockchainInfoSchema).optional(),
  })
  .passthrough();
export type BlockchainList = z.infer<typeof BlockchainListSchema>;

export const TableSizeEstimateSchema = z
  .object({
    estimatedBytes: z.number().optional(),
    estimatedRows: z.number().optional(),
    tables: z
      .array(
        z
          .object({ name: z.string(), estimatedBytes: z.number().optional() })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
export type TableSizeEstimate = z.infer<typeof TableSizeEstimateSchema>;

export const DocResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    snippet: z.string().optional(),
  })
  .passthrough();
export type DocResult = z.infer<typeof DocResultSchema>;

export const DocSearchResultsSchema = z
  .object({
    results: z.array(DocResultSchema).optional(),
    docs: z.array(DocResultSchema).optional(),
  })
  .passthrough();
export type DocSearchResults = z.infer<typeof DocSearchResultsSchema>;

// ---------------------------------------------------------------------------
// Visualization
// ---------------------------------------------------------------------------

export const VisualizationMetaSchema = z
  .object({
    visualizationId: z.string().optional(),
    id: z.string().optional(),
    queryId: z.number().optional(),
    type: z.string().optional(),
    name: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
export type VisualizationMeta = z.infer<typeof VisualizationMetaSchema>;

export const VisualizationListSchema = z
  .object({
    visualizations: z.array(VisualizationMetaSchema).optional(),
  })
  .passthrough();
export type VisualizationList = z.infer<typeof VisualizationListSchema>;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const DashboardMetaSchema = z
  .object({
    dashboardId: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    owner: z.string().optional(),
    widgets: z.array(z.record(z.string(), z.unknown())).optional(),
    isArchived: z.boolean().optional(),
  })
  .passthrough();
export type DashboardMeta = z.infer<typeof DashboardMetaSchema>;

export const DeleteResultSchema = z
  .object({
    success: z.boolean().optional(),
    id: z.string().optional(),
  })
  .passthrough();
export type DeleteResult = z.infer<typeof DeleteResultSchema>;
