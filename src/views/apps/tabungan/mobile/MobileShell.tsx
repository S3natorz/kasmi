'use client'

// React Imports
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// Component Imports
import BottomNav from './BottomNav'
import AddTransactionDialog from '@/components/dialogs/AddTransactionDialog'

type Props = {
  children: ReactNode
  onTransactionAdded?: () => void
}

const MobileShell = ({ children, onTransactionAdded }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Hide outer VerticalLayout navbar + sidebar so we get true fullscreen mobile feel
  useEffect(() => {
    const styleId = 'kasmi-mobile-shell-style'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      styleEl.innerHTML = `
        body.kasmi-mobile-active .ts-vertical-layout-header,
        body.kasmi-mobile-active .ts-vertical-nav-root,
        body.kasmi-mobile-active .ts-vertical-layout-footer,
        body.kasmi-mobile-active .customizer {
          display: none !important;
        }
        body.kasmi-mobile-active .ts-vertical-layout-content-wrapper,
        body.kasmi-mobile-active .ts-vertical-layout-content {
          padding: 0 !important;
          margin: 0 !important;
          max-width: 100% !important;
        }
        body.kasmi-mobile-active main {
          padding: 0 !important;
        }
      `
      document.head.appendChild(styleEl)
    }

    document.body.classList.add('kasmi-mobile-active')

    return () => {
      document.body.classList.remove('kasmi-mobile-active')
    }
  }, [])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0B0C10' : '#F4F5FA',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: isDesktop ? 480 : '100%',
          minHeight: '100vh',
          position: 'relative',
          backgroundColor: isDark ? '#15171E' : '#FFFFFF',
          boxShadow: isDesktop ? '0 0 40px rgba(0,0,0,0.3)' : 'none',
          paddingBottom: '88px'
        }}
      >
        {children}
      </Box>

      <BottomNav onAddClick={() => setAddDialogOpen(true)} />

      <AddTransactionDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false)
          onTransactionAdded?.()
        }}
      />
    </Box>
  )
}

export default MobileShell
