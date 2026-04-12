import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'

/**
 * Prisma client configured for Neon over the Cloudflare Workers runtime.
 *
 * Notes:
 * - `@prisma/adapter-neon` + `@neondatabase/serverless` lets Prisma run on
 *   edge-style runtimes (Workers) where the default TCP driver can't be used.
 * - `neonConfig.poolQueryViaFetch = true` routes one-shot queries over HTTP
 *   (no websocket cost); `$transaction` still uses pooled WebSockets.
 * - In Node (dev / prisma CLI / build), we cache on `globalThis` to survive
 *   HMR; on Workers each isolate gets its own cached instance, which is fine.
 */

const globalForPrisma = globalThis as unknown as {
  __kasmiPrisma?: PrismaClient
}

const buildClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  neonConfig.poolQueryViaFetch = true

  // PrismaNeon accepts a Neon PoolConfig; it builds/owns the underlying pool.
  const adapter = new PrismaNeon({ connectionString })

  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.__kasmiPrisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__kasmiPrisma = prisma
}

export default prisma
