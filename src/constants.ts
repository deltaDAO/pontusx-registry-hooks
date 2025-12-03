import { ApiVersion } from './types'

export const DEFAULT_API_BASE_URL =
  'https://cache.registry.pontus-x.eu' as const

export const DEFAULT_API_VERSION: ApiVersion = 'v1' as const

export const API_VERSIONS = {
  v1: {
    identities: '/identities',
    identity: '/identities/:contractAddress/:walletAddress',
  },
} as const
