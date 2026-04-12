'use client'

// React Imports
import { useState, ReactNode } from 'react'

// Next Imports
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// Component Imports
import BottomNav from './BottomNav'
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog'

type Props = {
  children: ReactNode
  onTransactionAdded?: () => void
}

const menuItems = [
  { label: 'Anggota Keluarga', icon: 'tabler-users', path: '/apps/tabungan/family-members' },
  { label: 'Kategori Tabungan', icon: 'tabler-pig-money', path: '/apps/tabungan/categories/savings' },
  { label: 'Kategori Pengeluaran', icon: 'tabler-shopping-cart', path: '/apps/tabungan/categories/expenses' },
  { label: 'Backup & Restore', icon: 'tabler-database', path: '/apps/tabungan/backup' }
]

const MobileShell = ({ children, onTransactionAdded }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'en'

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleMenuItemClick = (path: string) => {
    router.push(`/${lang}${path}`)
    setMenuOpen(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0F1014' : '#F4F5FA',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: isDesktop ? 480 : '100%',
          minHeight: '100vh',
          position: 'relative',
          backgroundColor: isDark ? '#16181F' : '#FFFFFF',
          boxShadow: isDesktop ? '0 0 40px rgba(0,0,0,0.1)' : 'none',
          paddingBottom: '88px',
          overflow: 'hidden'
        }}
      >
        {children}
      </Box>

      <BottomNav onAddClick={() => setAddDialogOpen(true)} onMenuClick={() => setMenuOpen(true)} />

      <AddTransactionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false)
          onTransactionAdded?.()
        }}
      />

      <Drawer
        anchor='bottom'
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxWidth: isDesktop ? 480 : '100%',
            left: '50% !important',
            right: 'auto !important',
            transform: 'translateX(-50%) !important',
            pb: 2
          }
        }}
      >
        <Box sx={{ width: 40, height: 4, backgroundColor: 'divider', borderRadius: 2, mx: 'auto', mt: 1.5, mb: 2 }} />
        <Typography variant='h6' sx={{ px: 3, mb: 1, fontWeight: 700 }}>
          Menu Lainnya
        </Typography>
        <Divider />
        <List sx={{ pt: 1 }}>
          {menuItems.map(item => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton onClick={() => handleMenuItemClick(item.path)} sx={{ py: 1.5, px: 3 }}>
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(115, 103, 240, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className={item.icon} style={{ fontSize: 20, color: '#7367F0' }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                />
                <i className='tabler-chevron-right' style={{ fontSize: 18, opacity: 0.4 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  )
}

export default MobileShell
