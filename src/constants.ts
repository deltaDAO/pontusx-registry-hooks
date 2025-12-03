import { ApiVersion } from './types'

export const DEFAULT_API_BASE_URL =
  'https://cache.registry.pontus-x.eu' as const

export const DEFAULT_API_VERSION: ApiVersion = 'v1' as const

/**
 * Default batch size for paginated requests
 */
export const DEFAULT_BATCH_SIZE = 100 as const

/**
 * Supported API versions and endpoints
 */
export const API_VERSIONS = {
  v1: {
    identities: '/identities',
    identity: '/identities/:contractAddress/:walletAddress',
  },
} as const
