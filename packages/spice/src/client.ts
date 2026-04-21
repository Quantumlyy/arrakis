import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { z } from "zod";

import { DuneSpiceError, DuneToolError } from "./errors.js";
import type { ExecutionHandle, ExecutionResult, UsageInfo } from "./schemas.js";
import { getUsage } from "./tools/account.js";
import {
  executeQueryById,
  getExecutionResults,
  runQueryAndWait,
} from "./tools/queries.js";
import { createDuneTransport, DEFAULT_MCP_URL, type AuthMode } from "./transport.js";
import type { DuneMCPOptions, RunQueryAndWaitOptions } from "./types.js";

const CLIENT_INFO_DEFAULT = { name: "@arrakis/spice", version: "0.0.0" };

/**
 * Thin typed wrapper around the official MCP `Client`. The `call` primitive
 * below performs a JSON-RPC `tools/call` against the Dune MCP server and
 * returns either the tool's `structuredContent` or, failing that, the first
 * text content block parsed as JSON.
 *
 * All typed tool methods (getUsage, executeQueryById, …) live in
 * `./tools/*.ts` as free functions that accept this client. Keeping tool
 * surface out of the class lets us tree-shake unused tools.
 */
export class DuneMCP {
  private readonly url: URL;
  private readonly auth: AuthMode;
  private readonly clientInfo: { name: string; version: string };
  private client: Client | undefined;
  private transport: StreamableHTTPClientTransport | undefined;
  private connectPromise: Promise<void> | undefined;

  constructor(options: DuneMCPOptions) {
    this.url = new URL(options.mcpUrl ?? DEFAULT_MCP_URL);
    this.clientInfo = options.clientInfo ?? CLIENT_INFO_DEFAULT;
    this.auth = options.getAccessToken
      ? { kind: "oauth", getAccessToken: options.getAccessToken }
      : { kind: "apiKey", apiKey: options.apiKey };
  }

  /**
   * Lazily connects on first call. Subsequent calls share the same
   * connection; `close()` resets the state so the next call reconnects.
   */
  private async ensureConnected(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connectPromise) {
      await this.connectPromise;
      return this.client!;
    }

    this.transport = createDuneTransport({ url: this.url, auth: this.auth });
    const client = new Client(this.clientInfo);
    this.connectPromise = client.connect(this.transport);

    try {
      await this.connectPromise;
      this.client = client;
      return client;
    } finally {
      this.connectPromise = undefined;
    }
  }

  /**
   * Raw `tools/call` primitive. Returns `structuredContent` when present,
   * else parses the first text block as JSON. Use this for tools that haven't
   * been given a typed wrapper yet.
   */
  async call<T = unknown>(tool: string, args?: Record<string, unknown>): Promise<T> {
    const client = await this.ensureConnected();
    let result;
    try {
      result = await client.callTool({ name: tool, arguments: args });
    } catch (err) {
      if (err instanceof DuneSpiceError) throw err;
      throw new DuneToolError(tool, args, errorMessage(err), {
        cause: err instanceof Error ? err : undefined,
      });
    }

    if (result.isError) {
      const text = extractText(result);
      throw new DuneToolError(tool, args, text ?? "tool returned isError: true");
    }

    if (result.structuredContent !== undefined) {
      return result.structuredContent as T;
    }

    const text = extractText(result);
    if (text === undefined) {
      throw new DuneToolError(tool, args, "tool returned no textual or structured content");
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  /**
   * Call a tool and validate the result with a Zod schema. Schema failures
   * become `DuneToolError`.
   */
  async callParsed<S extends z.ZodTypeAny>(
    tool: string,
    schema: S,
    args?: Record<string, unknown>,
  ): Promise<z.infer<S>> {
    const raw = await this.call(tool, args);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new DuneToolError(tool, args, `response failed validation: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  getUsage(): Promise<UsageInfo> {
    return getUsage(this);
  }

  executeQueryById(id: number, params?: Record<string, unknown>): Promise<ExecutionHandle> {
    return executeQueryById(this, id, params);
  }

  getExecutionResults(executionId: string): Promise<ExecutionResult> {
    return getExecutionResults(this, executionId);
  }

  runQueryAndWait(id: number, opts?: RunQueryAndWaitOptions): Promise<ExecutionResult> {
    return runQueryAndWait(this, id, opts);
  }

  async close(): Promise<void> {
    try {
      await this.client?.close();
    } finally {
      this.client = undefined;
      this.transport = undefined;
    }
  }
}

function extractText(result: Awaited<ReturnType<Client["callTool"]>>): string | undefined {
  const content = result.content as Array<{ type: string; text?: string }> | undefined;
  if (!content) return undefined;
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") return block.text;
  }
  return undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "unknown error";
  }
}
