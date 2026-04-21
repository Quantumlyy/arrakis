---
title: Quickstart
description: Ten-minute Next.js + Better Auth + Dune setup.
---

This walks you through the end-to-end setup the `muaddib` demo app uses. By the end you'll have:

- Email/password auth via Better Auth
- A "Connect Dune" button that OAuths the current user against Dune
- A server component running a saved Dune query with either the anonymous API key or the user's OAuth token

## 1. Install Better Auth + arrakis

```bash
pnpm add better-auth better-sqlite3 @arrakis/spice @arrakis/fremen
```

## 2. Configure Better Auth

```ts
// lib/auth.ts
import { duneConnection } from "@arrakis/fremen";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

const db = new Database("./.data/app.sqlite");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: db,
  emailAndPassword: { enabled: true, autoSignIn: true },
  plugins: [
    duneConnection({
      appName: "My App",
      baseURL: process.env.BETTER_AUTH_URL!,
    }),
  ],
});
```

## 3. Mount the handler

```ts
// app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

## 4. Wire the client + React context

```tsx
// lib/auth-client.ts
"use client";
import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [genericOAuthClient()],
});
```

```tsx
// app/providers.tsx
"use client";
import "@arrakis/fremen/react/styles.css";
import { DuneConnectionProvider } from "@arrakis/fremen/react";
import { authClient } from "@/lib/auth-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DuneConnectionProvider authClient={authClient}>
      {children}
    </DuneConnectionProvider>
  );
}
```

## 5. Render the connect control

```tsx
import { ConnectDune, DuneConnectionStatus } from "@arrakis/fremen/react";

export function TopBar() {
  return (
    <header>
      <DuneConnectionStatus />
      <ConnectDune variant="outline" />
    </header>
  );
}
```

## 6. Fetch data

For the anonymous / ISR path:

```ts
// app/page.tsx
import { DuneMCP } from "@arrakis/spice";

export const revalidate = 900;

export default async function Page() {
  const dune = new DuneMCP({ apiKey: process.env.DUNE_API_KEY! });
  const result = await dune.runQueryAndWait(Number(process.env.DUNE_QUERY_ID));
  return <Rows rows={result.rows ?? []} />;
}
```

Swap in user OAuth by pulling the session's Dune account and handing `getAccessToken` to `DuneMCP`. The [fetching data](/guides/fetching-data/) guide covers this.
