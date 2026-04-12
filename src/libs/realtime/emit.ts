import 'server-only'

import { TABUNGAN_EVENTS } from './events'
import type { TabunganEventName, TabunganEventPayload } from './events'

/**
 * Server-side helper used by mutation API routes to broadcast a realtime
 * invalidation event to all connected clients.
 *
 * When the app is started via the custom server (`npm run dev:rt` or
 * `npm start`), a Socket.io instance is stashed on `globalThis.__kasmiIO`.
 * This function becomes a no-op when that isn't set (e.g. during `npm run
 * dev` with Turbopack + the default Next.js server), so callers can safely
 * call `emitTabungan(...)` without branching.
 */
export const emitTabungan = (event: TabunganEventName, extra?: Partial<TabunganEventPayload>) => {
  try {
    const io = (globalThis as unknown as { __kasmiIO?: { emit: (evt: string, payload: unknown) => void } })
      .__kasmiIO

    if (!io) return

    const payload: TabunganEventPayload = {
      event,
      at: Date.now(),
      ...extra
    }

    io.emit(event, payload)
  } catch (err) {
    console.warn('emitTabungan failed (non-fatal):', err)
  }
}

export { TABUNGAN_EVENTS }
export type { TabunganEventName, TabunganEventPayload }
