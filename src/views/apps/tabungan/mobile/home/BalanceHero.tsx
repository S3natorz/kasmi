'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

type Props = {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  periodLabel: string
  hideBalance: boolean
  onToggleHide: () => void
}

const BalanceHero = ({ totalBalance, totalIncome, totalExpenses, periodLabel, hideBalance, onToggleHide }: Props) => {
  const maskValue = (value: string) => (hideBalance ? '••••••••' : value)

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '24px',
          p: 3,
          background: 'linear-gradient(135deg, #7367F0 0%, #9E95F5 50%, #BAB3F8 100%)',
          color: '#fff',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(115, 103, 240, 0.35)'
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant='caption' sx={{ opacity: 0.9, fontSize: '0.8rem', fontWeight: 500 }}>
              Total Saldo Keluarga
            </Typography>
            <IconButton
              size='small'
              onClick={onToggleHide}
              sx={{
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.15)',
                width: 32,
                height: 32,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
              }}
            >
              <i className={hideBalance ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Typography
            variant='h3'
            sx={{
              color: '#fff',
              fontWeight: 800,
              mb: 2.5,
              fontSize: { xs: '1.75rem', sm: '2rem' },
              letterSpacing: '-0.5px'
            }}
          >
            {maskValue(formatCurrency(totalBalance))}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                p: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(40, 199, 111, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-arrow-down-left' style={{ fontSize: 14, color: '#fff' }} />
                </Box>
                <Typography variant='caption' sx={{ opacity: 0.95, fontSize: '0.7rem' }}>
                  Masuk
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                {maskValue(formatCurrency(totalIncome))}
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                p: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 76, 81, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-arrow-up-right' style={{ fontSize: 14, color: '#fff' }} />
                </Box>
                <Typography variant='caption' sx={{ opacity: 0.95, fontSize: '0.7rem' }}>
                  Keluar
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                {maskValue(formatCurrency(totalExpenses))}
              </Typography>
            </Box>
          </Box>

          <Typography variant='caption' sx={{ opacity: 0.8, fontSize: '0.7rem', display: 'block', mt: 1.5 }}>
            <i className='tabler-calendar' style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
            {periodLabel}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default BalanceHero
