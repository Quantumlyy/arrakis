import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetDcrCacheForTests,
  getOrRegisterDuneClient,
  type DuneClientStore,
} from "../src/dcr.js";
import { DuneRegistrationError } from "../src/errors.js";
import type { DuneOAuthClientRow } from "../src/schema.js";

function makeStore(initial: DuneOAuthClientRow[] = []): DuneClientStore & {
  rows: DuneOAuthClientRow[];
} {
  const rows = [...initial];
  return {
    rows,
    async findByRedirectUri(redirectUri) {
      return rows.find((r) => r.redirectUri === redirectUri) ?? null;
    },
    async insert(row) {
      const next: DuneOAuthClientRow = {
        ...row,
        id: `row-${rows.length + 1}`,
      };
      rows.push(next);
      return next;
    },
  };
}

describe("getOrRegisterDuneClient", () => {
  beforeEach(() => {
    __resetDcrCacheForTests();
  });

  it("returns the cached client_id without calling the registration endpoint", async () => {
    const store = makeStore([
      {
        id: "row-1",
        clientId: "client-abc",
        redirectUri: "https://example.com/cb",
        appName: "Muaddib",
        createdAt: new Date(),
      },
    ]);
    const fetchImpl = vi.fn();

    const clientId = await getOrRegisterDuneClient({
      store,
      redirectUri: "https://example.com/cb",
      appName: "Muaddib",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(clientId).toBe("client-abc");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("dedupes concurrent first-registrations for the same redirectUri", async () => {
    const store = makeStore();
    let registerCalls = 0;
    const fetchImpl = vi.fn(async () => {
      registerCalls += 1;
      await new Promise((r) => setTimeout(r, 10));
      return new Response(JSON.stringify({ client_id: "client-new" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const [a, b, c] = await Promise.all([
      getOrRegisterDuneClient({
        store,
        redirectUri: "https://ex.com/cb",
        appName: "A",
        fetchImpl,
      }),
      getOrRegisterDuneClient({
        store,
        redirectUri: "https://ex.com/cb",
        appName: "A",
        fetchImpl,
      }),
      getOrRegisterDuneClient({
        store,
        redirectUri: "https://ex.com/cb",
        appName: "A",
        fetchImpl,
      }),
    ]);

    expect(a).toBe("client-new");
    expect(b).toBe("client-new");
    expect(c).toBe("client-new");
    expect(registerCalls).toBe(1);
    expect(store.rows).toHaveLength(1);
  });

  it("rejects with DuneRegistrationError on non-2xx responses", async () => {
    const store = makeStore();
    const fetchImpl = (async () =>
      new Response("denied", { status: 403 })) as typeof fetch;

    await expect(
      getOrRegisterDuneClient({
        store,
        redirectUri: "https://ex.com/cb",
        appName: "A",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(DuneRegistrationError);
  });

  it("rejects if Dune omits client_id in the response body", async () => {
    const store = makeStore();
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ not_a_client_id: true }), {
        status: 201,
      })) as typeof fetch;

    const err = await getOrRegisterDuneClient({
      store,
      redirectUri: "https://ex.com/cb",
      appName: "A",
      fetchImpl,
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(DuneRegistrationError);
    expect((err as DuneRegistrationError).message).toMatch(/client_id/);
  });
});
