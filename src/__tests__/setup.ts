import { afterEach, afterAll, beforeAll, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { DEFAULT_API_BASE_URL } from '../constants'
import { mockPaginatedResponse } from './fixtures'

/**
 * Mock Service Worker setup for API mocking
 */
export const server = setupServer(
  // Mock the identities list endpoint
  http.get(`${DEFAULT_API_BASE_URL}/identities`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)

    // Simulate pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = mockPaginatedResponse.data.slice(startIndex, endIndex)

    return HttpResponse.json({
      data: paginatedData,
      meta: {
        total: mockPaginatedResponse.data.length,
        page,
        lastPage: Math.ceil(mockPaginatedResponse.data.length / limit),
      },
    })
  }),

  // Mock the single identity endpoint
  http.get(
    `${DEFAULT_API_BASE_URL}/identities/:contractAddress/:walletAddress`,
    ({ params }) => {
      const { contractAddress, walletAddress } = params
      const identity = mockPaginatedResponse.data.find(
        (id: { walletAddress: string; contractAddress: string }) =>
          id.walletAddress.toLowerCase() ===
            (walletAddress as string).toLowerCase() &&
          id.contractAddress.toLowerCase() ===
            (contractAddress as string).toLowerCase(),
      )

      if (!identity) {
        return HttpResponse.json(
          { error: 'Identity not found' },
          { status: 404 },
        )
      }

      return HttpResponse.json(identity)
    },
  ),
)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())

// Mock fetch globally if needed
global.fetch = vi.fn(global.fetch)
