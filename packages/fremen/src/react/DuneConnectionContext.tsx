import * as React from "react";

/**
 * Minimum surface `@arrakis/fremen/react` needs from the host's authClient.
 * The hook no longer depends on `oauth2.link` / `unlinkAccount` — it talks
 * to fremen's own `/dune/*` endpoints directly — so the only requirement is
 * a working `useSession()` to drive loading states.
 */
export interface FremenAuthClient {
  useSession(): {
    data:
      | {
          user?: { id: string; name?: string | null } | null;
        }
      | null
      | undefined;
    isPending: boolean;
  };
}

export interface DuneConnectionContextValue {
  authClient: FremenAuthClient;
  /**
   * Base path fremen endpoints are mounted under, e.g. `/api/auth`. The hook
   * POSTs to `${basePath}/dune/link` and friends.
   */
  basePath: string;
  /** Fallback callback URL passed to `/dune/link` when callers don't specify one. */
  defaultCallbackURL?: string;
}

const DuneConnectionContext = React.createContext<
  DuneConnectionContextValue | undefined
>(undefined);

export interface DuneConnectionProviderProps {
  authClient: FremenAuthClient;
  /**
   * Base path fremen endpoints are mounted under. Defaults to `/api/auth`,
   * matching Better Auth's default basePath.
   */
  basePath?: string;
  defaultCallbackURL?: string;
  children: React.ReactNode;
}

/**
 * Wrap your app tree once with the host's Better Auth client instance; every
 * `@arrakis/fremen/react` component reads it from context.
 *
 * @example
 * ```tsx
 * import { authClient } from "@/lib/auth-client";
 * import { DuneConnectionProvider } from "@arrakis/fremen/react";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <DuneConnectionProvider authClient={authClient}>
 *       {children}
 *     </DuneConnectionProvider>
 *   );
 * }
 * ```
 */
export function DuneConnectionProvider({
  authClient,
  basePath = "/api/auth",
  defaultCallbackURL,
  children,
}: DuneConnectionProviderProps): React.ReactElement {
  const value = React.useMemo<DuneConnectionContextValue>(
    () => ({ authClient, basePath, defaultCallbackURL }),
    [authClient, basePath, defaultCallbackURL],
  );
  return (
    <DuneConnectionContext.Provider value={value}>
      {children}
    </DuneConnectionContext.Provider>
  );
}

/**
 * Read the ambient `DuneConnectionContext`. Throws a helpful error when
 * called outside of a `<DuneConnectionProvider>` so mis-wired trees are
 * caught during development.
 */
export function useDuneConnectionContext(): DuneConnectionContextValue {
  const value = React.useContext(DuneConnectionContext);
  if (!value) {
    throw new Error(
      "@arrakis/fremen/react: wrap your app in <DuneConnectionProvider authClient={...}> before using hooks or components.",
    );
  }
  return value;
}
