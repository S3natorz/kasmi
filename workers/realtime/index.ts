/**
 * TabunganBroadcaster Durable Object
 *
 * A single-instance Durable Object that keeps a pool of WebSockets connected
 * to browser clients. The Next.js app POSTs broadcast events to /broadcast;
 * the DO fans those events out to every connected client so their local
 * SWR-like caches can invalidate.
 *
 * Uses the WebSocket Hibernation API (ctx.acceptWebSocket / webSocketMessage)
 * so that the DO can sleep between events without dropping connections —
 * which keeps the bill near-zero for idle traffic.
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  REALTIME: DurableObjectNamespace
  REALTIME_SECRET: string
}

export class TabunganBroadcaster implements DurableObject {
  private ctx: DurableObjectState
  private env: Env

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Internal broadcast endpoint: receives events from the Next.js app and
    // fans them out to every connected client.
    if (url.pathname === '/broadcast') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
      }

      const secret = request.headers.get('x-realtime-secret')

      if (!this.env.REALTIME_SECRET || secret !== this.env.REALTIME_SECRET) {
        return new Response('Unauthorized', { status: 401 })
      }

      const body = await request.text()

      let sent = 0

      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.send(body)
          sent++
        } catch {
          // ignore; hibernation handler will clean up dead sockets
        }
      }

      return new Response(JSON.stringify({ sent }), {
        headers: { 'content-type': 'application/json' }
      })
    }

    // Public WebSocket endpoint.
    if (url.pathname === '/ws') {
      if (request.headers.get('upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 })
      }

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

      this.ctx.acceptWebSocket(server)

      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('Not found', { status: 404 })
  }

  // Hibernation API handlers -------------------------------------------------

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Only ping/pong is supported from clients; everything else is ignored.
    if (typeof message === 'string' && message === 'ping') {
      try {
        ws.send('pong')
      } catch {
        /* ignore */
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean) {
    try {
      ws.close(code, 'closing')
    } catch {
      /* ignore */
    }
  }

  async webSocketError(ws: WebSocket) {
    try {
      ws.close(1011, 'error')
    } catch {
      /* ignore */
    }
  }
}

// Default Worker fetch handler: route requests to the single global DO
// instance (keyed by "global"). Every WebSocket client and every broadcast
// lands on the same DO, so all clients see all events.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Preflight CORS for browser clients connecting from another origin.
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': request.headers.get('origin') ?? '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type, x-realtime-secret',
          'access-control-max-age': '86400'
        }
      })
    }

    // Only /ws and /broadcast are recognised.
    if (url.pathname !== '/ws' && url.pathname !== '/broadcast') {
      return new Response('Not found', { status: 404 })
    }

    const id = env.REALTIME.idFromName('global')
    const stub = env.REALTIME.get(id)

    return stub.fetch(request)
  }
}
