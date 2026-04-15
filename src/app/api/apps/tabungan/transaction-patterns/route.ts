import { NextResponse } from 'next/server'

import { withPrisma } from '@/libs/prisma'

// GET - Get most frequently used storage/category per transaction type
// Returns the "default" selections based on user's past behavior
export async function GET() {
  try {
    // Get the most common fromStorageTypeId, toStorageTypeId, expenseCategoryId, savingsCategoryId
    // grouped by transaction type from the last 100 transactions
    const recentTransactions = await withPrisma(prisma =>
      prisma.transaction.findMany({
        select: {
          type: true,
          fromStorageTypeId: true,
          toStorageTypeId: true,
          expenseCategoryId: true,
          savingsCategoryId: true,
          description: true
        },
        orderBy: { createdAt: 'desc' },
        take: 200
      })
    )

    // Count frequency per type
    const patterns: Record<string, {
      fromStorageTypeId: Record<string, number>
      toStorageTypeId: Record<string, number>
      expenseCategoryId: Record<string, number>
      savingsCategoryId: Record<string, number>
      // Map description keywords to category for smart matching
      descriptionToCategory: Record<string, string>
    }> = {}

    for (const tx of recentTransactions) {
      if (!patterns[tx.type]) {
        patterns[tx.type] = {
          fromStorageTypeId: {},
          toStorageTypeId: {},
          expenseCategoryId: {},
          savingsCategoryId: {},
          descriptionToCategory: {}
        }
      }

      const p = patterns[tx.type]

      if (tx.fromStorageTypeId) {
        p.fromStorageTypeId[tx.fromStorageTypeId] = (p.fromStorageTypeId[tx.fromStorageTypeId] || 0) + 1
      }

      if (tx.toStorageTypeId) {
        p.toStorageTypeId[tx.toStorageTypeId] = (p.toStorageTypeId[tx.toStorageTypeId] || 0) + 1
      }

      if (tx.expenseCategoryId) {
        p.expenseCategoryId[tx.expenseCategoryId] = (p.expenseCategoryId[tx.expenseCategoryId] || 0) + 1
      }

      if (tx.savingsCategoryId) {
        p.savingsCategoryId[tx.savingsCategoryId] = (p.savingsCategoryId[tx.savingsCategoryId] || 0) + 1
      }

      // Map description words to category for smart matching
      if (tx.description && (tx.expenseCategoryId || tx.savingsCategoryId)) {
        const words = tx.description.toLowerCase().split(/\s+/)

        for (const word of words) {
          if (word.length >= 3) {
            const catId = tx.expenseCategoryId || tx.savingsCategoryId

            if (catId) {
              p.descriptionToCategory[word] = catId
            }
          }
        }
      }
    }

    // Extract the most common value for each field per type
    const getMostCommon = (counts: Record<string, number>): string => {
      let maxCount = 0
      let maxId = ''

      for (const [id, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count
          maxId = id
        }
      }

      return maxId
    }

    const result: Record<string, {
      fromStorageTypeId: string
      toStorageTypeId: string
      expenseCategoryId: string
      savingsCategoryId: string
      descriptionToCategory: Record<string, string>
    }> = {}

    for (const [type, p] of Object.entries(patterns)) {
      result[type] = {
        fromStorageTypeId: getMostCommon(p.fromStorageTypeId),
        toStorageTypeId: getMostCommon(p.toStorageTypeId),
        expenseCategoryId: getMostCommon(p.expenseCategoryId),
        savingsCategoryId: getMostCommon(p.savingsCategoryId),
        descriptionToCategory: p.descriptionToCategory
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch transaction patterns:', error)
    return NextResponse.json({}, { status: 200 })
  }
}
