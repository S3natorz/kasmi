'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Socket.io client
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'

// Hook imports
import { invalidateTabuganKeys } from '@/hooks/useTabunganData'

// Events
import { EVENT_INVALIDATION_MAP, TABUNGAN_EVENTS } from './events'
import type { TabunganEventName } from './events'

/**
 * Connects to the Socket.io server (if one is running) and forwards invalidation
 * events to the Tabungan data cache. Silently no-ops when the server isn't
 * available — e.g. when running `npm run dev` with Turbopack + default server.
 *
 * Mounted once near the root of the Tabungan subtree; it owns a single socket
 * connection for the whole session.
 */
const TabunganRealtime = () => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Lazy-connect so the first page render isn't blocked by the WS handshake.
    const timer = setTimeout(() => {
      try {
        const socket = io({
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000
        })

        socketRef.current = socket

        Object.values(TABUNGAN_EVENTS).forEach(eventName => {
          socket.on(eventName, () => {
            const keys = EVENT_INVALIDATION_MAP[eventName as TabunganEventName]

            if (keys?.length) invalidateTabuganKeys(keys)
          })
        })

        socket.on('connect_error', err => {
          // Socket server not available (e.g. default Next dev server). Give up.
          if ((err as { message?: string }).message?.includes('xhr poll error')) {
            socket.close()
          }
        })
      } catch (err) {
        console.warn('TabunganRealtime connect failed (non-fatal):', err)
      }
    }, 500)

    return () => {
      clearTimeout(timer)

      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [])

  return null
}

export default TabunganRealtime
