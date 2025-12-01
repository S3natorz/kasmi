import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// Helper function to update storage balance
async function updateStorageBalance(storageTypeId: string, amount: number, isAdd: boolean) {
  const storage = await prisma.storageType.findUnique({ where: { id: storageTypeId } })
  if (storage) {
    const newBalance = isAdd ? storage.balance + amount : storage.balance - amount
    console.log(`Updating storage ${storage.name}: ${storage.balance} ${isAdd ? '+' : '-'} ${amount} = ${newBalance}`)
    await prisma.storageType.update({
      where: { id: storageTypeId },
      data: { balance: Math.max(0, newBalance) }
    })
  } else {
    console.log(`Storage not found: ${storageTypeId}`)
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
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    // Filter by storageTypeId (either from or to)
    if (storageTypeId) {
      where.OR = [
        { fromStorageTypeId: storageTypeId },
        { toStorageTypeId: storageTypeId }
      ]
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
      orderBy: { date: 'desc' }
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

    console.log('Creating transaction:', { type: body.type, amount, fromStorageTypeId: body.fromStorageTypeId, toStorageTypeId: body.toStorageTypeId })

    // ALUR BARU:
    // 1. Income (Pemasukan) -> langsung masuk ke toStorageType
    // 2. Expense (Pengeluaran) -> mengambil dari fromStorageType
    // 3. Savings (Tabungan) -> mengambil dari fromStorageType
    // 4. Transfer -> dari fromStorageType ke toStorageType

    if (body.type === 'income') {
      if (body.toStorageTypeId && body.toStorageTypeId !== '') {
        console.log('Income: Adding to storage', body.toStorageTypeId)
        await updateStorageBalance(body.toStorageTypeId, amount, true)
      }
    } else if (body.type === 'expense') {
      if (body.fromStorageTypeId && body.fromStorageTypeId !== '') {
        console.log('Expense: Subtracting from storage', body.fromStorageTypeId)
        await updateStorageBalance(body.fromStorageTypeId, amount, false)
      }
    } else if (body.type === 'savings') {
      if (body.fromStorageTypeId && body.fromStorageTypeId !== '') {
        console.log('Savings: Subtracting from storage', body.fromStorageTypeId)
        await updateStorageBalance(body.fromStorageTypeId, amount, false)
      }
    } else if (body.type === 'transfer') {
      if (body.fromStorageTypeId && body.fromStorageTypeId !== '' && body.toStorageTypeId && body.toStorageTypeId !== '') {
        console.log('Transfer: From', body.fromStorageTypeId, 'To', body.toStorageTypeId)
        await updateStorageBalance(body.fromStorageTypeId, amount, false)
        await updateStorageBalance(body.toStorageTypeId, amount, true)
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: body.type,
        amount: amount,
        description: body.description || null,
        date: body.date ? new Date(body.date) : new Date(),
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
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

// PUT - Update transaction (reverse old, apply new)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const newAmount = parseFloat(body.amount)

    // Get old transaction to reverse its effect
    const oldTx = await prisma.transaction.findUnique({ where: { id: body.id } })

    if (oldTx) {
      // Reverse old transaction effect
      if (oldTx.type === 'income' && oldTx.toStorageTypeId) {
        await updateStorageBalance(oldTx.toStorageTypeId, oldTx.amount, false)
      } else if (oldTx.type === 'expense' && oldTx.fromStorageTypeId) {
        await updateStorageBalance(oldTx.fromStorageTypeId, oldTx.amount, true)
      } else if (oldTx.type === 'savings' && oldTx.fromStorageTypeId) {
        await updateStorageBalance(oldTx.fromStorageTypeId, oldTx.amount, true)
      } else if (oldTx.type === 'transfer') {
        if (oldTx.fromStorageTypeId) await updateStorageBalance(oldTx.fromStorageTypeId, oldTx.amount, true)
        if (oldTx.toStorageTypeId) await updateStorageBalance(oldTx.toStorageTypeId, oldTx.amount, false)
      }
    }

    // Apply new transaction effect
    if (body.type === 'income' && body.toStorageTypeId) {
      await updateStorageBalance(body.toStorageTypeId, newAmount, true)
    } else if (body.type === 'expense' && body.fromStorageTypeId) {
      await updateStorageBalance(body.fromStorageTypeId, newAmount, false)
    } else if (body.type === 'savings' && body.fromStorageTypeId) {
      await updateStorageBalance(body.fromStorageTypeId, newAmount, false)
    } else if (body.type === 'transfer') {
      if (body.fromStorageTypeId) await updateStorageBalance(body.fromStorageTypeId, newAmount, false)
      if (body.toStorageTypeId) await updateStorageBalance(body.toStorageTypeId, newAmount, true)
    }

    const transaction = await prisma.transaction.update({
      where: { id: body.id },
      data: {
        type: body.type,
        amount: newAmount,
        description: body.description || null,
        date: body.date ? new Date(body.date) : undefined,
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
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE - Delete transaction and reverse balance
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get transaction to reverse its effect
    const tx = await prisma.transaction.findUnique({ where: { id } })

    if (tx) {
      // Reverse transaction effect before deleting
      if (tx.type === 'income' && tx.toStorageTypeId) {
        await updateStorageBalance(tx.toStorageTypeId, tx.amount, false)
      } else if (tx.type === 'expense' && tx.fromStorageTypeId) {
        await updateStorageBalance(tx.fromStorageTypeId, tx.amount, true)
      } else if (tx.type === 'savings' && tx.fromStorageTypeId) {
        await updateStorageBalance(tx.fromStorageTypeId, tx.amount, true)
      } else if (tx.type === 'transfer') {
        if (tx.fromStorageTypeId) await updateStorageBalance(tx.fromStorageTypeId, tx.amount, true)
        if (tx.toStorageTypeId) await updateStorageBalance(tx.toStorageTypeId, tx.amount, false)
      }
    }

    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
