---
title: API reference
description: Surface of @arrakis/spice and @arrakis/fremen.
---

A hand-rolled summary. Canonical types live in each package's `.d.ts`; this page links them together.

## `@arrakis/spice`

### `class DuneMCP`

```ts
new DuneMCP(options: DuneMCPOptions): DuneMCP;

type DuneMCPOptions =
  | { apiKey: string; mcpUrl?: string; clientInfo?: { name: string; version: string } }
  | { getAccessToken: () => Promise<string>; mcpUrl?: string; clientInfo?: { name: string; version: string } };
```

| Method | Signature |
|---|---|
| `getUsage` | `() => Promise<UsageInfo>` |
| `executeQueryById` | `(id: number, params?: Record<string, unknown>) => Promise<ExecutionHandle>` |
| `getExecutionResults` | `(executionId: string) => Promise<ExecutionResult>` |
| `runQueryAndWait` | `(id: number, opts?: { pollMs?: number; timeoutMs?: number; params?: Record<string, unknown> }) => Promise<ExecutionResult>` |
| `createDuneQuery` | `(input: CreateQueryInput) => Promise<QueryMeta>` |
| `getDuneQuery` | `(id: number) => Promise<QueryMeta>` |
| `updateDuneQuery` | `(id: number, input: UpdateQueryInput) => Promise<QueryMeta>` |
| `searchDocs` | `(query: string) => Promise<DocSearchResults>` |
| `searchTables` | `(query: string) => Promise<TableSearchResults>` |
| `listBlockchains` | `() => Promise<BlockchainList>` |
| `searchTablesByContractAddress` | `(chain: string, address: string) => Promise<TableSearchResults>` |
| `getTableSize` | `(namespace: string, table: string) => Promise<TableSizeEstimate>` |
| `generateVisualization` | `(queryId: number, input: VisualizationInput) => Promise<VisualizationMeta>` |
| `getVisualization` | `(id: string) => Promise<VisualizationMeta>` |
| `updateVisualization` | `(id: string, input: VisualizationInput) => Promise<VisualizationMeta>` |
| `deleteVisualization` | `(id: string) => Promise<DeleteResult>` |
| `listQueryVisualizations` | `(queryId: number) => Promise<VisualizationList>` |
| `createDashboard` | `(input: DashboardInput) => Promise<DashboardMeta>` |
| `getDashboard` | `(id: string) => Promise<DashboardMeta>` |
| `updateDashboard` | `(id: string, input: DashboardInput) => Promise<DashboardMeta>` |
| `archiveDashboard` | `(id: string) => Promise<DeleteResult>` |
| `call` | `<T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>` |
| `close` | `() => Promise<void>` |

### Errors

- `DuneSpiceError` — base class.
- `DuneAuthError` — 401 / auth failures.
- `DuneRateLimitError` — 429; `{ retryAfter }`.
- `DuneToolError` — non-auth JSON-RPC errors.
- `DuneExecutionTimeoutError` — `runQueryAndWait` timed out.

## `@arrakis/fremen`

### Plugin

```ts
duneConnection(options: DuneConnectionOptions): BetterAuthPlugin;

interface DuneConnectionOptions {
  appName: string;
  redirectURI?: string;
  baseURL?: string;
  clientStore?: DuneClientStore;
  scopes?: string[];
}
```

### Server helpers

```ts
getDuneClient(opts: GetDuneClientOptions): Promise<DuneMCP>;

interface GetDuneClientOptions {
  session: { user: { id: string } } | null | undefined;
  accountStore: AccountStore;
  clientId: string;
  mcpUrl?: string;
}
```

### DCR

```ts
getOrRegisterDuneClient(opts: GetOrRegisterOptions): Promise<string>;

interface DuneClientStore {
  findByRedirectUri(redirectUri: string): Promise<DuneOAuthClientRow | null>;
  insert(row: Omit<DuneOAuthClientRow, "id">): Promise<DuneOAuthClientRow>;
}
```

### Refresh

```ts
refreshIfNeeded(opts: RefreshIfNeededOptions): Promise<RefreshedTokens>;
```

### Errors

- `DuneFremenError` — base.
- `DuneNotConnectedError` — no Dune account linked.
- `DuneRegistrationError` — DCR failed; exposes `{ status, body }`.
- `DuneRefreshError` — refresh failed.

## `@arrakis/fremen/react`

| Export | Kind |
|---|---|
| `DuneConnectionProvider` | Context provider over an `authClient`. |
| `useDuneConnection` | Hook — `{ connected, context, isPending, connect, disconnect }`. |
| `ConnectDune` | Button, variants `"default" \| "outline" \| "inline"`. Hides itself when connected. |
| `DuneConnectionStatus` | Pill showing the connected account + a disconnect button. Hides itself when disconnected. |
| `DuneLogoMark` | SVG placeholder mark. |
