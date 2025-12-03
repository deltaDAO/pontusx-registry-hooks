import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  usePontusXRegistry,
  usePontusXIdentity,
  usePontusXIdentityByContract,
} from '../hooks'
import { mockDeltaDAOIdentities } from './fixtures'

describe('usePontusXRegistry', () => {
  it('should fetch all identities', async () => {
    const { result } = renderHook(() => usePontusXRegistry())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.error).toBeUndefined()
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
