# arrakis

A pnpm monorepo for connecting [Dune](https://dune.com) accounts to host apps through [Better Auth](https://better-auth.com). Ships a Dune MCP client, a Better Auth plugin for the OAuth flow, reusable React components, and a Next.js demo that exercises the whole stack.

> *Herbert's Dune. The spice must flow.*

## Packages

| Package | What it is |
|---|---|
| [`@arrakis/spice`](./packages/spice) | Dune MCP client. Wraps `@modelcontextprotocol/sdk` with typed methods, Zod-validated outputs, and support for either API-key or user-OAuth auth. |
| [`@arrakis/fremen`](./packages/fremen) | Better Auth plugin for the Dune OAuth flow (DCR + PKCE + refresh) plus `@arrakis/fremen/react` components (`<ConnectDune />`, `<DuneConnectionStatus />`). |
| [`muaddib`](./apps/muaddib) | Next.js 15 demo app — email/password auth, Dune connect, and a saved query rendered server-side via `@arrakis/spice`. |
| [`storybook`](./apps/storybook) | Storybook 8 coverage for every `@arrakis/fremen/react` component. |

## Dev setup

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

### Run the Next.js demo

```bash
cp apps/muaddib/.env.example apps/muaddib/.env.local
# Fill in BETTER_AUTH_SECRET, DUNE_API_KEY, DUNE_QUERY_ID
pnpm demo
```

Open <http://localhost:3000>.

### Run Storybook

```bash
pnpm --filter storybook dev
```

Open <http://localhost:6006>.

## Layout

```
arrakis/
├── apps/
│   ├── muaddib/             Next.js 15 demo app
│   └── storybook/           Storybook 8 component preview
├── packages/
│   ├── spice/               @arrakis/spice — Dune MCP client
│   └── fremen/              @arrakis/fremen — Better Auth plugin + React
├── .github/workflows/       CI — lint, typecheck, test, build
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Status

| Phase | Status |
|---|---|
| 0 — workspace scaffold | done |
| 1 — `@arrakis/spice` (full tool surface, dual auth) | done |
| 2 — `@arrakis/fremen` Better Auth plugin + React | done |
| 3 — Storybook component coverage | done |
| 5 — `apps/muaddib` demo with auth + Dune connect | done |
| 6 — CI + README | done |
| 4 — Starlight docs site (`apps/sietch`) | planned |

## Architecture notes

- **Two Dune auth paths.** `@arrakis/spice` accepts either `{ apiKey }` or `{ getAccessToken }`. API keys fuel the anonymous ISR path; OAuth tokens (fetched + refreshed by `@arrakis/fremen`) fuel the per-user signed-in path.
- **DCR on demand.** `@arrakis/fremen` registers the host app with Dune the first time a user hits the authorize flow, caching the `client_id` in a `duneOAuthClient` table keyed on `redirectUri`. The in-process map dedupes concurrent registrations.
- **Short-lived access tokens.** Dune access tokens live ~5 minutes. `@arrakis/fremen` refreshes automatically when a token is within 30s of expiring.
- **Progressive enhancement.** The demo's home page works anonymously via the API key and upgrades to per-user OAuth once a visitor signs in and connects — no route duplication.
