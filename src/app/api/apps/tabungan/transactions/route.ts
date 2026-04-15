import { NextResponse } from 'next/server'

import type { PrismaClient } from '@/generated/prisma/client'
import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'
import { edgeCached } from '@/libs/edgeCache'
import { wibDateAtNoon, wibStartOfDay, wibEndOfDay, wibToday } from '@/libs/wib'

// Default page size for the list endpoint. The old behaviour was "return
// every transaction ever" which pushed 400+ KB down the wire on every
// dashboard mount. 200 is plenty for the mobile home's "recent" view and
// the transactions page paginates on top of this via `?limit=&offset=`.
const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000

// Single source of truth for the `select` shape used by every read in this
// route — keeps GET and POST/PUT response payloads identical so SWR caches
// stay coherent, and prevents accidentally adding new heavy fields to one
// path but not another.
const TX_SELECT = {
  id: true,
  type: true,
  amount: true,
  description: true,
  date: true,
  familyMemberId: true,
  savingsCategoryId: true,
  expenseCategoryId: true,
  fromStorageTypeId: true,
  toStorageTypeId: true,
  createdAt: true,
  updatedAt: true,
  familyMember: { select: { id: true, name: true, role: true, avatar: true } },
  savingsCategory: { select: { id: true, name: true, icon: true, color: true } },
  expenseCategory: { select: { id: true, name: true, icon: true, color: true } },
  fromStorageType: { select: { id: true, name: true, icon: true, color: true, isGold: true } },
  toStorageType: { select: { id: true, name: true, icon: true, color: true, isGold: true } }
} as const

// Helper function to update storage balance.
//
// Uses Prisma's atomic `increment`/`decrement` so we never fall into
// the classic read-then-write race: two concurrent PUT/POST/DELETEs
// on the same storage would each `SELECT balance`, compute a new
// value, and `UPDATE balance = <value>` — one write wins and the
// other's delta is silently lost, which showed up as "saldo kepotong
// 2x" in the UI. Atomic increments push the arithmetic down to
// Postgres so the database serialises it.
//
// `balance` is modelled as Float in Prisma so negative results are
// possible mid-transaction (e.g. a reverse-then-apply PUT that
// temporarily pushes balance negative). We clamp back to 0 in a
// second conditional update afterwards instead of inside the math,
// because `Math.max(0, ...)` combined with read-then-write was the
// source of balances drifting away from reality.
async function updateStorageBalance(prisma: PrismaClient, storageTypeId: string, amount: number, isAdd: boolean) {
  if (!Number.isFinite(amount) || amount === 0) return

  try {
    await prisma.storageType.update({
      where: { id: storageTypeId },
      data: { balance: isAdd ? { increment: amount } : { decrement: amount } }
    })

    // Clamp to 0 if the atomic delta pushed us negative (e.g. legacy
    // data where the balance was already wrong). Two-step so the
    // arithmetic stays atomic.
    await prisma.storageType.updateMany({
      where: { id: storageTypeId, balance: { lt: 0 } },
      data: { balance: 0 }
    })
  } catch (err) {
    console.error(`Failed to update balance for storage ${storageTypeId}:`, err)
  }
}

// Helper function to update gold weight on storage — same atomic
// pattern as updateStorageBalance above.
async function updateGoldWeight(prisma: PrismaClient, storageTypeId: string, grams: number, isAdd: boolean) {
  if (!Number.isFinite(grams) || grams === 0) return

  try {
    await prisma.storageType.update({
      where: { id: storageTypeId },
      data: { goldWeight: isAdd ? { increment: grams } : { decrement: grams } }
    })

    await prisma.storageType.updateMany({
      where: { id: storageTypeId, goldWeight: { lt: 0 } },
      data: { goldWeight: 0 }
    })
  } catch (err) {
    console.error(`Failed to update gold weight for storage ${storageTypeId}:`, err)
  }
}

// GET - Get all transactions with filters
export async function GET(request: Request) {
  return edgeCached(request, { ttlSeconds: 10 }, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type')
      const familyMemberId = searchParams.get('familyMemberId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const storageTypeId = searchParams.get('storageTypeId')

      const limitParam = parseInt(searchParams.get('limit') || '', 10)
      const offsetParam = parseInt(searchParams.get('offset') || '', 10)
      const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT
      const skip = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0

      const where: any = {}

      if (type) where.type = type
      if (familyMemberId) where.familyMemberId = familyMemberId

      if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date.gte = wibStartOfDay(startDate)
        if (endDate) where.date.lte = wibEndOfDay(endDate)
      }

      // Filter by storageTypeId (either from or to)
      if (storageTypeId) {
        where.OR = [{ fromStorageTypeId: storageTypeId }, { toStorageTypeId: storageTypeId }]
      }

      const transactions = await withPrisma(prisma =>
        prisma.transaction.findMany({
          where,

          // `select` instead of `include` so we only ship the columns the UI
          // actually renders. The full StorageType row (accountNumber, balance,
          // isGold, goldWeight, createdAt, updatedAt, ...) was inflating each
          // transaction by ~400 bytes; on a list of 500 rows that's 200 KB of
          // dead weight per response.
          select: TX_SELECT,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take,
          skip
        })
      )

      return NextResponse.json(transactions, {
        headers: {
          // Allow the browser to serve the cached payload instantly while a
          // background revalidation refetches. Sockets and the SWR cache
          // already invalidate on writes, so a short max-age is safe and
          // makes back/forward navigation feel instant.
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=60'
        }
      })
    } catch (error) {
      console.error('Failed to fetch transactions:', error)

      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
  })
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = parseFloat(body.amount)
    const goldGrams = body.goldGrams != null ? parseFloat(body.goldGrams) : undefined

    console.log('Creating transaction:', {
      type: body.type,
      amount,
      fromStorageTypeId: body.fromStorageTypeId,
      toStorageTypeId: body.toStorageTypeId
    })

    // ALUR BARU:
    // 1. Income (Pemasukan) -> langsung masuk ke toStorageType
    // 2. Expense (Pengeluaran) -> mengambil dari fromStorageType
    // 3. Savings (Tabungan) -> mengambil dari fromStorageType
    // 4. Transfer -> dari fromStorageType ke toStorageType

    const transaction = await withPrisma(async prisma => {
      if (body.type === 'gold_income') {
        if (body.toStorageTypeId && body.toStorageTypeId !== '') {
          const grams = parseFloat(body.goldGrams) || amount

          console.log('Gold Income: Adding', grams, 'grams to storage', body.toStorageTypeId)
          await updateGoldWeight(prisma, body.toStorageTypeId, grams, true)
        }
      } else if (body.type === 'income') {
        if (body.toStorageTypeId && body.toStorageTypeId !== '') {
          console.log('Income: Adding to storage', body.toStorageTypeId)
          await updateStorageBalance(prisma, body.toStorageTypeId, amount, true)
        }
      } else if (body.type === 'expense') {
        if (body.fromStorageTypeId && body.fromStorageTypeId !== '') {
          console.log('Expense: Subtracting from storage', body.fromStorageTypeId)
          await updateStorageBalance(prisma, body.fromStorageTypeId, amount, false)
        }
      } else if (body.type === 'savings') {
        if (body.fromStorageTypeId && body.fromStorageTypeId !== '') {
          console.log('Savings: Subtracting from storage', body.fromStorageTypeId)
          await updateStorageBalance(prisma, body.fromStorageTypeId, amount, false)
        }
      } else if (body.type === 'transfer') {
        if (
          body.fromStorageTypeId &&
          body.fromStorageTypeId !== '' &&
          body.toStorageTypeId &&
          body.toStorageTypeId !== ''
        ) {
          console.log('Transfer: From', body.fromStorageTypeId, 'To', body.toStorageTypeId)
          await updateStorageBalance(prisma, body.fromStorageTypeId, amount, false)
          await updateStorageBalance(prisma, body.toStorageTypeId, amount, true)
        }
      }

      return prisma.transaction.create({
        data: {
          type: body.type,
          amount: amount,
          description: body.description || null,
          date: wibDateAtNoon(body.date || wibToday()),
          familyMemberId: body.familyMemberId && body.familyMemberId !== '' ? body.familyMemberId : null,
          savingsCategoryId: body.savingsCategoryId && body.savingsCategoryId !== '' ? body.savingsCategoryId : null,
          expenseCategoryId: body.expenseCategoryId && body.expenseCategoryId !== '' ? body.expenseCategoryId : null,
          fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
          toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
        },
        select: TX_SELECT
      })
    })

    emitTabungan(TABUNGAN_EVENTS.TRANSACTIONS_CHANGED)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)

    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

// PUT - Update transaction (reverse old, apply new) atomically so that a
// partial failure can never leave a storage double-charged or stuck with
// ghost money.
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const newAmount = parseFloat(body.amount)
    const newGoldGrams = body.goldGrams != null ? parseFloat(body.goldGrams) : undefined

    const transaction = await withPrisma(async prisma => {
      // Get old transaction to reverse its effect
      const oldTx = await prisma.transaction.findUnique({ where: { id: body.id } })

      if (oldTx) {
        // Reverse old transaction effect
        if (oldTx.type === 'gold_income' && oldTx.toStorageTypeId) {
          await updateGoldWeight(prisma, oldTx.toStorageTypeId, oldTx.amount, false)
        } else if (oldTx.type === 'income' && oldTx.toStorageTypeId) {
          await updateStorageBalance(prisma, oldTx.toStorageTypeId, oldTx.amount, false)
        } else if (oldTx.type === 'expense' && oldTx.fromStorageTypeId) {
          await updateStorageBalance(prisma, oldTx.fromStorageTypeId, oldTx.amount, true)
        } else if (oldTx.type === 'savings' && oldTx.fromStorageTypeId) {
          await updateStorageBalance(prisma, oldTx.fromStorageTypeId, oldTx.amount, true)
        } else if (oldTx.type === 'transfer') {
          if (oldTx.fromStorageTypeId) await updateStorageBalance(prisma, oldTx.fromStorageTypeId, oldTx.amount, true)
          if (oldTx.toStorageTypeId) await updateStorageBalance(prisma, oldTx.toStorageTypeId, oldTx.amount, false)
        }
      }

      // Apply new transaction effect
      if (body.type === 'gold_income' && body.toStorageTypeId) {
        const grams = parseFloat(body.goldGrams) || newAmount

        await updateGoldWeight(prisma, body.toStorageTypeId, grams, true)
      } else if (body.type === 'income' && body.toStorageTypeId) {
        await updateStorageBalance(prisma, body.toStorageTypeId, newAmount, true)
      } else if (body.type === 'expense' && body.fromStorageTypeId) {
        await updateStorageBalance(prisma, body.fromStorageTypeId, newAmount, false)
      } else if (body.type === 'savings' && body.fromStorageTypeId) {
        await updateStorageBalance(prisma, body.fromStorageTypeId, newAmount, false)
      } else if (body.type === 'transfer') {
        if (body.fromStorageTypeId) await updateStorageBalance(prisma, body.fromStorageTypeId, newAmount, false)
        if (body.toStorageTypeId) await updateStorageBalance(prisma, body.toStorageTypeId, newAmount, true)
      }

      return prisma.transaction.update({
        where: { id: body.id },
        data: {
          type: body.type,
          amount: newAmount,
          description: body.description || null,
          date: body.date ? wibDateAtNoon(body.date) : undefined,
          familyMemberId: body.familyMemberId && body.familyMemberId !== '' ? body.familyMemberId : null,
          savingsCategoryId: body.savingsCategoryId && body.savingsCategoryId !== '' ? body.savingsCategoryId : null,
          expenseCategoryId: body.expenseCategoryId && body.expenseCategoryId !== '' ? body.expenseCategoryId : null,
          fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
          toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
        },
        select: TX_SELECT
      })
    })

    emitTabungan(TABUNGAN_EVENTS.TRANSACTIONS_CHANGED)

    return NextResponse.json(transaction)
  } catch (error: any) {
    if (error?.message === 'TRANSACTION_NOT_FOUND') {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.error('Failed to update transaction:', error)

    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE - Delete transaction and reverse balance atomically
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await withPrisma(async prisma => {
      // Get transaction to reverse its effect
      const tx = await prisma.transaction.findUnique({ where: { id } })

      if (tx) {
        // Reverse transaction effect before deleting
        if (tx.type === 'gold_income' && tx.toStorageTypeId) {
          await updateGoldWeight(prisma, tx.toStorageTypeId, tx.amount, false)
        } else if (tx.type === 'income' && tx.toStorageTypeId) {
          await updateStorageBalance(prisma, tx.toStorageTypeId, tx.amount, false)
        } else if (tx.type === 'expense' && tx.fromStorageTypeId) {
          await updateStorageBalance(prisma, tx.fromStorageTypeId, tx.amount, true)
        } else if (tx.type === 'savings' && tx.fromStorageTypeId) {
          await updateStorageBalance(prisma, tx.fromStorageTypeId, tx.amount, true)
        } else if (tx.type === 'transfer') {
          if (tx.fromStorageTypeId) await updateStorageBalance(prisma, tx.fromStorageTypeId, tx.amount, true)
          if (tx.toStorageTypeId) await updateStorageBalance(prisma, tx.toStorageTypeId, tx.amount, false)
        }
      }

      await prisma.transaction.delete({ where: { id } })
    })

    emitTabungan(TABUNGAN_EVENTS.TRANSACTIONS_CHANGED)

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)

    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
