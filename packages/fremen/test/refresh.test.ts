import { describe, expect, it, vi } from "vitest";

import { REFRESH_BUFFER_MS } from "../src/constants.js";
import { DuneRefreshError } from "../src/errors.js";
import { refreshIfNeeded } from "../src/refresh.js";

const T0 = new Date("2026-04-21T14:00:00Z").getTime();

describe("refreshIfNeeded", () => {
  it("returns the current token unchanged when the buffer hasn't elapsed", async () => {
    const fetchImpl = vi.fn();
    const account = {
      accessToken: "at-live",
      refreshToken: "rt-live",
      accessTokenExpiresAt: new Date(T0 + REFRESH_BUFFER_MS + 60_000),
    };

    const result = await refreshIfNeeded({
      account,
      clientId: "cid",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => T0,
    });

    expect(result.refreshed).toBe(false);
    expect(result.accessToken).toBe("at-live");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refreshes when inside the buffer window", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          access_token: "at-new",
          refresh_token: "rt-new",
          expires_in: 300,
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const account = {
      accessToken: "at-old",
      refreshToken: "rt-old",
      accessTokenExpiresAt: new Date(T0 + 10_000), // 10s until expiry
    };

    const result = await refreshIfNeeded({
      account,
      clientId: "cid",
      fetchImpl,
      now: () => T0,
    });

    expect(result.refreshed).toBe(true);
    expect(result.accessToken).toBe("at-new");
    expect(result.refreshToken).toBe("rt-new");
    expect(result.accessTokenExpiresAt.getTime()).toBe(T0 + 300_000);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws DuneRefreshError when no refresh token is stored", async () => {
    const account = {
      accessToken: "at-old",
      refreshToken: null,
      accessTokenExpiresAt: new Date(T0 - 1000),
    };

    await expect(
      refreshIfNeeded({
        account,
        clientId: "cid",
        now: () => T0,
      }),
    ).rejects.toBeInstanceOf(DuneRefreshError);
  });

  it("throws DuneRefreshError on a 4xx from Dune's token endpoint", async () => {
    const fetchImpl = (async () =>
      new Response("invalid_grant", { status: 400 })) as typeof fetch;

    const account = {
      accessToken: "at-old",
      refreshToken: "rt-dead",
      accessTokenExpiresAt: new Date(T0 - 1000),
    };

    const err = await refreshIfNeeded({
      account,
      clientId: "cid",
      fetchImpl,
      now: () => T0,
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(DuneRefreshError);
    expect((err as DuneRefreshError).status).toBe(400);
  });

  it("throws DuneRefreshError when the response body is malformed", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ access_token: "only-half" }), {
        status: 200,
      })) as typeof fetch;

    const account = {
      accessToken: "at-old",
      refreshToken: "rt-old",
      accessTokenExpiresAt: new Date(T0 - 1000),
    };

    await expect(
      refreshIfNeeded({
        account,
        clientId: "cid",
        fetchImpl,
        now: () => T0,
      }),
    ).rejects.toBeInstanceOf(DuneRefreshError);
  });
});
