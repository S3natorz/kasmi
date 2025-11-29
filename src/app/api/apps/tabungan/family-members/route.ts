import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Get all family members
export async function GET() {
  try {
    console.log('Fetching family members...')
    const members = await prisma.familyMember.findMany({
      orderBy: { createdAt: 'desc' }
    })
    console.log('Found', members.length, 'family members')
    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch family members:', error)
    return NextResponse.json({ error: 'Failed to fetch family members', details: String(error) }, { status: 500 })
  }
}

// POST - Create new family member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Creating family member with data:', body)

    if (!body.name || !body.role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
    }

    const member = await prisma.familyMember.create({
      data: {
        name: body.name,
        role: body.role,
        avatar: body.avatar || null
      }
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Failed to create family member:', error)
    return NextResponse.json({ error: 'Failed to create family member', details: String(error) }, { status: 500 })
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
