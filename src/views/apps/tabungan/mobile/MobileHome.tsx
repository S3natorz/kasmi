'use client'

// React Imports
import { useState, useMemo } from 'react'

// Next Imports
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Component Imports
import TopBar from './TopBar'
import BalanceHero from './home/BalanceHero'
import QuickActions from './home/QuickActions'
import StatsTabs from './home/StatsTabs'
import StorageCarousel from './home/StorageCarousel'
import SavingsGoals from './home/SavingsGoals'
import RecentActivity from './home/RecentActivity'
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog'
import EditTransactionDialog from '@/components/dialogs/EditTransactionDialog'
import TransactionsByTypeDialog from '@/components/dialogs/TransactionsByTypeDialog'
import StorageTransactionsDialog from '@/components/dialogs/StorageTransactionsDialog'
import { MobileHomeSkeleton } from './MobileSkeletons'

// Hooks
import { useTabunganData, invalidateTabuganKeys } from '@/hooks/useTabunganData'

// Utils
import {
  formatWibDate,
  getWibDayOfWeek,
  wibDateAtNoon,
  wibDateKey,
  wibMonthRange,
  wibThisMonth,
  wibToday
} from '@/libs/wib'

// Types
import type { StorageTypeType, TransactionType } from '@/types/apps/tabunganTypes'
import type { TransactionFilterType } from '@/components/dialogs/TransactionsByTypeDialog'

type FilterType = 'daily' | 'weekly' | 'monthly' | 'custom'
type QuickType = 'income' | 'expense' | 'savings' | 'transfer'

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
  recentTransactions: TransactionType[]
  transactionCount: number
}

// Date math lives in WIB so the stats filter agrees with what the API
// interprets — otherwise a browser outside WIB silently shifts "today"
// by a day against the server's window.
const getDateRange = (filterType: FilterType, selectedMonth: string) => {
  const today = wibToday()

  if (filterType === 'monthly') {
    return wibMonthRange(selectedMonth)
  }

  if (filterType === 'weekly') {
    const anchor = wibDateAtNoon(today)
    const dayOfWeek = getWibDayOfWeek(anchor)
    const startOfWeek = new Date(anchor.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)

    return { startDate: wibDateKey(startOfWeek), endDate: wibDateKey(endOfWeek) }
  }

  return { startDate: today, endDate: today }
}

const MobileHome = () => {
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'en'

  // Period filter
  const [filterType, setFilterType] = useState<FilterType>('monthly')

  const [selectedMonth, setSelectedMonth] = useState(() => wibThisMonth())

  // Hide balance toggle
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideBalances') === 'true'
    }

    return false
  })

  const toggleHideBalance = () => {
    setHideBalance(prev => {
      const next = !prev

      localStorage.setItem('hideBalances', String(next))

      return next
    })
  }

  // Dialog states
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickType, setQuickType] = useState<QuickType | undefined>(undefined)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [selectedFilterType, setSelectedFilterType] = useState<TransactionFilterType>('all')
  const [selectedDialogTitle, setSelectedDialogTitle] = useState('')
  const [selectedDialogAmount, setSelectedDialogAmount] = useState(0)
  const [storageDialogOpen, setStorageDialogOpen] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState<StorageTypeType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null)

  // Period picker menu
  const [periodMenuAnchor, setPeriodMenuAnchor] = useState<null | HTMLElement>(null)

  const dateRange = useMemo(() => getDateRange(filterType, selectedMonth), [filterType, selectedMonth])

  const statsUrl = `/api/apps/tabungan/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`

  const { data: statsPayload, isLoading: statsLoading, mutate: mutateStats } = useTabunganData<{
    totalIncome?: number
    totalExpenses?: number
    totalSavings?: number
    savingsByCategory?: StatsData['savingsByCategory']
    expensesByCategory?: StatsData['expensesByCategory']
    recentTransactions?: TransactionType[]
    transactionCount?: number
  }>(statsUrl)

  const { data: storagesPayload, isLoading: storagesLoading, mutate: mutateStorages } = useTabunganData<StorageTypeType[]>(
    '/api/apps/tabungan/storage-types'
  )

  const { data: goldPayload, mutate: mutateGold } = useTabunganData<{ pricePerGram?: number }>(
    '/api/apps/tabungan/gold-price',
    { staleTime: 5 * 60_000 }
  )

  const goldPrice = goldPayload?.pricePerGram || 0

  const stats = useMemo<StatsData | null>(() => {
    if (!statsPayload && !storagesPayload) return null

    return {
      totalIncome: statsPayload?.totalIncome || 0,
      totalExpenses: statsPayload?.totalExpenses || 0,
      totalSavings: statsPayload?.totalSavings || 0,
      storageBalances: Array.isArray(storagesPayload) ? storagesPayload : [],
      savingsByCategory: statsPayload?.savingsByCategory || [],
      expensesByCategory: statsPayload?.expensesByCategory || [],
      recentTransactions: statsPayload?.recentTransactions || [],
      transactionCount: statsPayload?.transactionCount || 0
    }
  }, [statsPayload, storagesPayload])

  const loading = (statsLoading || storagesLoading) && !stats

  const refetchAll = () => {
    mutateStats().catch(() => {})
    mutateStorages().catch(() => {})
    mutateGold().catch(() => {})
    invalidateTabuganKeys(['/api/apps/tabungan/transactions'])
  }

  // Compute total balance
  const totalBalance = useMemo(() => {
    if (!stats) return 0

    return stats.storageBalances.reduce((sum, s) => {
      if (s.isGold && s.goldWeight) return sum + s.goldWeight * goldPrice

      return sum + (s.balance || 0)
    }, 0)
  }, [stats, goldPrice])

  // Period label
  const periodLabel = useMemo(() => {
    if (filterType === 'monthly') {
      const [y, m] = selectedMonth.split('-')
      // Anchor at noon UTC on day 15 → safely inside the intended month for WIB formatting.
      const anchor = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 15, 5, 0, 0))

      return formatWibDate(anchor, { month: 'long', year: 'numeric' })
    }

    if (filterType === 'weekly') return 'Minggu Ini'
    if (filterType === 'daily') return 'Hari Ini'

    return 'Periode Ini'
  }, [filterType, selectedMonth])

  // Handlers
  const handleQuickAction = (type: string) => {
    setQuickType(type as QuickType)
    setQuickAddOpen(true)
  }

  const handleStatClick = (key: string, label: string, amount: number) => {
    setSelectedFilterType(key as TransactionFilterType)
    setSelectedDialogTitle(label)
    setSelectedDialogAmount(amount)
    setTypeDialogOpen(true)
  }

  const handleStorageClick = (storage: StorageTypeType) => {
    setSelectedStorage(storage)
    setStorageDialogOpen(true)
  }

  const handleTransactionClick = (tx: TransactionType) => {
    setSelectedTransaction(tx)
    setEditDialogOpen(true)
  }

  const getMonthOptions = () => {
    const options = []
    const [yearStr, monthStr] = wibThisMonth().split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)

    for (let i = 0; i < 12; i++) {
      const anchor = new Date(Date.UTC(year, month - 1 - i, 15, 5, 0, 0))
      const value = formatWibDate(anchor, { year: 'numeric', month: '2-digit' }, 'sv-SE')
      const label = formatWibDate(anchor, { month: 'long', year: 'numeric' })

      options.push({ value, label })
    }

    return options
  }

  return (
    <>
      <TopBar
        title='Kasmi'
        subtitle={periodLabel}
        rightAction={
          <>
            <IconButton size='small' onClick={e => setPeriodMenuAnchor(e.currentTarget)}>
              <i className='tabler-calendar-event' style={{ fontSize: 22 }} />
            </IconButton>
            <IconButton size='small' onClick={refetchAll}>
              <i className='tabler-refresh' style={{ fontSize: 22 }} />
            </IconButton>
          </>
        }
      />

      <Menu
        anchorEl={periodMenuAnchor}
        open={Boolean(periodMenuAnchor)}
        onClose={() => setPeriodMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '14px', mt: 1, minWidth: 220 } }}
      >
        <MenuItem
          onClick={() => {
            setFilterType('daily')
            setPeriodMenuAnchor(null)
          }}
          selected={filterType === 'daily'}
        >
          <ListItemIcon>
            <i className='tabler-calendar-today' style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary='Hari Ini' />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFilterType('weekly')
            setPeriodMenuAnchor(null)
          }}
          selected={filterType === 'weekly'}
        >
          <ListItemIcon>
            <i className='tabler-calendar-week' style={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary='Minggu Ini' />
        </MenuItem>
        <Divider />
        <Typography
          variant='caption'
          sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 600, display: 'block' }}
        >
          Pilih Bulan
        </Typography>
        {getMonthOptions().map(opt => (
          <MenuItem
            key={opt.value}
            onClick={() => {
              setFilterType('monthly')
              setSelectedMonth(opt.value)
              setPeriodMenuAnchor(null)
            }}
            selected={filterType === 'monthly' && selectedMonth === opt.value}
          >
            <ListItemText primary={opt.label} />
          </MenuItem>
        ))}
      </Menu>

      {loading || !stats ? (
        <MobileHomeSkeleton />
      ) : (
        <Box>
          <BalanceHero
            totalBalance={totalBalance}
            totalIncome={stats.totalIncome}
            totalExpenses={stats.totalExpenses}
            periodLabel={periodLabel}
            hideBalance={hideBalance}
            onToggleHide={toggleHideBalance}
          />

          <QuickActions onActionClick={handleQuickAction} />

          <StatsTabs
            totalIncome={stats.totalIncome}
            totalExpenses={stats.totalExpenses}
            totalSavings={stats.totalSavings}
            transactionCount={stats.transactionCount}
            hideBalance={hideBalance}
            onCardClick={handleStatClick}
          />

          <StorageCarousel
            storages={stats.storageBalances}
            goldPrice={goldPrice}
            hideBalance={hideBalance}
            onStorageClick={handleStorageClick}
          />

          <SavingsGoals savings={stats.savingsByCategory} hideBalance={hideBalance} />

          <RecentActivity
            transactions={stats.recentTransactions}
            hideBalance={hideBalance}
            onTransactionClick={handleTransactionClick}
            onSeeAllClick={() => router.push(`/${lang}/apps/tabungan/transactions`)}
          />

          <Box sx={{ height: 20 }} />
        </Box>
      )}

      {/* Quick-action transaction dialog (pre-selected type) */}
      <AddTransactionDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          setQuickAddOpen(false)
          refetchAll()
        }}
        initialVoiceData={quickType ? { type: quickType } : null}
      />

      {/* Stat card dialog */}
      <TransactionsByTypeDialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        filterType={selectedFilterType}
        title={selectedDialogTitle}
        totalAmount={selectedDialogAmount}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        totalCount={stats?.transactionCount}
      />

      {/* Storage dialog */}
      <StorageTransactionsDialog
        open={storageDialogOpen}
        onClose={() => setStorageDialogOpen(false)}
        storage={selectedStorage}
      />

      {/* Edit transaction */}
      <EditTransactionDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        transaction={selectedTransaction}
        onSuccess={() => {
          setEditDialogOpen(false)
          refetchAll()
        }}
      />
    </>
  )
}

export default MobileHome
