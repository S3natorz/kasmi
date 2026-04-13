'use client'

import { useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'

import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

const MobileBackup = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const dict = useTabunganDictionary()

  const labels: Record<string, string> = {
    familyMembers: dict.backup.items.familyMembers,
    storageTypes: dict.backup.items.storageTypes,
    savingsCategories: dict.backup.items.savingsCategories,
    expenseCategories: dict.backup.items.expenseCategories,
    transactions: dict.backup.items.transactions
  }

  const [loading, setLoading] = useState<'backup' | 'restore' | null>(null)
  const [restoreResult, setRestoreResult] = useState<{
    message: string
    counts: Record<string, number>
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBackup = async () => {
    try {
      setLoading('backup')
      const res = await fetch('/api/apps/tabungan/backup')

      if (!res.ok) throw new Error('Backup gagal')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kasmi-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showSuccessToast(dict.backup.downloadSuccess)
    } catch (error) {
      console.error('Backup failed:', error)
      showErrorToast(dict.backup.downloadFail)
    } finally {
      setLoading(null)
    }
  }

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.data) {
        showErrorToast(dict.backup.invalidFormat)

        return
      }

      const confirmed = await showDeleteConfirm(dict.backup.restoreConfirmTarget)

      if (!confirmed) return

      setLoading('restore')
      setRestoreResult(null)

      const res = await fetch('/api/apps/tabungan/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Restore gagal')

      setRestoreResult(result)
      showSuccessToast(dict.backup.restoreSuccess)
    } catch (error) {
      console.error('Restore failed:', error)
      showErrorToast(dict.backup.restoreFail)
    } finally {
      setLoading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Box sx={{ px: 2, pt: 2, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Page Title */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isDark ? 'rgba(115, 103, 240, 0.16)' : 'rgba(115, 103, 240, 0.12)',
            color: 'primary.main'
          }}
        >
          <i className='tabler-database-export' style={{ fontSize: '2.25rem' }} />
        </Box>
        <Typography variant='h5' sx={{ fontWeight: 700, textAlign: 'center' }}>
          {dict.backup.title}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
          {dict.backup.subtitle}
        </Typography>
      </Box>

      {/* Card 1: Download Backup */}
      <Card
        sx={{
          borderRadius: '18px',
          bgcolor: isDark ? 'rgba(40, 199, 111, 0.08)' : 'rgba(40, 199, 111, 0.06)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(40, 199, 111, 0.24)' : 'rgba(40, 199, 111, 0.20)',
          boxShadow: 'none'
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark ? 'rgba(40, 199, 111, 0.18)' : 'rgba(40, 199, 111, 0.14)',
                color: 'success.main'
              }}
            >
              <i className='tabler-download' style={{ fontSize: '2rem' }} />
            </Box>
            <Typography variant='h6' sx={{ fontWeight: 700, textAlign: 'center' }}>
              {dict.backup.downloadCardTitle}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', lineHeight: 1.5 }}>
              {dict.backup.downloadCardDesc}
            </Typography>
          </Box>

          <Alert severity='info' variant='outlined' sx={{ fontSize: '0.78rem', borderRadius: '12px' }}>
            {dict.backup.downloadInfo}
          </Alert>

          <Button
            variant='contained'
            color='success'
            size='large'
            fullWidth
            sx={{ borderRadius: '12px', py: 1.25, fontWeight: 600 }}
            startIcon={
              loading === 'backup' ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <i className='tabler-download' />
              )
            }
            onClick={handleBackup}
            disabled={loading !== null}
          >
            {loading === 'backup' ? dict.backup.downloadingBtn : dict.backup.downloadBtn}
          </Button>
        </CardContent>
      </Card>

      {/* Card 2: Restore Data */}
      <Card
        sx={{
          borderRadius: '18px',
          bgcolor: isDark ? 'rgba(255, 159, 67, 0.08)' : 'rgba(255, 159, 67, 0.06)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 159, 67, 0.24)' : 'rgba(255, 159, 67, 0.20)',
          boxShadow: 'none'
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark ? 'rgba(255, 159, 67, 0.18)' : 'rgba(255, 159, 67, 0.14)',
                color: 'warning.main'
              }}
            >
              <i className='tabler-upload' style={{ fontSize: '2rem' }} />
            </Box>
            <Typography variant='h6' sx={{ fontWeight: 700, textAlign: 'center' }}>
              {dict.backup.restoreCardTitle}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', lineHeight: 1.5 }}>
              {dict.backup.restoreCardDesc}
            </Typography>
          </Box>

          <Alert severity='warning' variant='outlined' sx={{ fontSize: '0.78rem', borderRadius: '12px' }}>
            {dict.backup.restoreWarn}
          </Alert>

          <input
            ref={fileInputRef}
            type='file'
            accept='.json'
            hidden
            onChange={e => {
              const file = e.target.files?.[0]

              if (file) handleRestore(file)
            }}
          />

          <Button
            variant='contained'
            color='warning'
            size='large'
            fullWidth
            sx={{ borderRadius: '12px', py: 1.25, fontWeight: 600 }}
            startIcon={
              loading === 'restore' ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <i className='tabler-upload' />
              )
            }
            onClick={() => fileInputRef.current?.click()}
            disabled={loading !== null}
          >
            {loading === 'restore' ? dict.backup.restoringBtn : dict.backup.restoreBtn}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Result */}
      {restoreResult && (
        <Card
          sx={{
            borderRadius: '18px',
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity='success' sx={{ borderRadius: '12px' }}>
              {restoreResult.message}
            </Alert>
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              {dict.backup.restoreResultTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(restoreResult.counts).map(([key, count]) => (
                <Chip
                  key={key}
                  label={`${labels[key] || key}: ${count}`}
                  color='success'
                  variant='tonal'
                  size='small'
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default MobileBackup
