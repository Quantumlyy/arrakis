import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PATH = process.env.BETTER_AUTH_DB_PATH
  ? resolve(process.env.BETTER_AUTH_DB_PATH)
  : resolve(process.cwd(), ".data/muaddib.sqlite");

mkdirSync(dirname(DEFAULT_PATH), { recursive: true });

declare global {
  var __muaddibDb: Database.Database | undefined;
}

/**
 * Singleton SQLite handle. In dev, Next.js HMR re-evaluates modules; pinning
 * on `globalThis` stops us from opening a second connection (and hitting
 * SQLite's writer lock) on every edit.
 */
export const db: Database.Database =
  globalThis.__muaddibDb ?? (globalThis.__muaddibDb = new Database(DEFAULT_PATH));

db.pragma("journal_mode = WAL");
