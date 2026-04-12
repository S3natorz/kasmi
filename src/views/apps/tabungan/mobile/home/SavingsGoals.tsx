'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

type SavingCategory = {
  category: string
  amount: number
  target?: number
  color?: string
  icon?: string
}

type Props = {
  savings: SavingCategory[]
  hideBalance: boolean
}

const SavingsGoals = ({ savings, hideBalance }: Props) => {
  const maskValue = (value: string) => (hideBalance ? '••••••' : value)

  if (savings.length === 0) return null

  return (
    <Box sx={{ px: 2, pt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Target Tabungan
        </Typography>
        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {savings.length} target
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {savings.map((item, idx) => {
          const progress = item.target ? Math.min(100, (item.amount / item.target) * 100) : 0
          const accentColor = item.color || '#7367F0'

          return (
            <Box
              key={idx}
              sx={{
                p: 1.75,
                borderRadius: '16px',
                border: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '12px',
                    backgroundColor: `${accentColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i
                    className={item.icon || 'tabler-pig-money'}
                    style={{ fontSize: 20, color: accentColor }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.category}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                    {maskValue(formatCurrency(item.amount))}
                    {item.target ? ` / ${maskValue(formatCurrency(item.target))}` : ''}
                  </Typography>
                </Box>
                {item.target && (
                  <Typography sx={{ fontWeight: 700, color: accentColor, fontSize: '0.9rem' }}>
                    {progress.toFixed(0)}%
                  </Typography>
                )}
              </Box>
              {item.target && (
                <LinearProgress
                  variant='determinate'
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: `${accentColor}15`,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: accentColor
                    }
                  }}
                />
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default SavingsGoals
