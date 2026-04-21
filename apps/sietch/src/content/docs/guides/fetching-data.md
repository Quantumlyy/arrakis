---
title: Fetching data
description: Running Dune queries through @arrakis/spice.
---

`@arrakis/spice` wraps the [Dune MCP server](https://docs.dune.com/api-reference/agents/mcp) in a typed client. Under the hood it uses `@modelcontextprotocol/sdk`'s `Client` + `StreamableHTTPClientTransport`, with Dune-specific headers and error mapping layered on top.

## Construct a client

```ts
import { DuneMCP } from "@arrakis/spice";

// Anonymous / API key
const dune = new DuneMCP({ apiKey: process.env.DUNE_API_KEY! });

// Connected user / OAuth
const dune = new DuneMCP({
  getAccessToken: async () => session.dune.accessToken,
});
```

`DuneMCP` is a discriminated union on options — pass exactly one of `apiKey` or `getAccessToken`. TypeScript will complain at compile time if you pass both or neither.

## Run a saved query

`runQueryAndWait` handles the two-step execute + poll dance for you:

```ts
const result = await dune.runQueryAndWait(4132, {
  pollMs: 1_000,
  timeoutMs: 60_000,
});

for (const row of result.rows ?? []) {
  console.log(row);
}
```

Each row is typed as `Record<string, unknown>` — Dune's schema is per-query so the package validates the envelope, not the cells.

## Other tools

| Method | Purpose |
|---|---|
| `getUsage()` | Remaining credits + tier. |
| `executeQueryById(id, params?)` | Fire-and-forget; returns an `executionId`. |
| `getExecutionResults(executionId)` | Poll an execution yourself. |
| `createDuneQuery` / `getDuneQuery` / `updateDuneQuery` | Query lifecycle. |
| `searchDocs` / `searchTables` / `listBlockchains` / `getTableSize` | Discovery. |
| `generateVisualization` / `updateVisualization` / `deleteVisualization` | Visualizations. |
| `createDashboard` / `updateDashboard` / `archiveDashboard` | Dashboards. |
| `call(tool, args)` | Raw escape hatch for anything not yet typed. |

## Errors

Every method throws a typed subclass of `DuneSpiceError`:

- `DuneAuthError` — HTTP 401 / bad token.
- `DuneRateLimitError` — HTTP 429; exposes `retryAfter` from the response header.
- `DuneToolError` — generic JSON-RPC error from Dune.
- `DuneExecutionTimeoutError` — `runQueryAndWait` exceeded its poll budget.

```ts
import {
  DuneAuthError,
  DuneExecutionTimeoutError,
  DuneRateLimitError,
} from "@arrakis/spice";

try {
  await dune.runQueryAndWait(4132);
} catch (err) {
  if (err instanceof DuneRateLimitError) {
    return { retryAfter: err.retryAfter };
  }
  if (err instanceof DuneAuthError) {
    // token is stale — prompt the user to reconnect.
  }
  throw err;
}
```

## Closing the client

`DuneMCP` holds a live HTTP connection to Dune's MCP server. Call `close()` in a `finally` when you're done with short-lived work (API routes, server components).
