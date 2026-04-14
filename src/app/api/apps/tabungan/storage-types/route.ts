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
// The input `balance` is also persisted as `initialBalance` so we have a
// stable reference point when recalculating balances from transactions.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    const balance = body.balance ? parseFloat(body.balance) : 0
    const goldWeight = isGold && body.goldWeight ? parseFloat(body.goldWeight) : null

    const storageType = await prisma.storageType.create({
      data: {
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        accountNumber: body.accountNumber || null,
        balance,
        initialBalance: balance,
        isGold,
        goldWeight,
        initialGoldWeight: goldWeight
      }
    })

    
return NextResponse.json(storageType, { status: 201 })
  } catch (error) {
    console.error(error)
    
return NextResponse.json({ error: 'Failed to create storage type' }, { status: 500 })
  }
}

// PUT - Update storage type
// When the user edits the "Saldo Awal" / gold weight, we treat it as an
// update to the opening balance AND apply the same delta to the current
// balance so existing tx history stays intact.
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    const nextInitialBalance = body.balance != null && body.balance !== '' ? parseFloat(body.balance) : 0
    const nextInitialGoldWeight = isGold && body.goldWeight ? parseFloat(body.goldWeight) : null

    const existing = await prisma.storageType.findUnique({ where: { id: body.id } })

    if (!existing) {
      return NextResponse.json({ error: 'Storage type not found' }, { status: 404 })
    }

    const prevInitial = existing.initialBalance ?? existing.balance ?? 0
    const prevInitialGold = existing.initialGoldWeight ?? existing.goldWeight ?? null

    // Shift current balance by the same delta as the initial balance so that
    // balance == initialBalance + sum(tx effects) invariant is preserved.
    const balanceDelta = nextInitialBalance - prevInitial
    const goldDelta = (nextInitialGoldWeight ?? 0) - (prevInitialGold ?? 0)

    const storageType = await prisma.storageType.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || null,
        icon: body.icon || null,
        color: body.color || null,
        accountNumber: body.accountNumber || null,
        balance: (existing.balance ?? 0) + balanceDelta,
        initialBalance: nextInitialBalance,
        isGold,
        goldWeight: isGold ? (existing.goldWeight ?? 0) + goldDelta : null,
        initialGoldWeight: isGold ? nextInitialGoldWeight : null
      }
    })

    
return NextResponse.json(storageType)
  } catch (error) {
    console.error('Failed to update storage type:', error)
    
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
