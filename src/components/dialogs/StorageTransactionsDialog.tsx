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
  const [goldPrice, setGoldPrice] = useState<number>(0)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (open && storage) {
      fetchTransactions()
      if (storage.isGold) {
        fetchGoldPrice()
      }
    }
  }, [open, storage])

  const fetchGoldPrice = async () => {
    try {
      const res = await fetch('/api/apps/tabungan/gold-price')
      const data = await res.json()
      setGoldPrice(data.pricePerGram || 0)
    } catch (error) {
      console.error('Failed to fetch gold price:', error)
    }
  }

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
    setGoldPrice(0)
    onClose()
  }

  if (!storage) return null

  // Calculate display value (gold or regular)
  const displayValue =
    storage.isGold && storage.goldWeight && goldPrice > 0 ? storage.goldWeight * goldPrice : storage.balance || 0

  // Calculate stats for this storage
  const totalIn = transactions
    .filter(t => t.type === 'income' || (t.type === 'transfer' && t.toStorageTypeId === storage.id))
    .reduce((sum, t) => sum + t.amount, 0)

  const totalOut = transactions
    .filter(
      t => t.type === 'expense' || t.type === 'savings' || (t.type === 'transfer' && t.fromStorageTypeId === storage.id)
    )
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
          background: storage.isGold
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
            : `linear-gradient(135deg, ${storage.color || '#667eea'} 0%, ${storage.color ? `${storage.color}dd` : '#764ba2'} 100%)`,
          color: storage.isGold ? '#000' : 'white',
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
                  bgcolor: storage.isGold ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {storage.icon ? (
                  <i
                    className={storage.icon}
                    style={{ color: storage.isGold ? '#000' : 'white', fontSize: '1.5rem' }}
                  />
                ) : (
                  <i
                    className='tabler-wallet'
                    style={{ color: storage.isGold ? '#000' : 'white', fontSize: '1.5rem' }}
                  />
                )}
              </Box>
              <Box>
                <Typography variant='h6' sx={{ fontWeight: 600, color: storage.isGold ? '#000' : 'white' }}>
                  {storage.name}
                </Typography>
                <Typography
                  sx={{ color: storage.isGold ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}
                >
                  {storage.isGold ? 'Simpanan Emas' : 'Riwayat Transaksi'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} sx={{ color: storage.isGold ? '#000' : 'white' }}>
              <i className='tabler-x' />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Balance & Stats */}
        <Box sx={{ px: 3, pb: 3, position: 'relative', zIndex: 1 }}>
          {/* Gold Info Section */}
          {storage.isGold && storage.goldWeight && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 700,
                    color: '#000',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}
                >
                  {storage.goldWeight}
                </Typography>
                <Typography sx={{ fontWeight: 600, color: 'rgba(0,0,0,0.7)', fontSize: '1.2rem' }}>gram</Typography>
              </Box>
              <Typography sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.85rem' }}>Berat Emas</Typography>
            </Box>
          )}

          <Typography
            variant='h4'
            sx={{
              fontWeight: 700,
              color: storage.isGold ? '#000' : 'white',
              mt: storage.isGold ? 1 : 2,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {formatCurrency(displayValue)}
          </Typography>
          <Typography
            sx={{ color: storage.isGold ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', fontSize: '0.85rem', mb: 2 }}
          >
            {storage.isGold ? `Nilai Saat Ini @${formatCurrency(goldPrice)}/gram` : 'Saldo Saat Ini'}
          </Typography>

          {/* Mini Stats */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: storage.isGold ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography
                sx={{ color: storage.isGold ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
              >
                {storage.isGold ? 'Beli' : 'Masuk'}
              </Typography>
              <Typography sx={{ color: storage.isGold ? '#000' : 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {formatCurrency(totalIn)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: storage.isGold ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography
                sx={{ color: storage.isGold ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
              >
                {storage.isGold ? 'Jual' : 'Keluar'}
              </Typography>
              <Typography sx={{ color: storage.isGold ? '#000' : 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                {formatCurrency(totalOut)}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: storage.isGold ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                textAlign: 'center'
              }}
            >
              <Typography
                sx={{ color: storage.isGold ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
              >
                Transaksi
              </Typography>
              <Typography sx={{ color: storage.isGold ? '#000' : 'white', fontWeight: 600, fontSize: '0.9rem' }}>
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
                    <CustomAvatar color={config.color} variant='rounded' size={44} skin='light'>
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
                      <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.8rem', mt: 0.5 }}>
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
