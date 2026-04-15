'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import Swal from 'sweetalert2'

// Component Imports
import StorageTransactionsDialog from '@/components/dialogs/StorageTransactionsDialog'
import { SummaryCardSkeleton, StorageCardSkeleton } from './MobileSkeletons'

// Hook Imports
import { useTabunganData, invalidateMany } from '@/hooks/useTabunganData'

// Contexts
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

// Utils
import { showSuccessToast, showErrorToast } from '@/utils/swal'

// Types
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

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

const MobileStorages = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const gradients = isDark ? darkGradients : lightGradients
  const dict = useTabunganDictionary()

  const { data: storagesData, isLoading: storagesLoading } = useTabunganData<StorageTypeType[]>(
    '/api/apps/tabungan/storage-types'
  )

  const { data: goldData } = useTabunganData<{ pricePerGram?: number }>('/api/apps/tabungan/gold-price')

  const storages = Array.isArray(storagesData) ? storagesData : []
  const goldPrice = goldData?.pricePerGram || 0
  const loading = storagesLoading && storages.length === 0

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideBalances') === 'true'
    }

    return false
  })

  const [selected, setSelected] = useState<StorageTypeType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const handleRecalculate = async () => {
    const result = await Swal.fire({
      title: dict.storageTypes.recalculateTitle,
      text: dict.storageTypes.recalculateBody,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: dict.storageTypes.recalculateConfirm,
      cancelButtonText: dict.storageTypes.recalculateCancel,
      customClass: { container: 'swal-container-top' }
    })

    if (!result.isConfirmed) return

    try {
      setRecalculating(true)
      const res = await fetch('/api/apps/tabungan/storage-types/recalculate', { method: 'POST' })

      if (!res.ok) {
        showErrorToast(dict.storageTypes.recalculateFail)

        return
      }

      const data = await res.json()

      const changed = (data.summary || []).filter(
        (s: any) => Math.abs(s.balanceDiff || 0) > 0.001 || Math.abs(s.goldWeightDiff || 0) > 0.00001
      )

      if (changed.length === 0) {
        showSuccessToast(dict.storageTypes.recalculateNoChange)
      } else {
        showSuccessToast(dict.storageTypes.recalculateUpdated.replace('{count}', String(changed.length)))
      }

      // Invalidate every cache key that derives from storage balances so
      // all mounted SWR consumers (home, carousel, this page, dialogs)
      // refetch immediately — doesn't wait for the websocket broadcast.
      invalidateMany(['/api/apps/tabungan/storage-types', '/api/apps/tabungan/stats'])
    } catch (error) {
      console.error('Failed to recalculate:', error)
      showErrorToast(dict.storageTypes.recalculateFail)
    } finally {
      setRecalculating(false)
    }
  }

  const mask = (v: string) => (hideBalance ? '••••••' : v)

  const totalBalance = storages.reduce((sum, s) => {
    if (s.isGold && s.goldWeight) return sum + s.goldWeight * goldPrice

    return sum + (s.balance || 0)
  }, 0)

  if (loading) {
    return (
      <Box sx={{ px: 2, pt: 1.5 }}>
        <SummaryCardSkeleton />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <StorageCardSkeleton key={i} />
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ px: 2, pt: 1.5 }}>
      {/* Total summary */}
      <Box
        sx={{
          p: 2,
          borderRadius: '16px',
          mb: 2,
          backgroundColor: isDark ? 'rgba(115, 103, 240, 0.1)' : 'rgba(115, 103, 240, 0.05)',
          border: 1,
          borderColor: isDark ? 'rgba(115, 103, 240, 0.2)' : 'rgba(115, 103, 240, 0.15)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {dict.storageTypes.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <ButtonBase
              onClick={handleRecalculate}
              disabled={recalculating}
              sx={{ borderRadius: 1, p: 0.5, opacity: recalculating ? 0.5 : 1 }}
              title={dict.storageTypes.recalculate}
            >
              {recalculating ? (
                <CircularProgress size={16} />
              ) : (
                <i className='tabler-calculator' style={{ fontSize: 18 }} />
              )}
            </ButtonBase>
            <ButtonBase onClick={() => setHideBalance(!hideBalance)} sx={{ borderRadius: 1, p: 0.5 }}>
              <i className={hideBalance ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: 18 }} />
            </ButtonBase>
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: 'primary.main' }}>
          {mask(formatCurrency(totalBalance))}
        </Typography>
        <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {storages.length} {dict.byType.count}
        </Typography>
      </Box>

      {/* Storage cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {storages.map((storage, idx) => {
          const balance = storage.isGold && storage.goldWeight ? storage.goldWeight * goldPrice : storage.balance || 0

          return (
            <ButtonBase
              key={storage.id}
              onClick={() => {
                setSelected(storage)
                setDialogOpen(true)
              }}
              sx={{
                width: '100%',
                borderRadius: '18px',
                position: 'relative',
                overflow: 'hidden',
                background: gradients[idx % gradients.length],
                color: '#fff',
                boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.12)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'transform 0.2s ease',
                '&:active': { transform: 'scale(0.98)' }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)'
                }}
              />
              <Box sx={{ position: 'relative', width: '100%', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i
                        className={storage.icon || (storage.isGold ? 'tabler-coin' : 'tabler-wallet')}
                        style={{ fontSize: 22, color: '#fff' }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#fff', lineHeight: 1.2 }}>
                        {storage.name}
                      </Typography>
                      {storage.accountNumber && (
                        <Typography variant='caption' sx={{ fontSize: '0.72rem', opacity: 0.85, color: '#fff' }}>
                          {storage.accountNumber}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <i className='tabler-chevron-right' style={{ fontSize: 20, color: '#fff', opacity: 0.7 }} />
                </Box>

                <Typography variant='caption' sx={{ fontSize: '0.72rem', opacity: 0.9, color: '#fff', display: 'block' }}>
                  {storage.isGold ? `${storage.goldWeight?.toFixed(2) || 0} ${dict.storageCarousel.grams} • ${dict.storageCarousel.balance}` : dict.storageCarousel.balance}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: '#fff' }}>
                  {mask(formatCurrency(balance))}
                </Typography>
              </Box>
            </ButtonBase>
          )
        })}
      </Box>

      {storages.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <i className='tabler-wallet-off' style={{ fontSize: 64, opacity: 0.3 }} />
          <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>{dict.storageTypes.empty}</Typography>
        </Box>
      )}

      <Box sx={{ height: 20 }} />

      <StorageTransactionsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} storage={selected} />
    </Box>
  )
}

export default MobileStorages
