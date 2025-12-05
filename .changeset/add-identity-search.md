---
'@deltadao/pontusx-registry-hooks': minor
---

Add search functionality to `usePontusXRegistry` hook with support for:

- **Wallet Address Search**: Exact match (case-insensitive) for Web3 addresses
- **Legal Name Search**: Partial text match (case-insensitive) for entity names
- **Registration Number Search**: Search across all registration numbers (EORI, LEI, VATID)
- **Country Code Search**: ISO 3166-1 alpha-2 country codes with automatic country name resolution using `Intl.DisplayNames` API

All search criteria can be combined using AND logic. Results are filtered client-side from the cached registry data without additional API requests.

**New Types:**

- `PontusXSearchCriteria` - Configuration interface for search options

**Updated Types:**

- `PontusXRegistryConfig` - Now accepts optional `search` parameter

**Example Usage:**

```tsx
const { data } = usePontusXRegistry({
  search: {
    countryCode: 'DE',
    legalName: 'AG',
  },
})
```
