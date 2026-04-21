export class DuneFremenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DuneFremenError";
  }
}

/**
 * Thrown by `getDuneClient()` when the current session has no linked Dune
 * account. Hosts should treat this as a "show the connect button" signal
 * rather than a hard error.
 */
export class DuneNotConnectedError extends DuneFremenError {
  constructor(message = "The current user has not connected a Dune account.") {
    super(message);
    this.name = "DuneNotConnectedError";
  }
}

/**
 * Thrown when DCR against `https://dune.com/oauth/mcp/register` fails.
 * Carries the upstream HTTP status + body so callers can surface details.
 */
export class DuneRegistrationError extends DuneFremenError {
  readonly status: number | undefined;
  readonly body: unknown;

  constructor(
    message: string,
    details: { status?: number; body?: unknown; cause?: unknown } = {},
  ) {
    super(message, details.cause instanceof Error ? { cause: details.cause } : undefined);
    this.name = "DuneRegistrationError";
    this.status = details.status;
    this.body = details.body;
  }
}

/**
 * Thrown when refreshing a Dune access token fails (expired refresh token,
 * revoked client, network error). Host UI should prompt the user to
 * reconnect.
 */
export class DuneRefreshError extends DuneFremenError {
  readonly status: number | undefined;

  constructor(message: string, status?: number, cause?: unknown) {
    super(message, cause instanceof Error ? { cause } : undefined);
    this.name = "DuneRefreshError";
    this.status = status;
  }
}
