import { DuneSpiceError } from "@arrakis/spice";

import { GasTracker } from "@/components/GasTracker";
import { getConfiguredQueryId, getDuneClient, isDuneConfigured } from "@/lib/dune";

export const revalidate = 900;

export default async function HomePage() {
  if (!isDuneConfigured()) {
    return (
      <main>
        <Hero />
        <div className="banner">
          <h3>Demo not configured</h3>
          <p>
            Copy <code>apps/muaddib/.env.example</code> to <code>apps/muaddib/.env.local</code> and
            fill in <code>DUNE_API_KEY</code> and <code>DUNE_QUERY_ID</code>, then restart{" "}
            <code>pnpm demo</code>.
          </p>
        </div>
      </main>
    );
  }

  const queryId = getConfiguredQueryId()!;
  const dune = getDuneClient();

  try {
    const result = await dune.runQueryAndWait(queryId, { timeoutMs: 45_000 });
    const rows = result.rows ?? [];

    return (
      <main>
        <Hero queryId={queryId} rowCount={rows.length} />
        <div className="card">
          <GasTracker rows={rows} />
        </div>
      </main>
    );
  } catch (err) {
    return (
      <main>
        <Hero queryId={queryId} />
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

function Hero({ queryId, rowCount }: { queryId?: number; rowCount?: number } = {}) {
  return (
    <section className="hero">
      <h1>Muaddib</h1>
      <p className="muted">
        A tonight-minimum Arrakis demo — one Dune query, rendered server-side through{" "}
        <code>@arrakis/spice</code>.
      </p>
      <div className="badges">
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
