import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to update storage balance
async function updateStorageBalance(storageTypeId: string, amount: number, isAdd: boolean) {
  const storage = await prisma.storageType.findUnique({ where: { id: storageTypeId } })
  if (storage) {
    await prisma.storageType.update({
      where: { id: storageTypeId },
      data: {
        balance: isAdd ? storage.balance + amount : storage.balance - amount
      }
    })
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

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (familyMemberId) {
      where.familyMemberId = familyMemberId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        familyMember: true,
        savingsCategory: {
          include: { storageType: true }
        },
        expenseCategory: {
          include: { storageType: true }
        },
        fromStorageType: true,
        toStorageType: true
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST - Create new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = parseFloat(body.amount)

    // Handle transfer type - update balances
    if (body.type === 'transfer') {
      if (!body.fromStorageTypeId || !body.toStorageTypeId) {
        return NextResponse.json({ error: 'Transfer requires source and destination' }, { status: 400 })
      }

      // Decrease from source, increase to destination
      await updateStorageBalance(body.fromStorageTypeId, amount, false)
      await updateStorageBalance(body.toStorageTypeId, amount, true)
    }

    // Handle savings - increase storage balance
    if (body.type === 'savings' && body.savingsCategoryId) {
      const category = await prisma.savingsCategory.findUnique({
        where: { id: body.savingsCategoryId },
        include: { storageType: true }
      })
      if (category?.storageTypeId) {
        await updateStorageBalance(category.storageTypeId, amount, true)
      }
    }

    // Handle expense - decrease storage balance
    if (body.type === 'expense' && body.expenseCategoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: body.expenseCategoryId },
        include: { storageType: true }
      })
      if (category?.storageTypeId) {
        await updateStorageBalance(category.storageTypeId, amount, false)
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
        savingsCategory: {
          include: { storageType: true }
        },
        expenseCategory: {
          include: { storageType: true }
        },
        fromStorageType: true,
        toStorageType: true
      }
    })
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

// PUT - Update transaction
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const transaction = await prisma.transaction.update({
      where: { id: body.id },
      data: {
        type: body.type,
        amount: parseFloat(body.amount),
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
        savingsCategory: {
          include: { storageType: true }
        },
        expenseCategory: {
          include: { storageType: true }
        },
        fromStorageType: true,
        toStorageType: true
      }
    })
    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE - Delete transaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.transaction.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
