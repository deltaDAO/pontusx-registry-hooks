# @deltadao/pontusx-registry-hooks

[![npm version](https://badge.fury.io/js/@deltadao%2Fpontusx-registry-hooks.svg)](https://www.npmjs.com/package/@deltadao/pontusx-registry-hooks)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@deltadao/pontusx-registry-hooks)](https://bundlephobia.com/package/@deltadao/pontusx-registry-hooks)

Lightweight React hooks (~5kb) to resolve Web3 addresses to legal identities via the Pontus-X Registry API.

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
  const { identity, isLoading, error, legalName } = usePontusXIdentity(walletAddress)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading identity</div>
  if (!identity) return <div>Unknown address</div>

  return <div>{JSON.stringify(legalName)}</div>
}
```

### Fetch Identity by Contract and Wallet Address

```tsx
import { usePontusXIdentityByContract } from '@deltadao/pontusx-registry-hooks'

function IdentityDetails({ contractAddress, walletAddress }) {
  const { identity, isLoading, error } = usePontusXIdentityByContract(
    contractAddress,
    walletAddress
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!identity) return <div>Identity not found</div>

  return (
    <div>
      <h3>{JSON.stringify(identity.legalName)}</h3>
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
          {JSON.stringify(identity.legalName)} - {identity.walletAddress}
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
  apiVersion: 'v1'
})
```

## API

### `usePontusXIdentity(walletAddress, config?)`

Resolves a single Web3 wallet address to its legal identity. Uses the cached registry data for instant lookups.

**Parameters:**

- `walletAddress` (string | undefined): The wallet address to look up (case-insensitive)
- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL
  - `apiVersion` (ApiVersion): API version to use

**Returns:**

- `identity` (PontusXIdentity | undefined): The resolved identity
- `isLoading` (boolean): Loading state
- `error` (Error | undefined): Error if fetch failed
- `isFound` (boolean): Whether the identity was found
- `legalName` (object | null): Convenience accessor for legal name

### `usePontusXIdentityByContract(contractAddress, walletAddress, config?)`

Fetches a specific identity directly from the API using both contract and wallet addresses. Results are strictly cached since identities rarely change.

**Parameters:**

- `contractAddress` (string | undefined): The contract address of the registry
- `walletAddress` (string | undefined): The wallet address (owner of the identity)
- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL
  - `apiVersion` (ApiVersion): API version to use

**Returns:**

- `identity` (PontusXIdentity | undefined): The resolved identity
- `isLoading` (boolean): Loading state
- `error` (Error | undefined): Error if fetch failed
- `isFound` (boolean): Whether the identity was found
- `legalName` (object | null): Convenience accessor for legal name

### `usePontusXRegistry(config?)`

Fetches the entire Pontus-X Registry. Data is cached globally and reused across all hooks.

**Pagination**: Automatically fetches all pages in parallel after the first page. The first request fetches page 1 with a batch size of 100 items, then fetches all remaining pages simultaneously for optimal performance.

**Parameters:**

- `config` (optional): Configuration object
  - `apiBaseUrl` (string): Custom API base URL
  - `apiVersion` (ApiVersion): API version to use

**Returns:** Standard SWR response object

- `data` (PontusXIdentity[] | undefined): The registry data
- `error` (Error | undefined): Error if fetch failed
- `isLoading` (boolean): Loading state

## Types

```typescript
interface PontusXIdentityV1 {
  walletAddress: string
  contractAddress: string
  tokenId: string
  txHash: string
  lastBlockNumber: string
  blockTime: string
  legalName: object | null
  presentationUrl: object | null
  credentialsData: object
  createdAt: string
  updatedAt: string
}

type PontusXIdentity = PontusXIdentityV1

interface PontusXRegistryConfig {
  apiBaseUrl?: string
  apiVersion?: ApiVersion
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
pnpm lint
```

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

MIT © deltaDAO
