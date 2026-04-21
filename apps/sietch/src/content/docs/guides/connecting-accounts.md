---
title: Connecting Dune accounts
description: What happens when a user clicks "Connect Dune".
---

`@arrakis/fremen` turns Better Auth's `genericOAuth` plugin into a one-line `duneConnection()`. The plugin owns three moving parts: **dynamic client registration**, the **authorize + callback round-trip**, and **token refresh**.

## Dynamic Client Registration (DCR)

Dune's OAuth server accepts DCR requests at `https://dune.com/oauth/mcp/register`. The first time any user in your deployment hits the authorize URL:

1. The plugin checks its `duneOAuthClient` table for a row keyed on the redirect URI.
2. On a miss, it POSTs a DCR payload (`client_name`, `redirect_uris`, `token_endpoint_auth_method: "none"`, `grant_types: ["authorization_code", "refresh_token"]`).
3. The returned `client_id` is stored and reused for every subsequent authorize.

Multiple processes and concurrent requests for the same redirect URI are deduped in-memory via a `Map<redirectUri, Promise<clientId>>`. Cross-instance races are benign — `redirectUri` is the uniqueness key, and DCR is idempotent on the Dune side.

## Authorize + PKCE

With the `client_id` resolved the plugin delegates to Better Auth's `genericOAuth`:

- **PKCE S256** — required by Dune; handled by `genericOAuth`.
- **Scope** — `mcp:dune:full`.
- **Resource** — `https://api.dune.com` (Dune's RFC 8707 resource indicator).

On return, Better Auth writes the `access_token` + `refresh_token` + `expires_in` into its standard `account` table with `providerId: "dune"`.

## Token refresh

Dune access tokens live five minutes. `@arrakis/fremen`'s `refreshIfNeeded({ account, clientId })` helper:

- Returns the cached access token when it's more than 30 seconds from expiry.
- Otherwise POSTs a `refresh_token` grant to `https://dune.com/oauth/mcp/token` and returns the new pair.

Callers persist the refreshed tokens back to the account row. The MCP client is constructed with `getAccessToken: async () => tokens.accessToken`, so every outgoing tool call carries a valid bearer.

## Disconnecting

Better Auth exposes `authClient.unlinkAccount({ providerId: "dune" })` at the client root. `<DuneConnectionStatus />`'s disconnect button calls this for you.

## Where to go from here

- [Fetching data](/guides/fetching-data/) — running queries against the connected account.
- [Security model](/notes/security-model/) — PKCE, token scopes, and why tokens don't leave the server.
