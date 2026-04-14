import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

type StorageDelta = { balance: number; goldWeight: number }

// Recompute each storage's balance (and gold weight) deterministically from:
//   balance     = initialBalance     + sum(rupiah effects of transactions)
//   goldWeight  = initialGoldWeight  + sum(gram effects of gold transactions)
//
// This is the "single source of truth" fix for any drift that may have been
// introduced by prior bugs (e.g. the old Math.max(0,...) clamping that
// silently lost negative balances and caused double-deduction on edit).
export async function POST() {
  try {
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

    // Aggregate transaction effects per storage id.
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

    // Apply recomputed balances in one atomic batch.
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

    // Build a per-storage summary so the UI can show what changed.
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
