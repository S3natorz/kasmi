// Types for Tabungan Keluarga App

export type FamilyMemberType = {
  id: string
  name: string
  role: string
  avatar?: string | null
  createdAt: Date
  updatedAt: Date
}

export type SavingsCategoryType = {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  targetAmount?: number | null
  storageTypeId?: string | null
  storageType?: StorageTypeType | null
  createdAt: Date
  updatedAt: Date
}

export type ExpenseCategoryType = {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  budgetLimit?: number | null
  storageTypeId?: string | null
  storageType?: StorageTypeType | null
  createdAt: Date
  updatedAt: Date
}

export type StorageTypeType = {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  accountNumber?: string | null
  balance: number
  createdAt: Date
  updatedAt: Date
}

export type TransactionType = {
  id: string
  type: 'income' | 'expense' | 'savings' | 'transfer'
  amount: number
  description?: string | null
  date: Date
  familyMemberId?: string | null
  familyMember?: FamilyMemberType | null
  savingsCategoryId?: string | null
  savingsCategory?: SavingsCategoryType | null
  expenseCategoryId?: string | null
  expenseCategory?: ExpenseCategoryType | null
  // Transfer fields
  fromStorageTypeId?: string | null
  fromStorageType?: StorageTypeType | null
  toStorageTypeId?: string | null
  toStorageType?: StorageTypeType | null
  createdAt: Date
  updatedAt: Date
}

export type TabunganStatsType = {
  totalSavings: number
  totalExpenses: number
  totalIncome: number
  balance: number
  savingsByCategory: {
    category: string
    amount: number
    target?: number
  }[]
  expensesByCategory: {
    category: string
    amount: number
    budget?: number
  }[]
  recentTransactions: TransactionType[]
}
