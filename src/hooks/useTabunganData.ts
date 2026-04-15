'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lightweight stale-while-revalidate cache hook for the Tabungan mobile app.
 *
 * - Keeps a module-level Map keyed by URL so the same URL across pages / mounts
 *   shares a single cached value.
 * - On mount, returns the cached value immediately (no loading state) and
 *   kicks off a background revalidation.
 * - Exposes `mutate` to force a revalidation and `invalidate` helpers so
 *   socket events or mutation handlers can bust specific keys.
 */

type Listener = (value: any) => void

type Entry = {
  data: any
  ts: number
  listeners: Set<Listener>
  inflight?: Promise<any>
}

const cache = new Map<string, Entry>()

// Global event bus for cross-hook invalidations (e.g. socket pokes)
const globalInvalidationListeners = new Set<(keys: string[]) => void>()

const getOrCreate = (key: string): Entry => {
  let entry = cache.get(key)

  if (!entry) {
    entry = { data: undefined, ts: 0, listeners: new Set() }
    cache.set(key, entry)
  }

  return entry
}

const notify = (entry: Entry) => {
  entry.listeners.forEach(l => l(entry.data))
}

const fetchJSON = async (url: string, bustEdge = false) => {
  // Every revalidation must bypass the browser's HTTP cache. Mutation
  // endpoints (transactions/stats/storage-types) return
  // `Cache-Control: private, max-age=5, stale-while-revalidate=60` to
  // make back/forward navigation feel instant — but that same header
  // was also intercepting our forced revalidations after a write, so
  // the UI showed stale data for a few seconds until the max-age
  // expired (the "refresh button" workaround). The module-level Map
  // already gives us an instant render on mount; we don't need the
  // HTTP cache on top of it, and we definitely need to bypass it when
  // we know the server data changed.
  //
  // `bustEdge` additionally appends a disposable query param so the
  // Cloudflare edge cache (which keys on the full URL) misses and we
  // fetch fresh from the origin. Used when a mutation/socket event
  // told us the server state just changed.
  let target = url

  if (bustEdge) {
    const sep = url.includes('?') ? '&' : '?'

    target = `${url}${sep}_cb=${Date.now()}`
  }

  const res = await fetch(target, { cache: 'no-store' })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)

  return res.json()
}

export type UseTabunganDataOptions<T> = {
  enabled?: boolean
  fallback?: T

  // Revalidate if cache is older than this (ms). Default 30s.
  staleTime?: number
}

export function useTabunganData<T = any>(url: string | null, options: UseTabunganDataOptions<T> = {}) {
  const { enabled = true, fallback, staleTime = 30_000 } = options

  const entry = url ? getOrCreate(url) : null

  const [data, setData] = useState<T | undefined>(() => (entry?.data ?? fallback) as T | undefined)
  const [error, setError] = useState<Error | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const urlRef = useRef<string | null>(url)

  urlRef.current = url

  const revalidate = useCallback(async (target?: string, opts?: { bustEdge?: boolean }) => {
    const key = target ?? urlRef.current

    if (!key) return

    const e = getOrCreate(key)

    if (e.inflight) return e.inflight

    setIsValidating(true)

    // Default to busting the edge cache for any explicit revalidation —
    // the only path that passes `bustEdge: false` is the initial
    // on-mount hydration, where the edge cache is exactly what we want
    // to hit for speed.
    const p = fetchJSON(key, opts?.bustEdge ?? true)
      .then(result => {
        e.data = result
        e.ts = Date.now()
        notify(e)

        return result
      })
      .catch(err => {
        // Surface error but keep last cached data
        setError(err instanceof Error ? err : new Error(String(err)))
        throw err
      })
      .finally(() => {
        e.inflight = undefined
        setIsValidating(false)
      })

    e.inflight = p

    return p
  }, [])

  // Subscribe to cache updates for this URL
  useEffect(() => {
    if (!url || !enabled) return

    const e = getOrCreate(url)
    const listener: Listener = value => setData(value as T)

    e.listeners.add(listener)

    // Hydrate immediately from cache if present
    if (e.data !== undefined) setData(e.data as T)

    // Revalidate if empty or stale
    const stale = !e.data || Date.now() - e.ts > staleTime

    if (stale) {
      // On-mount hydration: let the request hit the edge cache if present,
      // so first paint is fast. Only explicit invalidations (writes,
      // socket events) should force-bust the edge.
      revalidate(url, { bustEdge: false }).catch(() => {})
    }

    return () => {
      e.listeners.delete(listener)
    }
  }, [url, enabled, staleTime, revalidate])

  // Subscribe to global invalidations
  useEffect(() => {
    const listener = (keys: string[]) => {
      if (!urlRef.current) return

      const matched = keys.some(k => urlRef.current === k || urlRef.current!.startsWith(k))

      if (matched) revalidate().catch(() => {})
    }

    globalInvalidationListeners.add(listener)

    return () => {
      globalInvalidationListeners.delete(listener)
    }
  }, [revalidate])

  return {
    data,
    error,
    isLoading: data === undefined && !error,
    isValidating,
    mutate: revalidate
  }
}

/**
 * Manually set a cached value (e.g. from an optimistic update or socket payload).
 */
export const setTabunganCache = (key: string, value: any) => {
  const e = getOrCreate(key)

  e.data = value
  e.ts = Date.now()
  notify(e)
}

/**
 * Invalidate one or more cache keys. Any mounted hook subscribed to a matching
 * key will refetch. Keys are prefix-matched so passing
 * `/api/apps/tabungan/stats` also refreshes `/api/apps/tabungan/stats?x=y`.
 */
export const invalidateTabuganKeys = (keys: string | string[]) => {
  const arr = Array.isArray(keys) ? keys : [keys]

  globalInvalidationListeners.forEach(l => l(arr))
}

/**
 * Clear the entire in-memory cache. Useful on sign-out.
 */
export const clearTabunganCache = () => {
  cache.clear()
}

/**
 * Invalidate every mounted key that starts with any of the given prefixes.
 */
export const invalidateMany = (prefixes: string[]) => {
  invalidateTabuganKeys(prefixes)
}
