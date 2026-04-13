'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter, useParams, usePathname } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { Mode } from '@core/types'
import type { Locale } from '@configs/i18n'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

type MenuGroup = {
  title: string
  items: {
    label: string
    description?: string
    icon: string
    path: string
    color: string
    bg: string
  }[]
}

const groups: MenuGroup[] = [
  {
    title: 'Data Utama',
    items: [
      {
        label: 'Anggota Keluarga',
        description: 'Kelola anggota & profil keluarga',
        icon: 'tabler-users',
        path: '/apps/tabungan/family-members',
        color: '#7367F0',
        bg: 'rgba(115, 103, 240, 0.12)'
      },
      {
        label: 'Kategori Tabungan',
        description: 'Target & kategori tabungan',
        icon: 'tabler-coin',
        path: '/apps/tabungan/categories/savings',
        color: '#28C76F',
        bg: 'rgba(40, 199, 111, 0.12)'
      },
      {
        label: 'Kategori Pengeluaran',
        description: 'Kelompokkan pengeluaran harian',
        icon: 'tabler-shopping-cart',
        path: '/apps/tabungan/categories/expenses',
        color: '#FF9F43',
        bg: 'rgba(255, 159, 67, 0.12)'
      }
    ]
  },
  {
    title: 'Sistem',
    items: [
      {
        label: 'Backup & Restore',
        description: 'Cadangkan & pulihkan data',
        icon: 'tabler-database',
        path: '/apps/tabungan/backup',
        color: '#00CFE8',
        bg: 'rgba(0, 207, 232, 0.12)'
      }
    ]
  }
]

const modeOptions: { value: Mode; label: string; icon: string }[] = [
  { value: 'light', label: 'Terang', icon: 'tabler-sun' },
  { value: 'dark', label: 'Gelap', icon: 'tabler-moon-stars' },
  { value: 'system', label: 'Sistem', icon: 'tabler-device-laptop' }
]

const languageOptions: { value: Locale; label: string; short: string }[] = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'fr', label: 'Français', short: 'FR' },
  { value: 'ar', label: 'العربية', short: 'AR' }
]

const MobileSettings = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const router = useRouter()
  const pathname = usePathname() || '/'
  const params = useParams()
  const lang = (params?.lang as Locale) || 'en'

  const { settings, updateSettings } = useSettings()
  const currentMode: Mode = settings.mode || 'system'

  // Prefetch all destinations so tap-through feels instant
  useEffect(() => {
    groups.forEach(g => g.items.forEach(item => router.prefetch(`/${lang}${item.path}`)))
  }, [lang, router])

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, mode: Mode | null) => {
    if (!mode || mode === currentMode) return
    updateSettings({ mode })
  }

  const handleLangChange = (_: React.MouseEvent<HTMLElement>, code: Locale | null) => {
    if (!code || code === lang) return
    const segments = pathname.split('/')
    segments[1] = code
    router.push(segments.join('/'))
  }

  const sectionBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const sectionBg = isDark ? 'rgba(255,255,255,0.03)' : '#fff'

  const sectionLabel = (text: string) => (
    <Typography
      variant='overline'
      sx={{
        display: 'block',
        px: 2,
        pt: 1,
        pb: 0.5,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: 0.5,
        color: 'text.secondary'
      }}
    >
      {text}
    </Typography>
  )

  return (
    <Box sx={{ px: 0.5, pb: 2 }}>
      {/* Tampilan */}
      <Box sx={{ mb: 2 }}>
        {sectionLabel('Tampilan')}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${sectionBorder}`,
            backgroundColor: sectionBg,
            p: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, px: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: 'rgba(115, 103, 240, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-palette' style={{ fontSize: 22, color: '#7367F0' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Mode Tema</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Pilih tampilan terang, gelap, atau sistem
              </Typography>
            </Box>
          </Box>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={currentMode}
            onChange={handleModeChange}
            sx={{
              display: 'flex',
              gap: 1,
              '& .MuiToggleButton-root': {
                flex: 1,
                border: `1px solid ${sectionBorder} !important`,
                borderRadius: '10px !important',
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'text.primary',
                gap: 0.75
              },
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'rgba(115, 103, 240, 0.12)',
                color: '#7367F0',
                borderColor: 'rgba(115, 103, 240, 0.35) !important'
              },
              '& .MuiToggleButton-root.Mui-selected:hover': {
                backgroundColor: 'rgba(115, 103, 240, 0.18)'
              }
            }}
          >
            {modeOptions.map(opt => (
              <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
                <i className={opt.icon} style={{ fontSize: 18 }} />
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Bahasa */}
      <Box sx={{ mb: 2 }}>
        {sectionLabel('Bahasa')}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${sectionBorder}`,
            backgroundColor: sectionBg,
            p: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, px: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 207, 232, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-language' style={{ fontSize: 22, color: '#00CFE8' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Bahasa Aplikasi</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                Ubah bahasa tampilan (dictionary)
              </Typography>
            </Box>
          </Box>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={lang}
            onChange={handleLangChange}
            sx={{
              display: 'flex',
              gap: 1,
              '& .MuiToggleButton-root': {
                flex: 1,
                border: `1px solid ${sectionBorder} !important`,
                borderRadius: '10px !important',
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'text.primary',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                lineHeight: 1.2
              },
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'rgba(0, 207, 232, 0.12)',
                color: '#00CFE8',
                borderColor: 'rgba(0, 207, 232, 0.35) !important'
              },
              '& .MuiToggleButton-root.Mui-selected:hover': {
                backgroundColor: 'rgba(0, 207, 232, 0.18)'
              }
            }}
          >
            {languageOptions.map(opt => (
              <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label}>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{opt.short}</span>
                <span>{opt.label}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {groups.map(group => (
        <Box key={group.title} sx={{ mb: 2 }}>
          {sectionLabel(group.title)}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${sectionBorder}`,
              backgroundColor: sectionBg
            }}
          >
            <List disablePadding>
              {group.items.map((item, idx) => (
                <ListItem
                  key={item.path}
                  disablePadding
                  divider={idx < group.items.length - 1}
                  sx={{ borderColor: sectionBorder }}
                >
                  <ListItemButton
                    onClick={() => router.push(`/${lang}${item.path}`)}
                    sx={{ py: 1.5, px: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          backgroundColor: item.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <i className={item.icon} style={{ fontSize: 22, color: item.color }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                    <i className='tabler-chevron-right' style={{ fontSize: 20, opacity: 0.45 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      ))}

      <Typography
        variant='caption'
        sx={{
          display: 'block',
          textAlign: 'center',
          color: 'text.disabled',
          mt: 3,
          fontSize: '0.7rem'
        }}
      >
        Kasmi Mobile · Family Savings
      </Typography>
    </Box>
  )
}

export default MobileSettings
