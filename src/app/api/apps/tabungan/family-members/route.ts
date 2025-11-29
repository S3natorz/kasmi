import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get all family members
export async function GET() {
  try {
    const members = await prisma.familyMember.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
  }
}

// POST - Create new family member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const member = await prisma.familyMember.create({
      data: {
        name: body.name,
        role: body.role,
        avatar: body.avatar || null
      }
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create family member' }, { status: 500 })
  }
}

// PUT - Update family member
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const member = await prisma.familyMember.update({
      where: { id: body.id },
      data: {
        name: body.name,
        role: body.role,
        avatar: body.avatar
      }
    })
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update family member' }, { status: 500 })
  }
}

// DELETE - Delete family member
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.familyMember.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Family member deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete family member' }, { status: 500 })
  }
}
