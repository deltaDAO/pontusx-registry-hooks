import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  usePontusXRegistry,
  usePontusXRegistryDeprecated,
  usePontusXIdentity,
  usePontusXIdentityByContract,
} from '../hooks'
import {
  mockDeltaDAOIdentities,
  mockDeprecatedDeltaDAOIdentities,
} from './fixtures'
import { PontusXIdentity } from '../types'

describe('usePontusXRegistry', () => {
  it('should fetch all identities', async () => {
    const { result } = renderHook(() => usePontusXRegistry())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.[0].version).toBe('v1')
    expect(result.current.error).toBeUndefined()
  })

  it('should include deprecated identities when configured', async () => {
    const [targetDeprecatedIdentityAddress, targetDeprecatedIdentityName] =
      Object.entries(mockDeprecatedDeltaDAOIdentities)[0]
    const { result } = renderHook(() =>
      usePontusXRegistry({ includeDeprecated: true }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    const deprecatedIdentity = result.current.data?.find(
      (id) => id.walletAddress === targetDeprecatedIdentityAddress,
    )
    expect(deprecatedIdentity).toBeDefined()
    expect(deprecatedIdentity?.legalName).toBe(targetDeprecatedIdentityName)
    expect(deprecatedIdentity?.version).toBe('0.x')
  })

  it('should prioritize v1 identities over deprecated ones when duplicates exist', async () => {
    const targetIdentity = mockDeltaDAOIdentities[0]
    const { result } = renderHook(() =>
      usePontusXRegistry({ includeDeprecated: true }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()

    // The address that exists in both registries
    const duplicateAddress = targetIdentity.walletAddress

    const identity = result.current.data?.find(
      (id) => id.walletAddress.toLowerCase() === duplicateAddress.toLowerCase(),
    )

    expect(identity).toBeDefined()
    // Should have the v1 version and name, not the deprecated name ("Old deltaDAO Name")
    expect(identity?.version).toBe('v1')
    expect(identity?.legalName).toBe(targetIdentity.legalName)
    // Ensure v1 specific fields are present
    expect((identity as PontusXIdentity<'v1'>)?.txHash).toBeDefined()

    // Ensure we don't have two entries for the same address
    const duplicates = result.current.data?.filter(
      (id) => id.walletAddress.toLowerCase() === duplicateAddress.toLowerCase(),
    )
    expect(duplicates?.length).toBe(1)
  })

  describe('search functionality', () => {
    it('should filter by wallet address', async () => {
      const targetIdentity = mockDeltaDAOIdentities[0]
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { walletAddress: targetIdentity.walletAddress },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBe(1)
      expect(result.current.data?.[0].walletAddress).toBe(
        targetIdentity.walletAddress,
      )
    })

    it('should filter by legal name', async () => {
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { legalName: 'deltaDAO' },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      // Both mock identities have "deltaDAO" in their name
      expect(result.current.data?.length).toBe(2)
    })

    it('should filter by registration number (EORI)', async () => {
      // First mock identity has EORI: DE390726175076766
      const targetEORI = 'DE390726175076766'
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { registrationNumber: targetEORI },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBeGreaterThan(0)
      // Check that we found identities with this EORI
      const found = result.current.data?.every((id) => {
        if (id.version !== 'v1') return false
        const eori = (id as PontusXIdentity<'v1'>).credentialsData?.['gx:EORI']
        return (eori as any)?.['gx:eori'] === targetEORI
      })
      expect(found).toBe(true)
    })

    it('should return empty list if no match found', async () => {
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { legalName: 'NonExistentCompany' },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBe(0)
    })

    it('should filter by country code', async () => {
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { countryCode: 'DE' },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBeGreaterThan(0)
      // Verify that all results have Germany-related credentials
      const allHaveDE = result.current.data?.every((id) => {
        if (id.version !== 'v1') return false
        const credentials = (id as PontusXIdentity<'v1'>).credentialsData
        if (!credentials) return false

        // Check if any credential has DE or Germany
        return Object.values(credentials).some((credential: any) => {
          if (!credential || typeof credential !== 'object') return false
          return Object.values(credential).some((value) => {
            if (typeof value !== 'string') return false
            const normalized = value.trim().toUpperCase()
            return (
              normalized === 'DE' || value.toLowerCase().includes('germany')
            )
          })
        })
      })
      expect(allHaveDE).toBe(true)
    })

    it('should handle invalid country code', async () => {
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { countryCode: 'INVALID' },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.length).toBe(0)
    })

    it('should match country name when searching by code', async () => {
      // DE should resolve to "Germany" and match the country field in EORI
      const { result } = renderHook(() =>
        usePontusXRegistry({
          search: { countryCode: 'DE' },
        }),
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      const found = result.current.data?.some((id) => {
        if (id.version !== 'v1') return false
        const eori = (id as PontusXIdentity<'v1'>).credentialsData?.['gx:EORI']
        return (eori as any)?.['gx:country'] === 'Germany'
      })
      expect(found).toBe(true)
    })
  })
})

describe('usePontusXRegistryDeprecated', () => {
  it('should fetch deprecated identities', async () => {
    const [targetDeprecatedIdentityAddress, targetDeprecatedIdentityName] =
      Object.entries(mockDeprecatedDeltaDAOIdentities)[0]
    const { result } = renderHook(() => usePontusXRegistryDeprecated())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.length).toBe(3)
    expect(result.current.data?.[0].walletAddress).toBe(
      targetDeprecatedIdentityAddress,
    )
    expect(result.current.data?.[0].legalName).toBe(
      targetDeprecatedIdentityName,
    )
    expect(result.current.data?.[0].version).toBe('0.x')
  })
})

describe('usePontusXIdentity', () => {
  it('should find an identity by wallet address', async () => {
    const targetIdentity = mockDeltaDAOIdentities[0]
    const { result } = renderHook(() =>
      usePontusXIdentity(targetIdentity.walletAddress),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.identity).toBeDefined()
    expect(result.current.identity?.walletAddress).toBe(
      targetIdentity.walletAddress,
    )
  })

  it('should return undefined for non-existent identity', async () => {
    const { result } = renderHook(() => usePontusXIdentity('0xnonexistent'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.identity).toBeUndefined()
  })

  it('should handle case-insensitive address matching', async () => {
    const targetIdentity = mockDeltaDAOIdentities[0]
    const upperAddress = targetIdentity.walletAddress.toUpperCase()

    const { result } = renderHook(() => usePontusXIdentity(upperAddress))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.identity).toBeDefined()
    expect(result.current.identity?.walletAddress).toBe(
      targetIdentity.walletAddress,
    )
  })

  it('should handle pagination correctly when finding identity', async () => {
    // Use the second identity which would be on the second page if batchSize is 1
    const targetIdentity = mockDeltaDAOIdentities[1]
    const { result } = renderHook(() =>
      usePontusXIdentity(targetIdentity.walletAddress, { batchSize: 1 }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.identity).toBeDefined()
    expect(result.current.identity?.walletAddress).toBe(
      targetIdentity.walletAddress,
    )
  })
})

describe('usePontusXIdentityByContract', () => {
  it('should fetch identity by contract and wallet address', async () => {
    const targetIdentity = mockDeltaDAOIdentities[0]
    const { result } = renderHook(() =>
      usePontusXIdentityByContract(
        targetIdentity.contractAddress,
        targetIdentity.walletAddress,
      ),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.identity).toBeDefined()
    expect(result.current.identity?.walletAddress).toBe(
      targetIdentity.walletAddress,
    )
    expect(result.current.identity?.contractAddress).toBe(
      targetIdentity.contractAddress,
    )
  })

  it('should handle 404 for non-existent identity', async () => {
    const { result } = renderHook(() =>
      usePontusXIdentityByContract('0xnonexistent', '0xnonexistent'),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
  })
})
