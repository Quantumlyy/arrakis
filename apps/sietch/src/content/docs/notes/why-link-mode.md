---
title: Why link mode (and not "sign in with Dune")
description: Why @arrakis/fremen treats Dune as a secondary connection, not an identity provider.
---

Dune's OAuth server supports `authorization_code` but doesn't ship a user-info endpoint suitable for primary identity. We deliberately model the flow as **linking a secondary account to an already-authenticated Better Auth user**, not "sign in with Dune".

## The trade-off

**Sign in with Dune** (identity mode) would mean:

- Every visitor must have a Dune account to use any part of your app.
- You inherit Dune's account lifecycle — blocks, renames, etc.
- Your `user` row is keyed on a Dune-issued identifier.

**Link Dune** (secondary mode) means:

- Visitors sign in with email/password, passkeys, or any other Better Auth provider.
- Connecting Dune is a *capability*, not a requirement.
- Anonymous users still get an ISR-cached render via your app's shared API key.
- Upgrading to per-user credits is a one-click toggle, not a sign-in gate.

For dashboarding + analytics workloads — the actual shape of apps that integrate Dune — link mode is almost always what you want.

## What this means in practice

- The primary key in `account` is still Better Auth's normal user id; Dune tokens sit on a separate `account` row with `providerId: "dune"`.
- A user can have multiple social providers *plus* a Dune connection and Better Auth handles it uniformly.
- Unlinking (`authClient.unlinkAccount({ providerId: "dune" })`) drops only the Dune row; the primary identity survives.

## If you really want sign-in-with-Dune

Nothing in `@arrakis/fremen` prevents you from treating the Dune OAuth row as primary — just wire `genericOAuth` yourself without the `duneConnection()` helper. You'd lose DCR, the shipped schema, and the React components, but the MCP client side still works identically.
