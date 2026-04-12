'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

type Props = {
  title?: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  avatar?: string
}

const TopBar = ({ title = 'Kasmi', subtitle, showBack = false, onBack, rightAction, avatar }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        width: '100%',
        maxWidth: isDesktop ? 480 : '100%',
        zIndex: 1100,
        backgroundColor: isDark ? 'rgba(22, 24, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
          px: 2,
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          {showBack ? (
            <IconButton onClick={onBack} size='small' sx={{ ml: -1 }}>
              <i className='tabler-chevron-left' style={{ fontSize: 24 }} />
            </IconButton>
          ) : (
            <Avatar
              src={avatar}
              sx={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #7367F0 0%, #9E95F5 100%)',
                fontSize: 16,
                fontWeight: 700
              }}
            >
              {title.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant='h6'
              sx={{
                fontSize: '1.05rem',
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.72rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {rightAction && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{rightAction}</Box>}
      </Box>
    </Box>
  )
}

export default TopBar
