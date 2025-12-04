import { API_VERSIONS } from './constants'

export type ApiVersion = keyof typeof API_VERSIONS

/**
 * Base interface for Pontus-X Identity (API v1)
 */
interface PontusXIdentityV1 {
  /** Wallet address (owner of the identity) */
  walletAddress: string
  /** Contract address of the registry */
  contractAddress: string
  /** Token ID on the blockchain */
  tokenId: string
  /** Transaction hash */
  txHash: string
  /** Last block number synced */
  lastBlockNumber: string
  /** Block timestamp */
  blockTime: string
  /** Legal name of the entity */
  legalName: string | null
  /** URL of the verifiable presentation */
  presentationUrl: string | null
  /** Flattened credentials data (JSONB) */
  credentialsData: Record<string, object>
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  /** API Version */
  version: 'v1'
}

/**
 * Represents a legal identity entry in the Pontus-X Registry.
 * The structure depends on the API version.
 */
export type PontusXIdentity<V extends ApiVersion> = V extends 'v1'
  ? PontusXIdentityV1
  : never

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  /** Total number of items */
  total: number
  /** Current page number */
  page: number
  /** Last page number */
  lastPage: number
}

/**
 * Deprecated identity structure from v0.x JSON file
 * @deprecated This type is for the legacy JSON-based registry and will be removed in future versions.
 */
export interface PontusXIdentityDeprecated {
  /** Wallet address (owner of the identity) */
  walletAddress: string
  /** Legal name of the entity */
  legalName: string
  /** API Version */
  version: '0.x'
}

/**
 * Response DTO for the identities list endpoint
 */
export interface GetIdentitiesResponse<V extends ApiVersion> {
  /** Array of identity records */
  data: PontusXIdentity<V>[]
  /** Pagination metadata */
  meta: PaginationMeta
}

/**
 * Configuration options for the Pontus-X Registry hooks
 */
export interface PontusXRegistryConfig {
  /**
   * The API endpoint for the Pontus-X Registry
   * @default "https://cache.registry.pontus-x.eu"
   */
  apiBaseUrl?: string

  /**
   * The API version to use
   * @default "v1"
   */
  apiVersion?: ApiVersion

  /**
   * Batch size for paginated requests
   * @default 100
   */
  batchSize?: number

  /**
   * Whether to include deprecated identities from the v0.x JSON file
   * @default false
   */
  includeDeprecated?: boolean
}
