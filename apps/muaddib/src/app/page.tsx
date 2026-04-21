import { headers } from "next/headers";

import { DuneNotConnectedError, getDuneClient } from "@arrakis/fremen";
import { DuneSpiceError, type DuneMCP } from "@arrakis/spice";

import { GasTracker } from "@/components/GasTracker";
import { auth } from "@/lib/auth";
import {
  getAnonymousDune,
  getConfiguredQueryId,
  isAnonymousConfigured,
} from "@/lib/dune";

export const revalidate = 900;

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const queryId = getConfiguredQueryId();
  if (!queryId) {
    return (
      <main>
        <Hero signedIn={Boolean(session?.user)} mode="unconfigured" />
        <div className="banner">
          <h3>Demo not configured</h3>
          <p>
            Copy <code>apps/muaddib/.env.example</code> to{" "}
            <code>apps/muaddib/.env.local</code> and set{" "}
            <code>DUNE_QUERY_ID</code>, then restart <code>pnpm demo</code>.
          </p>
        </div>
      </main>
    );
  }

  // Prefer the signed-in user's linked Dune credits. Fall back to the
  // anonymous API key only when no one's connected — and only if the
  // operator configured a shared key.
  let dune: DuneMCP | undefined;
  let mode: "connected" | "anonymous" = "anonymous";
  try {
    dune = await getDuneClient({ auth, session });
    mode = "connected";
  } catch (err) {
    if (!(err instanceof DuneNotConnectedError)) throw err;
  }

  if (!dune) {
    if (!isAnonymousConfigured()) {
      return (
        <main>
          <Hero
            signedIn={Boolean(session?.user)}
            mode="anonymous"
            queryId={queryId}
          />
          <div className="banner">
            <h3>No Dune credentials available</h3>
            <p>
              {session?.user
                ? "You're signed in but haven't connected your Dune account yet. Use the Connect Dune button above, or set DUNE_API_KEY to enable the shared anonymous path."
                : "Sign in and connect a Dune account, or set DUNE_API_KEY on the server to enable the shared anonymous path."}
            </p>
          </div>
        </main>
      );
    }
    dune = getAnonymousDune();
    mode = "anonymous";
  }

  try {
    const result = await dune.runQueryAndWait(queryId, { timeoutMs: 45_000 });
    const rows = result.rows ?? [];

    return (
      <main>
        <Hero
          signedIn={Boolean(session?.user)}
          mode={mode}
          queryId={queryId}
          rowCount={rows.length}
        />
        <div className="card">
          <GasTracker rows={rows} />
        </div>
      </main>
    );
  } catch (err) {
    return (
      <main>
        <Hero signedIn={Boolean(session?.user)} mode={mode} queryId={queryId} />
        <div className="banner banner--danger">
          <h3>Query failed</h3>
          <p>{formatError(err)}</p>
        </div>
      </main>
    );
  } finally {
    await dune.close();
  }
}

function Hero({
  signedIn,
  mode,
  queryId,
  rowCount,
}: {
  signedIn: boolean;
  mode: "connected" | "anonymous" | "unconfigured";
  queryId?: number;
  rowCount?: number;
}) {
  const authBadge =
    mode === "connected"
      ? "dune · connected account"
      : mode === "anonymous"
        ? "dune · shared key"
        : "dune · not configured";
  return (
    <section className="hero">
      <h1>Muaddib</h1>
      <p className="muted">
        An Arrakis demo — one Dune query, rendered server-side through{" "}
        <code>@arrakis/spice</code>. When you sign in and connect your Dune
        account via <code>@arrakis/fremen</code>, the page re-runs the same
        query on <em>your</em> credits.
      </p>
      <div className="badges">
        <span className="badge">{signedIn ? "auth · signed in" : "auth · anonymous"}</span>
        <span className="badge">{authBadge}</span>
        <span className="badge">ISR · 15 min</span>
        {queryId !== undefined && <span className="badge">query #{queryId}</span>}
        {rowCount !== undefined && <span className="badge">{rowCount} rows</span>}
      </div>
    </section>
  );
}

function formatError(err: unknown): string {
  if (err instanceof DuneSpiceError) return `${err.name}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
