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
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import { DashboardStatsSkeleton } from '@/components/skeletons'
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

type StatsData = {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  storageBalances: StorageTypeType[]
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
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [statsRes, storageRes] = await Promise.all([
        fetch(`/api/apps/tabungan/stats?month=${selectedMonth}`),
        fetch('/api/apps/tabungan/storage-types')
      ])
      const [data, storages] = await Promise.all([statsRes.json(), storageRes.json()])

      setStats({
        totalIncome: data.totalIncome || 0,
        totalExpenses: data.totalExpenses || 0,
        totalSavings: data.totalSavings || 0,
        storageBalances: Array.isArray(storages) ? storages : [],
        savingsByCategory: data.savingsByCategory || [],
        expensesByCategory: data.expensesByCategory || [],
        recentTransactions: data.recentTransactions || [],
        transactionCount: data.transactionCount || 0
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        storageBalances: [],
        savingsByCategory: [],
        expensesByCategory: [],
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
    return <DashboardStatsSkeleton />
  }

  // Calculate total balance from all storage types
  const totalBalance = stats.storageBalances.reduce((sum, s) => sum + (s.balance || 0), 0)

  const statsCards: { title: string; value: number; icon: string; color: ThemeColor }[] = [
    { title: 'Pemasukan Bulan Ini', value: stats.totalIncome, icon: 'tabler-arrow-up', color: 'success' },
    { title: 'Pengeluaran Bulan Ini', value: stats.totalExpenses, icon: 'tabler-arrow-down', color: 'error' },
    { title: 'Tabungan Bulan Ini', value: stats.totalSavings, icon: 'tabler-coin', color: 'info' },
    { title: 'Total Transaksi', value: stats.transactionCount, icon: 'tabler-receipt', color: 'warning' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Month Filter */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <Typography variant='h5'>Dashboard Tabungan Keluarga</Typography>
            <CustomTextField
              select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className='min-is-[200px] w-full sm:w-auto'
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
        <Grid key={index} size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent className='flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4'>
              <CustomAvatar color={stat.color} variant='rounded' size={48} skin='light' className='shrink-0'>
                <i className={`${stat.icon} text-xl`} />
              </CustomAvatar>
              <div className='flex flex-col min-w-0 w-full'>
                <Typography 
                  variant='h6' 
                  className='font-semibold'
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.2
                  }}
                >
                  {stat.title === 'Total Transaksi' ? stat.value : formatCurrency(stat.value)}
                </Typography>
                <Typography 
                  variant='body2' 
                  color='text.secondary'
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    lineHeight: 1.3,
                    mt: 0.5
                  }}
                >
                  {stat.title}
                </Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Storage Balances - NEW: List saldo per Jenis Simpan */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader 
            title='Saldo Simpanan' 
            subheader={`Total: ${formatCurrency(totalBalance)}`}
          />
          <CardContent>
            <Grid container spacing={3}>
              {stats.storageBalances.length > 0 ? (
                stats.storageBalances.map((storage, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
                    <Box 
                      sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        borderRadius: 2, 
                        bgcolor: 'action.hover',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1.5, sm: 2 },
                        height: '100%'
                      }}
                    >
                      <CustomAvatar 
                        variant='rounded' 
                        size={40} 
                        skin='light'
                        className='shrink-0'
                        sx={{ bgcolor: storage.color ? `${storage.color}20` : undefined }}
                      >
                        {storage.icon ? (
                          <i className={storage.icon} style={{ color: storage.color || undefined }} />
                        ) : (
                          <i className='tabler-wallet' />
                        )}
                      </CustomAvatar>
                      <div className='flex flex-col min-w-0 w-full'>
                        <Typography 
                          variant='body2' 
                          color='text.secondary' 
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {storage.name}
                        </Typography>
                        <Typography 
                          variant='h6'
                          sx={{ 
                            fontSize: { xs: '0.85rem', sm: '1rem' },
                            fontWeight: 600,
                            lineHeight: 1.3,
                            mt: 0.25
                          }}
                        >
                          {formatCurrency(storage.balance || 0)}
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Typography color='text.secondary' textAlign='center'>
                    Belum ada jenis simpanan. Tambahkan di menu Jenis Simpan.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Savings Progress */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Progress Tabungan' />
          <CardContent className='flex flex-col gap-4'>
            {stats.savingsByCategory.length > 0 ? (
              stats.savingsByCategory.map((item, index) => {
                const progress = item.target ? Math.min((item.amount / item.target) * 100, 100) : 0
                return (
                  <div key={index} className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between flex-wrap gap-1'>
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
                        sx={{ height: 8, borderRadius: 1 }}
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
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Pengeluaran per Kategori' />
          <CardContent className='flex flex-col gap-4'>
            {stats.expensesByCategory.length > 0 ? (
              stats.expensesByCategory.map((item, index) => {
                const progress = item.budget ? Math.min((item.amount / item.budget) * 100, 100) : 0
                const isOverBudget = item.budget && item.amount > item.budget
                return (
                  <div key={index} className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between flex-wrap gap-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
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
                        sx={{ height: 8, borderRadius: 1 }}
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

      {/* Recent Transactions */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Transaksi Terbaru' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 overflow-hidden'>
                      <CustomAvatar
                        color={
                          transaction.type === 'income' 
                            ? 'success' 
                            : transaction.type === 'expense' 
                              ? 'error' 
                              : transaction.type === 'transfer'
                                ? 'warning'
                                : 'info'
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
                                : transaction.type === 'transfer'
                                  ? 'tabler-transfer'
                                  : 'tabler-coin'
                          }
                        />
                      </CustomAvatar>
                      <div className='overflow-hidden'>
                        <Typography variant='body1' className='truncate'>
                          {transaction.description || transaction.type}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' className='truncate'>
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
                            : transaction.type === 'transfer'
                              ? 'warning.main'
                              : 'info.main'
                      }
                      className='whitespace-nowrap'
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

      {/* Floating Action Button - Tambah Transaksi */}
      <Tooltip title="Tambah Transaksi" placement="left">
        <Fab
          color="primary"
          size="small"
          aria-label="tambah transaksi"
          onClick={() => setOpenAddDialog(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 20, sm: 28 },
            right: { xs: 65, sm: 75 },
            zIndex: 1000,
            boxShadow: 3,
            width: 44,
            height: 44,
            minHeight: 44,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: 6
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <i className='tabler-plus text-base' />
        </Fab>
      </Tooltip>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        onSuccess={fetchStats}
      />
    </Grid>
  )
}

export default TabunganDashboard
