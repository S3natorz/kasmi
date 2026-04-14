import { NextResponse } from 'next/server'

import type { Prisma } from '@prisma/client'

import prisma from '@/libs/prisma'

// Tx client type for helper fns, so balance updates happen inside the same
// Prisma interactive transaction as the reverse/apply/update of the tx row.
type TxClient = Prisma.TransactionClient

// Helper function to update storage balance
// NOTE: we intentionally do NOT clamp the result to >= 0. Clamping silently
// loses information and breaks reversal math when a transaction is later
// edited/deleted (the reversal would add back more than was actually taken,
// producing "ghost money" / double-deduction). The UI can handle negative.
async function updateStorageBalance(tx: TxClient, storageTypeId: string, amount: number, isAdd: boolean) {
  await tx.storageType.update({
    where: { id: storageTypeId },
    data: {
      balance: { [isAdd ? 'increment' : 'decrement']: amount } as any
    }
  })
}

// Helper function to update gold weight on storage
async function updateGoldWeight(tx: TxClient, storageTypeId: string, grams: number, isAdd: boolean) {
  await tx.storageType.update({
    where: { id: storageTypeId },
    data: {
      goldWeight: { [isAdd ? 'increment' : 'decrement']: grams } as any
    }
  })
}

// Apply (or reverse, when isReverse=true) the effect of a transaction shape
// on the relevant storage balance(s). Kept in one place so POST/PUT/DELETE
// stay in sync.
type TxShape = {
  type: string
  amount: number
  goldGrams?: number | null
  fromStorageTypeId?: string | null
  toStorageTypeId?: string | null
}

async function applyTxEffect(tx: TxClient, shape: TxShape, isReverse = false) {
  const { type, amount } = shape
  const fromId = shape.fromStorageTypeId || null
  const toId = shape.toStorageTypeId || null

  // For normal (non-reverse) application: add to "to", subtract from "from".
  // For reversal: do the opposite.
  const addToDest = !isReverse
  const subFromSrc = !isReverse

  if (type === 'gold_income') {
    if (toId) {
      const grams = typeof shape.goldGrams === 'number' ? shape.goldGrams : amount

      await updateGoldWeight(tx, toId, grams, addToDest)
    }
  } else if (type === 'income') {
    if (toId) await updateStorageBalance(tx, toId, amount, addToDest)
  } else if (type === 'expense') {
    if (fromId) await updateStorageBalance(tx, fromId, amount, !subFromSrc)
  } else if (type === 'savings') {
    if (fromId) await updateStorageBalance(tx, fromId, amount, !subFromSrc)
  } else if (type === 'transfer') {
    if (fromId) await updateStorageBalance(tx, fromId, amount, !subFromSrc)
    if (toId) await updateStorageBalance(tx, toId, amount, addToDest)
  }
}

// GET - Get all transactions with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const familyMemberId = searchParams.get('familyMemberId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const storageTypeId = searchParams.get('storageTypeId')

    const where: any = {}

    if (type) where.type = type
    if (familyMemberId) where.familyMemberId = familyMemberId

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate + 'T00:00:00+07:00')
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59.999+07:00')
    }

    // Filter by storageTypeId (either from or to)
    if (storageTypeId) {
      where.OR = [{ fromStorageTypeId: storageTypeId }, { toStorageTypeId: storageTypeId }]
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        familyMember: true,
        savingsCategory: true,
        expenseCategory: true,
        fromStorageType: true,
        toStorageType: true
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    
return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = parseFloat(body.amount)
    const goldGrams = body.goldGrams != null ? parseFloat(body.goldGrams) : undefined

    const transaction = await prisma.$transaction(async tx => {
      await applyTxEffect(tx, {
        type: body.type,
        amount,
        goldGrams: Number.isFinite(goldGrams) ? goldGrams : undefined,
        fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
        toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
      })

      return tx.transaction.create({
        data: {
          type: body.type,
          amount: amount,
          description: body.description || null,
          date: body.date ? new Date(body.date + 'T12:00:00+07:00') : new Date(),
          familyMemberId: body.familyMemberId && body.familyMemberId !== '' ? body.familyMemberId : null,
          savingsCategoryId: body.savingsCategoryId && body.savingsCategoryId !== '' ? body.savingsCategoryId : null,
          expenseCategoryId: body.expenseCategoryId && body.expenseCategoryId !== '' ? body.expenseCategoryId : null,
          fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
          toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
        },
        include: {
          familyMember: true,
          savingsCategory: true,
          expenseCategory: true,
          fromStorageType: true,
          toStorageType: true
        }
      })
    })

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

    const transaction = await prisma.$transaction(async tx => {
      const oldTx = await tx.transaction.findUnique({ where: { id: body.id } })

      if (!oldTx) {
        throw new Error('TRANSACTION_NOT_FOUND')
      }

      // Reverse the OLD tx's effect using the OLD stored values (NOT body),
      // so that changes to fromStorage/toStorage/type/amount correctly undo
      // what was previously applied.
      await applyTxEffect(
        tx,
        {
          type: oldTx.type,
          amount: oldTx.amount,
          goldGrams: oldTx.type === 'gold_income' ? oldTx.amount : undefined,
          fromStorageTypeId: oldTx.fromStorageTypeId,
          toStorageTypeId: oldTx.toStorageTypeId
        },
        true
      )

      // Apply the NEW tx effect.
      await applyTxEffect(tx, {
        type: body.type,
        amount: newAmount,
        goldGrams: Number.isFinite(newGoldGrams) ? newGoldGrams : undefined,
        fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
        toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
      })

      return tx.transaction.update({
        where: { id: body.id },
        data: {
          type: body.type,
          amount: newAmount,
          description: body.description || null,
          date: body.date ? new Date(body.date + 'T12:00:00+07:00') : undefined,
          familyMemberId: body.familyMemberId && body.familyMemberId !== '' ? body.familyMemberId : null,
          savingsCategoryId: body.savingsCategoryId && body.savingsCategoryId !== '' ? body.savingsCategoryId : null,
          expenseCategoryId: body.expenseCategoryId && body.expenseCategoryId !== '' ? body.expenseCategoryId : null,
          fromStorageTypeId: body.fromStorageTypeId && body.fromStorageTypeId !== '' ? body.fromStorageTypeId : null,
          toStorageTypeId: body.toStorageTypeId && body.toStorageTypeId !== '' ? body.toStorageTypeId : null
        },
        include: {
          familyMember: true,
          savingsCategory: true,
          expenseCategory: true,
          fromStorageType: true,
          toStorageType: true
        }
      })
    })

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

    await prisma.$transaction(async tx => {
      const oldTx = await tx.transaction.findUnique({ where: { id } })

      if (!oldTx) return

      await applyTxEffect(
        tx,
        {
          type: oldTx.type,
          amount: oldTx.amount,
          goldGrams: oldTx.type === 'gold_income' ? oldTx.amount : undefined,
          fromStorageTypeId: oldTx.fromStorageTypeId,
          toStorageTypeId: oldTx.toStorageTypeId
        },
        true
      )

      await tx.transaction.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    
return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
