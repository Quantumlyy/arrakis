# @arrakis/spice

Dune MCP client — a framework-agnostic TypeScript client that wraps the [official MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) and exposes the Dune toolset as typed methods.

> *The spice must flow.*

## Install

This package is private to the `arrakis` workspace. Add it via pnpm workspaces:

```jsonc
{
  "dependencies": {
    "@arrakis/spice": "workspace:*"
  }
}
```

## Usage

```ts
import { DuneMCP } from "@arrakis/spice";

const dune = new DuneMCP({
  getAccessToken: async () => process.env.DUNE_ACCESS_TOKEN!,
});

const usage = await dune.getUsage();
const result = await dune.runQueryAndWait(5394530);
await dune.close();
```

The constructor takes a **token provider**, not a token. Tokens expire; a long-lived `DuneMCP` instance will refresh on every call by invoking `getAccessToken()`.

## Scope — what's implemented

For the tonight-minimum slice:

- `getUsage()`
- `executeQueryById(id, params?)`
- `getExecutionResults(executionId)`
- `runQueryAndWait(id, opts?)` — convenience wrapper that polls until completion
- `call<T>(tool, args?)` — raw escape hatch for any tool not yet typed
- `close()`

Discovery, visualizations, and dashboards are deferred (see the repo root plan).

## Errors

- `DuneAuthError` — 401 / auth failures (token expired or invalid)
- `DuneRateLimitError` — 429, with `retryAfter` seconds when provided
- `DuneToolError` — any other JSON-RPC-level error from a tool call
- `DuneExecutionTimeoutError` — `runQueryAndWait` exceeded its deadline
