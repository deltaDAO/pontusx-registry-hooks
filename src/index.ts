/**
 * @deltadao/pontusx-registry-hooks
 *
 * Lightweight React hooks to resolve Web3 addresses to legal identities
 * via the Pontus-X Registry Cache API.
 */

export type {
  PontusXIdentity,
  PontusXRegistryConfig,
  GetIdentitiesResponse,
  PaginationMeta,
  ApiVersion,
} from './types'

export {
  usePontusXRegistry,
  usePontusXIdentity,
  usePontusXIdentityByContract,
} from './hooks'

export {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_API_VERSION,
} from './constants'
