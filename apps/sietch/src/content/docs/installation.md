---
title: Installation
description: Add @arrakis/spice and @arrakis/fremen to your app.
---

`arrakis` targets Node 20+ and ships ESM-only packages. Every package works with `pnpm`, `npm`, and `yarn` — examples below use `pnpm`.

## Packages

```bash
pnpm add @arrakis/spice @arrakis/fremen better-auth
```

`@arrakis/fremen/react` re-exports from the same `@arrakis/fremen` package via a subpath export. React and Better Auth are peer dependencies.

## Peer requirements

| Peer | Version |
|---|---|
| `better-auth` | `^1.2.0` |
| `react` | `>=18` (optional — only for `@arrakis/fremen/react`) |

## Environment

Before you call Dune you'll need one of:

- **A Dune API key.** Grab one at <https://dune.com/settings/api> — used for anonymous / shared-key flows.
- **OAuth credentials via DCR.** With `@arrakis/fremen` installed you don't pre-register anything: the plugin registers your redirect URI lazily the first time a user hits the authorize flow.

## Next steps

- [Quickstart](/quickstart/) — wire up both auth paths in a Next.js app.
- [Connecting accounts](/guides/connecting-accounts/) — a deeper look at the OAuth flow.
- [Fetching data](/guides/fetching-data/) — running Dune queries through `@arrakis/spice`.
