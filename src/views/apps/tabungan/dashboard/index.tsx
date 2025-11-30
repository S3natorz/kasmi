'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

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
import Collapse from '@mui/material/Collapse'
import Button from '@mui/material/Button'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import { DashboardStatsSkeleton } from '@/components/skeletons'
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog'
import StorageTransactionsDialog from '@/components/dialogs/StorageTransactionsDialog'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

type FilterType = 'daily' | 'weekly' | 'monthly' | 'custom'

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

// Helper to format date for API
const formatDateForApi = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// Helper to get date range based on filter type
const getDateRange = (filterType: FilterType, selectedDate: string, customStart?: string, customEnd?: string) => {
  const now = new Date()

  switch (filterType) {
    case 'daily': {
      const date = selectedDate ? new Date(selectedDate) : now
      return {
        startDate: formatDateForApi(date),
        endDate: formatDateForApi(date)
      }
    }
    case 'weekly': {
      const date = selectedDate ? new Date(selectedDate) : now
      const dayOfWeek = date.getDay()
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - dayOfWeek)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        startDate: formatDateForApi(startOfWeek),
        endDate: formatDateForApi(endOfWeek)
      }
    }
    case 'monthly': {
      const [year, month] = selectedDate.split('-').map(Number)
      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 0)
      return {
        startDate: formatDateForApi(startOfMonth),
        endDate: formatDateForApi(endOfMonth)
      }
    }
    case 'custom': {
      return {
        startDate: customStart || formatDateForApi(now),
        endDate: customEnd || formatDateForApi(now)
      }
    }
    default:
      return {
        startDate: formatDateForApi(now),
        endDate: formatDateForApi(now)
      }
  }
}

const TabunganDashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openStorageDialog, setOpenStorageDialog] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState<StorageTypeType | null>(null)

  // Gold price state
  const [goldPrice, setGoldPrice] = useState<number>(0)

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDate, setSelectedDate] = useState(() => formatDateForApi(new Date()))
  const [customStartDate, setCustomStartDate] = useState(() => formatDateForApi(new Date()))
  const [customEndDate, setCustomEndDate] = useState(() => formatDateForApi(new Date()))

  // Get current date range based on filter
  const dateRange = useMemo(() => {
    if (filterType === 'monthly') {
      return getDateRange(filterType, selectedMonth)
    } else if (filterType === 'custom') {
      return getDateRange(filterType, '', customStartDate, customEndDate)
    } else {
      return getDateRange(filterType, selectedDate)
    }
  }, [filterType, selectedMonth, selectedDate, customStartDate, customEndDate])

  // Fetch gold price
  const fetchGoldPrice = async () => {
    try {
      const res = await fetch('/api/apps/tabungan/gold-price')
      const data = await res.json()
      setGoldPrice(data.pricePerGram || 0)
    } catch (error) {
      console.error('Failed to fetch gold price:', error)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = dateRange

      const [statsRes, storageRes] = await Promise.all([
        fetch(`/api/apps/tabungan/stats?startDate=${startDate}&endDate=${endDate}`),
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
    fetchGoldPrice()
  }, [dateRange])

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

  // Get label for current filter
  const getFilterLabel = () => {
    switch (filterType) {
      case 'daily':
        return new Date(selectedDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      case 'weekly':
        const weekStart = new Date(dateRange.startDate)
        const weekEnd = new Date(dateRange.endDate)
        return `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      case 'monthly':
        const [year, month] = selectedMonth.split('-')
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric'
        })
      case 'custom':
        return `${new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      default:
        return ''
    }
  }

  // Get period label for stats cards
  const getPeriodLabel = () => {
    switch (filterType) {
      case 'daily':
        return 'Hari Ini'
      case 'weekly':
        return 'Minggu Ini'
      case 'monthly':
        return 'Bulan Ini'
      case 'custom':
        return 'Periode Ini'
      default:
        return ''
    }
  }

  if (loading || !stats) {
    return <DashboardStatsSkeleton />
  }

  // Calculate total balance from all storage types (including gold value)
  const totalBalance = stats.storageBalances.reduce((sum, s) => {
    if (s.isGold && s.goldWeight) {
      return sum + s.goldWeight * goldPrice
    }
    return sum + (s.balance || 0)
  }, 0)

  // Calculate total gold weight
  const totalGoldWeight = stats.storageBalances
    .filter(s => s.isGold && s.goldWeight)
    .reduce((sum, s) => sum + (s.goldWeight || 0), 0)

  const periodLabel = getPeriodLabel()
  const statsCards: { title: string; value: number; icon: string; color: ThemeColor }[] = [
    { title: `Pemasukan ${periodLabel}`, value: stats.totalIncome, icon: 'tabler-arrow-up', color: 'success' },
    { title: `Pengeluaran ${periodLabel}`, value: stats.totalExpenses, icon: 'tabler-arrow-down', color: 'error' },
    { title: `Tabungan ${periodLabel}`, value: stats.totalSavings, icon: 'tabler-coin', color: 'info' },
    { title: 'Total Transaksi', value: stats.transactionCount, icon: 'tabler-receipt', color: 'warning' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Filter Section */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant='h5'>Dashboard Tabungan Keluarga</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    <i className='tabler-calendar-event' style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {getFilterLabel()}
                  </Typography>
                </Box>

                {/* Filter Type Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { value: 'daily', label: 'Harian', icon: 'tabler-calendar-event' },
                    { value: 'weekly', label: 'Mingguan', icon: 'tabler-calendar-week' },
                    { value: 'monthly', label: 'Bulanan', icon: 'tabler-calendar-month' },
                    { value: 'custom', label: 'Custom', icon: 'tabler-calendar-stats' }
                  ].map(filter => (
                    <Chip
                      key={filter.value}
                      icon={<i className={filter.icon} style={{ fontSize: '1rem' }} />}
                      label={filter.label}
                      onClick={() => setFilterType(filter.value as FilterType)}
                      color={filterType === filter.value ? 'primary' : 'default'}
                      variant={filterType === filter.value ? 'filled' : 'outlined'}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: filterType === filter.value ? 600 : 400
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Filter Inputs */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                {filterType === 'daily' && (
                  <CustomTextField
                    type='date'
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    size='small'
                    sx={{ minWidth: 180 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}

                {filterType === 'weekly' && (
                  <CustomTextField
                    type='date'
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    size='small'
                    label='Pilih tanggal dalam minggu'
                    sx={{ minWidth: 220 }}
                    InputLabelProps={{ shrink: true }}
                  />
                )}

                {filterType === 'monthly' && (
                  <CustomTextField
                    select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    size='small'
                    sx={{ minWidth: 200 }}
                  >
                    {getMonthOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}

                {filterType === 'custom' && (
                  <>
                    <CustomTextField
                      type='date'
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      size='small'
                      label='Dari Tanggal'
                      sx={{ minWidth: 160 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Typography color='text.secondary'>s/d</Typography>
                    <CustomTextField
                      type='date'
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      size='small'
                      label='Sampai Tanggal'
                      sx={{ minWidth: 160 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}

                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-refresh' />}
                  onClick={fetchStats}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
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

      {/* Storage Balances - Total Saldo Simpanan */}
      <Grid size={{ xs: 12 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)'
            }
          }}
        >
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            {/* Total Balance Header */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                mb: 3,
                pb: 3,
                borderBottom: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 0 } }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-wallet text-2xl' style={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 500 }}>
                    Total Saldo Simpanan
                  </Typography>
                  <Typography
                    variant='h4'
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      letterSpacing: '-0.5px'
                    }}
                  >
                    {formatCurrency(totalBalance)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<i className='tabler-trending-up' style={{ color: 'white', fontSize: '1rem' }} />}
                label={`${stats.storageBalances.length} Jenis Simpanan`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Box>

            {/* Storage Items */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.875rem' }}>
                Rincian Saldo (klik untuk detail)
              </Typography>
              {totalGoldWeight > 0 && goldPrice > 0 && (
                <Chip
                  icon={<i className='tabler-diamond' style={{ color: '#FFD700', fontSize: '0.9rem' }} />}
                  label={`${totalGoldWeight}g @${formatCurrency(goldPrice)}/g`}
                  size='small'
                  sx={{
                    bgcolor: 'rgba(255,215,0,0.2)',
                    color: '#FFD700',
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>
            <Grid container spacing={2}>
              {stats.storageBalances.length > 0 ? (
                stats.storageBalances.map((storage, index) => {
                  const displayValue =
                    storage.isGold && storage.goldWeight ? storage.goldWeight * goldPrice : storage.balance || 0

                  return (
                    <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
                      <Box
                        onClick={() => {
                          setSelectedStorage(storage)
                          setOpenStorageDialog(true)
                        }}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: storage.isGold ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: storage.isGold ? '1px solid rgba(255,215,0,0.3)' : 'none',
                          '&:hover': {
                            bgcolor: storage.isGold ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.25)',
                            transform: 'translateY(-2px)'
                          },
                          '&:active': {
                            transform: 'translateY(0)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              bgcolor: storage.isGold ? '#FFD700' : storage.color || 'rgba(255,255,255,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {storage.icon ? (
                              <i
                                className={storage.icon}
                                style={{ color: storage.isGold ? '#000' : 'white', fontSize: '1.1rem' }}
                              />
                            ) : (
                              <i className='tabler-wallet' style={{ color: 'white', fontSize: '1.1rem' }} />
                            )}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {storage.name}
                            </Typography>
                            {storage.isGold && storage.goldWeight && (
                              <Typography
                                sx={{
                                  color: '#FFD700',
                                  fontSize: '0.65rem',
                                  fontWeight: 500
                                }}
                              >
                                {storage.goldWeight} gram
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: { xs: '0.95rem', sm: '1.1rem' },
                            fontWeight: 700,
                            color: storage.isGold ? '#FFD700' : 'white'
                          }}
                        >
                          {formatCurrency(displayValue)}
                        </Typography>
                      </Box>
                    </Grid>
                  )
                })
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      textAlign: 'center'
                    }}
                  >
                    <i className='tabler-wallet-off text-3xl' style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                      Belum ada jenis simpanan. Tambahkan di menu Jenis Simpan.
                    </Typography>
                  </Box>
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
      <Tooltip title='Tambah Transaksi' placement='left'>
        <Fab
          color='error'
          size='small'
          aria-label='tambah transaksi'
          onClick={() => setOpenAddDialog(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 5, sm: 28 },
            right: { xs: 40, sm: 75 },
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
      <AddTransactionDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} onSuccess={fetchStats} />

      {/* Storage Transactions Dialog */}
      <StorageTransactionsDialog
        open={openStorageDialog}
        onClose={() => {
          setOpenStorageDialog(false)
          setSelectedStorage(null)
        }}
        storage={selectedStorage}
      />
    </Grid>
  )
}

export default TabunganDashboard
