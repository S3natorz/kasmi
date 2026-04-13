import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'
import { wibStartOfDay, wibEndOfDay, wibMonthRange } from '@/libs/wib'

// GET - Get dashboard statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate') // Format: YYYY-MM-DD
    const endDateParam = searchParams.get('endDate') // Format: YYYY-MM-DD
    const month = searchParams.get('month') // Legacy: Format: YYYY-MM

    let dateFilter: any = {}

    if (startDateParam && endDateParam) {
      // New date range filter (WIB/UTC+7 boundaries)
      dateFilter = {
        date: {
          gte: wibStartOfDay(startDateParam),
          lte: wibEndOfDay(endDateParam)
        }
      }
    } else if (month) {
      // Legacy month filter for backward compatibility
      const { startDate, endDate } = wibMonthRange(month)
      dateFilter = {
        date: {
          gte: wibStartOfDay(startDate),
          lte: wibEndOfDay(endDate)
        }
      }
    }

    const payload = await withPrisma(async prisma => {
      // Get all transactions
      const transactions = await prisma.transaction.findMany({
        where: dateFilter,
        include: {
          familyMember: true,
          savingsCategory: true,
          expenseCategory: true,
          fromStorageType: true,
          toStorageType: true
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
      })

      // Calculate totals
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

      const totalSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0)

      const balance = totalIncome - totalExpenses - totalSavings

      // Get savings by category
      const savingsCategories = await prisma.savingsCategory.findMany()
      const savingsByCategory = savingsCategories.map(cat => {
        const amount = transactions
          .filter(t => t.type === 'savings' && t.savingsCategoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0)
        return {
          category: cat.name,
          amount,
          target: cat.targetAmount,
          color: cat.color,
          icon: cat.icon
        }
      })

      // Get expenses by category
      const expenseCategories = await prisma.expenseCategory.findMany()
      const expensesByCategory = expenseCategories.map(cat => {
        const amount = transactions
          .filter(t => t.type === 'expense' && t.expenseCategoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0)
        return {
          category: cat.name,
          amount,
          budget: cat.budgetLimit,
          color: cat.color,
          icon: cat.icon
        }
      })

      // Get family members contribution
      const familyMembers = await prisma.familyMember.findMany()
      const memberContributions = familyMembers.map(member => {
        const income = transactions
          .filter(t => t.type === 'income' && t.familyMemberId === member.id)
          .reduce((sum, t) => sum + t.amount, 0)
        const savings = transactions
          .filter(t => t.type === 'savings' && t.familyMemberId === member.id)
          .reduce((sum, t) => sum + t.amount, 0)
        return {
          name: member.name,
          role: member.role,
          avatar: member.avatar,
          income,
          savings
        }
      })

      // Recent transactions (last 10)
      const recentTransactions = transactions.slice(0, 10)

      return {
        totalIncome,
        totalExpenses,
        totalSavings,
        balance,
        savingsByCategory: savingsByCategory.filter(s => s.amount > 0),
        expensesByCategory: expensesByCategory.filter(e => e.amount > 0),
        memberContributions,
        recentTransactions,
        transactionCount: transactions.length
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
