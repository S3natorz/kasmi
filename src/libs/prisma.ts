import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Prisma client configured for Supabase Postgres over the Cloudflare Workers
 * runtime.
 *
 * Connection string guidance for `DATABASE_URL`:
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │ Use the **Session mode** Supavisor pooler URL (port 5432):        │
 *   │                                                                    │
 *   │   postgres://postgres.<project-ref>:<pwd>@aws-0-<region>           │
 *   │     .pooler.supabase.com:5432/postgres                             │
 *   │                                                                    │
 *   │ Session mode preserves per-connection state, which Prisma needs   │
 *   │ for `$transaction([...])` used by /api/.../restore. Transaction   │
 *   │ mode (port 6543) would break those batches.                       │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * `pg` runs on Workers thanks to the `nodejs_compat` compatibility flag
 * (set in wrangler.toml) which exposes Node's TCP socket API.
 *
 * A small `max: 3` keeps us well inside Supabase's default pooler limits
 * across many Worker isolates.
 */

const globalForPrisma = globalThis as unknown as {
  __kasmiPrisma?: PrismaClient
}

const buildClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.__kasmiPrisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__kasmiPrisma = prisma
}

export default prisma
