import { useMemo } from 'react'
import useSWR from 'swr'
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_API_VERSION,
  DEFAULT_BATCH_SIZE,
  DEPRECATED_REGISTRY_URL,
} from './constants'
import {
  ApiVersion,
  type GetIdentitiesResponse,
  type PontusXIdentity,
  type PontusXIdentityDeprecated,
  type PontusXRegistryConfig,
  type PontusXSearchCriteria,
} from './types'

/**
 * Helper function to check if an identity matches the search criteria
 */
const matchIdentity = (
  identity: PontusXIdentity<any> | PontusXIdentityDeprecated,
  search: PontusXSearchCriteria,
): boolean => {
  // 1. Wallet Address Search (Exact match, case-insensitive)
  if (search.walletAddress) {
    if (
      identity.walletAddress.toLowerCase() !==
      search.walletAddress.toLowerCase()
    ) {
      return false
    }
  }

  // 2. Legal Name Search (Partial match, case-insensitive)
  if (search.legalName) {
    if (
      !identity.legalName ||
      !identity.legalName.toLowerCase().includes(search.legalName.toLowerCase())
    ) {
      return false
    }
  }

  // 3. Registration Number Search (Partial match on known fields)
  if (search.registrationNumber) {
    // Deprecated identities don't have credentialsData
    if (identity.version !== 'v1') {
      return false
    }

    const searchTerm = search.registrationNumber.toLowerCase()
    const credentials = (identity as PontusXIdentity<'v1'>).credentialsData

    if (!credentials) return false

    // Check if any credential value matches the search term
    // We specifically look for values in the credential objects
    const hasMatch = Object.values(credentials).some((credential: any) => {
      if (!credential || typeof credential !== 'object') return false

      return Object.values(credential).some((value) => {
        return (
          typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        )
      })
    })

    if (!hasMatch) return false
  }

  // 4. Country Search (Code or Name match)
  if (search.countryCode) {
    if (identity.version !== 'v1') {
      return false
    }

    const credentials = (identity as PontusXIdentity<'v1'>).credentialsData
    if (!credentials) return false

    const searchCode = search.countryCode.toUpperCase()
    let searchName: string | undefined

    // Try to resolve country name from code using Intl API
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
      searchName = regionNames.of(searchCode)
    } catch {
      // Invalid country code - no matches possible
      return false
    }

    const hasMatch = Object.values(credentials).some((credential: any) => {
      if (!credential || typeof credential !== 'object') return false

      return Object.values(credential).some((value) => {
        if (typeof value !== 'string') return false
        const normalizedValue = value.trim()

        // Check 1: Exact match for Country Code (e.g. "DE")
        if (normalizedValue.toUpperCase() === searchCode) {
          return true
        }

        // Check 2: Partial match for Country Name (e.g. "Germany")
        if (
          searchName &&
          normalizedValue.toLowerCase().includes(searchName.toLowerCase())
        ) {
          return true
        }

        return false
      })
    })

    if (!hasMatch) return false
  }

  return true
}

/**
 * Fetcher function for SWR - list endpoint with pagination
 * Fetches all pages in parallel after getting the first page
 */
const listFetcher = async <V extends ApiVersion>(
  url: string,
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<PontusXIdentity<V>[]> => {
  let allIdentities: PontusXIdentity<V>[] = []
  const currentPage = 1

  // Parse the URL to add pagination parameters
  const urlObj = new URL(url)
  urlObj.searchParams.set('page', currentPage.toString())
  urlObj.searchParams.set('limit', batchSize.toString())

  // 1. Fetch the first page
  const firstRes = await fetch(urlObj.toString())
  if (!firstRes.ok) {
    throw new Error(`Failed to fetch registry data: ${firstRes.statusText}`)
  }

  const firstJson: GetIdentitiesResponse<V> = await firstRes.json()
  allIdentities = firstJson.data.map((identity) => ({
    ...identity,
    version: 'v1',
  })) as PontusXIdentity<V>[]

  const { lastPage } = firstJson.meta

  // 2. If there are more pages, fetch them in parallel
  if (lastPage > 1) {
    const remainingPages: Promise<GetIdentitiesResponse<V>>[] = []

    // Create promises for all remaining pages at once (parallel fetching)
    for (let page = 2; page <= lastPage; page++) {
      const pageUrl = new URL(url)
      pageUrl.searchParams.set('page', page.toString())
      pageUrl.searchParams.set('limit', batchSize.toString())

      remainingPages.push(
        fetch(pageUrl.toString()).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch page ${page}`)
          return res.json()
        }),
      )
    }

    const results = await Promise.all(remainingPages)

    // Combine results
    results.forEach((json: GetIdentitiesResponse<V>) => {
      const pageIdentities = json.data.map((identity) => ({
        ...identity,
        version: 'v1',
      })) as PontusXIdentity<V>[]
      allIdentities = [...allIdentities, ...pageIdentities]
    })
  }

  return allIdentities
}

/**
 * Fetcher function for SWR - single identity endpoint
 */
const identityFetcher = async <V extends ApiVersion>(
  url: string,
): Promise<PontusXIdentity<V>> => {
  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Identity not found')
    }
    throw new Error(`Failed to fetch identity: ${response.statusText}`)
  }
  const json = await response.json()
  return { ...json, version: 'v1' }
}

/**
 * Fetcher function for the deprecated JSON registry
 */
const deprecatedFetcher = async (
  url: string,
): Promise<PontusXIdentityDeprecated[]> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch deprecated registry')
  const json = await res.json()
  return Object.entries(json).map(([walletAddress, legalName]) => ({
    walletAddress,
    legalName: legalName as string,
    version: '0.x',
  }))
}

/**
 * Hook to fetch the deprecated v0.x registry
 *
 * @returns SWR response with the deprecated registry data
 * @deprecated This hook is for the legacy JSON-based registry and will be removed in future versions.
 */
export function usePontusXRegistryDeprecated() {
  return useSWR<PontusXIdentityDeprecated[]>(
    DEPRECATED_REGISTRY_URL,
    deprecatedFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour - static file
    },
  )
}

/**
 * Hook to fetch the entire Pontus-X Registry
 *
 * This hook fetches the complete registry list once and caches it globally.
 * The data is revalidated only when explicitly requested, not on focus/reconnect.
 *
 * @param config - Optional configuration for the registry API
 * @returns SWR response with the full registry data
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = usePontusXRegistry()
 * ```
 */
export function usePontusXRegistry<
  V extends ApiVersion = typeof DEFAULT_API_VERSION,
>(config?: PontusXRegistryConfig) {
  const apiUrl = new URL(
    API_VERSIONS[config?.apiVersion || DEFAULT_API_VERSION].identities,
    config?.apiBaseUrl || DEFAULT_API_BASE_URL,
  ).toString()

  const swrResponse = useSWR<PontusXIdentity<V>[]>(
    apiUrl,
    (url) => listFetcher<V>(url, config?.batchSize || DEFAULT_BATCH_SIZE),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute deduping
    },
  )

  const {
    data: deprecatedData,
    isLoading: deprecatedIsLoading,
    error: deprecatedError,
  } = usePontusXRegistryDeprecated()

  const combinedData = useMemo(() => {
    let result: (PontusXIdentity<V> | PontusXIdentityDeprecated)[] = []

    if (!config?.includeDeprecated || !deprecatedData) {
      result = swrResponse.data || []
    } else {
      const currentData = swrResponse.data || []
      const currentAddresses = new Set(
        currentData.map((id) => id.walletAddress.toLowerCase()),
      )

      const uniqueDeprecated = deprecatedData.filter(
        (id) => !currentAddresses.has(id.walletAddress.toLowerCase()),
      )

      result = [...currentData, ...uniqueDeprecated]
    }

    // Apply search filtering if criteria exists
    if (config?.search) {
      return result.filter((identity) =>
        matchIdentity(identity, config.search!),
      )
    }

    return result
  }, [swrResponse.data, deprecatedData, config])

  return {
    ...swrResponse,
    data: combinedData as
      | (PontusXIdentity<V> | PontusXIdentityDeprecated)[]
      | undefined,
    isLoading:
      swrResponse.isLoading ||
      (!!config?.includeDeprecated && deprecatedIsLoading),
    error: swrResponse.error || (config?.includeDeprecated && deprecatedError),
  }
}

/**
 * Hook to resolve a single Web3 address to its legal identity (from list cache)
 *
 * This hook efficiently looks up a single identity from the cached registry data.
 * If the registry is already loaded, this returns data instantly without a network request.
 * Address comparison is case-insensitive.
 *
 * @param address - The Web3 address to look up (case-insensitive)
 * @param config - Optional configuration for the registry API
 * @returns Object containing the identity data, loading state, and error
 *
 * @example
 * ```tsx
 * const { identity, isLoading, error } = usePontusXIdentity('0x1234...')
 * ```
 */
export function usePontusXIdentity<
  V extends ApiVersion = typeof DEFAULT_API_VERSION,
>(address: string | undefined, config?: PontusXRegistryConfig) {
  const { data, error, isLoading } = usePontusXRegistry<V>(config)

  const identity = useMemo(() => {
    if (!data || !address) return undefined

    const normalizedAddress = address.toLowerCase()
    return data.find(
      (entry) => entry.walletAddress.toLowerCase() === normalizedAddress,
    )
  }, [data, address])

  return {
    identity,
    isLoading,
    error,
    // Derived states for convenience
    isFound: identity !== undefined,
    legalName: identity?.legalName,
  }
}

/**
 * Hook to fetch a single identity by contract and wallet address
 *
 * This hook fetches a specific identity directly from the API using both
 * the contract address and wallet address. Results are cached with strict
 * caching since identities don't change frequently.
 *
 * @param contractAddress - The contract address of the registry
 * @param walletAddress - The wallet address (owner of the identity)
 * @param config - Optional configuration for the registry API
 * @returns Object containing the identity data, loading state, and error
 *
 * @example
 * ```tsx
 * const { identity, isLoading, error } = usePontusXIdentityByContract(
 *   '0xCe1750f8A5A645935F6451f6a92Ed1968F6B4430',
 *   '0xe0d15ab8d5ef763a4757509daac262dbc357712'
 * )
 * ```
 */
export function usePontusXIdentityByContract<
  V extends ApiVersion = typeof DEFAULT_API_VERSION,
>(
  contractAddress: string | undefined,
  walletAddress: string | undefined,
  config?: PontusXRegistryConfig,
) {
  const apiVersion = config?.apiVersion || DEFAULT_API_VERSION
  const baseUrl = config?.apiBaseUrl || DEFAULT_API_BASE_URL

  // Build the URL with path parameters
  const apiUrl = useMemo(() => {
    if (!contractAddress || !walletAddress) return null

    const path = API_VERSIONS[apiVersion].identity
      .replace(':contractAddress', contractAddress)
      .replace(':walletAddress', walletAddress)

    return new URL(path, baseUrl).toString()
  }, [contractAddress, walletAddress, apiVersion, baseUrl])

  const { data, error, isLoading } = useSWR<PontusXIdentity<V>>(
    apiUrl,
    identityFetcher<V>,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000, // 5 minutes - strict caching
    },
  )

  return {
    identity: data,
    isLoading,
    error,
    // Derived states for convenience
    isFound: data !== undefined,
    legalName: data?.legalName,
  }
}
