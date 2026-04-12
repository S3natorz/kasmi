'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import { useTheme } from '@mui/material/styles'

// Summary card skeleton (used at top of list pages)
export const SummaryCardSkeleton = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
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
        <Skeleton variant='text' width={120} height={18} />
        <Skeleton variant='rounded' width={32} height={32} />
      </Box>
      <Skeleton variant='text' width={180} height={36} sx={{ mb: 0.5 }} />
      <Skeleton variant='text' width={140} height={14} />
    </Box>
  )
}

// Card row skeleton (used for storages, members, categories lists)
export const ListCardSkeleton = ({ height = 72, hasAction = true }: { height?: number; hasAction?: boolean }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '16px',
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
        border: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: height
      }}
    >
      <Skeleton variant='rounded' width={44} height={44} sx={{ borderRadius: '12px', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant='text' width='60%' height={18} />
        <Skeleton variant='text' width='40%' height={14} />
      </Box>
      {hasAction && <Skeleton variant='rounded' width={32} height={32} sx={{ borderRadius: '10px' }} />}
    </Box>
  )
}

// Storage gradient card skeleton (for MobileStorages list)
export const StorageCardSkeleton = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        width: '100%',
        height: 110,
        borderRadius: '18px',
        overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
      }}
    >
      <Skeleton variant='rectangular' width='100%' height='100%' animation='wave' />
    </Box>
  )
}

// Transaction row skeleton
export const TransactionRowSkeleton = ({ isLast = false }: { isLast?: boolean }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.5,
        px: 1.5,
        borderBottom: isLast ? 'none' : 1,
        borderColor: 'divider'
      }}
    >
      <Skeleton variant='rounded' width={42} height={42} sx={{ borderRadius: '12px', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant='text' width='70%' height={18} />
        <Skeleton variant='text' width='50%' height={14} />
      </Box>
      <Skeleton variant='text' width={80} height={20} />
    </Box>
  )
}

// Full mobile list skeleton (summary + list rows)
export const MobileListSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 12 }}>
      <SummaryCardSkeleton />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <ListCardSkeleton key={i} />
        ))}
      </Box>
    </Box>
  )
}

// Balance hero skeleton
export const BalanceHeroSkeleton = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '24px',
          p: 3,
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(115, 103, 240, 0.18)' : 'rgba(115, 103, 240, 0.1)',
          minHeight: 200
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Skeleton variant='text' width={140} height={16} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
        <Skeleton variant='text' width={200} height={48} sx={{ mb: 2.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Skeleton variant='rounded' height={60} sx={{ borderRadius: '14px' }} />
          <Skeleton variant='rounded' height={60} sx={{ borderRadius: '14px' }} />
        </Box>
      </Box>
    </Box>
  )
}

// Home page full skeleton
export const MobileHomeSkeleton = () => {
  return (
    <Box>
      <BalanceHeroSkeleton />

      {/* Quick actions */}
      <Box sx={{ px: 2, pt: 3, display: 'flex', gap: 1.5 }}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant='circular' width={48} height={48} />
            <Skeleton variant='text' width={50} height={14} />
          </Box>
        ))}
      </Box>

      {/* Stats grid */}
      <Box sx={{ px: 2, pt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant='rounded' height={90} sx={{ borderRadius: '16px' }} />
        ))}
      </Box>

      {/* Storage carousel */}
      <Box sx={{ pt: 3 }}>
        <Box sx={{ px: 2, mb: 1.5 }}>
          <Skeleton variant='text' width={160} height={20} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, px: 2, overflowX: 'hidden' }}>
          {[1, 2, 3].map(i => (
            <Skeleton
              key={i}
              variant='rounded'
              sx={{ flexShrink: 0, width: 200, height: 120, borderRadius: '18px' }}
            />
          ))}
        </Box>
      </Box>

      {/* Recent activity */}
      <Box sx={{ px: 2, pt: 3 }}>
        <Skeleton variant='text' width={140} height={20} sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4].map(i => (
            <ListCardSkeleton key={i} hasAction={false} />
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// Transactions list skeleton (search + filter + grouped list)
export const MobileTransactionsSkeleton = () => {
  return (
    <Box>
      {/* Search + summary */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
        <Skeleton variant='rounded' width='100%' height={44} sx={{ borderRadius: '14px' }} />
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant='text' width={100} height={16} />
          <Skeleton variant='text' width={120} height={16} />
        </Box>
      </Box>

      {/* Filter chips */}
      <Box sx={{ display: 'flex', gap: 0.75, px: 2, pb: 1.5, overflowX: 'hidden' }}>
        {[80, 70, 70, 90, 80].map((w, i) => (
          <Skeleton key={i} variant='rounded' width={w} height={34} sx={{ borderRadius: '17px', flexShrink: 0 }} />
        ))}
      </Box>

      {/* Grouped transaction list */}
      <Box sx={{ px: 2 }}>
        {[1, 2].map(group => (
          <Box key={group} sx={{ mb: 2 }}>
            <Skeleton variant='text' width={120} height={16} sx={{ mb: 1 }} />
            <Box
              sx={{
                borderRadius: '16px',
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden'
              }}
            >
              {[1, 2, 3].map((r, idx, arr) => (
                <TransactionRowSkeleton key={r} isLast={idx === arr.length - 1} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
