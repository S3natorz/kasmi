import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Get all expense categories
export async function GET() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      include: { storageType: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expense categories' }, { status: 500 })
  }
}

// POST - Create new expense category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = await prisma.expenseCategory.create({
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
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense category' }, { status: 500 })
  }
}

// PUT - Update expense category
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const category = await prisma.expenseCategory.update({
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

    await prisma.expenseCategory.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Expense category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense category' }, { status: 500 })
  }
}
