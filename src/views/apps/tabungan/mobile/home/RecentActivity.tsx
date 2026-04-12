'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'

// Type Imports
import type { TransactionType } from '@/types/apps/tabunganTypes'

// Utils
import { formatWibDate, isWibToday, isWibYesterday } from '@/libs/wib'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date: Date | string) => {
  if (isWibToday(date)) return 'Hari ini'
  if (isWibYesterday(date)) return 'Kemarin'

  return formatWibDate(date, { day: 'numeric', month: 'short' })
}

type FilterType = 'all' | 'income' | 'expense' | 'savings' | 'transfer'

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'income', label: 'Masuk' },
  { key: 'expense', label: 'Keluar' },
  { key: 'savings', label: 'Tabungan' },
  { key: 'transfer', label: 'Transfer' }
]

const typeConfig = {
  income: { icon: 'tabler-arrow-down-left', color: '#28C76F', bg: 'rgba(40, 199, 111, 0.12)', sign: '+' },
  gold_income: { icon: 'tabler-coin', color: '#FFB300', bg: 'rgba(255, 179, 0, 0.12)', sign: '+' },
  expense: { icon: 'tabler-arrow-up-right', color: '#FF4C51', bg: 'rgba(255, 76, 81, 0.12)', sign: '-' },
  savings: { icon: 'tabler-coin', color: '#00BAD1', bg: 'rgba(0, 186, 209, 0.12)', sign: '↗' },
  transfer: { icon: 'tabler-transfer', color: '#FF9F43', bg: 'rgba(255, 159, 67, 0.12)', sign: '↔' }
}

type Props = {
  transactions: TransactionType[]
  hideBalance: boolean
  onTransactionClick?: (tx: TransactionType) => void
  onSeeAllClick?: () => void
}

const RecentActivity = ({ transactions, hideBalance, onTransactionClick, onSeeAllClick }: Props) => {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    if (filter === 'income') return transactions.filter(t => t.type === 'income' || t.type === 'gold_income')
    return transactions.filter(t => t.type === filter)
  }, [transactions, filter])

  const maskValue = (value: string) => (hideBalance ? '••••••' : value)

  return (
    <Box sx={{ pt: 3 }}>
      <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Transaksi Terbaru
        </Typography>
        <ButtonBase onClick={onSeeAllClick} sx={{ borderRadius: 1, px: 1 }}>
          <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}>
            Lihat Semua
            <i className='tabler-chevron-right' style={{ fontSize: 14, verticalAlign: 'middle', marginLeft: 2 }} />
          </Typography>
        </ButtonBase>
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
            onClick={() => setFilter(f.key)}
            size='small'
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 30,
              borderRadius: '15px',
              backgroundColor: filter === f.key ? 'primary.main' : 'action.hover',
              color: filter === f.key ? '#fff' : 'text.primary',
              border: 'none',
              '&:hover': {
                backgroundColor: filter === f.key ? 'primary.dark' : 'action.selected'
              }
            }}
          />
        ))}
      </Box>

      {/* Transaction list */}
      <Box sx={{ px: 2 }}>
        {filtered.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary'
            }}
          >
            <i className='tabler-inbox' style={{ fontSize: 48, opacity: 0.4 }} />
            <Typography variant='body2' sx={{ mt: 1, fontSize: '0.85rem' }}>
              Tidak ada transaksi
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {filtered.slice(0, 10).map(tx => {
              const cfg = typeConfig[tx.type] || typeConfig.expense
              const storageName = tx.toStorageType?.name || tx.fromStorageType?.name
              const storageColor = tx.toStorageType?.color || tx.fromStorageType?.color

              return (
                <ButtonBase
                  key={tx.id}
                  onClick={() => onTransactionClick?.(tx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.25,
                    px: 1.5,
                    borderRadius: '14px',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
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
                      {tx.description || tx.expenseCategory?.name || tx.savingsCategory?.name || '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                      <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {formatDate(tx.date)}
                      </Typography>
                      {storageName && (
                        <>
                          <Box
                            sx={{
                              width: 3,
                              height: 3,
                              borderRadius: '50%',
                              backgroundColor: 'text.disabled'
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
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
                    {maskValue(formatCurrency(tx.amount))}
                  </Typography>
                </ButtonBase>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default RecentActivity
