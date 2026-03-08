'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import VoiceTransactionButton from '@/components/VoiceTransactionButton'

// Utils
import { showSuccessToast, showErrorToast } from '@/utils/swal'
import { fuzzyMatchName } from '@/utils/voiceTransactionParser'
import type { ParsedTransaction } from '@/utils/voiceTransactionParser'

// Types
import type {
  FamilyMemberType,
  SavingsCategoryType,
  ExpenseCategoryType,
  StorageTypeType
} from '@/types/apps/tabunganTypes'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialVoiceData?: ParsedTransaction | null
}

// Format number with thousand separator (dots)
const formatRupiahInput = (value: string) => {
  const numericValue = value.replace(/\D/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Parse formatted value back to number string
const parseRupiahInput = (value: string) => {
  return value.replace(/\./g, '')
}

const AddTransactionDialog = ({ open, onClose, onSuccess, initialVoiceData }: Props) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense' | 'savings' | 'transfer',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    familyMemberId: '',
    savingsCategoryId: '',
    expenseCategoryId: '',
    fromStorageTypeId: '',
    toStorageTypeId: ''
  })

  // Reference data
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberType[]>([])
  const [savingsCategories, setSavingsCategories] = useState<SavingsCategoryType[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryType[]>([])
  const [storageTypes, setStorageTypes] = useState<StorageTypeType[]>([])
  const [txPatterns, setTxPatterns] = useState<Record<string, {
    fromStorageTypeId: string
    toStorageTypeId: string
    expenseCategoryId: string
    savingsCategoryId: string
    descriptionToCategory: Record<string, string>
  }>>({})

  const fetchReferenceData = async () => {
    try {
      const [membersRes, savingsRes, expensesRes, storageRes, patternsRes] = await Promise.all([
        fetch('/api/apps/tabungan/family-members'),
        fetch('/api/apps/tabungan/savings-categories'),
        fetch('/api/apps/tabungan/expense-categories'),
        fetch('/api/apps/tabungan/storage-types'),
        fetch('/api/apps/tabungan/transaction-patterns')
      ])

      const [members, savings, expenses, storages, patterns] = await Promise.all([
        membersRes.json(),
        savingsRes.json(),
        expensesRes.json(),
        storageRes.json(),
        patternsRes.json()
      ])

      setFamilyMembers(Array.isArray(members) ? members : [])
      setSavingsCategories(Array.isArray(savings) ? savings : [])
      setExpenseCategories(Array.isArray(expenses) ? expenses : [])
      setStorageTypes(Array.isArray(storages) ? storages : [])
      setTxPatterns(patterns && typeof patterns === 'object' ? patterns : {})
    } catch (error) {
      console.error('Failed to fetch reference data:', error)
    }
  }

  const [pendingVoiceData, setPendingVoiceData] = useState<ParsedTransaction | null>(null)

  useEffect(() => {
    if (open) {
      fetchReferenceData()
      // Reset form when dialog opens
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        familyMemberId: '',
        savingsCategoryId: '',
        expenseCategoryId: '',
        fromStorageTypeId: '',
        toStorageTypeId: ''
      })

      if (initialVoiceData) {
        setPendingVoiceData(initialVoiceData)
      }
    }
  }, [open, initialVoiceData])

  // Apply voice data after reference data is loaded
  useEffect(() => {
    if (pendingVoiceData && storageTypes.length > 0) {
      handleVoiceParsed(pendingVoiceData)
      setPendingVoiceData(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVoiceData, storageTypes])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const submitData = {
        ...formData,
        amount: parseRupiahInput(formData.amount)
      }

      const response = await fetch('/api/apps/tabungan/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showSuccessToast('Transaksi berhasil ditambahkan!')
        onClose()
        onSuccess?.()
      } else {
        showErrorToast('Gagal menyimpan transaksi')
      }
    } catch (error) {
      console.error('Failed to save transaction:', error)
      showErrorToast('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = () => {
    switch (formData.type) {
      case 'income':
        return 'Pemasukan'
      case 'expense':
        return 'Pengeluaran'
      case 'savings':
        return 'Tabungan'
      case 'transfer':
        return 'Transfer'
      default:
        return ''
    }
  }

  const handleVoiceParsed = (data: ParsedTransaction) => {
    const type = data.type || 'expense'
    const storageItems = storageTypes.filter(s => !s.isGold).map(s => ({ id: s.id, name: s.name }))
    const expenseItems = expenseCategories.map(c => ({ id: c.id, name: c.name }))
    const savingsItems = savingsCategories.map(c => ({ id: c.id, name: c.name }))
    const pattern = txPatterns[type]

    // Fuzzy match storage from voice hint
    let matchedStorageId = data.storageHint ? fuzzyMatchName(data.storageHint, storageItems) : ''

    // Fuzzy match category from voice hint
    let matchedExpenseCategoryId = ''
    let matchedSavingsCategoryId = ''

    if (data.categoryHint) {
      if (type === 'expense') {
        matchedExpenseCategoryId = fuzzyMatchName(data.categoryHint, expenseItems)
      } else if (type === 'savings') {
        matchedSavingsCategoryId = fuzzyMatchName(data.categoryHint, savingsItems)
      }
    }

    // Auto-fill from description keywords if category not matched
    if (pattern?.descriptionToCategory && data.description) {
      const words = data.description.toLowerCase().split(/\s+/)

      if (type === 'expense' && !matchedExpenseCategoryId) {
        for (const word of words) {
          const catId = pattern.descriptionToCategory[word]

          if (catId && expenseItems.some(c => c.id === catId)) {
            matchedExpenseCategoryId = catId
            break
          }
        }
      }

      if (type === 'savings' && !matchedSavingsCategoryId) {
        for (const word of words) {
          const catId = pattern.descriptionToCategory[word]

          if (catId && savingsItems.some(c => c.id === catId)) {
            matchedSavingsCategoryId = catId
            break
          }
        }
      }
    }

    // Fallback to most frequently used patterns if not specified in voice
    if (pattern) {
      if (!matchedStorageId) {
        if (type === 'income') {
          matchedStorageId = pattern.toStorageTypeId || ''
        } else {
          matchedStorageId = pattern.fromStorageTypeId || ''
        }
      }

      if (type === 'expense' && !matchedExpenseCategoryId) {
        matchedExpenseCategoryId = pattern.expenseCategoryId || ''
      }

      if (type === 'savings' && !matchedSavingsCategoryId) {
        matchedSavingsCategoryId = pattern.savingsCategoryId || ''
      }
    }

    setFormData(prev => ({
      ...prev,
      type,
      ...(data.amount && { amount: formatRupiahInput(data.amount.toString()) }),
      ...(data.description && { description: data.description }),
      fromStorageTypeId: (type === 'expense' || type === 'savings' || type === 'transfer') ? matchedStorageId : '',
      toStorageTypeId: type === 'income' ? matchedStorageId : '',
      expenseCategoryId: matchedExpenseCategoryId,
      savingsCategoryId: matchedSavingsCategoryId
    }))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span>Tambah Transaksi</span>
          <VoiceTransactionButton onParsed={handleVoiceParsed} />
        </div>
        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={4} className='pt-2'>
          {/* Tipe Transaksi */}
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              select
              fullWidth
              label='Tipe Transaksi'
              value={formData.type}
              onChange={e =>
                setFormData({
                  ...formData,
                  type: e.target.value as any,
                  savingsCategoryId: '',
                  expenseCategoryId: '',
                  fromStorageTypeId: '',
                  toStorageTypeId: ''
                })
              }
            >
              <MenuItem value='income'>Pemasukan</MenuItem>
              <MenuItem value='expense'>Pengeluaran</MenuItem>
              <MenuItem value='savings'>Tabungan</MenuItem>
              <MenuItem value='transfer'>Transfer</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Jumlah */}
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Jumlah (Rp)'
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: formatRupiahInput(e.target.value) })}
              placeholder='0'
              slotProps={{
                input: {
                  startAdornment: <span className='mr-1'>Rp</span>
                }
              }}
            />
          </Grid>

          {/* Keterangan */}
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label='Keterangan'
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder='Contoh: Gaji bulanan'
            />
          </Grid>

          {/* Tanggal */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='date'
              label='Tanggal'
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Anggota Keluarga */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label='Anggota Keluarga'
              value={formData.familyMemberId}
              onChange={e => setFormData({ ...formData, familyMemberId: e.target.value })}
            >
              <MenuItem value=''>-- Pilih Anggota --</MenuItem>
              {familyMembers.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>

          {/* Masuk ke Simpanan (untuk income) */}
          {formData.type === 'income' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                required
                label='Masuk ke Simpanan'
                value={formData.toStorageTypeId}
                onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                error={!formData.toStorageTypeId}
                helperText={!formData.toStorageTypeId ? 'Pilih simpanan tujuan' : ''}
              >
                <MenuItem value=''>-- Pilih Simpanan --</MenuItem>
                {storageTypes
                  .filter(s => !s.isGold)
                  .map(storage => (
                    <MenuItem key={storage.id} value={storage.id}>
                      {storage.name}
                    </MenuItem>
                  ))}
              </CustomTextField>
            </Grid>
          )}

          {/* Ambil dari Simpanan (untuk expense/savings) */}
          {(formData.type === 'expense' || formData.type === 'savings') && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                required
                label='Ambil dari Simpanan'
                value={formData.fromStorageTypeId}
                onChange={e => setFormData({ ...formData, fromStorageTypeId: e.target.value })}
                error={!formData.fromStorageTypeId}
                helperText={!formData.fromStorageTypeId ? 'Pilih simpanan sumber' : ''}
              >
                <MenuItem value=''>-- Pilih Simpanan --</MenuItem>
                {storageTypes
                  .filter(s => !s.isGold)
                  .map(storage => (
                    <MenuItem key={storage.id} value={storage.id}>
                      {storage.name} (Saldo: Rp {(storage.balance || 0).toLocaleString('id-ID')})
                    </MenuItem>
                  ))}
              </CustomTextField>
            </Grid>
          )}

          {/* Transfer: From & To */}
          {formData.type === 'transfer' && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  required
                  label='Dari Simpanan'
                  value={formData.fromStorageTypeId}
                  onChange={e => setFormData({ ...formData, fromStorageTypeId: e.target.value })}
                  error={!formData.fromStorageTypeId}
                >
                  <MenuItem value=''>-- Pilih --</MenuItem>
                  {storageTypes
                    .filter(s => !s.isGold)
                    .map(storage => (
                      <MenuItem key={storage.id} value={storage.id}>
                        {storage.name}
                      </MenuItem>
                    ))}
                </CustomTextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  select
                  fullWidth
                  required
                  label='Ke Simpanan'
                  value={formData.toStorageTypeId}
                  onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                  error={!formData.toStorageTypeId}
                >
                  <MenuItem value=''>-- Pilih --</MenuItem>
                  {storageTypes
                    .filter(s => s.id !== formData.fromStorageTypeId && !s.isGold)
                    .map(storage => (
                      <MenuItem key={storage.id} value={storage.id}>
                        {storage.name}
                      </MenuItem>
                    ))}
                </CustomTextField>
              </Grid>
            </>
          )}

          {/* Kategori Tabungan */}
          {formData.type === 'savings' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Kategori Tabungan'
                value={formData.savingsCategoryId}
                onChange={e => setFormData({ ...formData, savingsCategoryId: e.target.value })}
              >
                <MenuItem value=''>-- Pilih Kategori --</MenuItem>
                {savingsCategories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          )}

          {/* Kategori Pengeluaran */}
          {formData.type === 'expense' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                required
                label='Kategori Pengeluaran'
                value={formData.expenseCategoryId}
                onChange={e => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                error={!formData.expenseCategoryId}
                helperText={!formData.expenseCategoryId ? 'Pilih kategori pengeluaran' : ''}
              >
                <MenuItem value=''>-- Pilih Kategori --</MenuItem>
                {expenseCategories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 p-4'>
        <Button variant='outlined' color='secondary' onClick={onClose}>
          Batal
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={
            loading ||
            !formData.amount ||
            (formData.type === 'income' && !formData.toStorageTypeId) ||
            ((formData.type === 'expense' || formData.type === 'savings') && !formData.fromStorageTypeId) ||
            (formData.type === 'expense' && !formData.expenseCategoryId) ||
            (formData.type === 'transfer' && (!formData.fromStorageTypeId || !formData.toStorageTypeId))
          }
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTransactionDialog
