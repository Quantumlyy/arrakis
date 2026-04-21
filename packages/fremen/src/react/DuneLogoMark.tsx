import * as React from "react";

export interface DuneLogoMarkProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

/**
 * Placeholder monochrome Dune glyph. Hosts with permission to ship Dune's
 * actual wordmark can pass a custom element via the `logo` prop on
 * `<ConnectDune />` / `<DuneConnectionStatus />` instead of rendering this.
 *
 * @example
 * ```tsx
 * <DuneLogoMark aria-hidden style={{ color: "currentColor" }} />
 * ```
 */
export function DuneLogoMark({
  title,
  className,
  ...rest
}: DuneLogoMarkProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={["arrakis-logo-mark", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d="M2 2h5.2c3.2 0 5.4 2.2 5.4 6 0 3.8-2.2 6-5.4 6H2V2zm2 2v8h3.1c2 0 3.3-1.5 3.3-4s-1.3-4-3.3-4H4z" />
    </svg>
  );
}
