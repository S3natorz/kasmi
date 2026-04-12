// Custom Next.js server that hosts Socket.io alongside the Next app.
// Used for realtime invalidation events between browser tabs / devices.
//
// Usage:
//   npm run dev:rt   → development with Socket.io (no Turbopack)
//   npm run start    → production with Socket.io

import { createServer } from 'node:http'
import { parse } from 'node:url'
import next from 'next'
import { Server as IOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true)

      handle(req, res, parsedUrl)
    } catch (err) {
      console.error('HTTP handle error', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new IOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
  })

  io.on('connection', socket => {
    socket.on('join', room => {
      if (typeof room === 'string') socket.join(room)
    })
  })

  // Expose io globally so Next.js API routes can emit events without importing
  // this module (which would bundle node-only dependencies into the app).
  globalThis.__kasmiIO = io

  httpServer.listen(port, () => {
    console.log(`> Kasmi ready on http://${hostname}:${port} (socket.io enabled)`)
  })
})
