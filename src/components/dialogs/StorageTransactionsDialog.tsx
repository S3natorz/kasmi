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
import type { StorageTypeType, TransactionType } from '@/types/apps/tabunganTypes'

type Props = {
  open: boolean
  onClose: () => void
  storage: StorageTypeType | null
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const typeConfig: Record<string, { label: string; color: 'success' | 'error' | 'info' | 'warning'; icon: string }> = {
  income: { label: 'Pemasukan', color: 'success', icon: 'tabler-arrow-up' },
  expense: { label: 'Pengeluaran', color: 'error', icon: 'tabler-arrow-down' },
  savings: { label: 'Tabungan', color: 'info', icon: 'tabler-coin' },
  transfer: { label: 'Transfer', color: 'warning', icon: 'tabler-transfer' }
}

const StorageTransactionsDialog = ({ open, onClose, storage }: Props) => {
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (open && storage) {
      fetchTransactions()
    }
  }, [open, storage])

  const fetchTransactions = async () => {
    if (!storage) return

    try {
      setLoading(true)
      const res = await fetch(`/api/apps/tabungan/transactions?storageTypeId=${storage.id}`)
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

  if (!storage) return null

  // Calculate stats for this storage
  const totalIn = transactions
    .filter(t => t.type === 'income' || (t.type === 'transfer' && t.toStorageTypeId === storage.id))
    .reduce((sum, t) => sum + t.amount, 0)

  const totalOut = transactions
    .filter(t => t.type === 'expense' || t.type === 'savings' || (t.type === 'transfer' && t.fromStorageTypeId === storage.id))
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          maxHeight: fullScreen ? '100%' : '85vh'
        }
      }}
    >
      {/* Header with gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${storage.color || '#667eea'} 0%, ${storage.color ? `${storage.color}dd` : '#764ba2'} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)'
          }
        }}
      >
        <DialogTitle sx={{ position: 'relative', zIndex: 1, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {storage.icon ? (
                  <i className={storage.icon} style={{ color: 'white', fontSize: '1.5rem' }} />
                ) : (
                  <i className='tabler-wallet' style={{ color: 'white', fontSize: '1.5rem' }} />
                )}
              </Box>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 600, color: 'white' }}>
                  {storage.name}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                  Riwayat Transaksi
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Balance & Stats */}
        <Box sx={{ px: 3, pb: 3, position: 'relative', zIndex: 1 }}>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 700,
              color: 'white',
              mt: 2,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {formatCurrency(storage.balance || 0)}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', mb: 2 }}>
            Saldo Saat Ini
          </Typography>

          {/* Mini Stats */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Masuk</Typography>
              <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {formatCurrency(totalIn)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Keluar</Typography>
              <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {formatCurrency(totalOut)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Transaksi</Typography>
              <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {transactions.length}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <i className='tabler-receipt-off text-5xl' style={{ color: '#ccc' }} />
            <Typography color='text.secondary' sx={{ mt: 2 }}>
              Belum ada transaksi untuk simpanan ini
            </Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            {transactions.map((transaction, index) => {
              const config = typeConfig[transaction.type] || typeConfig.income
              const isIncoming =
                transaction.type === 'income' ||
                (transaction.type === 'transfer' && transaction.toStorageTypeId === storage.id)

              return (
                <Box key={transaction.id || index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 2,
                      px: 1
                    }}
                  >
                    <CustomAvatar
                      color={config.color}
                      variant='rounded'
                      size={44}
                      skin='light'
                    >
                      <i className={config.icon} />
                    </CustomAvatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {transaction.description || config.label}
                        </Typography>
                        <Chip
                          label={config.label}
                          size='small'
                          color={config.color}
                          variant='tonal'
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.8rem', mt: 0.5 }}
                      >
                        {new Date(transaction.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {transaction.familyMember && ` • ${transaction.familyMember.name}`}
                      </Typography>
                      {transaction.type === 'transfer' && (
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5
                          }}
                        >
                          {transaction.fromStorageTypeId === storage.id ? (
                            <>
                              <i className='tabler-arrow-right text-sm' />
                              Ke: {transaction.toStorageType?.name || 'Lainnya'}
                            </>
                          ) : (
                            <>
                              <i className='tabler-arrow-left text-sm' />
                              Dari: {transaction.fromStorageType?.name || 'Lainnya'}
                            </>
                          )}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      variant='body1'
                      sx={{
                        fontWeight: 600,
                        color: isIncoming ? 'success.main' : 'error.main',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isIncoming ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                  {index < transactions.length - 1 && <Divider />}
                </Box>
              )
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StorageTransactionsDialog
