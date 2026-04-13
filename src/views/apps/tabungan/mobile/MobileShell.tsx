'use client'

// React Imports
import type { ReactNode } from 'react';
import { useState } from 'react'

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

// Note: the CSS that hides the outer VerticalLayout chrome is rendered
// from the server component at `app/[lang]/(dashboard)/(private)/apps/
// tabungan/layout.tsx` so it's present on first paint — hiding it from
// a client-side `useEffect` caused a visible flash of the desktop
// chrome on every refresh before hydration landed.
const MobileShell = ({ children, onTransactionAdded }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const [addDialogOpen, setAddDialogOpen] = useState(false)

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
