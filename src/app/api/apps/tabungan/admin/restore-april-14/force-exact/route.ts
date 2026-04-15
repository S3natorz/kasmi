import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'

// POST/GET /api/apps/tabungan/admin/restore-april-14/force-exact
//
// "Force exact" variant of the restore endpoint. Instead of deriving
// `initialBalance` from backup tx effects and then expecting the user
// to press "Hitung Ulang", this one writes `balance` directly to the
// April-14 snapshot value and picks an `initialBalance` that keeps the
// invariant stable even if the user later taps Hitung Ulang:
//
//   balance        := backup.balance
//   initialBalance := backup.balance - sum(ALL tx effects currently in DB
//                                          for this storage)
//
// So after Hitung Ulang:
//   balance = initialBalance + sum(all tx effects)
//           = backup.balance - sum(all tx) + sum(all tx)
//           = backup.balance            (unchanged)
//
// Used when the delta-based approach produced wrong numbers (e.g. some
// transactions were re-entered after the backup so createdAt doesn't
// align with "backup vs new" split anymore).
//
// Gated by the same ADMIN_RESTORE_TOKEN / REALTIME_SECRET as the
// sibling endpoint.

const BACKUP_STORAGES = [
  {
    id: 'cmijvlf0r0000kz040qd1yckb',
    name: 'Bank BSI (Suami)',
    icon: 'tabler-building-bank',
    color: '#8bc34a',
    balance: 18144463,
    isGold: false,
    goldWeight: null as number | null,
    createdAt: new Date('2025-11-29T05:53:36.839Z')
  },
  {
    id: 'cmijvm3w30000jj04mv09oarb',
    name: 'Bank BSI (Istri)',
    icon: 'tabler-building-bank',
    color: '#009688',
    balance: 248562,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-11-29T05:54:09.072Z')
  },
  {
    id: 'cmijvmduu0001jj04mtrry7eu',
    name: 'Bank BCA',
    icon: 'tabler-credit-card',
    color: '#2196f3',
    balance: 19572591,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-11-29T05:54:21.990Z')
  },
  {
    id: 'cmijvmyvl0002jj042p2edr9r',
    name: 'Brangkas',
    icon: 'tabler-cash',
    color: '#f44336',
    balance: 56215000,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-11-29T05:54:49.231Z')
  },
  {
    id: 'cmijvngpa0003jj046t3rwgti',
    name: 'Dompet (Istri)',
    icon: 'tabler-wallet',
    color: '#795548',
    balance: 479000,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-11-29T05:55:12.332Z')
  },
  {
    id: 'cmijxvr6n0000l204d3b31g84',
    name: 'Seabank Istri',
    icon: 'tabler-building-bank',
    color: '#ff9800',
    balance: 885449,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-11-29T06:57:38.397Z')
  },
  {
    id: 'cmiluzx9k0000r162z8478fzj',
    name: 'Emas Antam',
    icon: 'tabler-diamond',
    color: '#FFD700',
    balance: 0,
    isGold: true,
    goldWeight: 55,
    createdAt: new Date('2025-11-30T15:12:26.162Z')
  },
  {
    id: 'cmin3x6ku0004jr04onmwspg5',
    name: 'Seabank Suami',
    icon: 'tabler-credit-card',
    color: '#ff5722',
    balance: 5357755,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-12-01T12:10:01.204Z')
  },
  {
    id: 'cmj1ez7fp0000kz04a0g475au',
    name: 'Shopeepay Giftbyhani',
    icon: 'tabler-currency-dollar',
    color: '#ffc107',
    balance: 344313,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-12-11T12:28:17.890Z')
  },
  {
    id: 'cmja2smid0002l104togdtpu6',
    name: 'Shopee Enha',
    icon: 'tabler-currency-dollar',
    color: '#ff9800',
    balance: 901343,
    isGold: false,
    goldWeight: null,
    createdAt: new Date('2025-12-17T13:57:10.982Z')
  }
] as const

const readToken = (request: Request): string | null => {
  const url = new URL(request.url)
  const q = url.searchParams.get('token')

  if (q) return q

  const auth = request.headers.get('authorization')

  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()

  return null
}

const requiredToken = (): string | null =>
  process.env.ADMIN_RESTORE_TOKEN || process.env.REALTIME_SECRET || null

async function runForceExact() {
  return withPrisma(async prisma => {
    // Idempotent DDL in case the migration still hasn't run.
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "StorageType" ADD COLUMN IF NOT EXISTS "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0'
    )
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "StorageType" ADD COLUMN IF NOT EXISTS "initialGoldWeight" DOUBLE PRECISION'
    )

    // Sum effects of ALL transactions currently in DB per storage id.
    const allTx = await prisma.transaction.findMany({
      select: {
        type: true,
        amount: true,
        fromStorageTypeId: true,
        toStorageTypeId: true
      }
    })

    const deltas: Record<string, { balance: number; gold: number }> = {}

    const getDelta = (id: string) => {
      if (!deltas[id]) deltas[id] = { balance: 0, gold: 0 }

      return deltas[id]
    }

    for (const tx of allTx) {
      const amt = tx.amount || 0

      if (tx.type === 'gold_income') {
        if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).gold += amt
      } else if (tx.type === 'income') {
        if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).balance += amt
      } else if (tx.type === 'expense') {
        if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amt
      } else if (tx.type === 'savings') {
        if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amt
      } else if (tx.type === 'transfer') {
        if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amt
        if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).balance += amt
      }
    }

    // Upsert each storage: balance = backup snapshot, initialBalance
    // adjusted so the Hitung Ulang invariant keeps balance stable.
    const results: Array<{
      id: string
      name: string
      balance: number
      initialBalance: number
      goldWeight: number | null
      initialGoldWeight: number | null
      currentTxDeltaBalance: number
      currentTxDeltaGold: number
    }> = []

    for (const b of BACKUP_STORAGES) {
      const d = deltas[b.id] || { balance: 0, gold: 0 }
      const nextBalance = b.balance
      const nextInitialBalance = b.balance - d.balance
      const nextGoldWeight = b.isGold ? b.goldWeight : null
      const nextInitialGoldWeight = b.isGold && b.goldWeight != null ? b.goldWeight - d.gold : null

      await prisma.storageType.upsert({
        where: { id: b.id },
        create: {
          id: b.id,
          name: b.name,
          icon: b.icon,
          color: b.color,
          balance: nextBalance,
          initialBalance: nextInitialBalance,
          isGold: b.isGold,
          goldWeight: nextGoldWeight,
          initialGoldWeight: nextInitialGoldWeight,
          createdAt: b.createdAt
        },
        update: {
          name: b.name,
          icon: b.icon,
          color: b.color,
          balance: nextBalance,
          initialBalance: nextInitialBalance,
          isGold: b.isGold,
          goldWeight: nextGoldWeight,
          initialGoldWeight: nextInitialGoldWeight
        }
      })

      results.push({
        id: b.id,
        name: b.name,
        balance: nextBalance,
        initialBalance: nextInitialBalance,
        goldWeight: nextGoldWeight,
        initialGoldWeight: nextInitialGoldWeight,
        currentTxDeltaBalance: d.balance,
        currentTxDeltaGold: d.gold
      })
    }

    return {
      totalTxInDb: allTx.length,
      storagesRestored: results.length,
      storages: results
    }
  })
}

export async function POST(request: Request) {
  const expected = requiredToken()

  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_RESTORE_TOKEN (or REALTIME_SECRET) is not configured on the Worker' },
      { status: 503 }
    )
  }

  if (readToken(request) !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await runForceExact()

    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json({
      message:
        'Storage balances forced to April-14 backup snapshot. You do NOT need to tap Hitung Ulang; balances are already set. Invariant is preserved so Hitung Ulang would be a no-op.',
      ...summary
    })
  } catch (error: any) {
    console.error('admin restore-april-14/force-exact failed:', error)

    return NextResponse.json(
      { error: error?.message || 'Failed to force-exact storage types' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return POST(request)
}
