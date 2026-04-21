---
title: Security model
description: PKCE, token scope, refresh cadence, and blast radius.
---

## Token flow

Dune OAuth tokens are short-lived (five minutes) and never reach the browser. `@arrakis/fremen` stores them in Better Auth's server-side `account` table; `@arrakis/spice` reads them via a token-provider closure that's only ever invoked server-side.

There is no `postMessage`, no `fetch("/api/dune/token")`, no client-side bearer. If the browser bundle were fully compromised, the attacker still couldn't exfiltrate Dune tokens.

## PKCE

`duneConnection()` configures `genericOAuth` with `pkce: true`, which uses the S256 challenge method. That means:

- The browser generates a random `code_verifier`, SHA-256s it into a `code_challenge`, and sends only the challenge to Dune on authorize.
- On callback, Better Auth POSTs the code plus the verifier to `https://dune.com/oauth/mcp/token`.
- A stolen authorization code is useless without the verifier.

Combined with `token_endpoint_auth_method: "none"` (public client), this is the OAuth 2.1 recommended pattern for first-party web apps.

## Dynamic Client Registration

The `client_id` returned by DCR is *not* a secret — it's a public identifier tied to your `redirect_uris`. Treat the `duneOAuthClient` table as operational data, not secret material. The secret is the combination of PKCE verifier + bound redirect URI, both of which live transiently in the OAuth state cookie.

## Refresh cadence

`refreshIfNeeded` skips the round-trip when the stored token is more than 30 seconds from expiry. The buffer is deliberate: network round-trips plus Dune-side validation can easily eat 1–2 seconds, and we'd rather refresh slightly early than ship a request that races expiry.

## Scope

The plugin requests a single scope, `mcp:dune:full`, which is what Dune's MCP server currently advertises. Narrower scopes will plug into the same flow once Dune ships them; `duneConnection({ scopes: [...] })` already accepts an override.

## What to watch for

- **Refresh-token leakage is the big one.** A stolen refresh token lets an attacker mint new access tokens indefinitely. If you suspect compromise, revoke the row (`authClient.unlinkAccount({ providerId: "dune" })`) and have the user re-consent.
- **Redirect URI drift.** DCR is keyed on `redirectUri`. Changing it in prod without re-running DCR will break authorize. Use `BETTER_AUTH_URL` consistently.
- **Clock skew.** `refreshIfNeeded` uses `Date.now()` — if your server clock drifts past 30 seconds, you'll see unnecessary refresh pressure. Run NTP.
