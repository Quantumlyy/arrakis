import type { DuneMCP } from "../client.js";
import {
  DeleteResultSchema,
  VisualizationListSchema,
  VisualizationMetaSchema,
  type DeleteResult,
  type VisualizationList,
  type VisualizationMeta,
} from "../schemas.js";

export const TOOL_GENERATE_VISUALIZATION = "generateVisualization";
export const TOOL_GET_VISUALIZATION = "getVisualization";
export const TOOL_UPDATE_VISUALIZATION = "updateVisualization";
export const TOOL_DELETE_VISUALIZATION = "deleteVisualization";
export const TOOL_LIST_QUERY_VISUALIZATIONS = "listQueryVisualizations";

export interface GenerateVisualizationInput {
  queryId: number;
  type: "line" | "bar" | "area" | "counter" | "table" | "pie" | string;
  name?: string;
  config?: Record<string, unknown>;
}

/** Create a chart, counter, or table from a query's execution results. */
export function generateVisualization(
  client: DuneMCP,
  input: GenerateVisualizationInput,
): Promise<VisualizationMeta> {
  return client.callParsed(TOOL_GENERATE_VISUALIZATION, VisualizationMetaSchema, {
    ...input,
  });
}

/** Fetch an existing visualization's configuration. */
export function getVisualization(
  client: DuneMCP,
  visualizationId: string,
): Promise<VisualizationMeta> {
  return client.callParsed(TOOL_GET_VISUALIZATION, VisualizationMetaSchema, {
    visualizationId,
  });
}

export interface UpdateVisualizationInput {
  name?: string;
  config?: Record<string, unknown>;
}

/** Update an existing visualization's name or config. */
export function updateVisualization(
  client: DuneMCP,
  visualizationId: string,
  patch: UpdateVisualizationInput,
): Promise<VisualizationMeta> {
  return client.callParsed(TOOL_UPDATE_VISUALIZATION, VisualizationMetaSchema, {
    visualizationId,
    ...patch,
  });
}

/** Delete a visualization. */
export function deleteVisualization(
  client: DuneMCP,
  visualizationId: string,
): Promise<DeleteResult> {
  return client.callParsed(TOOL_DELETE_VISUALIZATION, DeleteResultSchema, {
    visualizationId,
  });
}

/** List every visualization attached to a query. */
export function listQueryVisualizations(
  client: DuneMCP,
  queryId: number,
): Promise<VisualizationList> {
  return client.callParsed(TOOL_LIST_QUERY_VISUALIZATIONS, VisualizationListSchema, {
    queryId,
  });
}
