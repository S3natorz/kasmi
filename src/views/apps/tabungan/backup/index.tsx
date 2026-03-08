'use client'

import { useRef, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'

const BackupRestore = () => {
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

      showSuccessToast('Backup berhasil didownload!')
    } catch (error) {
      console.error('Backup failed:', error)
      showErrorToast('Gagal membuat backup')
    } finally {
      setLoading(null)
    }
  }

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.data) {
        showErrorToast('Format file backup tidak valid')
        return
      }

      const confirmed = await showDeleteConfirm(
        'semua data saat ini. Data lama akan diganti dengan data dari backup'
      )

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
      showSuccessToast('Data berhasil di-restore!')
    } catch (error) {
      console.error('Restore failed:', error)
      showErrorToast('Gagal restore data. Pastikan file backup valid.')
    } finally {
      setLoading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>Backup & Restore</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Download backup database atau restore dari file backup
        </Typography>
      </Grid>

      {/* Backup Section */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title='Download Backup'
            subheader='Export semua data ke file JSON'
            avatar={
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className='tabler-download' style={{ fontSize: '1.5rem', color: 'var(--mui-palette-success-main)' }} />
              </Box>
            }
          />
          <CardContent>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              File backup berisi semua data: anggota keluarga, jenis simpanan, kategori, dan transaksi.
              Simpan file ini di tempat yang aman.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity='info' variant='outlined' sx={{ fontSize: '0.8rem' }}>
                Disarankan backup secara berkala untuk mencegah kehilangan data
              </Alert>

              <Button
                variant='contained'
                color='success'
                size='large'
                fullWidth
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
                {loading === 'backup' ? 'Mengunduh...' : 'Download Backup'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Restore Section */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title='Restore Data'
            subheader='Import data dari file backup JSON'
            avatar={
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'warning.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className='tabler-upload' style={{ fontSize: '1.5rem', color: 'var(--mui-palette-warning-main)' }} />
              </Box>
            }
          />
          <CardContent>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Upload file backup untuk mengembalikan data. Semua data saat ini akan diganti
              dengan data dari file backup.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity='warning' variant='outlined' sx={{ fontSize: '0.8rem' }}>
                Restore akan menghapus semua data saat ini dan menggantinya dengan data dari backup
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
                {loading === 'restore' ? 'Memulihkan...' : 'Pilih File & Restore'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Restore Result */}
      {restoreResult && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Alert severity='success' sx={{ mb: 3 }}>
                {restoreResult.message}
              </Alert>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>
                Data yang di-restore:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(restoreResult.counts).map(([key, count]) => {
                  const labels: Record<string, string> = {
                    familyMembers: 'Anggota Keluarga',
                    storageTypes: 'Jenis Simpanan',
                    savingsCategories: 'Kategori Tabungan',
                    expenseCategories: 'Kategori Pengeluaran',
                    transactions: 'Transaksi'
                  }
                  return (
                    <Chip
                      key={key}
                      label={`${labels[key] || key}: ${count}`}
                      color='success'
                      variant='tonal'
                    />
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default BackupRestore
