export class DuneSpiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DuneSpiceError";
  }
}

export class DuneAuthError extends DuneSpiceError {
  constructor(message = "Dune rejected the access token (401).", options?: ErrorOptions) {
    super(message, options);
    this.name = "DuneAuthError";
  }
}

export class DuneRateLimitError extends DuneSpiceError {
  readonly retryAfter: number | undefined;

  constructor(retryAfter: number | undefined, message?: string, options?: ErrorOptions) {
    super(
      message ??
        (retryAfter !== undefined
          ? `Dune rate limit hit; retry after ${retryAfter}s.`
          : "Dune rate limit hit."),
      options,
    );
    this.name = "DuneRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class DuneToolError extends DuneSpiceError {
  readonly tool: string;
  readonly params: unknown;

  constructor(tool: string, params: unknown, cause: string, options?: ErrorOptions) {
    super(`Dune tool "${tool}" failed: ${cause}`, options);
    this.name = "DuneToolError";
    this.tool = tool;
    this.params = params;
  }
}

export class DuneExecutionTimeoutError extends DuneSpiceError {
  readonly executionId: string;
  readonly waitedMs: number;

  constructor(executionId: string, waitedMs: number) {
    super(`Dune execution ${executionId} did not complete within ${waitedMs}ms.`);
    this.name = "DuneExecutionTimeoutError";
    this.executionId = executionId;
    this.waitedMs = waitedMs;
  }
}
