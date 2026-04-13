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
      // Split the previous "findMany with include" into two queries:
      //  1. `aggRows` — strips relations and selects only the fields needed
      //     for the in-memory `reduce`/`filter` math below. Per-row payload
      //     drops from ~600B to ~80B, which matters because the date range
      //     can include hundreds of rows.
      //  2. `recentTransactions` — capped at 10 with full relations for
      //     display, served by the new `(date desc, createdAt desc)` index.
      //
      // All five queries fan out in parallel; on cold pools each one costs
      // a TCP round-trip, so awaiting sequentially used to add ~5x the
      // slowest-query latency for no good reason.
      const [aggRows, recentTransactions, transactionCount, savingsCategories, expenseCategories, familyMembers] =
        await Promise.all([
          prisma.transaction.findMany({
            where: dateFilter,
            select: {
              type: true,
              amount: true,
              familyMemberId: true,
              savingsCategoryId: true,
              expenseCategoryId: true
            }
          }),
          prisma.transaction.findMany({
            where: dateFilter,
            select: {
              id: true,
              type: true,
              amount: true,
              description: true,
              date: true,
              familyMemberId: true,
              savingsCategoryId: true,
              expenseCategoryId: true,
              fromStorageTypeId: true,
              toStorageTypeId: true,
              createdAt: true,
              updatedAt: true,
              familyMember: { select: { id: true, name: true, role: true, avatar: true } },
              savingsCategory: { select: { id: true, name: true, icon: true, color: true } },
              expenseCategory: { select: { id: true, name: true, icon: true, color: true } },
              fromStorageType: { select: { id: true, name: true, icon: true, color: true, isGold: true } },
              toStorageType: { select: { id: true, name: true, icon: true, color: true, isGold: true } }
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            take: 10
          }),
          prisma.transaction.count({ where: dateFilter }),
          prisma.savingsCategory.findMany(),
          prisma.expenseCategory.findMany(),
          prisma.familyMember.findMany()
        ])

      // Calculate totals
      const totalIncome = aggRows.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = aggRows.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

      const totalSavings = aggRows.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0)

      const balance = totalIncome - totalExpenses - totalSavings

      // Get savings by category
      const savingsByCategory = savingsCategories.map(cat => {
        const amount = aggRows
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
      const expensesByCategory = expenseCategories.map(cat => {
        const amount = aggRows
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
      const memberContributions = familyMembers.map(member => {
        const income = aggRows
          .filter(t => t.type === 'income' && t.familyMemberId === member.id)
          .reduce((sum, t) => sum + t.amount, 0)
        const savings = aggRows
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

      return {
        totalIncome,
        totalExpenses,
        totalSavings,
        balance,
        savingsByCategory: savingsByCategory.filter(s => s.amount > 0),
        expensesByCategory: expensesByCategory.filter(e => e.amount > 0),
        memberContributions,
        recentTransactions,
        transactionCount
      }
    })

    return NextResponse.json(payload, {
      headers: {
        // Match the transactions route — sockets invalidate on writes, so
        // a short max-age + SWR is safe and makes back/forward navigation
        // and dashboard re-renders feel instant.
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
