import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PATH = process.env.BETTER_AUTH_DB_PATH
  ? resolve(process.env.BETTER_AUTH_DB_PATH)
  : resolve(process.cwd(), ".data/muaddib.sqlite");

declare global {
  var __muaddibDb: Database.Database | undefined;
}

/**
 * Singleton SQLite handle wrapped behind a Proxy so the file isn't opened at
 * module-load time — `next build`'s page-data collection imports every route
 * module, and opening `better-sqlite3` in parallel workers there fights over
 * the writer lock. Lazy-open also keeps `next build` from writing stray
 * .sqlite-wal files into `.data/`.
 *
 * At runtime the first property access through the proxy (which happens when
 * Better Auth's adapter queries) boots the real handle, caches it on
 * `globalThis` so HMR reuses it, and delegates every further op.
 */
function openDb(): Database.Database {
  if (globalThis.__muaddibDb) return globalThis.__muaddibDb;
  mkdirSync(dirname(DEFAULT_PATH), { recursive: true });
  const handle = new Database(DEFAULT_PATH);
  handle.pragma("journal_mode = WAL");
  globalThis.__muaddibDb = handle;
  return handle;
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    const real = openDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
  set(_target, prop, value) {
    return Reflect.set(openDb(), prop, value);
  },
  has(_target, prop) {
    return Reflect.has(openDb(), prop);
  },
});
