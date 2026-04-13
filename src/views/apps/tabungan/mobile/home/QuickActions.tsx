'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'

// Context Imports
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

type Action = {
  key: string
  label: string
  icon: string
  color: string
  bgColor: string
}

type Props = {
  onActionClick: (type: string) => void
}

const QuickActions = ({ onActionClick }: Props) => {
  const dict = useTabunganDictionary()

  const actions = useMemo<Action[]>(
    () => [
      {
        key: 'income',
        label: dict.quickActions.income,
        icon: 'tabler-arrow-down-left',
        color: '#28C76F',
        bgColor: 'rgba(40, 199, 111, 0.12)'
      },
      {
        key: 'expense',
        label: dict.quickActions.expense,
        icon: 'tabler-arrow-up-right',
        color: '#FF4C51',
        bgColor: 'rgba(255, 76, 81, 0.12)'
      },
      {
        key: 'savings',
        label: dict.quickActions.savings,
        icon: 'tabler-coin',
        color: '#00BAD1',
        bgColor: 'rgba(0, 186, 209, 0.12)'
      },
      {
        key: 'transfer',
        label: dict.quickActions.transfer,
        icon: 'tabler-transfer',
        color: '#FF9F43',
        bgColor: 'rgba(255, 159, 67, 0.12)'
      }
    ],
    [dict]
  )

  return (
    <Box sx={{ px: 2, pt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {dict.quickActions.title}
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
        {actions.map(action => (
          <ButtonBase
            key={action.key}
            onClick={() => onActionClick(action.key)}
            sx={{
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              borderRadius: '16px',
              p: 1.25,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateY(-2px)'
              },
              '&:active': {
                transform: 'scale(0.96)'
              }
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                backgroundColor: action.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className={action.icon} style={{ fontSize: 22, color: action.color }} />
            </Box>
            <Typography
              variant='caption'
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                textAlign: 'center',
                lineHeight: 1.2
              }}
            >
              {action.label}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  )
}

export default QuickActions
