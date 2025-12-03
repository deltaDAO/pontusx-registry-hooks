import { useMemo } from 'react'
import useSWR from 'swr'
import {
  API_VERSIONS,
  DEFAULT_API_BASE_URL,
  DEFAULT_API_VERSION,
  DEFAULT_BATCH_SIZE,
} from './constants'
import {
  ApiVersion,
  type GetIdentitiesResponse,
  type PontusXIdentity,
  type PontusXRegistryConfig,
} from './types'

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
  allIdentities = [...firstJson.data]

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
      allIdentities = [...allIdentities, ...json.data]
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
  return response.json()
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

  return useSWR<PontusXIdentity<V>[]>(
    apiUrl,
    (url) => listFetcher<V>(url, config?.batchSize || DEFAULT_BATCH_SIZE),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute deduping
    },
  )
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
