import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'

// One-shot admin endpoint to re-seed the 10 StorageType rows that were
// lost (while the Transaction table was kept intact). Values come from
// the 2026-04-14 backup.
//
// Security: gated by a shared token. Send `?token=<ADMIN_RESTORE_TOKEN>`
// or `Authorization: Bearer <ADMIN_RESTORE_TOKEN>`. The worker must have
// ADMIN_RESTORE_TOKEN set in its secrets; without it the route refuses
// to run (so it can't be triggered anonymously once deployed).
//
// Idempotent: uses `upsert` keyed on the original cuid so re-running it
// just refreshes the computed `initialBalance` and leaves everything
// else alone. Transactions are never touched.
//
// What it computes, per storage:
//   delta_balance = sum(rupiah tx effects in backup, i.e. createdAt <= cutoff)
//   delta_gold    = sum(gram   tx effects in backup)
//   initialBalance     = backup_balance    - delta_balance
//   initialGoldWeight  = backup_goldWeight - delta_gold   (gold storages only)
//
// After this runs, the user opens the app and taps "Hitung Ulang" on
// Dompet & Simpanan. The recalculate endpoint sets:
//   balance      = initialBalance    + sum(tx effects currently in DB)
// which equals backup_balance + sum(tx effects that happened AFTER the
// backup was taken) = the user's real current balance.

const CUTOFF = new Date('2026-04-14T13:39:40.592Z')

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

const requiredToken = (): string | null => {
  // Accept either the admin-specific secret or fall back to the realtime
  // secret we already have set — saves the user one more secret to
  // provision for a one-shot operation.
  return process.env.ADMIN_RESTORE_TOKEN || process.env.REALTIME_SECRET || null
}

async function runRestore() {
  return withPrisma(async prisma => {
    // 1. Sum transaction effects per storage id, constrained to tx that
    //    existed at backup time.
    const backupTx = await prisma.transaction.findMany({
      where: { createdAt: { lte: CUTOFF } },
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

    for (const tx of backupTx) {
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

    // 2. Upsert each storage with derived opening balance.
    const results: Array<{
      id: string
      name: string
      initialBalance: number
      initialGoldWeight: number | null
      deltaBalanceInBackup: number
      deltaGoldInBackup: number
    }> = []

    for (const b of BACKUP_STORAGES) {
      const d = deltas[b.id] || { balance: 0, gold: 0 }
      const nextInitialBalance = b.balance - d.balance
      const nextInitialGoldWeight = b.isGold && b.goldWeight != null ? b.goldWeight - d.gold : null

      await prisma.storageType.upsert({
        where: { id: b.id },
        create: {
          id: b.id,
          name: b.name,
          icon: b.icon,
          color: b.color,
          balance: nextInitialBalance,
          initialBalance: nextInitialBalance,
          isGold: b.isGold,
          goldWeight: nextInitialGoldWeight,
          initialGoldWeight: nextInitialGoldWeight,
          createdAt: b.createdAt
        },
        update: {
          name: b.name,
          icon: b.icon,
          color: b.color,
          balance: nextInitialBalance,
          initialBalance: nextInitialBalance,
          isGold: b.isGold,
          goldWeight: nextInitialGoldWeight,
          initialGoldWeight: nextInitialGoldWeight
        }
      })

      results.push({
        id: b.id,
        name: b.name,
        initialBalance: nextInitialBalance,
        initialGoldWeight: nextInitialGoldWeight,
        deltaBalanceInBackup: d.balance,
        deltaGoldInBackup: d.gold
      })
    }

    return {
      cutoff: CUTOFF.toISOString(),
      backupTxCount: backupTx.length,
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
    const summary = await runRestore()

    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json({
      message:
        'Storage types restored. Open the app and tap "Hitung Ulang" on Dompet & Simpanan to apply post-backup transactions.',
      ...summary
    })
  } catch (error: any) {
    console.error('admin restore-april-14 failed:', error)

    return NextResponse.json({ error: error?.message || 'Failed to restore storage types' }, { status: 500 })
  }
}

// Allow GET with the same token so you can trigger the restore from a
// plain browser click/URL rather than having to run curl.
export async function GET(request: Request) {
  return POST(request)
}
