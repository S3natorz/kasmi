'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'

// Context Imports
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

type StatCard = {
  key: string
  label: string
  value: number
  icon: string
  color: string
  bgColor: string
  format: 'currency' | 'number'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    notation: amount > 999999 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(amount)
}

type Props = {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  transactionCount: number
  hideBalance: boolean
  onCardClick: (key: string, label: string, value: number) => void
}

const StatsTabs = ({
  totalIncome,
  totalExpenses,
  totalSavings,
  transactionCount,
  hideBalance,
  onCardClick
}: Props) => {
  const dict = useTabunganDictionary()

  const cards: StatCard[] = [
    {
      key: 'income',
      label: dict.stats.income,
      value: totalIncome,
      icon: 'tabler-trending-up',
      color: '#28C76F',
      bgColor: 'rgba(40, 199, 111, 0.08)',
      format: 'currency'
    },
    {
      key: 'expense',
      label: dict.stats.expense,
      value: totalExpenses,
      icon: 'tabler-trending-down',
      color: '#FF4C51',
      bgColor: 'rgba(255, 76, 81, 0.08)',
      format: 'currency'
    },
    {
      key: 'savings',
      label: dict.stats.savings,
      value: totalSavings,
      icon: 'tabler-coin',
      color: '#00BAD1',
      bgColor: 'rgba(0, 186, 209, 0.08)',
      format: 'currency'
    },
    {
      key: 'all',
      label: dict.stats.transactions,
      value: transactionCount,
      icon: 'tabler-receipt',
      color: '#FF9F43',
      bgColor: 'rgba(255, 159, 67, 0.08)',
      format: 'number'
    }
  ]

  const mask = (value: string) => (hideBalance ? '••••••' : value)

  return (
    <Box sx={{ px: 2, pt: 3 }}>
      <Typography variant='subtitle2' sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>
        {dict.stats.title}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
        {cards.map(card => (
          <ButtonBase
            key={card.key}
            onClick={() => onCardClick(card.key, card.label, card.value)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              p: 1.75,
              borderRadius: '16px',
              backgroundColor: card.bgColor,
              border: 1,
              borderColor: 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: card.color,
                transform: 'translateY(-2px)'
              },
              '&:active': { transform: 'scale(0.98)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  backgroundColor: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className={card.icon} style={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <i className='tabler-chevron-right' style={{ fontSize: 16, color: card.color, opacity: 0.6 }} />
            </Box>
            <Typography variant='caption' sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 500 }}>
              {card.label}
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                color: card.color,
                mt: 0.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'left'
              }}
            >
              {card.format === 'currency' ? mask(formatCurrency(card.value)) : card.value}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  )
}

export default StatsTabs
