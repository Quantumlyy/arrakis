import * as React from "react";

import { DuneLogoMark } from "./DuneLogoMark.js";
import { useDuneConnection } from "./useDuneConnection.js";

export interface DuneConnectionStatusProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Render instead of "Connected" / "Not connected". */
  connectedLabel?: (context: string | undefined) => React.ReactNode;
  /** Hide the built-in disconnect button; host renders its own control. */
  hideDisconnect?: boolean;
  /** Custom logo in place of the bundled mark. */
  logo?: React.ReactNode;
  /** Called after `disconnect()` resolves / rejects. */
  onDisconnectResult?: (result: { ok: boolean; error?: unknown }) => void;
}

/**
 * Small inline status pill showing the current Dune connection. Pairs with
 * `<ConnectDune />` — render both; one hides itself based on state.
 *
 * @example
 * ```tsx
 * <DuneConnectionStatus />
 * <ConnectDune variant="outline" />
 * ```
 */
export function DuneConnectionStatus({
  connectedLabel,
  hideDisconnect,
  logo,
  onDisconnectResult,
  className,
  ...rest
}: DuneConnectionStatusProps): React.ReactElement | null {
  const { connected, context, isPending, disconnect } = useDuneConnection();
  const [pending, setPending] = React.useState(false);

  if (!connected || isPending) return null;

  const handleDisconnect = async () => {
    setPending(true);
    try {
      await disconnect();
      onDisconnectResult?.({ ok: true });
    } catch (err) {
      onDisconnectResult?.({ ok: false, error: err });
    } finally {
      setPending(false);
    }
  };

  const label =
    connectedLabel !== undefined
      ? connectedLabel(context)
      : context
        ? `Connected as @${context}`
        : "Connected to Dune";

  return (
    <div
      className={["arrakis-connection-status", className].filter(Boolean).join(" ")}
      data-connected="true"
      {...rest}
    >
      <span className="arrakis-connection-status__dot" aria-hidden />
      {logo ?? <DuneLogoMark aria-hidden />}
      <span className="arrakis-connection-status__label">{label}</span>
      {!hideDisconnect ? (
        <button
          type="button"
          className="arrakis-connection-status__disconnect"
          onClick={handleDisconnect}
          disabled={pending}
        >
          {pending ? "disconnecting…" : "disconnect"}
        </button>
      ) : null}
    </div>
  );
}
