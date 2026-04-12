'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { usePathname, useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Fab from '@mui/material/Fab'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

type NavItem = {
  label: string
  icon: string
  path: string
  key: string
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Beranda', icon: 'tabler-home-2', path: '/apps/tabungan/dashboard' },
  { key: 'transactions', label: 'Transaksi', icon: 'tabler-list-details', path: '/apps/tabungan/transactions' },
  { key: 'add', label: 'Tambah', icon: 'tabler-plus', path: '' },
  { key: 'storage', label: 'Dompet', icon: 'tabler-wallet', path: '/apps/tabungan/storage-types' },
  { key: 'menu', label: 'Menu', icon: 'tabler-menu-2', path: '' }
]

type Props = {
  onAddClick?: () => void
  onMenuClick?: () => void
}

const BottomNav = ({ onAddClick, onMenuClick }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const lang = (params?.lang as string) || 'en'

  // Prefetch all nav routes on mount so tab switches are instant
  useEffect(() => {
    navItems.forEach(item => {
      if (item.path) router.prefetch(`/${lang}${item.path}`)
    })
  }, [lang, router])

  const isActive = (path: string) => {
    if (!path) return false
    return pathname?.includes(path)
  }

  const handleClick = (item: NavItem) => {
    if (item.key === 'add') {
      onAddClick?.()
      return
    }
    if (item.key === 'menu') {
      onMenuClick?.()
      return
    }
    if (item.path) {
      router.push(`/${lang}${item.path}`)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: isDesktop ? 480 : '100%',
        zIndex: 1200,
        borderRadius: 0,
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        backgroundColor: isDark ? 'rgba(22, 24, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          height: 68,
          position: 'relative'
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path)

          if (item.key === 'add') {
            return (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  height: '100%'
                }}
              >
                <Fab
                  color='primary'
                  onClick={() => handleClick(item)}
                  sx={{
                    position: 'absolute',
                    top: -24,
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #7367F0 0%, #9E95F5 100%)',
                    boxShadow: '0 10px 24px rgba(115, 103, 240, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6455EE 0%, #8E85F0 100%)',
                      boxShadow: '0 12px 28px rgba(115, 103, 240, 0.5)'
                    }
                  }}
                >
                  <i className={item.icon} style={{ fontSize: 28, color: '#fff' }} />
                </Fab>
                <Typography
                  variant='caption'
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            )
          }

          return (
            <Box
              key={item.key}
              onClick={() => handleClick(item)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                cursor: 'pointer',
                gap: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  '& i': {
                    transform: 'translateY(-2px)'
                  }
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 32,
                  borderRadius: '16px',
                  backgroundColor: active ? 'rgba(115, 103, 240, 0.12)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <i
                  className={item.icon}
                  style={{
                    fontSize: 22,
                    color: active ? '#7367F0' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                    transition: 'all 0.2s ease'
                  }}
                />
              </Box>
              <Typography
                variant='caption'
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'primary.main' : 'text.secondary'
                }}
              >
                {item.label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}

export default BottomNav
