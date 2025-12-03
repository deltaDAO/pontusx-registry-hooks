# @deltadao/pontusx-registry-hooks

## 0.1.0

### Minor Changes

- [#1](https://github.com/deltaDAO/pontusx-registry-hooks/pull/1) [`627feaa`](https://github.com/deltaDAO/pontusx-registry-hooks/commit/627feaa02205f58ccb703edc9f9d880694acdc6d) Thanks [@moritzkirstein](https://github.com/moritzkirstein)! - Initial release of Pontus-X Registry Hooks

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
