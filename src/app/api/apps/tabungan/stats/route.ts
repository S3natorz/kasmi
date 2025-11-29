import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

// GET - Get dashboard statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM

    let dateFilter: any = {}

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        familyMember: true,
        savingsCategory: true,
        expenseCategory: true
      },
      orderBy: { date: 'desc' }
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

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      totalSavings,
      balance,
      savingsByCategory: savingsByCategory.filter(s => s.amount > 0),
      expensesByCategory: expensesByCategory.filter(e => e.amount > 0),
      memberContributions,
      recentTransactions,
      transactionCount: transactions.length
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
