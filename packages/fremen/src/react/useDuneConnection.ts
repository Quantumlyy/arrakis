import * as React from "react";

import { useDuneConnectionContext } from "./DuneConnectionContext.js";

export interface UseDuneConnectionReturn {
  /** `true` once a Dune account row is linked to the current user. */
  connected: boolean;
  /** Public Dune handle / identifier when available on the account row. */
  context: string | undefined;
  /** Session + status are still resolving — render a skeleton, not "disconnected". */
  isPending: boolean;
  /**
   * Kick off the OAuth link flow. Posts to `/dune/link`, which returns the
   * Dune authorize URL; the hook then assigns `window.location` to start the
   * round-trip.
   */
  connect: (opts?: { callbackURL?: string; errorCallbackURL?: string }) => Promise<void>;
  /** Unlink the Dune account. Re-fetches status on success. */
  disconnect: () => Promise<void>;
  /** Force-refresh the status endpoint. Useful after a callback redirect. */
  refresh: () => Promise<void>;
}

interface DuneStatusResponse {
  connected: boolean;
  context?: string;
}

/**
 * Reads Dune connection state from the plugin's `/dune/status` endpoint and
 * exposes `connect` / `disconnect` helpers that hit the corresponding POST
 * routes. The hook doesn't try to derive state from `authClient.useSession()`
 * because Better Auth's session response doesn't include linked accounts.
 *
 * @example
 * ```tsx
 * const { connected, connect, context } = useDuneConnection();
 * return connected
 *   ? <div>Connected as @{context}</div>
 *   : <button onClick={() => connect()}>Connect Dune</button>;
 * ```
 */
export function useDuneConnection(): UseDuneConnectionReturn {
  const { authClient, basePath, defaultCallbackURL } =
    useDuneConnectionContext();

  // Track session state to drive `isPending` and refetch status on sign-in /
  // sign-out transitions.
  const session = authClient.useSession();

  const [status, setStatus] = React.useState<DuneStatusResponse | undefined>(
    undefined,
  );
  const [statusLoading, setStatusLoading] = React.useState(true);

  const fetchStatus = React.useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${basePath}/dune/status`, {
        method: "GET",
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        setStatus({ connected: false });
        return;
      }
      const json = (await res.json()) as DuneStatusResponse;
      setStatus(json);
    } catch {
      setStatus({ connected: false });
    } finally {
      setStatusLoading(false);
    }
  }, [basePath]);

  // Fetch on mount, and whenever the signed-in user changes. Pending sessions
  // don't trigger a fetch — no point hitting the endpoint before we know if
  // there's a user.
  const userId = session.data?.user?.id;
  React.useEffect(() => {
    if (session.isPending) return;
    void fetchStatus();
  }, [fetchStatus, session.isPending, userId]);

  const connect = React.useCallback(
    async (opts?: { callbackURL?: string; errorCallbackURL?: string }) => {
      const callbackURL =
        opts?.callbackURL ??
        defaultCallbackURL ??
        (typeof window !== "undefined" ? window.location.href : undefined);
      const res = await fetch(`${basePath}/dune/link`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          callbackURL,
          errorCallbackURL: opts?.errorCallbackURL,
        }),
      });
      if (!res.ok) {
        throw new Error(
          `Failed to start Dune link flow: ${res.status} ${res.statusText}`,
        );
      }
      const json = (await res.json()) as { url?: string; redirect?: boolean };
      if (!json.url) {
        throw new Error("Dune link response did not include a URL.");
      }
      if (json.redirect !== false && typeof window !== "undefined") {
        window.location.assign(json.url);
        return;
      }
      // `redirect: false` — hand the URL back to the caller via thrown error.
      throw new Error(`Dune authorize URL (manual redirect): ${json.url}`);
    },
    [basePath, defaultCallbackURL],
  );

  const disconnect = React.useCallback(async () => {
    const res = await fetch(`${basePath}/dune/unlink`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(
        `Failed to disconnect Dune: ${res.status} ${res.statusText}`,
      );
    }
    await fetchStatus();
  }, [basePath, fetchStatus]);

  const connected = Boolean(status?.connected);
  const context = status?.context;
  const isPending = session.isPending || statusLoading;

  return {
    connected,
    context,
    isPending,
    connect,
    disconnect,
    refresh: fetchStatus,
  };
}
