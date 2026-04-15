// Shared event name constants + payload types used by both the server
// (mutation API routes) and the client (SocketProvider).

export const TABUNGAN_EVENTS = {
  TRANSACTIONS_CHANGED: 'tabungan:transactions-changed',
  STORAGE_TYPES_CHANGED: 'tabungan:storage-types-changed',
  SAVINGS_CATEGORIES_CHANGED: 'tabungan:savings-categories-changed',
  EXPENSE_CATEGORIES_CHANGED: 'tabungan:expense-categories-changed',
  FAMILY_MEMBERS_CHANGED: 'tabungan:family-members-changed',
  DATA_RESTORED: 'tabungan:data-restored'
} as const

export type TabunganEventName = (typeof TABUNGAN_EVENTS)[keyof typeof TABUNGAN_EVENTS]

export type TabunganEventPayload = {
  event: TabunganEventName
  actor?: string
  at: number
}

// Map of event → API URL prefixes that should be invalidated on the client.
// Matches the key prefix against the URL used in useTabunganData.
export const EVENT_INVALIDATION_MAP: Record<TabunganEventName, string[]> = {
  [TABUNGAN_EVENTS.TRANSACTIONS_CHANGED]: [
    '/api/apps/tabungan/transactions',
    '/api/apps/tabungan/stats',
    '/api/apps/tabungan/storage-types'
  ],
  [TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED]: [
    '/api/apps/tabungan/storage-types',
    '/api/apps/tabungan/stats'
  ],
  [TABUNGAN_EVENTS.SAVINGS_CATEGORIES_CHANGED]: [
    '/api/apps/tabungan/savings-categories',
    '/api/apps/tabungan/stats'
  ],
  [TABUNGAN_EVENTS.EXPENSE_CATEGORIES_CHANGED]: [
    '/api/apps/tabungan/expense-categories',
    '/api/apps/tabungan/stats'
  ],
  [TABUNGAN_EVENTS.FAMILY_MEMBERS_CHANGED]: ['/api/apps/tabungan/family-members'],
  [TABUNGAN_EVENTS.DATA_RESTORED]: [
    '/api/apps/tabungan/transactions',
    '/api/apps/tabungan/stats',
    '/api/apps/tabungan/storage-types',
    '/api/apps/tabungan/savings-categories',
    '/api/apps/tabungan/expense-categories',
    '/api/apps/tabungan/family-members'
  ]
}
