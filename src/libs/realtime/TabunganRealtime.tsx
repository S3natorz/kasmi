'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Hook imports
import { invalidateTabuganKeys } from '@/hooks/useTabunganData'

// Events
import { EVENT_INVALIDATION_MAP } from './events'
import type { TabunganEventName, TabunganEventPayload } from './events'

/**
 * Connects to the Cloudflare `kasmi-realtime` Durable Object via a native
 * WebSocket and forwards invalidation events to the Tabungan data cache.
 *
 * URL is read from `NEXT_PUBLIC_REALTIME_URL` (e.g. the `kasmi-realtime`
 * worker's `*.workers.dev` hostname or a custom route). Silently no-ops
 * when the variable isn't set — e.g. during `next dev` without CF bindings.
 */
const TabunganRealtime = () => {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const baseUrl = process.env.NEXT_PUBLIC_REALTIME_URL

    if (!baseUrl) return

    // Build the ws:// URL once. Supports passing either `https://...` or
    // `wss://...` in the env var.
    const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws'

    let cancelled = false
    let attempt = 0
    let pingTimer: ReturnType<typeof setInterval> | null = null

    const connect = () => {
      if (cancelled) return

      try {
        const socket = new WebSocket(wsUrl)

        socketRef.current = socket

        socket.addEventListener('open', () => {
          attempt = 0

          // Keepalive ping every 25s. DO is billed per WS tick, but only
          // when active — hibernation handles idle connections for free.
          pingTimer = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send('ping')
              } catch {
                /* ignore */
              }
            }
          }, 25_000)
        })

        socket.addEventListener('message', ev => {
          if (typeof ev.data !== 'string') return
          if (ev.data === 'pong') return

          try {
            const msg = JSON.parse(ev.data) as TabunganEventPayload
            const keys = EVENT_INVALIDATION_MAP[msg.event as TabunganEventName]

            if (keys?.length) invalidateTabuganKeys(keys)
          } catch {
            /* ignore malformed payloads */
          }
        })

        const scheduleReconnect = () => {
          if (cancelled) return

          attempt++
          const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5))

          reconnectRef.current = setTimeout(connect, delay)
        }

        socket.addEventListener('close', () => {
          if (pingTimer) clearInterval(pingTimer)
          pingTimer = null
          scheduleReconnect()
        })

        socket.addEventListener('error', () => {
          // `close` fires right after, which schedules the reconnect.
          if (pingTimer) clearInterval(pingTimer)
          pingTimer = null
        })
      } catch (err) {
        console.warn('TabunganRealtime connect failed (non-fatal):', err)
      }
    }

    // Lazy-connect so the first paint isn't blocked by the WS handshake.
    const kickoff = setTimeout(connect, 500)

    return () => {
      cancelled = true
      clearTimeout(kickoff)

      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (pingTimer) clearInterval(pingTimer)

      const socket = socketRef.current

      if (socket) {
        try {
          socket.close()
        } catch {
          /* ignore */
        }

        socketRef.current = null
      }
    }
  }, [])

  return null
}

export default TabunganRealtime
