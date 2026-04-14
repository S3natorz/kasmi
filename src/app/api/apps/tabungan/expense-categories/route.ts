import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'
import { edgeCached } from '@/libs/edgeCache'

// GET - Get all expense categories
export async function GET(request: Request) {
  return edgeCached(request, { ttlSeconds: 30 }, async () => {
    try {
      const categories = await withPrisma(prisma =>
        prisma.expenseCategory.findMany({
          include: { storageType: true },
          orderBy: { createdAt: 'desc' }
        })
      )

      return NextResponse.json(categories, {
        headers: {
          // Categories rarely change; sockets invalidate on writes so a
          // generous SWR window keeps repeat navigations instant.
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=120'
        }
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch expense categories' }, { status: 500 })
    }
  })
}

// POST - Create new expense category
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const category = await withPrisma(prisma =>
      prisma.expenseCategory.create({
        data: {
          name: body.name,
          description: body.description || null,
          icon: body.icon || null,
          color: body.color || null,
          budgetLimit: body.budgetLimit ? parseFloat(body.budgetLimit) : null,
          storageTypeId: body.storageTypeId && body.storageTypeId !== '' ? body.storageTypeId : null
        },
        include: { storageType: true }
      })
    )

    emitTabungan(TABUNGAN_EVENTS.EXPENSE_CATEGORIES_CHANGED)

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense category' }, { status: 500 })
  }
}

// PUT - Update expense category
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const category = await withPrisma(prisma =>
      prisma.expenseCategory.update({
        where: { id: body.id },
        data: {
          name: body.name,
          description: body.description,
          icon: body.icon,
          color: body.color,
          budgetLimit: body.budgetLimit ? parseFloat(body.budgetLimit) : null,
          storageTypeId: body.storageTypeId && body.storageTypeId !== '' ? body.storageTypeId : null
        },
        include: { storageType: true }
      })
    )

    emitTabungan(TABUNGAN_EVENTS.EXPENSE_CATEGORIES_CHANGED)

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense category' }, { status: 500 })
  }
}

// DELETE - Delete expense category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await withPrisma(prisma =>
      prisma.expenseCategory.delete({
        where: { id }
      })
    )
    emitTabungan(TABUNGAN_EVENTS.EXPENSE_CATEGORIES_CHANGED)

    return NextResponse.json({ message: 'Expense category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense category' }, { status: 500 })
  }
}
