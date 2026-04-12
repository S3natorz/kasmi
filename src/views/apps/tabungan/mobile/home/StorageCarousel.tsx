'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'

// Type Imports
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const gradients = [
  'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
  'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
  'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
  'linear-gradient(135deg, #30CFD0 0%, #330867 100%)',
  'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
  'linear-gradient(135deg, #FFE9A0 0%, #FFB480 100%)'
]

type Props = {
  storages: StorageTypeType[]
  goldPrice: number
  hideBalance: boolean
  onStorageClick: (storage: StorageTypeType) => void
}

const StorageCarousel = ({ storages, goldPrice, hideBalance, onStorageClick }: Props) => {
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
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
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
                  background: 'rgba(255,255,255,0.15)'
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
