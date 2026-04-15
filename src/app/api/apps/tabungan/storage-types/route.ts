import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { emitTabungan, TABUNGAN_EVENTS } from '@/libs/realtime/emit'
import { edgeCached } from '@/libs/edgeCache'

// GET - Get all storage types
export async function GET(request: Request) {
  return edgeCached(request, { ttlSeconds: 10 }, async () => {
    try {
      const storageTypes = await withPrisma(prisma =>
        prisma.storageType.findMany({
          orderBy: { name: 'asc' }
        })
      )

      return NextResponse.json(storageTypes, {
        headers: {
          // Sockets invalidate the SWR cache the moment a storage type
          // changes, so a short max-age + SWR is safe and lets the browser
          // serve back/forward navigations instantly while it revalidates.
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
        }
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch storage types' }, { status: 500 })
    }
  })
}

// POST - Create new storage type.
//
// The submitted `balance` is the *opening* balance — we store it into
// both `balance` (current) and `initialBalance` (stable reference) so the
// recalculate endpoint has a deterministic anchor:
//
//   balance = initialBalance + sum(tx effects)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    const balance = body.balance ? parseFloat(body.balance) : 0
    const goldWeight = isGold && body.goldWeight ? parseFloat(body.goldWeight) : null

    const storageType = await withPrisma(prisma =>
      prisma.storageType.create({
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
    )

    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json(storageType, { status: 201 })
  } catch (error) {
    console.error(error)

    return NextResponse.json({ error: 'Failed to create storage type' }, { status: 500 })
  }
}

// PUT - Update storage type.
//
// The form's "Saldo Awal" (and gold weight) field is pre-filled from
// `initialBalance` / `initialGoldWeight`, so the submitted `balance` /
// `goldWeight` is the *opening* balance the user wants.
//
// We shift the current balance by the same delta so existing tx history
// stays intact: if the user raises opening balance by +100k, current
// balance also goes +100k, preserving `balance = initialBalance + Σ(tx)`.
// If they don't touch the field, the delta is 0 and nothing moves.
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const isGold = body.isGold === true || body.isGold === 'true'
    const nextInitialBalance = body.balance != null && body.balance !== '' ? parseFloat(body.balance) : 0
    const nextInitialGoldWeight = isGold && body.goldWeight ? parseFloat(body.goldWeight) : null

    const storageType = await withPrisma(async prisma => {
      const existing = await prisma.storageType.findUnique({ where: { id: body.id } })

      if (!existing) throw new Error('STORAGE_TYPE_NOT_FOUND')

      const prevInitial = existing.initialBalance ?? existing.balance ?? 0
      const prevInitialGold = existing.initialGoldWeight ?? existing.goldWeight ?? null

      const balanceDelta = nextInitialBalance - prevInitial
      const goldDelta = (nextInitialGoldWeight ?? 0) - (prevInitialGold ?? 0)

      return prisma.storageType.update({
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
    })

    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json(storageType)
  } catch (error: any) {
    if (error?.message === 'STORAGE_TYPE_NOT_FOUND') {
      return NextResponse.json({ error: 'Storage type not found' }, { status: 404 })
    }

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

    await withPrisma(prisma =>
      prisma.storageType.delete({
        where: { id }
      })
    )
    emitTabungan(TABUNGAN_EVENTS.STORAGE_TYPES_CHANGED)

    return NextResponse.json({ message: 'Storage type deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete storage type' }, { status: 500 })
  }
}
