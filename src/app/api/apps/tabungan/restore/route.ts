import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

// POST - Restore data from JSON backup
export async function POST(request: Request) {
  try {
    const backup = await request.json()

    // Validate backup format
    if (!backup.version || !backup.data) {
      return NextResponse.json({ error: 'Format backup tidak valid' }, { status: 400 })
    }

    const { familyMembers, savingsCategories, expenseCategories, storageTypes, transactions } = backup.data

    // Delete all existing data in correct order (respect foreign keys)
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.savingsCategory.deleteMany(),
      prisma.expenseCategory.deleteMany(),
      prisma.storageType.deleteMany(),
      prisma.familyMember.deleteMany()
    ])

    // Restore in correct order
    if (familyMembers?.length) {
      await prisma.familyMember.createMany({
        data: familyMembers.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatar: m.avatar || null,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt)
        }))
      })
    }

    if (storageTypes?.length) {
      await prisma.storageType.createMany({
        data: storageTypes.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || null,
          icon: s.icon || null,
          color: s.color || null,
          accountNumber: s.accountNumber || null,
          balance: s.balance || 0,

          // For older backups without initialBalance, fall back to balance so
          // the recalculate invariant (balance = initialBalance + tx effects)
          // still holds when no transactions exist yet.
          initialBalance: s.initialBalance != null ? s.initialBalance : s.balance || 0,
          isGold: s.isGold || false,
          goldWeight: s.goldWeight || null,
          initialGoldWeight: s.initialGoldWeight != null ? s.initialGoldWeight : s.goldWeight || null,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }))
      })
    }

    if (savingsCategories?.length) {
      await prisma.savingsCategory.createMany({
        data: savingsCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || null,
          icon: c.icon || null,
          color: c.color || null,
          targetAmount: c.targetAmount || null,
          storageTypeId: c.storageTypeId || null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      })
    }

    if (expenseCategories?.length) {
      await prisma.expenseCategory.createMany({
        data: expenseCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || null,
          icon: c.icon || null,
          color: c.color || null,
          budgetLimit: c.budgetLimit || null,
          storageTypeId: c.storageTypeId || null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      })
    }

    if (transactions?.length) {
      await prisma.transaction.createMany({
        data: transactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description || null,
          date: new Date(t.date),
          familyMemberId: t.familyMemberId || null,
          savingsCategoryId: t.savingsCategoryId || null,
          expenseCategoryId: t.expenseCategoryId || null,
          fromStorageTypeId: t.fromStorageTypeId || null,
          toStorageTypeId: t.toStorageTypeId || null,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }))
      })
    }

    const counts = {
      familyMembers: familyMembers?.length || 0,
      storageTypes: storageTypes?.length || 0,
      savingsCategories: savingsCategories?.length || 0,
      expenseCategories: expenseCategories?.length || 0,
      transactions: transactions?.length || 0
    }

    return NextResponse.json({
      message: 'Restore berhasil!',
      counts
    })
  } catch (error) {
    console.error('Restore failed:', error)
    
return NextResponse.json({ error: 'Gagal restore data' }, { status: 500 })
  }
}
