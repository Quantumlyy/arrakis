# arrakis

A pnpm monorepo sketching a Better Auth plugin for connecting Dune accounts to host apps. This branch contains the *tonight-minimum* slice: the MCP client and a Next.js demo. The Better Auth plugin, Storybook, and docs site are planned post-interview — see `.context/attachments/` for the full build plan.

> *Herbert's Dune. The spice must flow.*

## Packages

| Package | What it is |
|---|---|
| [`@arrakis/spice`](./packages/spice) | Dune MCP client. Wraps `@modelcontextprotocol/sdk` with typed methods, Zod-validated outputs, and a token-provider pattern. |
| [`muaddib`](./apps/muaddib) | Next.js demo that runs a saved Dune query server-side through `@arrakis/spice` and renders the rows. |

## Dev setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

To boot the demo:

```bash
cp apps/muaddib/.env.example apps/muaddib/.env.local
# Fill in DUNE_ACCESS_TOKEN and DUNE_QUERY_ID
pnpm demo
```

Open <http://localhost:3000>.

## Layout

```
arrakis/
├── apps/
│   └── muaddib/            Next.js 15 demo app
├── packages/
│   └── spice/              @arrakis/spice — Dune MCP client
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Status

| Phase | Status |
|---|---|
| 0 — workspace scaffold | done |
| 1 — `@arrakis/spice` (getUsage, executeQueryById, getExecutionResults, runQueryAndWait) | done |
| 5 — `apps/muaddib` demo (server-side only, no OAuth) | done |
| 2 — `@arrakis/fremen` (Better Auth plugin) | planned |
| 3 — Storybook | planned |
| 4 — Starlight docs site | planned |
| 6 — CI / polish | planned |
