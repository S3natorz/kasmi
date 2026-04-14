import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Edge-cache wrapper for idempotent GET responses on Cloudflare Workers.
 *
 * =============================================================================
 *  Why this exists
 * =============================================================================
 *
 * Every `/api/apps/tabungan/*` GET in this app costs ~1.5-2s of pure
 * connection setup before the query even runs — we open a fresh `pg.Pool`
 * per request (we *have* to, because Workers forbid reusing I/O across
 * requests), which means TCP + TLS + Supavisor auth on every call. For a
 * lookup like `/family-members` that returns 327 bytes this was a 2s
 * round-trip for 5ms of actual work.
 *
 * Cloudflare's edge cache (`caches.default`) sits between the Worker and
 * the origin. A cached response is served in <10ms straight from the PoP
 * the user is connected to — no DB hop at all. Sockets already
 * invalidate the in-memory client cache on writes, so a short TTL here is
 * safe: the worst case is a 10-second blip between a write and when an
 * unconnected client sees it.
 *
 * Usage:
 *
 *   export async function GET(request: Request) {
 *     return edgeCached(request, { ttlSeconds: 10 }, async () => {
 *       const data = await withPrisma(...)
 *       return NextResponse.json(data)
 *     })
 *   }
 *
 * Notes:
 *   - Only `GET` requests are cached. Anything else short-circuits to
 *     the builder.
 *   - We vary the cache key by the full URL (query string included) so
 *     `stats?startDate=...` and `stats?startDate=...&type=expense` are
 *     distinct.
 *   - The write is backgrounded via `ctx.waitUntil` so the user isn't
 *     blocked on `cache.put` once the response is ready.
 */

type Builder = () => Promise<Response>

export type EdgeCacheOptions = {
  ttlSeconds: number

  // Optional extra Vary dimensions. We always include the URL; pass
  // e.g. `['accept-language']` if the response depends on a header.
  varyHeaders?: string[]
}

const DEFAULT_VARY: string[] = []

const buildCacheKey = (request: Request): Request => {
  // Strip cookies / auth from the key so cache entries are shared
  // across users. All tabungan data is family-scoped (no per-user
  // rows), so this is safe.
  const url = new URL(request.url)

  return new Request(url.toString(), { method: 'GET' })
}

export async function edgeCached(
  request: Request,
  options: EdgeCacheOptions,
  builder: Builder
): Promise<Response> {
  if (request.method !== 'GET') return builder()

  let ctx: { waitUntil: (p: Promise<unknown>) => void } | undefined

  try {
    const cf = getCloudflareContext() as { ctx?: typeof ctx } | undefined

    ctx = cf?.ctx
  } catch {
    // No Cloudflare context — next dev / local build. Skip caching.
    return builder()
  }

  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default

  if (!cache) return builder()

  const cacheKey = buildCacheKey(request)
  const hit = await cache.match(cacheKey)

  if (hit) {
    // Clone so the body is consumable by Next's response pipeline.
    const headers = new Headers(hit.headers)

    headers.set('X-Edge-Cache', 'HIT')

    return new Response(hit.body, { status: hit.status, headers })
  }

  const fresh = await builder()

  // Only cache successful responses with bodies. Error responses and
  // redirects should always hit origin so we don't pin a transient
  // failure at the edge.
  if (fresh.status >= 200 && fresh.status < 300) {
    const toCache = fresh.clone()
    const headers = new Headers(toCache.headers)

    // Override Cache-Control for the edge. The browser-facing
    // Cache-Control is already on the response; this one tells
    // CF's edge how long to hold it.
    headers.set('Cache-Control', `public, max-age=${options.ttlSeconds}, stale-while-revalidate=${options.ttlSeconds * 6}`)

    const varyHeaders = [...DEFAULT_VARY, ...(options.varyHeaders ?? [])]

    if (varyHeaders.length) headers.set('Vary', varyHeaders.join(', '))

    const cacheable = new Response(toCache.body, {
      status: toCache.status,
      headers
    })

    const write = cache.put(cacheKey, cacheable)

    if (ctx?.waitUntil) ctx.waitUntil(write)
    else void write
  }

  // Mark the client-facing response as a cache miss for debugging.
  const outHeaders = new Headers(fresh.headers)

  outHeaders.set('X-Edge-Cache', 'MISS')

  return new Response(fresh.body, { status: fresh.status, headers: outHeaders })
}

/**
 * Manual purge helper. Pass the origin URL (e.g.
 * `https://kasmi.example.workers.dev/api/apps/tabungan/storage-types`)
 * to drop any cached entry. Writes already invalidate the *client* SWR
 * cache via WebSockets, but other tabs on other devices rely on the
 * edge entry rolling over at the `ttlSeconds` boundary.
 */
export async function purgeEdgeCache(request: Request): Promise<void> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default

  if (!cache) return

  await cache.delete(buildCacheKey(request))
}
