/**
 * @deltadao/pontusx-registry-hooks
 *
 * Lightweight React hooks to resolve Web3 addresses to legal identities
 * via the Pontus-X Registry Cache API.
 */

export type {
  PontusXIdentity,
  PontusXIdentityDeprecated,
  PontusXRegistryConfig,
  GetIdentitiesResponse,
  PaginationMeta,
  ApiVersion,
} from './types'

export {
  usePontusXRegistry,
  usePontusXRegistryDeprecated,
  usePontusXIdentity,
  usePontusXIdentityByContract,
} from './hooks'

export {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_API_VERSION,
  DEFAULT_BATCH_SIZE,
} from './constants'
