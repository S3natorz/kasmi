import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Get all storage types
export async function GET() {
  try {
    const storageTypes = await prisma.storageType.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(storageTypes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch storage types' }, { status: 500 })
  }
}

// POST - Create new storage type
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    
    const storageType = await prisma.storageType.create({
      data: {
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        accountNumber: body.accountNumber || null,
        balance: body.balance ? parseFloat(body.balance) : 0,
        isGold: isGold,
        goldWeight: isGold && body.goldWeight ? parseFloat(body.goldWeight) : null
      }
    })
    return NextResponse.json(storageType, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create storage type' }, { status: 500 })
  }
}

// PUT - Update storage type
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    
    const storageType = await prisma.storageType.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        accountNumber: body.accountNumber || null,
        balance: body.balance ? parseFloat(body.balance) : 0,
        isGold: isGold,
        goldWeight: isGold && body.goldWeight ? parseFloat(body.goldWeight) : null
      }
    })
    return NextResponse.json(storageType)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update storage type' }, { status: 500 })
  }
}

// DELETE - Delete storage type
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.storageType.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Storage type deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete storage type' }, { status: 500 })
  }
}
