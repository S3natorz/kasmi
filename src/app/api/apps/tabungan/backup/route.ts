import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Export all data as JSON
export async function GET() {
  try {
    const [familyMembers, savingsCategories, expenseCategories, storageTypes, transactions] = await Promise.all([
      prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.savingsCategory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.expenseCategory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.storageType.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.transaction.findMany({ orderBy: { createdAt: 'asc' } })
    ])

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        familyMembers,
        savingsCategories,
        expenseCategories,
        storageTypes,
        transactions
      }
    }

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kasmi-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'Gagal membuat backup' }, { status: 500 })
  }
}
