'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { TransactionType } from '@/types/apps/tabunganTypes'

export type TransactionFilterType = 'income' | 'expense' | 'savings' | 'all'

type Props = {
  open: boolean
  onClose: () => void
  filterType: TransactionFilterType
  startDate: string
  endDate: string
  title: string
  totalAmount: number
  totalCount?: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const typeConfig: Record<string, { label: string; color: ThemeColor; icon: string }> = {
  income: { label: 'Pemasukan', color: 'success', icon: 'tabler-arrow-up' },
  expense: { label: 'Pengeluaran', color: 'error', icon: 'tabler-arrow-down' },
  savings: { label: 'Tabungan', color: 'info', icon: 'tabler-coin' },
  transfer: { label: 'Transfer', color: 'warning', icon: 'tabler-transfer' }
}

const TransactionsByTypeDialog = ({
  open,
  onClose,
  filterType,
  startDate,
  endDate,
  title,
  totalAmount,
  totalCount
}: Props) => {
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (open) {
      fetchTransactions()
    }
  }, [open, filterType, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      let url = `/api/apps/tabungan/transactions?startDate=${startDate}&endDate=${endDate}`

      if (filterType !== 'all') {
        url += `&type=${filterType}`
      }

      const res = await fetch(url)
      const data = await res.json()

      setTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTransactions([])
    onClose()
  }

  const getTypeConfig = () => {
    if (filterType === 'all') {
      return { label: 'Semua', color: 'primary' as ThemeColor, icon: 'tabler-receipt' }
    }

    return typeConfig[filterType] || { label: filterType, color: 'primary' as ThemeColor, icon: 'tabler-receipt' }
  }

  const config = getTypeConfig()

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CustomAvatar color={config.color} variant='rounded' size={48} skin='light'>
              <i className={`${config.icon} text-xl`} />
            </CustomAvatar>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} -{' '}
                {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Summary */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Total {config.label}
            </Typography>
            <Typography variant='h5' sx={{ fontWeight: 700 }} color={`${config.color}.main`}>
              {filterType === 'all' ? (totalCount ?? transactions.length) : formatCurrency(totalAmount)}
            </Typography>
          </Box>
          <Chip
            label={`${transactions.length} Transaksi`}
            color={config.color}
            size='small'
            variant='tonal'
            icon={<i className='tabler-list' style={{ fontSize: '0.9rem' }} />}
          />
        </Box>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length > 0 ? (
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {transactions.map((transaction, index) => {
              const txConfig = typeConfig[transaction.type] || typeConfig.income

              return (
                <Box key={transaction.id || index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      px: 3,
                      py: 2,
                      '&:hover': {
                        bgcolor: theme =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', flex: 1 }}>
                      <CustomAvatar color={txConfig.color} variant='rounded' size={40} skin='light'>
                        <i className={txConfig.icon} />
                      </CustomAvatar>
                      <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {transaction.description || txConfig.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant='caption' color='text.secondary'>
                            {new Date(transaction.date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                          {transaction.familyMember && (
                            <>
                              <Typography variant='caption' color='text.secondary'>
                                •
                              </Typography>
                              <Chip
                                label={transaction.familyMember.name}
                                size='small'
                                variant='outlined'
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </>
                          )}
                        </Box>
                        {/* Show category if available */}
                        {(transaction.savingsCategory || transaction.expenseCategory) && (
                          <Chip
                            label={transaction.savingsCategory?.name || transaction.expenseCategory?.name}
                            size='small'
                            sx={{
                              mt: 0.5,
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor:
                                transaction.savingsCategory?.color ||
                                transaction.expenseCategory?.color ||
                                'primary.main',
                              color: 'white'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography
                      variant='body1'
                      sx={{
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: `${txConfig.color}.main`
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                  {index < transactions.length - 1 && <Divider />}
                </Box>
              )
            })}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CustomAvatar color='secondary' variant='rounded' size={64} skin='light' sx={{ mb: 2 }}>
              <i className='tabler-receipt-off text-3xl' />
            </CustomAvatar>
            <Typography variant='h6' color='text.secondary'>
              Tidak ada transaksi
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Belum ada transaksi {config.label.toLowerCase()} pada periode ini
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TransactionsByTypeDialog
