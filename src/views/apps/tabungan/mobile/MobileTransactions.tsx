'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'

// Component Imports
import EditTransactionDialog from '@/components/dialogs/EditTransactionDialog'
import { TransactionRowSkeleton } from './MobileSkeletons'
import Skeleton from '@mui/material/Skeleton'

// Types
import type { TransactionType } from '@/types/apps/tabunganTypes'

type FilterType = 'all' | 'income' | 'expense' | 'savings' | 'transfer'

const filters: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua', icon: 'tabler-list' },
  { key: 'income', label: 'Masuk', icon: 'tabler-arrow-down-left' },
  { key: 'expense', label: 'Keluar', icon: 'tabler-arrow-up-right' },
  { key: 'savings', label: 'Tabungan', icon: 'tabler-pig-money' },
  { key: 'transfer', label: 'Transfer', icon: 'tabler-transfer' }
]

const typeConfig: Record<string, { icon: string; color: string; bg: string; sign: string }> = {
  income: { icon: 'tabler-arrow-down-left', color: '#28C76F', bg: 'rgba(40, 199, 111, 0.12)', sign: '+' },
  gold_income: { icon: 'tabler-coin', color: '#FFB300', bg: 'rgba(255, 179, 0, 0.12)', sign: '+' },
  expense: { icon: 'tabler-arrow-up-right', color: '#FF4C51', bg: 'rgba(255, 76, 81, 0.12)', sign: '-' },
  savings: { icon: 'tabler-pig-money', color: '#00BAD1', bg: 'rgba(0, 186, 209, 0.12)', sign: '↗' },
  transfer: { icon: 'tabler-transfer', color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.12)', sign: '↔' }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const groupByDate = (txs: TransactionType[]) => {
  const groups: Record<string, TransactionType[]> = {}
  txs.forEach(tx => {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  })

  return groups
}

const formatGroupHeader = (key: string) => {
  const d = new Date(key)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hari Ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'

  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const MobileTransactions = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [data, setData] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideBalances') === 'true'
    }

    return false
  })

  const [editOpen, setEditOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<TransactionType | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/apps/tabungan/transactions')
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    let list = data
    if (filter !== 'all') {
      list =
        filter === 'income'
          ? list.filter(t => t.type === 'income' || t.type === 'gold_income')
          : list.filter(t => t.type === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        t =>
          t.description?.toLowerCase().includes(q) ||
          t.expenseCategory?.name?.toLowerCase().includes(q) ||
          t.savingsCategory?.name?.toLowerCase().includes(q) ||
          t.familyMember?.name?.toLowerCase().includes(q) ||
          t.fromStorageType?.name?.toLowerCase().includes(q) ||
          t.toStorageType?.name?.toLowerCase().includes(q)
      )
    }

    return list
  }, [data, filter, search])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, t) => {
      if (t.type === 'income' || t.type === 'gold_income') return sum + t.amount
      if (t.type === 'expense') return sum - t.amount

      return sum
    }, 0)
  }, [filtered])

  const mask = (v: string) => (hideBalance ? '••••••' : v)

  return (
    <Box>
      {/* Search + summary header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderRadius: '14px',
            px: 1.5,
            py: 0.5
          }}
        >
          <i className='tabler-search' style={{ fontSize: 18, color: isDark ? '#aaa' : '#666' }} />
          <InputBase
            placeholder='Cari transaksi...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '0.9rem' }}
          />
          {search && (
            <IconButton size='small' onClick={() => setSearch('')}>
              <i className='tabler-x' style={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Summary */}
        <Box
          sx={{
            mt: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 0.5
          }}
        >
          <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {filtered.length} transaksi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant='caption' sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
              Net:
            </Typography>
            <Typography
              variant='caption'
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: totalAmount >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {totalAmount >= 0 ? '+' : ''}
              {mask(formatCurrency(totalAmount))}
            </Typography>
            <IconButton size='small' onClick={() => setHideBalance(!hideBalance)}>
              <i className={hideBalance ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Filter chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          px: 2,
          pb: 1.5,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {filters.map(f => (
          <Chip
            key={f.key}
            label={f.label}
            icon={<i className={f.icon} style={{ fontSize: 14, marginLeft: 6 }} />}
            onClick={() => setFilter(f.key)}
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 34,
              borderRadius: '17px',
              backgroundColor: filter === f.key ? 'primary.main' : isDark ? 'rgba(255,255,255,0.06)' : 'action.hover',
              color: filter === f.key ? '#fff' : 'text.primary',
              '& .MuiChip-icon': {
                color: filter === f.key ? '#fff' : 'text.secondary'
              },
              '&:hover': {
                backgroundColor: filter === f.key ? 'primary.dark' : 'action.selected'
              }
            }}
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ px: 2 }}>
          {[1, 2].map(group => (
            <Box key={group} sx={{ mb: 2 }}>
              <Skeleton variant='text' width={130} height={16} sx={{ mb: 1 }} />
              <Box
                sx={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                {[1, 2, 3].map((r, idx, arr) => (
                  <TransactionRowSkeleton key={r} isLast={idx === arr.length - 1} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <i className='tabler-inbox' style={{ fontSize: 64, opacity: 0.3 }} />
          <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>Tidak ada transaksi</Typography>
          <Typography variant='caption' sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
            Tap tombol + untuk menambah
          </Typography>
        </Box>
      ) : (
        <Box sx={{ px: 2 }}>
          {Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a))
            .map(dateKey => (
              <Box key={dateKey} sx={{ mb: 2 }}>
                <Typography
                  variant='caption'
                  sx={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    mb: 1,
                    pl: 0.5
                  }}
                >
                  {formatGroupHeader(dateKey)}
                </Typography>
                <Box
                  sx={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  {grouped[dateKey].map((tx, idx) => {
                    const cfg = typeConfig[tx.type] || typeConfig.expense
                    const storageName = tx.toStorageType?.name || tx.fromStorageType?.name
                    const storageColor = tx.toStorageType?.color || tx.fromStorageType?.color
                    const memberName = tx.familyMember?.name

                    return (
                      <ButtonBase
                        key={tx.id}
                        onClick={() => {
                          setSelectedTx(tx)
                          setEditOpen(true)
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          width: '100%',
                          py: 1.5,
                          px: 1.5,
                          textAlign: 'left',
                          borderBottom: idx === grouped[dateKey].length - 1 ? 'none' : 1,
                          borderColor: 'divider',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '12px',
                            backgroundColor: cfg.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <i className={cfg.icon} style={{ fontSize: 20, color: cfg.color }} />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.3
                            }}
                          >
                            {tx.description ||
                              tx.expenseCategory?.name ||
                              tx.savingsCategory?.name ||
                              '—'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            {storageName && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, minWidth: 0 }}>
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: storageColor || '#7367F0',
                                    flexShrink: 0
                                  }}
                                />
                                <Typography
                                  variant='caption'
                                  sx={{
                                    fontSize: '0.7rem',
                                    color: 'text.secondary',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {storageName}
                                </Typography>
                              </Box>
                            )}
                            {memberName && (
                              <>
                                <Box
                                  sx={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'text.disabled' }}
                                />
                                <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                  {memberName}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>

                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: cfg.color,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cfg.sign}
                          {mask(formatCurrency(tx.amount))}
                        </Typography>
                      </ButtonBase>
                    )
                  })}
                </Box>
              </Box>
            ))}
          <Box sx={{ height: 20 }} />
        </Box>
      )}

      <EditTransactionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        transaction={selectedTx}
        onSuccess={() => {
          setEditOpen(false)
          fetchData()
        }}
      />
    </Box>
  )
}

export default MobileTransactions
