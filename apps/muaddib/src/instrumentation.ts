/**
 * Next.js runs this once per server boot. Use it to apply the Better Auth
 * schema to our SQLite file before the first request arrives, so a clone of
 * the repo with no pre-existing `.data/muaddib.sqlite` can serve signups
 * without a separate `better-auth migrate` step.
 *
 * Guarded on NEXT_RUNTIME === "nodejs" so we don't try to touch SQLite from
 * the edge runtime (which can't load the better-sqlite3 native module anyway).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureSchema } = await import("./lib/bootstrap");
  await ensureSchema();
}
