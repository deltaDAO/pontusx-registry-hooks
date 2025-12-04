# @deltadao/pontusx-registry-hooks

[![npm version](https://badge.fury.io/js/@deltadao%2Fpontusx-registry-hooks.svg)](https://www.npmjs.com/package/@deltadao/pontusx-registry-hooks)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@deltadao/pontusx-registry-hooks)](https://bundlephobia.com/package/@deltadao/pontusx-registry-hooks)

Lightweight React hooks (<5kb) to resolve Web3 addresses to legal identities via the Pontus-X Registry API.

## Features

- 🪶 **Minimal Bundle Size**: Uses SWR for efficient caching (~5kb)
- ⚡ **Instant Lookups**: Cached registry prevents API spam when resolving 50+ addresses
- 📄 **Smart Pagination**: Automatically fetches all pages in parallel for complete registry data
- 🎯 **Type-Safe**: Full TypeScript support with strict mode
- 🔄 **Framework Agnostic**: Works with Next.js, Vite, and any React app
- 📦 **Zero Config**: Works out of the box with sensible defaults

## Installation

```bash
pnpm add @deltadao/pontusx-registry-hooks swr
```

## Usage

### Resolve a Single Address (from cached list)

```tsx
import { usePontusXIdentity } from '@deltadao/pontusx-registry-hooks'

function UserProfile({ walletAddress }) {
  const { identity, isLoading, error, isFound } =
    usePontusXIdentity(walletAddress)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading identity</div>
  if (!isFound) return <div>Unknown address</div>

  return <div>{identity?.legalName}</div>
}
```

### Fetch Identity by Contract and Wallet Address

```tsx
import { usePontusXIdentityByContract } from '@deltadao/pontusx-registry-hooks'

function IdentityDetails({ contractAddress, walletAddress }) {
  const { identity, isLoading, error } = usePontusXIdentityByContract(
    contractAddress,
    walletAddress,
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!identity) return <div>Identity not found</div>

  return (
    <div>
      <h3>{identity.legalName}</h3>
      <p>Token ID: {identity.tokenId}</p>
      <p>Updated: {new Date(identity.updatedAt).toLocaleDateString()}</p>
    </div>
  )
}
```

### Fetch the Entire Registry

```tsx
import { usePontusXRegistry } from '@deltadao/pontusx-registry-hooks'

function RegistryList() {
  const { data, error, isLoading } = usePontusXRegistry()

  if (isLoading) return <div>Loading registry...</div>
  if (error) return <div>Error loading registry</div>

  return (
    <ul>
      {data?.map((identity) => (
        <li key={identity.walletAddress}>
          {identity.legalName} - {identity.walletAddress} ({identity.version})
        </li>
      ))}
    </ul>
  )
}
```

### Custom API Configuration

```tsx
const { identity } = usePontusXIdentity(address, {
  apiBaseUrl: 'https://your-custom-registry.com',
  apiVersion: 'v1',
  batchSize: 50, // Customize pagination batch size
})
```

### Deprecated Registry Support (v0.x)

To support the migration period, you can include identities from the deprecated v0.x JSON registry. These entries will be merged with the v1 API data.

If an identity exists in both the new registry (v1) and the deprecated list (0.x), the v1 entry takes precedence.

All returned identities include a `version` flag (`'v1'` or `'0.x'`) to help distinguish the source.

```tsx
const { data } = usePontusXRegistry({
  includeDeprecated: true, // Enable legacy JSON support
})
```

You can also use the deprecated hook directly if needed:

```tsx
import { usePontusXRegistryDeprecated } from '@deltadao/pontusx-registry-hooks'

const { data } = usePontusXRegistryDeprecated()
```

## API

### `usePontusXIdentity(walletAddress, config?)`

Resolves a single Web3 wallet address to its legal identity. Uses the cached registry data for instant lookups. Address comparison is case-insensitive.

**Parameters:**

- `walletAddress` (string | undefined): The wallet address to look up (case-insensitive)
- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL (default: `https://cache.registry.pontus-x.eu`)
  - `apiVersion` (ApiVersion): API version to use (default: `v1`)
  - `batchSize` (number): Batch size for pagination (default: `100`)

**Returns:**

- `identity` (PontusXIdentity | undefined): The resolved identity
- `isLoading` (boolean): Loading state
- `error` (Error | undefined): Error if fetch failed
- `isFound` (boolean): Convenience flag indicating whether identity was found
- `legalName` (string | null): Convenience accessor for the entity's legal name

**Caching:**

- Relies on `usePontusXRegistry` for cached data
- No additional network request if registry is already loaded
- Cache deduping interval: 1 minute

### `usePontusXIdentityByContract(contractAddress, walletAddress, config?)`

Fetches a specific identity directly from the API using both contract and wallet addresses. Results are strictly cached since identities rarely change.

**Parameters:**

- `contractAddress` (string | undefined): The contract address of the registry
- `walletAddress` (string | undefined): The wallet address (owner of the identity)
- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL (default: `https://cache.registry.pontus-x.eu`)
  - `apiVersion` (ApiVersion): API version to use (default: `v1`)
  - `batchSize` (number): Batch size for pagination (default: `100`)

**Returns:**

- `identity` (PontusXIdentity | undefined): The resolved identity
- `isLoading` (boolean): Loading state
- `error` (Error | undefined): Error if fetch failed
- `isFound` (boolean): Convenience flag indicating whether identity was found
- `legalName` (string | null): Convenience accessor for the entity's legal name

**Caching:**

- Direct API calls with no dependency on registry cache
- Strict caching with 5 minute deduping interval (identities rarely change)
- Returns 404 error for non-existent identities

### `usePontusXRegistry(config?)`

Fetches the entire Pontus-X Registry. Data is cached globally and reused across all hooks. Use this when you need the complete registry or when making multiple lookups to avoid repeated fetches.

**Pagination**: Automatically fetches all pages in parallel after the first page for optimal performance.

1. Fetches page 1 with configurable batch size (default: 100 items)
2. Fetches all remaining pages simultaneously using `Promise.all()`
3. Aggregates all results into a single array

**Parameters:**

- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL (default: `https://cache.registry.pontus-x.eu`)
  - `apiVersion` (ApiVersion): API version to use (default: `v1`)
  - `batchSize` (number): Batch size for paginated requests (default: `100`)

**Returns:** Standard SWR response object

- `data` (PontusXIdentity[] | undefined): The complete registry data
- `error` (Error | undefined): Error if fetch failed
- `isLoading` (boolean): Loading state

**Caching:**

- Global cache: data is reused across all hook instances
- No revalidation on window focus or network reconnect
- Cache deduping interval: 1 minute

## Constants

The library exports useful constants for configuration:

```typescript
import {
  DEFAULT_API_BASE_URL, // 'https://cache.registry.pontus-x.eu'
  DEFAULT_API_VERSION, // 'v1'
  DEFAULT_BATCH_SIZE, // 100
  API_VERSIONS, // { v1: { identities: '/identities', identity: '...' } }
} from '@deltadao/pontusx-registry-hooks'
```

## Types

```typescript
interface PontusXIdentityV1 {
  walletAddress: string // Wallet address (owner of the identity)
  contractAddress: string // Contract address of the registry
  tokenId: string // Token ID on the blockchain
  txHash: string // Transaction hash
  lastBlockNumber: string // Last block number synced
  blockTime: string // Block timestamp (ISO 8601)
  legalName: string | null // Legal name of the entity
  presentationUrl: string | null // URL of the verifiable presentation
  credentialsData: Record<string, object> // Flattened credentials data
  createdAt: string // Creation timestamp (ISO 8601)
  updatedAt: string // Last update timestamp (ISO 8601)
}

type PontusXIdentity<V extends ApiVersion> = V extends 'v1'
  ? PontusXIdentityV1
  : never

interface PaginationMeta {
  total: number // Total number of items
  page: number // Current page number
  lastPage: number // Last page number
}

interface GetIdentitiesResponse<V extends ApiVersion> {
  data: PontusXIdentity<V>[]
  meta: PaginationMeta
}

interface PontusXRegistryConfig {
  apiBaseUrl?: string // Custom API endpoint (default: 'https://cache.registry.pontus-x.eu')
  apiVersion?: ApiVersion // API version to use (default: 'v1')
  batchSize?: number // Batch size for paginated requests (default: 100)
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## Testing

The library includes comprehensive unit tests using Vitest and MSW for API mocking:

```bash
# Run tests
pnpm test
```

Tests cover:

- Hook functionality and data fetching
- Pagination handling with custom batch sizes
- Case-insensitive address matching
- Error handling for non-existent identities
- Type correctness and structure validation

## Publishing

This package uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset
pnpm changeset

# Version packages and update changelog
pnpm changeset version

# Publish to NPM
pnpm release
```

## License

Apache 2.0 © deltaDAO
