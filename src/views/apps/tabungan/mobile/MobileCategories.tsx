'use client'

// React Imports
import { forwardRef, useMemo, useState } from 'react'
import type { ReactElement, Ref } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Fab from '@mui/material/Fab'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Popover from '@mui/material/Popover'
import LinearProgress from '@mui/material/LinearProgress'
import Slide from '@mui/material/Slide'
import type { SlideProps } from '@mui/material/Slide'
import { useTheme } from '@mui/material/styles'

// Utils
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'

// Skeletons
import { MobileListSkeleton } from './MobileSkeletons'

// Hooks
import { useTabunganData, invalidateTabuganKeys } from '@/hooks/useTabunganData'

// Contexts
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

// Types
import type { ExpenseCategoryType, SavingsCategoryType, StorageTypeType } from '@/types/apps/tabunganTypes'

type Kind = 'savings' | 'expenses'

type Props = {
  kind: Kind
}

const Transition = forwardRef(function Transition(
  props: SlideProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatRupiahInput = (value: string) => value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const parseRupiahInput = (value: string) => value.replace(/\./g, '')

const savingsIcons = [
  { label: 'Tabungan', value: 'tabler-coins' },
  { label: 'Dompet', value: 'tabler-wallet' },
  { label: 'Uang', value: 'tabler-cash' },
  { label: 'Koin', value: 'tabler-coin' },
  { label: 'Bank', value: 'tabler-building-bank' },
  { label: 'Rumah', value: 'tabler-home' },
  { label: 'Mobil', value: 'tabler-car' },
  { label: 'Motor', value: 'tabler-motorbike' },
  { label: 'Pesawat', value: 'tabler-plane' },
  { label: 'Liburan', value: 'tabler-beach' },
  { label: 'Pendidikan', value: 'tabler-school' },
  { label: 'Buku', value: 'tabler-book' },
  { label: 'Laptop', value: 'tabler-device-laptop' },
  { label: 'Kesehatan', value: 'tabler-heart' },
  { label: 'Pernikahan', value: 'tabler-heart-handshake' },
  { label: 'Bayi', value: 'tabler-baby-carriage' },
  { label: 'Hadiah', value: 'tabler-gift' },
  { label: 'Target', value: 'tabler-target' },
  { label: 'Bintang', value: 'tabler-star' },
  { label: 'Diamond', value: 'tabler-diamond' },
  { label: 'Pertumbuhan', value: 'tabler-trending-up' },
  { label: 'Trophy', value: 'tabler-trophy' },
  { label: 'HP', value: 'tabler-device-mobile' },
  { label: 'Komputer', value: 'tabler-device-desktop' },
  { label: 'Kamera', value: 'tabler-camera' },
  { label: 'Belanja', value: 'tabler-shopping-cart' },
  { label: 'Kalender', value: 'tabler-calendar' },
  { label: 'Gembok', value: 'tabler-lock' },
  { label: 'Kunci', value: 'tabler-key' },
  { label: 'Hati', value: 'tabler-heart-filled' }
]

const expenseIcons = [
  { label: 'Makanan', value: 'tabler-tools-kitchen-2' },
  { label: 'Restoran', value: 'tabler-chef-hat' },
  { label: 'Kopi', value: 'tabler-coffee' },
  { label: 'Belanja', value: 'tabler-shopping-cart' },
  { label: 'Tas Belanja', value: 'tabler-shopping-bag' },
  { label: 'Keranjang', value: 'tabler-basket' },
  { label: 'Mobil', value: 'tabler-car' },
  { label: 'Motor', value: 'tabler-motorbike' },
  { label: 'Bus', value: 'tabler-bus' },
  { label: 'Kereta', value: 'tabler-train' },
  { label: 'Pesawat', value: 'tabler-plane' },
  { label: 'Bensin', value: 'tabler-gas-station' },
  { label: 'Listrik', value: 'tabler-bolt' },
  { label: 'Air', value: 'tabler-droplet' },
  { label: 'Internet', value: 'tabler-wifi' },
  { label: 'Telepon', value: 'tabler-phone' },
  { label: 'Rumah', value: 'tabler-home' },
  { label: 'Sewa', value: 'tabler-key' },
  { label: 'Kesehatan', value: 'tabler-heart-rate-monitor' },
  { label: 'Dokter', value: 'tabler-stethoscope' },
  { label: 'Obat', value: 'tabler-pill' },
  { label: 'Pendidikan', value: 'tabler-school' },
  { label: 'Buku', value: 'tabler-book' },
  { label: 'Hiburan', value: 'tabler-movie' },
  { label: 'Musik', value: 'tabler-music' },
  { label: 'Game', value: 'tabler-device-gamepad-2' },
  { label: 'Gym', value: 'tabler-barbell' },
  { label: 'Pakaian', value: 'tabler-shirt' },
  { label: 'Sepatu', value: 'tabler-shoe' },
  { label: 'Asuransi', value: 'tabler-shield-check' },
  { label: 'Pajak', value: 'tabler-receipt-tax' },
  { label: 'Bank', value: 'tabler-building-bank' },
  { label: 'Hadiah', value: 'tabler-gift' },
  { label: 'Donasi', value: 'tabler-heart-handshake' },
  { label: 'Zakat', value: 'tabler-hand-love' },
  { label: 'Lainnya', value: 'tabler-dots' }
]

const colorPresets = [
  '#f44336', '#e53935', '#d32f2f', '#c62828',
  '#e91e63', '#d81b60', '#c2185b', '#ad1457',
  '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a',
  '#673ab7', '#5e35b1', '#512da8', '#4527a0',
  '#3f51b5', '#3949ab', '#303f9f', '#283593',
  '#2196f3', '#1e88e5', '#1976d2', '#1565c0',
  '#03a9f4', '#039be5', '#0288d1', '#0277bd',
  '#00bcd4', '#00acc1', '#0097a7', '#00838f',
  '#009688', '#00897b', '#00796b', '#00695c',
  '#4caf50', '#43a047', '#388e3c', '#2e7d32',
  '#8bc34a', '#7cb342', '#689f38', '#558b2f',
  '#ffeb3b', '#fdd835', '#fbc02d', '#f9a825',
  '#ffc107', '#ffb300', '#ffa000', '#ff8f00',
  '#ff9800', '#fb8c00', '#f57c00', '#ef6c00',
  '#ff5722', '#f4511e', '#e64a19', '#d84315',
  '#795548', '#6d4c41', '#5d4037', '#4e342e',
  '#9e9e9e', '#757575', '#616161', '#424242',
  '#607d8b', '#546e7a', '#455a64', '#37474f'
]

type CategoryUnion = SavingsCategoryType | ExpenseCategoryType

const MobileCategories = ({ kind }: Props) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const dict = useTabunganDictionary()

  const isSavings = kind === 'savings'
  const iconSuggestions = isSavings ? savingsIcons : expenseIcons
  const apiPath = isSavings ? '/api/apps/tabungan/savings-categories' : '/api/apps/tabungan/expense-categories'
  const pageDict = isSavings ? dict.savingsCategoriesPage : dict.expenseCategoriesPage
  const pageTitle = pageDict.title
  const addLabel = pageDict.add
  const editLabel = pageDict.edit
  const emptyMsg = pageDict.empty
  const amountLabel = isSavings ? dict.savingsCategoriesPage.target : dict.expenseCategoriesPage.budget

  const { data: categoriesData, isLoading, mutate } = useTabunganData<CategoryUnion[]>(apiPath)
  const { data: storageData } = useTabunganData<StorageTypeType[]>('/api/apps/tabungan/storage-types')

  const data = Array.isArray(categoriesData) ? categoriesData : []
  const storageTypes = Array.isArray(storageData) ? storageData : []
  const loading = isLoading && data.length === 0

  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
    amount: '',
    storageTypeId: ''
  })

  const refresh = () => {
    mutate().catch(() => {})
    invalidateTabuganKeys(['/api/apps/tabungan/stats'])
  }

  const totalAmount = useMemo(() => {
    return data.reduce((sum, c) => {
      const v = isSavings
        ? (c as SavingsCategoryType).targetAmount || 0
        : (c as ExpenseCategoryType).budgetLimit || 0

      return sum + v
    }, 0)
  }, [data, isSavings])

  const handleOpenDialog = (category?: CategoryUnion) => {
    if (category) {
      const amt = isSavings
        ? (category as SavingsCategoryType).targetAmount
        : (category as ExpenseCategoryType).budgetLimit

      setEditingId(category.id)
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
        amount: amt ? formatRupiahInput(amt.toString()) : '',
        storageTypeId: category.storageTypeId || ''
      })
    } else {
      setEditingId(null)
      setFormData({ name: '', description: '', icon: '', color: '', amount: '', storageTypeId: '' })
    }

    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST'
      const amountKey = isSavings ? 'targetAmount' : 'budgetLimit'

      const submitData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        storageTypeId: formData.storageTypeId,
        [amountKey]: parseRupiahInput(formData.amount)
      }

      if (editingId) submitData.id = editingId

      const res = await fetch(apiPath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!res.ok) throw new Error('Failed to save')

      handleCloseDialog()
      refresh()
      showSuccessToast(editingId ? pageDict.updateSuccess : pageDict.addSuccess)
    } catch (error) {
      console.error('Failed to save category:', error)
      showErrorToast(editingId ? pageDict.updateFail : pageDict.addFail)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm(pageDict.deleteConfirm)

    if (confirmed) {
      try {
        const res = await fetch(`${apiPath}?id=${id}`, { method: 'DELETE' })

        if (!res.ok) throw new Error('Failed to delete')
        refresh()
        showSuccessToast(pageDict.deleteSuccess)
      } catch (error) {
        console.error('Failed to delete category:', error)
        showErrorToast(pageDict.deleteFail)
      }
    }
  }

  if (loading) {
    return <MobileListSkeleton rows={5} />
  }

  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 12 }}>
      {/* Summary card */}
      <Box
        sx={{
          p: 2,
          borderRadius: '16px',
          mb: 2,
          backgroundColor: isDark ? 'rgba(115, 103, 240, 0.1)' : 'rgba(115, 103, 240, 0.05)',
          border: 1,
          borderColor: isDark ? 'rgba(115, 103, 240, 0.2)' : 'rgba(115, 103, 240, 0.15)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {pageTitle}
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(115, 103, 240, 0.2)' : 'rgba(115, 103, 240, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i
              className={isSavings ? 'tabler-coin' : 'tabler-shopping-cart'}
              style={{ fontSize: 18, color: theme.palette.primary.main }}
            />
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: 'primary.main' }}>
          {formatCurrency(totalAmount)}
        </Typography>
        <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {data.length} • {isSavings ? dict.savingsCategoriesPage.target : dict.expenseCategoriesPage.budget}
        </Typography>
      </Box>

      {/* Category list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map(category => {
          const amt = isSavings
            ? (category as SavingsCategoryType).targetAmount
            : (category as ExpenseCategoryType).budgetLimit

          const accent = category.color || theme.palette.primary.main

          return (
            <Box
              key={category.id}
              onClick={() => handleOpenDialog(category)}
              sx={{
                p: 2,
                borderRadius: '16px',
                cursor: 'pointer',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                border: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: isDark ? 'rgba(115, 103, 240, 0.4)' : 'rgba(115, 103, 240, 0.3)',
                  backgroundColor: isDark ? 'rgba(115, 103, 240, 0.06)' : 'rgba(115, 103, 240, 0.03)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: `${accent}22`,
                    border: `1px solid ${accent}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <i
                    className={category.icon || (isSavings ? 'tabler-coin' : 'tabler-shopping-cart')}
                    style={{ fontSize: 22, color: accent }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {category.name}
                  </Typography>
                  {category.description && (
                    <Typography
                      variant='caption'
                      sx={{
                        fontSize: '0.72rem',
                        color: 'text.secondary',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {category.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                    {category.storageType && (
                      <>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: category.storageType.color || '#7367F0'
                          }}
                        />
                        <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {category.storageType.name}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: accent }}>
                    {amt ? formatCurrency(amt) : '—'}
                  </Typography>
                  <Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    {isSavings ? dict.savingsCategoriesPage.target : dict.expenseCategoriesPage.budget}
                  </Typography>
                </Box>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(category.id)
                  }}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    backgroundColor: isDark ? 'rgba(234, 84, 85, 0.15)' : 'rgba(234, 84, 85, 0.08)',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(234, 84, 85, 0.25)' : 'rgba(234, 84, 85, 0.15)'
                    }
                  }}
                >
                  <i className='tabler-trash' style={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              {isSavings && amt && amt > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant='determinate'
                    value={0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': { backgroundColor: accent }
                    }}
                  />
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {data.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <i
            className={isSavings ? 'tabler-coin' : 'tabler-shopping-cart-off'}
            style={{ fontSize: 64, opacity: 0.3 }}
          />
          <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>{emptyMsg}</Typography>
        </Box>
      )}

      <Fab
        color='primary'
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          zIndex: 1200,
          boxShadow: '0 8px 20px rgba(115, 103, 240, 0.4)'
        }}
      >
        <i className='tabler-plus' style={{ fontSize: 24 }} />
      </Fab>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen
        TransitionComponent={Transition}
        PaperProps={{
          sx: { backgroundColor: isDark ? theme.palette.background.default : '#fff' }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            px: 2,
            py: 1.5
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{editingId ? editLabel : addLabel}</Typography>
          <IconButton onClick={handleCloseDialog} size='small'>
            <i className='tabler-x' style={{ fontSize: 22 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label={pageDict.name}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label={dict.fields.description}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <Autocomplete
              freeSolo
              options={iconSuggestions}
              getOptionLabel={option => (typeof option === 'string' ? option : option.value)}
              value={formData.icon}
              onChange={(_, newValue) => {
                const value = typeof newValue === 'string' ? newValue : newValue?.value || ''

                setFormData({ ...formData, icon: value })
              }}
              onInputChange={(_, newValue) => setFormData({ ...formData, icon: newValue })}
              renderOption={(props, option) => (
                <Box component='li' {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <i className={`${option.value} text-xl`} />
                  <span>{option.label}</span>
                </Box>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  label={pageDict.icon}
                  placeholder={pageDict.icon}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: formData.icon ? (
                      <i
                        className={formData.icon}
                        style={{ marginRight: 8, color: formData.color || undefined, fontSize: 20 }}
                      />
                    ) : null
                  }}
                />
              )}
            />
            <TextField
              fullWidth
              label={pageDict.color}
              value={formData.color}
              onChange={e => setFormData({ ...formData, color: e.target.value })}
              placeholder='#f44336'
              onClick={e => setColorAnchor(e.currentTarget as HTMLElement)}
              InputProps={{
                startAdornment: (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      backgroundColor: formData.color || '#ccc',
                      border: '1px solid rgba(0,0,0,0.2)',
                      mr: 1,
                      flexShrink: 0
                    }}
                  />
                )
              }}
            />
            <Popover
              open={Boolean(colorAnchor)}
              anchorEl={colorAnchor}
              onClose={() => setColorAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, maxWidth: 280, maxHeight: 280, overflowY: 'auto' }}>
                <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                  {pageDict.color}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
                  {colorPresets.map(color => (
                    <Box
                      key={color}
                      onClick={() => {
                        setFormData({ ...formData, color })
                        setColorAnchor(null)
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)',
                        '&:hover': { transform: 'scale(1.15)' },
                        transition: 'transform 0.15s'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Popover>
            <TextField
              fullWidth
              label={amountLabel}
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: formatRupiahInput(e.target.value) })}
              placeholder='0'
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
              }}
            />
            <TextField
              select
              fullWidth
              label={dict.fields.storage}
              value={formData.storageTypeId}
              onChange={e => setFormData({ ...formData, storageTypeId: e.target.value })}
            >
              <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
              {storageTypes.map(st => (
                <MenuItem key={st.id} value={st.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {st.icon && <i className={st.icon} style={{ color: st.color || undefined }} />}
                    {st.name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2,
            py: 2,
            borderTop: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            gap: 1
          }}
        >
          <Button onClick={handleCloseDialog} color='secondary' variant='outlined' fullWidth>
            {dict.common.cancel}
          </Button>
          <Button onClick={handleSubmit} variant='contained' fullWidth>
            {dict.common.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MobileCategories
