import { getMigrations } from "better-auth/db/migration";

import { auth } from "./auth";

let schemaReady: Promise<void> | undefined;

/**
 * Apply Better Auth's generated schema (user / session / account / verification
 * + the fremen plugin's `duneOAuthClient` table) to the configured database.
 *
 * Idempotent and memoized so a burst of parallel requests during cold start
 * doesn't fight over DDL. The demo leans on this because we hand betterAuth
 * a raw `better-sqlite3` instance rather than a pre-migrated database — a
 * fresh clone should just work without a separate CLI step.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
    })().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}
