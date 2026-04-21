import type { DuneMCP } from "../client.js";
import {
  BlockchainListSchema,
  DocSearchResultsSchema,
  TableSearchResultsSchema,
  TableSizeEstimateSchema,
  type BlockchainList,
  type DocSearchResults,
  type TableSearchResults,
  type TableSizeEstimate,
} from "../schemas.js";

export const TOOL_SEARCH_DOCS = "searchDocs";
export const TOOL_SEARCH_TABLES = "searchTables";
export const TOOL_LIST_BLOCKCHAINS = "listBlockchains";
export const TOOL_SEARCH_TABLES_BY_CONTRACT_ADDRESS = "searchTablesByContractAddress";
export const TOOL_GET_TABLE_SIZE = "getTableSize";

/**
 * Full-text search across Dune documentation (guides, examples, API refs).
 *
 * @example
 * ```ts
 * const results = await dune.searchDocs({ query: "DEX volume" });
 * ```
 */
export function searchDocs(
  client: DuneMCP,
  args: { query: string; limit?: number },
): Promise<DocSearchResults> {
  return client.callParsed(TOOL_SEARCH_DOCS, DocSearchResultsSchema, args);
}

/**
 * Find Dune tables by protocol, chain, category, or schema keyword.
 */
export function searchTables(
  client: DuneMCP,
  args: {
    query?: string;
    chain?: string;
    protocol?: string;
    category?: string;
    limit?: number;
  },
): Promise<TableSearchResults> {
  return client.callParsed(TOOL_SEARCH_TABLES, TableSearchResultsSchema, args);
}

/** List every blockchain Dune indexes, with table counts. */
export function listBlockchains(client: DuneMCP): Promise<BlockchainList> {
  return client.callParsed(TOOL_LIST_BLOCKCHAINS, BlockchainListSchema);
}

/**
 * Find decoded event / call tables associated with a contract address.
 *
 * @example
 * ```ts
 * await dune.searchTablesByContractAddress(
 *   "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
 * );
 * ```
 */
export function searchTablesByContractAddress(
  client: DuneMCP,
  address: string,
  chain?: string,
): Promise<TableSearchResults> {
  const args: Record<string, unknown> = { address };
  if (chain) args.chain = chain;
  return client.callParsed(
    TOOL_SEARCH_TABLES_BY_CONTRACT_ADDRESS,
    TableSearchResultsSchema,
    args,
  );
}

/** Estimate bytes scanned when querying one or more tables. */
export function getTableSize(
  client: DuneMCP,
  tables: string[],
): Promise<TableSizeEstimate> {
  return client.callParsed(TOOL_GET_TABLE_SIZE, TableSizeEstimateSchema, { tables });
}
