---
'@deltadao/pontusx-registry-hooks': minor
---

Initial release of Pontus-X Registry Hooks

Features:

- Three React hooks for resolving Web3 addresses to legal identities
  - `usePontusXRegistry`: Fetch the entire registry with automatic pagination
  - `usePontusXIdentity`: Look up a single identity from cached registry data
  - `usePontusXIdentityByContract`: Fetch identity by contract and wallet address
- SWR-based caching for efficient data management (~5kb bundle size)
- Smart pagination that fetches all pages in parallel
- Full TypeScript support with strict mode
- Case-insensitive address matching
- Configurable API endpoints and batch size
