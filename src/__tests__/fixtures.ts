import { type GetIdentitiesResponse, type PontusXIdentity } from '../types'

/**
 * Mock deltaDAO identities from the staging registry
 */
export const mockDeprecatedDeltaDAOIdentities: Record<string, string> = {
  '0xDeprecated1': 'Deprecated Entity 1',
  '0xDeprecated2': 'Deprecated Entity 2',
  // This address exists in the new registry (mockDeltaDAOIdentities[0])
  '0xe0d15ab8d5ef763a46757509daac262dbc357712': 'Old deltaDAO Name',
}

/**
 * Mock deltaDAO identities from the staging registry
 */
export const mockDeltaDAOIdentities: PontusXIdentity<'v1'>[] = [
  {
    walletAddress: '0xe0d15ab8d5ef763a46757509daac262dbc357712',
    contractAddress: '0xCe1750f8A5A645935F6451f6a92Ed1968F6B4430',
    tokenId: '60',
    txHash:
      '0x38b8b2b8de403041089710c4d1e1036d626babadcfceac5e81ca53efbe4a270e',
    lastBlockNumber: '8051042',
    blockTime: '2025-12-01T18:04:11.000Z',
    legalName: 'deltaDAO AG',
    presentationUrl: 'https://credentials.delta-dao.com/presentations/6',
    credentialsData: {
      'gx:EORI': {
        id: 'https://credentials.delta-dao.com/credentials/28#cs',
        type: 'gx:EORI',
        'gx:eori': 'DE390726175076766',
        'gx:country': 'Germany',
      },
      'gx:VatID': {
        id: 'https://credentials.delta-dao.com/credentials/27#cs',
        type: 'gx:VatID',
        'gx:vatID': 'DE346013532',
        'gx:countryCode': 'DE',
      },
      'gx:LeiCode': {
        id: 'https://credentials.delta-dao.com/credentials/26#cs',
        type: 'gx:LeiCode',
        'gx:countryCode': 'DE',
        'schema:leiCode': '391200FJBNU0YW987L26',
      },
    },
    version: 'v1',
    createdAt: '2025-12-03T00:10:42.348Z',
    updatedAt: '2025-12-03T00:10:42.348Z',
  },
  {
    walletAddress: '0x4c84a36fcdb7bc750294a7f3b5ad5ca8f74c4a52',
    contractAddress: '0xCe1750f8A5A645935F6451f6a92Ed1968F6B4430',
    tokenId: '53',
    txHash:
      '0x2f992a5ebeed8182df04d2ce36bdaa8e03ac755731b94c14f8cac9c34e0ef4d0',
    lastBlockNumber: '7871915',
    blockTime: '2025-11-19T21:39:28.000Z',
    legalName: 'deltaDAO AG',
    presentationUrl: 'https://credentials.delta-dao.com/presentations/5',
    credentialsData: {
      'gx:EORI': {
        id: 'https://credentials.delta-dao.com/credentials/22#cs',
        type: 'gx:EORI',
        'gx:eori': 'DE390726175076766',
        'gx:country': 'Germany',
      },
    },
    version: 'v1',
    createdAt: '2025-12-03T00:10:41.677Z',
    updatedAt: '2025-12-03T00:10:41.677Z',
  },
]

/**
 * Mock paginated response from the identities endpoint
 */
export const mockPaginatedResponse: GetIdentitiesResponse<'v1'> = {
  data: mockDeltaDAOIdentities,
  meta: {
    total: mockDeltaDAOIdentities.length,
    page: 1,
    lastPage: 1,
  },
}
