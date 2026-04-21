---
title: arrakis
description: Better Auth plugin + Dune MCP client + React components for connecting Dune accounts to host apps.
template: splash
hero:
  tagline: The spice must flow. Wire up Dune auth + data in a single Better Auth install.
  actions:
    - text: Installation
      link: /installation/
      variant: primary
    - text: View on GitHub
      link: https://github.com/Quantumlyy/arrakis
      variant: minimal
---

## What's in the box

`arrakis` is a small monorepo of Dune-shaped building blocks:

- **`@arrakis/spice`** — a typed [Dune MCP](https://docs.dune.com/api-reference/agents/mcp) client. Give it an API key *or* a user-OAuth token and the same surface returns the same Zod-validated rows.
- **`@arrakis/fremen`** — the Better Auth plugin that handles the OAuth round-trip: dynamic client registration, PKCE, short-lived-token refresh, and a shipped `duneOAuthClient` schema.
- **`@arrakis/fremen/react`** — drop-in components (`<ConnectDune />`, `<DuneConnectionStatus />`) that bind to the plugin via context.

## What you get

Two clean auth paths that share one data layer:

1. **API-key path** — bootstrap-friendly, demo-friendly, ISR-friendly. A single server-side key behind every render.
2. **User-OAuth path** — a visitor signs in, clicks "Connect Dune", and subsequent queries burn *their* credits. No extra code in the render path — `@arrakis/spice` just swaps its token source.

See the [quickstart](/quickstart/) to wire both into a Next.js app in under ten minutes.
