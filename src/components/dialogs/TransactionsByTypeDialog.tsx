'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Hooks
import { useTabunganData } from '@/hooks/useTabunganData'

// Context Imports
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

// Utils
import { formatWibDate, formatWibDateKey } from '@/libs/wib'

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
  const dict = useTabunganDictionary()

  const typeConfig: Record<string, { label: string; color: ThemeColor; icon: string }> = {
    income: { label: dict.types.income, color: 'success', icon: 'tabler-arrow-up' },
    gold_income: { label: dict.types.incomeGold, color: 'warning', icon: 'tabler-diamond' },
    expense: { label: dict.types.expense, color: 'error', icon: 'tabler-arrow-down' },
    savings: { label: dict.types.savings, color: 'info', icon: 'tabler-coin' },
    transfer: { label: dict.types.transfer, color: 'warning', icon: 'tabler-transfer' }
  }

  // SWR hook so the list re-renders when something elsewhere (an edit,
  // an add, a delete) invalidates the transactions key. `limit=5000`
  // opts out of the default 200-row page for bulk views.
  const buildUrl = () => {
    if (!open) return null
    let url = `/api/apps/tabungan/transactions?startDate=${startDate}&endDate=${endDate}&limit=5000`

    if (filterType !== 'all') url += `&type=${filterType}`

    return url
  }

  const { data: txData, isLoading } = useTabunganData<TransactionType[]>(buildUrl())
  const transactions = Array.isArray(txData) ? txData : []
  const loading = isLoading && transactions.length === 0

  const handleClose = () => {
    onClose()
  }

  const getTypeConfig = () => {
    if (filterType === 'all') {
      return { label: dict.common.all, color: 'primary' as ThemeColor, icon: 'tabler-receipt' }
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* Fixed Header */}
      <Box sx={{ flexShrink: 0 }}>
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
                  {formatWibDateKey(startDate, { day: 'numeric', month: 'short' })} -{' '}
                  {formatWibDateKey(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
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
                {dict.byType.total} {config.label}
              </Typography>
              <Typography variant='h5' sx={{ fontWeight: 700 }} color={`${config.color}.main`}>
                {filterType === 'all' ? (totalCount ?? transactions.length) : formatCurrency(totalAmount)}
              </Typography>
            </Box>
            <Chip
              label={`${transactions.length} ${dict.byType.count}`}
              color={config.color}
              size='small'
              variant='tonal'
              icon={<i className='tabler-list' style={{ fontSize: '0.9rem' }} />}
            />
          </Box>
        </Box>

        <Divider />
      </Box>

      {/* Transaction List - scrollable area */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : transactions.length > 0 ? (
        <Box>
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
                          {formatWibDate(transaction.date, {
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
                      {/* Show category and storage info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {(transaction.savingsCategory || transaction.expenseCategory) && (
                          <Chip
                            label={transaction.savingsCategory?.name || transaction.expenseCategory?.name}
                            size='small'
                            sx={{
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
                        {/* Show storage name */}
                        {(transaction.fromStorageType || transaction.toStorageType) && (
                          <Chip
                            icon={<i className='tabler-wallet' style={{ fontSize: '0.7rem' }} />}
                            label={
                              transaction.type === 'transfer'
                                ? `${transaction.fromStorageType?.name || ''} → ${transaction.toStorageType?.name || ''}`
                                : transaction.type === 'income'
                                  ? transaction.toStorageType?.name
                                  : transaction.fromStorageType?.name
                            }
                            size='small'
                            variant='outlined'
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              '& .MuiChip-icon': {
                                marginLeft: '4px'
                              }
                            }}
                          />
                        )}
                      </Box>
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
                    {transaction.type === 'gold_income'
                      ? `+${transaction.amount}g`
                      : `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`}
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
            {dict.byType.empty}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {dict.byType.empty}
          </Typography>
        </Box>
      )}
      </Box>
    </Dialog>
  )
}

export default TransactionsByTypeDialog
