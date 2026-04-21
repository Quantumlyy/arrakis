import * as React from "react";

import { DuneLogoMark } from "./DuneLogoMark.js";
import { useDuneConnection } from "./useDuneConnection.js";

export type ConnectDuneVariant = "default" | "outline" | "inline";

export interface ConnectDuneProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  variant?: ConnectDuneVariant;
  /** Override the default "Connect Dune" label. */
  label?: React.ReactNode;
  /** Override callback URL for the OAuth link round-trip. */
  callbackURL?: string;
  /** Replace the built-in logo mark with a custom element. */
  logo?: React.ReactNode;
  /**
   * Called after `connect()` resolves (or rejects). Use it to toast a
   * success / failure — the hook itself doesn't surface UI.
   */
  onLinkResult?: (result: { ok: boolean; error?: unknown }) => void;
  /**
   * Render-prop escape hatch: if provided, the button's inner content is
   * delegated to this function, receiving the current state.
   */
  children?: (state: { pending: boolean }) => React.ReactNode;
}

/**
 * Primary "Connect Dune" button. Three variants cover the common layouts:
 * a solid call-to-action, a neutral outline for secondary surfaces, and an
 * inline text link for prose.
 *
 * The component reads connection state from the ambient provider and
 * renders nothing when the user is already connected (hosts typically pair
 * it with `<DuneConnectionStatus />` for the connected state).
 *
 * @example
 * ```tsx
 * <ConnectDune />
 * <ConnectDune variant="outline" label="Link your Dune account" />
 * <ConnectDune variant="inline">
 *   {({ pending }) => (pending ? "linking…" : "connect your Dune account")}
 * </ConnectDune>
 * ```
 */
export function ConnectDune({
  variant = "default",
  label,
  callbackURL,
  logo,
  onLinkResult,
  className,
  children,
  disabled,
  ...rest
}: ConnectDuneProps): React.ReactElement | null {
  const { connected, isPending, connect } = useDuneConnection();
  const [pending, setPending] = React.useState(false);

  if (connected && !isPending) return null;

  const handleClick = async () => {
    setPending(true);
    try {
      await connect({ callbackURL });
      onLinkResult?.({ ok: true });
    } catch (err) {
      onLinkResult?.({ ok: false, error: err });
    } finally {
      setPending(false);
    }
  };

  const disabledState = disabled || pending || isPending;

  const renderedLabel = children
    ? children({ pending })
    : (label ?? (pending ? "Connecting…" : "Connect Dune"));

  return (
    <button
      type="button"
      className={["arrakis-connect-dune", className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-state={pending ? "pending" : "idle"}
      disabled={disabledState}
      onClick={handleClick}
      {...rest}
    >
      {variant === "inline" ? null : (logo ?? <DuneLogoMark aria-hidden />)}
      {renderedLabel}
    </button>
  );
}
