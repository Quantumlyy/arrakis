import type { DuneMCP } from "../client.js";
import { DashboardMetaSchema, type DashboardMeta } from "../schemas.js";

export const TOOL_CREATE_DASHBOARD = "createDashboard";
export const TOOL_GET_DASHBOARD = "getDashboard";
export const TOOL_UPDATE_DASHBOARD = "updateDashboard";
export const TOOL_ARCHIVE_DASHBOARD = "archiveDashboard";

export interface CreateDashboardInput {
  name: string;
  widgets?: Array<Record<string, unknown>>;
  layout?: Record<string, unknown>;
  description?: string;
  tags?: string[];
}

/** Create a new dashboard with widgets + layout. */
export function createDashboard(
  client: DuneMCP,
  input: CreateDashboardInput,
): Promise<DashboardMeta> {
  return client.callParsed(TOOL_CREATE_DASHBOARD, DashboardMetaSchema, { ...input });
}

/** Fetch a dashboard's content, layout, and metadata. */
export function getDashboard(
  client: DuneMCP,
  dashboardId: string,
): Promise<DashboardMeta> {
  return client.callParsed(TOOL_GET_DASHBOARD, DashboardMetaSchema, { dashboardId });
}

export interface UpdateDashboardInput {
  name?: string;
  widgets?: Array<Record<string, unknown>>;
  layout?: Record<string, unknown>;
  description?: string;
  tags?: string[];
}

/** Update a dashboard's content, layout, or metadata. */
export function updateDashboard(
  client: DuneMCP,
  dashboardId: string,
  patch: UpdateDashboardInput,
): Promise<DashboardMeta> {
  return client.callParsed(TOOL_UPDATE_DASHBOARD, DashboardMetaSchema, {
    dashboardId,
    ...patch,
  });
}

/** Archive a dashboard (soft-delete). */
export function archiveDashboard(
  client: DuneMCP,
  dashboardId: string,
): Promise<DashboardMeta> {
  return client.callParsed(TOOL_ARCHIVE_DASHBOARD, DashboardMetaSchema, {
    dashboardId,
  });
}
