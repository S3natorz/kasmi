import 'server-only'

import { TABUNGAN_EVENTS } from './events'
import type { TabunganEventName, TabunganEventPayload } from './events'

// Realtime broadcast DISABLED. The Durable Object WebSocket pipeline was
// causing stale-UI / saldo-ngaco symptoms that were hard to diagnose from
// mobile. All mutation routes still import this helper, but it's now a
// no-op. Data freshness is handled entirely by:
//   - dialog onSuccess callbacks that invalidate the local SWR cache
//   - short (10s) Cloudflare edge TTLs on read endpoints
//   - explicit `?_cb=<ts>` cache-busting on every revalidation
//
// If you ever want realtime back, restore this file from git history
// (commit before the websocket-removal commit) AND re-mount
// <TabunganRealtime /> in TabunganMobileLayout.
export const emitTabungan = (
  _event: TabunganEventName,
  _extra?: Partial<TabunganEventPayload>
): void => {
  // intentionally empty
}

export { TABUNGAN_EVENTS }
export type { TabunganEventName, TabunganEventPayload }
