import * as React from "react";

import { useDuneConnectionContext } from "./DuneConnectionContext.js";

export interface UseDuneConnectionReturn {
  /** `true` once a Dune account row is linked to the current user. */
  connected: boolean;
  /** Public Dune handle / username when available on the account row. */
  context: string | undefined;
  /** Session is still resolving — render a skeleton, not "disconnected". */
  isPending: boolean;
  /** Kick off the OAuth link flow. */
  connect: (opts?: { callbackURL?: string }) => Promise<void>;
  /** Unlink the Dune account locally; revocation is host-side / best-effort. */
  disconnect: () => Promise<void>;
}

/**
 * Derives Dune connection state from the ambient Better Auth session and
 * exposes `connect` / `disconnect` helpers that delegate to
 * `authClient.oauth2.link` / `oauth2.unlink`.
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
  const { authClient, providerId, defaultCallbackURL } = useDuneConnectionContext();
  const { data, isPending } = authClient.useSession();

  const duneAccount = React.useMemo(() => {
    const user = data?.user;
    if (!user?.accounts) return undefined;
    return user.accounts.find((a) => a.providerId === providerId);
  }, [data, providerId]);

  const connect = React.useCallback(
    async (opts?: { callbackURL?: string }) => {
      const callbackURL =
        opts?.callbackURL ??
        defaultCallbackURL ??
        (typeof window !== "undefined" ? window.location.href : undefined);
      await authClient.oauth2.link({ providerId, callbackURL });
    },
    [authClient, providerId, defaultCallbackURL],
  );

  const disconnect = React.useCallback(async () => {
    if (authClient.unlinkAccount) {
      await authClient.unlinkAccount({ providerId });
      return;
    }
    if (authClient.oauth2.unlink) {
      await authClient.oauth2.unlink({ providerId });
      return;
    }
    throw new Error(
      "@arrakis/fremen/react: authClient has neither `unlinkAccount` nor `oauth2.unlink` — host must expose one to support disconnecting.",
    );
  }, [authClient, providerId]);

  return {
    connected: Boolean(duneAccount),
    context: duneAccount?.username ?? duneAccount?.accountId ?? undefined,
    isPending,
    connect,
    disconnect,
  };
}
