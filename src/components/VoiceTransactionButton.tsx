'use client'

import { useState, useCallback } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'

import { useVoiceInput } from '@/hooks/useVoiceInput'
import { parseVoiceTransaction } from '@/utils/voiceTransactionParser'
import type { ParsedTransaction } from '@/utils/voiceTransactionParser'

type Props = {
  onParsed: (data: ParsedTransaction) => void
  lang?: string
}

const formatRupiahInput = (value: string) => {
  const numericValue = value.replace(/\D/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const typeLabels: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  savings: 'Tabungan',
  transfer: 'Transfer'
}

const VoiceTransactionButton = ({ onParsed, lang = 'id-ID' }: Props) => {
  const [showDialog, setShowDialog] = useState(false)
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null)

  const { isListening, isSupported, transcript, error, toggleListening, stopListening } = useVoiceInput({
    lang,
    onResult: useCallback((text: string, isFinal: boolean) => {
      if (isFinal) {
        const result = parseVoiceTransaction(text)
        setParsed(result)
      }
    }, []),
    onError: useCallback(() => {
      // Error is already stored in hook state
    }, [])
  })

  const handleOpen = () => {
    setParsed(null)
    setShowDialog(true)
  }

  const handleClose = () => {
    stopListening()
    setParsed(null)
    setShowDialog(false)
  }

  const handleApply = () => {
    if (parsed) {
      onParsed(parsed)
      handleClose()
    }
  }

  const handleRetry = () => {
    setParsed(null)
    toggleListening()
  }

  if (!isSupported) return null

  return (
    <>
      <Tooltip title='Input dengan suara'>
        <IconButton
          onClick={handleOpen}
          color='primary'
          sx={{
            bgcolor: 'primary.lighter',
            '&:hover': { bgcolor: 'primary.light' }
          }}
        >
          <i className='tabler-microphone' />
        </IconButton>
      </Tooltip>

      <Dialog
        open={showDialog}
        onClose={handleClose}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          {/* Mic Button */}
          <Box
            onClick={toggleListening}
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: isListening ? 'error.main' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(255, 77, 73, 0.4)' },
                '70%': { boxShadow: '0 0 0 20px rgba(255, 77, 73, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(255, 77, 73, 0)' }
              },
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <i
              className={isListening ? 'tabler-player-stop-filled' : 'tabler-microphone'}
              style={{ fontSize: '2rem', color: 'white' }}
            />
          </Box>

          <Typography variant='h6' sx={{ mb: 0.5 }}>
            {isListening ? 'Mendengarkan...' : parsed ? 'Hasil' : 'Tap untuk mulai bicara'}
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {isListening
              ? 'Contoh: "pengeluaran 50 ribu beli nasi goreng"'
              : !parsed && !error
                ? 'Ucapkan jenis, jumlah, dan keterangan transaksi'
                : ''}
          </Typography>

          {/* Transcript */}
          {(transcript || isListening) && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant='body1' sx={{ fontStyle: transcript ? 'normal' : 'italic' }}>
                {transcript || '...'}
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && (
            <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'error.lighter' }}>
              <Typography variant='body2' color='error.main'>
                {error}
              </Typography>
            </Box>
          )}

          {/* Parsed Result */}
          {parsed && !isListening && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
                {parsed.type && (
                  <Chip
                    label={typeLabels[parsed.type]}
                    color={
                      parsed.type === 'income'
                        ? 'success'
                        : parsed.type === 'expense'
                          ? 'error'
                          : parsed.type === 'transfer'
                            ? 'warning'
                            : 'info'
                    }
                    icon={
                      <i
                        className={
                          parsed.type === 'income'
                            ? 'tabler-arrow-up'
                            : parsed.type === 'expense'
                              ? 'tabler-arrow-down'
                              : parsed.type === 'transfer'
                                ? 'tabler-transfer'
                                : 'tabler-coin'
                        }
                        style={{ fontSize: '1rem' }}
                      />
                    }
                  />
                )}
                {parsed.amount && (
                  <Chip
                    label={`Rp${formatRupiahInput(parsed.amount.toString())}`}
                    color='primary'
                    variant='outlined'
                    icon={<i className='tabler-cash' style={{ fontSize: '1rem' }} />}
                  />
                )}
              </Box>
              {parsed.storageHint && (
                <Chip
                  label={`Simpanan: ${parsed.storageHint}`}
                  variant='outlined'
                  size='small'
                  icon={<i className='tabler-building-bank' style={{ fontSize: '1rem' }} />}
                  sx={{ mb: 0.5 }}
                />
              )}
              {parsed.categoryHint && (
                <Chip
                  label={`Kategori: ${parsed.categoryHint}`}
                  variant='outlined'
                  size='small'
                  icon={<i className='tabler-tag' style={{ fontSize: '1rem' }} />}
                  sx={{ mb: 0.5 }}
                />
              )}
              {parsed.description && (
                <Typography variant='body2' color='text.secondary'>
                  Keterangan: <strong>{parsed.description}</strong>
                </Typography>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {parsed && !isListening ? (
              <>
                <Button variant='outlined' onClick={handleRetry} startIcon={<i className='tabler-refresh' />}>
                  Ulang
                </Button>
                <Button variant='contained' onClick={handleApply} startIcon={<i className='tabler-check' />}>
                  Gunakan
                </Button>
              </>
            ) : (
              <Button variant='outlined' onClick={handleClose}>
                Batal
              </Button>
            )}
          </Box>
        </Box>
      </Dialog>
    </>
  )
}

export default VoiceTransactionButton
