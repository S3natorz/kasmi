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
import LinearProgress from '@mui/material/LinearProgress'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { TransactionType } from '@/types/apps/tabunganTypes'

type ExpenseCategory = {
  category: string
  amount: number
  budget?: number
  color?: string
  icon?: string
  id?: string
}

type Props = {
  open: boolean
  onClose: () => void
  category: ExpenseCategory | null
  startDate: string
  endDate: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Helper function untuk warna berdasarkan progress
const getProgressColor = (progress: number): 'success' | 'warning' | 'error' => {
  if (progress < 50) return 'success'
  if (progress < 100) return 'warning'
  return 'error'
}

const getProgressColorHex = (progress: number): string => {
  if (progress < 50) return '#72E128' // green
  if (progress < 100) return '#FDB528' // orange/warning
  return '#FF4D49' // red/error
}

const ExpenseCategoryTransactionsDialog = ({ open, onClose, category, startDate, endDate }: Props) => {
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (open && category) {
      fetchTransactions()
    }
  }, [open, category, startDate, endDate])

  const fetchTransactions = async () => {
    if (!category) return

    try {
      setLoading(true)

      // Fetch transactions filtered by expense category
      const url = `/api/apps/tabungan/transactions?type=expense&startDate=${startDate}&endDate=${endDate}`
      const res = await fetch(url)
      const data = await res.json()

      // Filter by category name (since we don't have categoryId directly)
      const filtered = Array.isArray(data)
        ? data.filter((t: TransactionType) => t.expenseCategory?.name === category.category)
        : []

      setTransactions(filtered)
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

  if (!category) return null

  const progress = category.budget ? Math.min((category.amount / category.budget) * 100, 100) : 0
  const isOverBudget = category.budget && category.amount > category.budget
  const progressColor = getProgressColor(progress)
  const progressColorHex = getProgressColorHex(progress)

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
            <CustomAvatar
              color={progressColor}
              variant='rounded'
              size={48}
              skin='light'
              sx={{ bgcolor: category.color || undefined }}
            >
              <i className={category.icon || 'tabler-category'} style={{ fontSize: '1.25rem' }} />
            </CustomAvatar>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {category.category}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Pengeluaran Kategori
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size='small'>
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Budget Progress Summary */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Penggunaan Budget
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOverBudget && (
              <Chip
                label='Melebihi Budget!'
                color='error'
                size='small'
                icon={<i className='tabler-alert-triangle' style={{ fontSize: '0.9rem' }} />}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
          <Typography variant='h5' sx={{ fontWeight: 700, color: progressColorHex }}>
            {formatCurrency(category.amount)}
          </Typography>
          {category.budget && (
            <Typography variant='body2' color='text.secondary'>
              / {formatCurrency(category.budget)}
            </Typography>
          )}
        </Box>

        {category.budget && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress
              variant='determinate'
              value={Math.min(progress, 100)}
              color={progressColor}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>
                {progress.toFixed(1)}% terpakai
              </Typography>
              {category.budget > category.amount && (
                <Typography variant='caption' color='success.main'>
                  Sisa: {formatCurrency(category.budget - category.amount)}
                </Typography>
              )}
              {isOverBudget && (
                <Typography variant='caption' color='error.main'>
                  Lebih: {formatCurrency(category.amount - category.budget)}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Chip
          label={`${transactions.length} Transaksi`}
          color={progressColor}
          size='small'
          variant='tonal'
          icon={<i className='tabler-list' style={{ fontSize: '0.9rem' }} />}
        />
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length > 0 ? (
          <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {transactions.map((transaction, index) => (
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
                      bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)')
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', flex: 1 }}>
                    <CustomAvatar color='error' variant='rounded' size={40} skin='light'>
                      <i className='tabler-arrow-down' />
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
                        {transaction.description || 'Pengeluaran'}
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
                    </Box>
                  </Box>
                  <Typography
                    variant='body1'
                    sx={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      color: 'error.main'
                    }}
                  >
                    -{formatCurrency(transaction.amount)}
                  </Typography>
                </Box>
                {index < transactions.length - 1 && <Divider />}
              </Box>
            ))}
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
              Belum ada pengeluaran untuk kategori ini pada periode ini
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ExpenseCategoryTransactionsDialog
