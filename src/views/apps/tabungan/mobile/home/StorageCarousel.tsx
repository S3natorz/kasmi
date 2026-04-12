'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Darker, more muted gradients that work in both light/dark mode
const lightGradients = [
  'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'linear-gradient(135deg, #4FACFE 0%, #00C9FF 100%)',
  'linear-gradient(135deg, #43C4A1 0%, #2BB19C 100%)',
  'linear-gradient(135deg, #FA709A 0%, #FEB47B 100%)',
  'linear-gradient(135deg, #30CFD0 0%, #6B7FD7 100%)',
  'linear-gradient(135deg, #FFB86C 0%, #FF7043 100%)',
  'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)'
]

const darkGradients = [
  'linear-gradient(135deg, #3B4371 0%, #2E1A47 100%)',
  'linear-gradient(135deg, #6B2D5C 0%, #4A1A35 100%)',
  'linear-gradient(135deg, #1E5F74 0%, #133B5C 100%)',
  'linear-gradient(135deg, #1F4D46 0%, #0F3B2F 100%)',
  'linear-gradient(135deg, #5D3A5A 0%, #3B2135 100%)',
  'linear-gradient(135deg, #1A4F63 0%, #2D3561 100%)',
  'linear-gradient(135deg, #6B3F2E 0%, #3E2317 100%)',
  'linear-gradient(135deg, #3D3A6B 0%, #2A2548 100%)'
]

type Props = {
  storages: StorageTypeType[]
  goldPrice: number
  hideBalance: boolean
  onStorageClick: (storage: StorageTypeType) => void
}

const StorageCarousel = ({ storages, goldPrice, hideBalance, onStorageClick }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const gradients = isDark ? darkGradients : lightGradients
  const maskValue = (value: string) => (hideBalance ? '••••••' : value)

  if (storages.length === 0) return null

  return (
    <Box sx={{ pt: 3 }}>
      <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
          Dompet & Simpanan
        </Typography>
        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {storages.length} akun
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          px: 2,
          pb: 1,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {storages.map((storage, idx) => {
          const balance = storage.isGold && storage.goldWeight ? storage.goldWeight * goldPrice : storage.balance || 0

          return (
            <ButtonBase
              key={storage.id}
              onClick={() => onStorageClick(storage)}
              sx={{
                flexShrink: 0,
                width: 200,
                height: 120,
                borderRadius: '18px',
                scrollSnapAlign: 'start',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                background: gradients[idx % gradients.length],
                color: '#fff',
                boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.12)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'transform 0.2s ease',
                '&:active': { transform: 'scale(0.97)' }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)'
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i
                      className={storage.icon || (storage.isGold ? 'tabler-coin' : 'tabler-wallet')}
                      style={{ fontSize: 18, color: '#fff' }}
                    />
                  </Box>
                  {storage.isGold && (
                    <Typography variant='caption' sx={{ fontSize: '0.65rem', opacity: 0.9, fontWeight: 600 }}>
                      {storage.goldWeight?.toFixed(2)}g
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant='caption'
                    sx={{
                      opacity: 0.9,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {storage.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {maskValue(formatCurrency(balance))}
                  </Typography>
                </Box>
              </Box>
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}

export default StorageCarousel
