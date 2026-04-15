import 'server-only'

import { getCloudflareContext } from '@opennextjs/cloudflare'

import { TABUNGAN_EVENTS } from './events'
import type { TabunganEventName, TabunganEventPayload } from './events'

/**
 * Server-side helper used by mutation API routes to broadcast a realtime
 * invalidation event to all connected browser clients.
 *
 * Under Cloudflare Workers (via @opennextjs/cloudflare), this calls the
 * `TabunganBroadcaster` Durable Object's `/broadcast` endpoint through the
 * `REALTIME` namespace binding. The DO then fans the event out to every
 * connected WebSocket.
 *
 * Uses `executionContext.waitUntil()` so the API response is not blocked on
 * the broadcast round-trip. Safe no-op when the binding is missing
 * (e.g. `next dev` without CF bindings).
 */
export const emitTabungan = (event: TabunganEventName, extra?: Partial<TabunganEventPayload>): void => {
  let cf:
    | {
        env?: CloudflareEnv
        ctx?: { waitUntil: (p: Promise<unknown>) => void }
      }
    | undefined

  try {
    cf = getCloudflareContext() as typeof cf
  } catch {
    // No Cloudflare context (plain Node dev server, build time, etc.)
    return
  }

  const env = cf?.env

  if (!env?.REALTIME || !env.REALTIME_SECRET) return

  const payload: TabunganEventPayload = {
    event,
    at: Date.now(),
    ...extra
  }

  const work = (async () => {
    try {
      const id = env.REALTIME.idFromName('global')
      const stub = env.REALTIME.get(id)

      // URL host doesn't matter — the DO routes by pathname.
      await stub.fetch('https://do.internal/broadcast', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-realtime-secret': env.REALTIME_SECRET
        },
        body: JSON.stringify(payload)
      })
    } catch (err) {
      console.warn('emitTabungan broadcast failed (non-fatal):', err)
    }
  })()

  if (cf?.ctx?.waitUntil) {
    cf.ctx.waitUntil(work)
  } else {
    // In non-CF environments, just let the promise float; mutation response
    // has already been sent by the time we care about errors.
    void work
  }
}

export { TABUNGAN_EVENTS }
export type { TabunganEventName, TabunganEventPayload }
