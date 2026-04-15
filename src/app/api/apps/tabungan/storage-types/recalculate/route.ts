import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'

type StorageDelta = { balance: number; goldWeight: number }

// POST /api/apps/tabungan/storage-types/recalculate
//
// Rebuild every storage's `balance` (and `goldWeight`) deterministically
// from:
//
//   balance     = initialBalance     + Σ(rupiah effects of transactions)
//   goldWeight  = initialGoldWeight  + Σ(gram effects of gold transactions)
//
// This is the escape hatch for any drift that slipped past the atomic
// increment path — for example legacy rows from before the atomic fix,
// or rows that got clamped to 0 by the safety-net `updateMany` while the
// transaction record itself still kept the original amount (which made
// subsequent reverse-then-apply edits produce "ghost money" / the
// "kepotong 2x" symptom).
export async function POST() {
  try {
    const { storages, summary } = await withPrisma(async prisma => {
      const [storages, transactions] = await Promise.all([
        prisma.storageType.findMany(),
        prisma.transaction.findMany({
          select: {
            type: true,
            amount: true,
            fromStorageTypeId: true,
            toStorageTypeId: true
          }
        })
      ])

      // Aggregate transaction effects per storage id in one pass.
      const deltas: Record<string, StorageDelta> = {}

      const getDelta = (id: string) => {
        if (!deltas[id]) deltas[id] = { balance: 0, goldWeight: 0 }

        return deltas[id]
      }

      for (const tx of transactions) {
        const amount = tx.amount || 0

        if (tx.type === 'gold_income') {
          if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).goldWeight += amount
        } else if (tx.type === 'income') {
          if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).balance += amount
        } else if (tx.type === 'expense') {
          if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amount
        } else if (tx.type === 'savings') {
          if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amount
        } else if (tx.type === 'transfer') {
          if (tx.fromStorageTypeId) getDelta(tx.fromStorageTypeId).balance -= amount
          if (tx.toStorageTypeId) getDelta(tx.toStorageTypeId).balance += amount
        }
      }

      // Apply recomputed balances in a single Postgres transaction so all
      // storages flip atomically — the UI never sees a half-recalculated
      // state.
      const results = await prisma.$transaction(
        storages.map(storage => {
          const delta = deltas[storage.id] || { balance: 0, goldWeight: 0 }
          const initialBalance = storage.initialBalance ?? 0
          const initialGoldWeight = storage.initialGoldWeight ?? 0
          const nextBalance = initialBalance + delta.balance
          const nextGoldWeight = storage.isGold ? initialGoldWeight + delta.goldWeight : storage.goldWeight

          return prisma.storageType.update({
            where: { id: storage.id },
            data: {
              balance: nextBalance,
              goldWeight: nextGoldWeight
            }
          })
        })
      )

      const summary = storages.map((storage, idx) => {
        const delta = deltas[storage.id] || { balance: 0, goldWeight: 0 }
        const updated = results[idx]

        return {
          id: storage.id,
          name: storage.name,
          isGold: storage.isGold,
          previousBalance: storage.balance ?? 0,
          newBalance: updated.balance ?? 0,
          balanceDiff: (updated.balance ?? 0) - (storage.balance ?? 0),
          previousGoldWeight: storage.goldWeight ?? 0,
          newGoldWeight: updated.goldWeight ?? 0,
          goldWeightDiff: (updated.goldWeight ?? 0) - (storage.goldWeight ?? 0),
          initialBalance: storage.initialBalance ?? 0,
          initialGoldWeight: storage.initialGoldWeight ?? 0,
          transactionDelta: delta.balance,
          goldTransactionDelta: delta.goldWeight
        }
      })

      return { storages, summary }
    })

    // Fire STORAGE_TYPES_CHANGED so every connected SWR client refetches
    // — mirrors what POST/PUT/DELETE on /storage-types already do.
    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json({
      message: 'Recalculation complete',
      count: storages.length,
      summary
    })
  } catch (error) {
    console.error('Failed to recalculate balances:', error)

    return NextResponse.json({ error: 'Failed to recalculate balances' }, { status: 500 })
  }
}
