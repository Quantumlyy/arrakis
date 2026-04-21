# muaddib

The Arrakis demo app. A single Next.js page that runs a saved Dune query on the server via [`@arrakis/spice`](../../packages/spice) and renders the rows.

## Run it

From the repo root:

```bash
cp apps/muaddib/.env.example apps/muaddib/.env.local
# Fill in DUNE_ACCESS_TOKEN + DUNE_QUERY_ID
pnpm demo
```

Open <http://localhost:3000>.

## Scope

Tonight-minimum. No auth, no OAuth, no per-user tokens. The server reads a long-lived access token from env and runs the configured query on every (ISR-bucketed) request. Post-interview, this flips to per-user OAuth via `@arrakis/fremen`.
