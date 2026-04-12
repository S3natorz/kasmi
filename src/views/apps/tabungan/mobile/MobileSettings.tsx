'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'

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
        icon: 'tabler-pig-money',
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

const MobileSettings = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'en'

  // Prefetch all destinations so tap-through feels instant
  useEffect(() => {
    groups.forEach(g => g.items.forEach(item => router.prefetch(`/${lang}${item.path}`)))
  }, [lang, router])

  return (
    <Box sx={{ px: 0.5, pb: 2 }}>
      {groups.map(group => (
        <Box key={group.title} sx={{ mb: 2 }}>
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
            {group.title}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff'
            }}
          >
            <List disablePadding>
              {group.items.map((item, idx) => (
                <ListItem
                  key={item.path}
                  disablePadding
                  divider={idx < group.items.length - 1}
                  sx={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
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
