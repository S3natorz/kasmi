import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Get all savings categories
export async function GET() {
  try {
    const categories = await prisma.savingsCategory.findMany({
      include: { storageType: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch savings categories' }, { status: 500 })
  }
}

// POST - Create new savings category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = await prisma.savingsCategory.create({
      data: {
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : null,
        storageTypeId: body.storageTypeId && body.storageTypeId !== '' ? body.storageTypeId : null
      },
      include: { storageType: true }
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create savings category' }, { status: 500 })
  }
}

// PUT - Update savings category
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const category = await prisma.savingsCategory.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : null,
        storageTypeId: body.storageTypeId && body.storageTypeId !== '' ? body.storageTypeId : null
      },
      include: { storageType: true }
    })
    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update savings category' }, { status: 500 })
  }
}

// DELETE - Delete savings category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.savingsCategory.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Savings category deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete savings category' }, { status: 500 })
  }
}
