'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

// Type Imports
import type { ThemeColor } from '@core/types'

type StatsData = {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  balance: number
  savingsByCategory: {
    category: string
    amount: number
    target?: number
    color?: string
    icon?: string
  }[]
  expensesByCategory: {
    category: string
    amount: number
    budget?: number
    color?: string
    icon?: string
  }[]
  memberContributions: {
    name: string
    role: string
    avatar?: string
    income: number
    savings: number
  }[]
  recentTransactions: any[]
  transactionCount: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const TabunganDashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/apps/tabungan/stats?month=${selectedMonth}`)
      const data = await res.json()
      // Ensure all arrays have default values
      setStats({
        totalIncome: data.totalIncome || 0,
        totalExpenses: data.totalExpenses || 0,
        totalSavings: data.totalSavings || 0,
        balance: data.balance || 0,
        savingsByCategory: data.savingsByCategory || [],
        expensesByCategory: data.expensesByCategory || [],
        memberContributions: data.memberContributions || [],
        recentTransactions: data.recentTransactions || [],
        transactionCount: data.transactionCount || 0
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set default empty stats on error
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        balance: 0,
        savingsByCategory: [],
        expensesByCategory: [],
        memberContributions: [],
        recentTransactions: [],
        transactionCount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [selectedMonth])

  const getMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  const statsCards: { title: string; value: number; icon: string; color: ThemeColor }[] = [
    { title: 'Total Pemasukan', value: stats.totalIncome, icon: 'tabler-arrow-up', color: 'success' },
    { title: 'Total Pengeluaran', value: stats.totalExpenses, icon: 'tabler-arrow-down', color: 'error' },
    { title: 'Total Tabungan', value: stats.totalSavings, icon: 'tabler-coin', color: 'info' },
    { title: 'Saldo', value: stats.balance, icon: 'tabler-wallet', color: 'primary' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Month Filter */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex items-center justify-between'>
            <Typography variant='h5'>Dashboard Tabungan Keluarga</Typography>
            <CustomTextField
              select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className='min-is-[200px]'
            >
              {getMonthOptions().map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </CustomTextField>
          </CardContent>
        </Card>
      </Grid>

      {/* Statistics Cards */}
      {statsCards.map((stat, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar color={stat.color} variant='rounded' size={50} skin='light'>
                <i className={`${stat.icon} text-2xl`} />
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5'>{formatCurrency(stat.value)}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {stat.title}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Savings Progress */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='Progress Tabungan' />
          <CardContent className='flex flex-col gap-4'>
            {stats.savingsByCategory.length > 0 ? (
              stats.savingsByCategory.map((item, index) => {
                const progress = item.target ? Math.min((item.amount / item.target) * 100, 100) : 0
                return (
                  <div key={index} className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body1'>{item.category}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {formatCurrency(item.amount)} {item.target && `/ ${formatCurrency(item.target)}`}
                      </Typography>
                    </div>
                    {item.target && (
                      <LinearProgress
                        variant='determinate'
                        value={progress}
                        color={progress >= 100 ? 'success' : 'primary'}
                        className='bs-2'
                      />
                    )}
                  </div>
                )
              })
            ) : (
              <Typography color='text.secondary'>Belum ada data tabungan</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Expense Budget */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='Pengeluaran per Kategori' />
          <CardContent className='flex flex-col gap-4'>
            {stats.expensesByCategory.length > 0 ? (
              stats.expensesByCategory.map((item, index) => {
                const progress = item.budget ? Math.min((item.amount / item.budget) * 100, 100) : 0
                const isOverBudget = item.budget && item.amount > item.budget
                return (
                  <div key={index} className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Typography variant='body1'>{item.category}</Typography>
                        {isOverBudget && <Chip label='Melebihi Budget' color='error' size='small' />}
                      </div>
                      <Typography variant='body2' color='text.secondary'>
                        {formatCurrency(item.amount)} {item.budget && `/ ${formatCurrency(item.budget)}`}
                      </Typography>
                    </div>
                    {item.budget && (
                      <LinearProgress
                        variant='determinate'
                        value={progress}
                        color={isOverBudget ? 'error' : 'warning'}
                        className='bs-2'
                      />
                    )}
                  </div>
                )
              })
            ) : (
              <Typography color='text.secondary'>Belum ada data pengeluaran</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Member Contributions */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='Kontribusi Anggota Keluarga' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {stats.memberContributions.length > 0 ? (
                stats.memberContributions.map((member, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <CustomAvatar src={member.avatar} size={40}>
                        {member.name.charAt(0)}
                      </CustomAvatar>
                      <div>
                        <Typography variant='body1'>{member.name}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {member.role}
                        </Typography>
                      </div>
                    </div>
                    <div className='text-end'>
                      <Typography variant='body2' color='success.main'>
                        +{formatCurrency(member.income)}
                      </Typography>
                      <Typography variant='body2' color='info.main'>
                        Tabungan: {formatCurrency(member.savings)}
                      </Typography>
                    </div>
                  </div>
                ))
              ) : (
                <Typography color='text.secondary'>Belum ada anggota keluarga</Typography>
              )}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Transactions */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title='Transaksi Terbaru' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <CustomAvatar
                        color={
                          transaction.type === 'income' ? 'success' : transaction.type === 'expense' ? 'error' : 'info'
                        }
                        variant='rounded'
                        size={40}
                        skin='light'
                      >
                        <i
                          className={
                            transaction.type === 'income'
                              ? 'tabler-arrow-up'
                              : transaction.type === 'expense'
                                ? 'tabler-arrow-down'
                                : 'tabler-coin'
                          }
                        />
                      </CustomAvatar>
                      <div>
                        <Typography variant='body1'>{transaction.description || transaction.type}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {new Date(transaction.date).toLocaleDateString('id-ID')}
                          {transaction.familyMember && ` • ${transaction.familyMember.name}`}
                        </Typography>
                      </div>
                    </div>
                    <Typography
                      variant='body1'
                      color={
                        transaction.type === 'income'
                          ? 'success.main'
                          : transaction.type === 'expense'
                            ? 'error.main'
                            : 'info.main'
                      }
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </div>
                ))
              ) : (
                <Typography color='text.secondary'>Belum ada transaksi</Typography>
              )}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TabunganDashboard
