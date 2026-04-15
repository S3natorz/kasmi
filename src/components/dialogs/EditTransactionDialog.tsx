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
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import VoiceTransactionButton from '@/components/VoiceTransactionButton'

// Context Imports
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

// Utils
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'
import { fuzzyMatchName } from '@/utils/voiceTransactionParser'
import type { ParsedTransaction } from '@/utils/voiceTransactionParser'
import { wibDateKey, wibToday } from '@/libs/wib'
import { invalidateMany } from '@/hooks/useTabunganData'

// Every cache key that derives from transactions or storage balances.
// Invalidated after any PUT/DELETE so the UI refetches without
// relying on realtime WebSocket events.
const MUTATION_INVALIDATION_KEYS = [
  '/api/apps/tabungan/transactions',
  '/api/apps/tabungan/stats',
  '/api/apps/tabungan/storage-types'
]

// Types
import type {
  FamilyMemberType,
  SavingsCategoryType,
  ExpenseCategoryType,
  StorageTypeType,
  TransactionType
} from '@/types/apps/tabunganTypes'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  transaction: TransactionType | null
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

const EditTransactionDialog = ({ open, onClose, onSuccess, transaction }: Props) => {
  const dict = useTabunganDictionary()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense' | 'savings' | 'transfer' | 'gold_income',
    amount: '',
    goldGrams: '',
    description: '',
    date: wibToday(),
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

  const fetchReferenceData = async () => {
    try {
      const [membersRes, savingsRes, expensesRes, storageRes] = await Promise.all([
        fetch('/api/apps/tabungan/family-members'),
        fetch('/api/apps/tabungan/savings-categories'),
        fetch('/api/apps/tabungan/expense-categories'),
        fetch('/api/apps/tabungan/storage-types')
      ])

      const [members, savings, expenses, storages] = await Promise.all([
        membersRes.json(),
        savingsRes.json(),
        expensesRes.json(),
        storageRes.json()
      ])

      setFamilyMembers(Array.isArray(members) ? members : [])
      setSavingsCategories(Array.isArray(savings) ? savings : [])
      setExpenseCategories(Array.isArray(expenses) ? expenses : [])
      setStorageTypes(Array.isArray(storages) ? storages : [])
    } catch (error) {
      console.error('Failed to fetch reference data:', error)
    }
  }

  useEffect(() => {
    if (open && transaction) {
      fetchReferenceData()
      // Populate form with transaction data
      setFormData({
        type: transaction.type,
        amount: transaction.type === 'gold_income' ? '' : formatRupiahInput(transaction.amount.toString()),
        goldGrams: transaction.type === 'gold_income' ? transaction.amount.toString() : '',
        description: transaction.description || '',
        date: wibDateKey(transaction.date),
        familyMemberId: transaction.familyMemberId || '',
        savingsCategoryId: transaction.savingsCategoryId || '',
        expenseCategoryId: transaction.expenseCategoryId || '',
        fromStorageTypeId: transaction.fromStorageTypeId || '',
        toStorageTypeId: transaction.toStorageTypeId || ''
      })
    }
  }, [open, transaction])

  const handleSubmit = async () => {
    if (!transaction) return

    try {
      setLoading(true)
      const submitData = {
        id: transaction.id,
        ...formData,
        amount: formData.type === 'gold_income' ? formData.goldGrams : parseRupiahInput(formData.amount),
        ...(formData.type === 'gold_income' && { goldGrams: parseFloat(formData.goldGrams) || 0 })
      }

      const response = await fetch('/api/apps/tabungan/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showSuccessToast(dict.dialogs.updateSuccess)

        // Bust every cache that depends on transactions / balances so
        // mounted SWR consumers (Home, Carousel, Transactions list,
        // Storage dialogs) revalidate immediately — not dependent on
        // realtime WebSocket invalidation.
        invalidateMany(MUTATION_INVALIDATION_KEYS)
        onClose()
        onSuccess?.()
      } else {
        showErrorToast(dict.dialogs.updateFail)
      }
    } catch (error) {
      console.error('Failed to update transaction:', error)
      showErrorToast(dict.dialogs.error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction) return

    const confirmed = await showDeleteConfirm(dict.dialogs.deleteConfirmTarget)
    if (confirmed) {
      try {
        setLoading(true)
        const response = await fetch(`/api/apps/tabungan/transactions?id=${transaction.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showSuccessToast(dict.dialogs.deleteSuccess)
          invalidateMany(MUTATION_INVALIDATION_KEYS)
          onClose()
          onSuccess?.()
        } else {
          showErrorToast(dict.dialogs.deleteFail)
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        showErrorToast(dict.dialogs.error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleVoiceParsed = (data: ParsedTransaction) => {
    const type = data.type || formData.type
    const storageItems = storageTypes.filter(s => !s.isGold).map(s => ({ id: s.id, name: s.name }))
    const expenseItems = expenseCategories.map(c => ({ id: c.id, name: c.name }))
    const savingsItems = savingsCategories.map(c => ({ id: c.id, name: c.name }))

    const matchedStorageId = data.storageHint ? fuzzyMatchName(data.storageHint, storageItems) : ''
    let matchedExpenseCategoryId = ''
    let matchedSavingsCategoryId = ''

    if (data.categoryHint) {
      if (type === 'expense') {
        matchedExpenseCategoryId = fuzzyMatchName(data.categoryHint, expenseItems)
      } else if (type === 'savings') {
        matchedSavingsCategoryId = fuzzyMatchName(data.categoryHint, savingsItems)
      }
    }

    setFormData(prev => ({
      ...prev,
      type,
      ...(data.amount && { amount: formatRupiahInput(data.amount.toString()) }),
      ...(data.description && { description: data.description }),
      fromStorageTypeId: (type === 'expense' || type === 'savings' || type === 'transfer') ? matchedStorageId : prev.fromStorageTypeId,
      toStorageTypeId: type === 'income' ? matchedStorageId : prev.toStorageTypeId,
      expenseCategoryId: matchedExpenseCategoryId || prev.expenseCategoryId,
      savingsCategoryId: matchedSavingsCategoryId || prev.savingsCategoryId
    }))
  }

  if (!transaction) return null

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
          <span>{dict.dialogs.editTitle}</span>
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
              label={dict.fields.type}
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
              <MenuItem value='income'>{dict.types.income}</MenuItem>
              <MenuItem value='expense'>{dict.types.expense}</MenuItem>
              <MenuItem value='savings'>{dict.types.savings}</MenuItem>
              <MenuItem value='transfer'>{dict.types.transfer}</MenuItem>
              <MenuItem value='gold_income'>{dict.types.incomeGold}</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Jumlah */}
          {formData.type === 'gold_income' ? (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={dict.fields.grams}
                value={formData.goldGrams}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                  setFormData({ ...formData, goldGrams: val })
                }}
                placeholder={dict.fields.gramsPlaceholder}
                slotProps={{
                  input: {
                    endAdornment: <span className='ml-1 text-sm'>gram</span>
                  }
                }}
              />
            </Grid>
          ) : (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label={dict.fields.amount}
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: formatRupiahInput(e.target.value) })}
                placeholder={dict.fields.amountPlaceholder}
                slotProps={{
                  input: {
                    startAdornment: <span className='mr-1'>Rp</span>
                  }
                }}
              />
            </Grid>
          )}

          {/* Keterangan */}
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label={dict.fields.description}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder={dict.fields.descriptionPlaceholder}
            />
          </Grid>

          {/* Tanggal */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              type='date'
              label={dict.fields.date}
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
              label={dict.fields.member}
              value={formData.familyMemberId}
              onChange={e => setFormData({ ...formData, familyMemberId: e.target.value })}
            >
              <MenuItem value=''>{dict.fields.memberPlaceholder}</MenuItem>
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
                label={dict.fields.toStorage}
                value={formData.toStorageTypeId}
                onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                error={!formData.toStorageTypeId}
                helperText={!formData.toStorageTypeId ? dict.fields.storagePlaceholder : ''}
              >
                <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
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

          {/* Masuk ke Simpanan Emas (untuk gold_income) */}
          {formData.type === 'gold_income' && (
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                required
                label={dict.fields.toStorage}
                value={formData.toStorageTypeId}
                onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                error={!formData.toStorageTypeId}
                helperText={!formData.toStorageTypeId ? dict.fields.storagePlaceholder : ''}
              >
                <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
                {storageTypes
                  .filter(s => s.isGold)
                  .map(storage => (
                    <MenuItem key={storage.id} value={storage.id}>
                      {storage.name} ({(storage.goldWeight || 0).toFixed(2)} gram)
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
                label={dict.fields.fromStorage}
                value={formData.fromStorageTypeId}
                onChange={e => setFormData({ ...formData, fromStorageTypeId: e.target.value })}
                error={!formData.fromStorageTypeId}
                helperText={!formData.fromStorageTypeId ? dict.fields.storagePlaceholder : ''}
              >
                <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
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
                  label={dict.fields.fromStorage}
                  value={formData.fromStorageTypeId}
                  onChange={e => setFormData({ ...formData, fromStorageTypeId: e.target.value })}
                  error={!formData.fromStorageTypeId}
                >
                  <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
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
                  label={dict.fields.toStorage}
                  value={formData.toStorageTypeId}
                  onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                  error={!formData.toStorageTypeId}
                >
                  <MenuItem value=''>{dict.fields.storagePlaceholder}</MenuItem>
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
                label={dict.fields.savingsCategory}
                value={formData.savingsCategoryId}
                onChange={e => setFormData({ ...formData, savingsCategoryId: e.target.value })}
              >
                <MenuItem value=''>{dict.fields.categoryPlaceholder}</MenuItem>
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
                label={dict.fields.expenseCategory}
                value={formData.expenseCategoryId}
                onChange={e => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                error={!formData.expenseCategoryId}
                helperText={!formData.expenseCategoryId ? dict.fields.categoryPlaceholder : ''}
              >
                <MenuItem value=''>{dict.fields.categoryPlaceholder}</MenuItem>
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
      <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
        <Button
          variant='outlined'
          color='error'
          onClick={handleDelete}
          disabled={loading}
          startIcon={<i className='tabler-trash' />}
        >
          {dict.dialogs.delete}
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='outlined' color='secondary' onClick={onClose}>
            {dict.dialogs.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={
              loading ||
              (formData.type === 'gold_income' ? !formData.goldGrams : !formData.amount) ||
              (formData.type === 'income' && !formData.toStorageTypeId) ||
              (formData.type === 'gold_income' && !formData.toStorageTypeId) ||
              ((formData.type === 'expense' || formData.type === 'savings') && !formData.fromStorageTypeId) ||
              (formData.type === 'expense' && !formData.expenseCategoryId) ||
              (formData.type === 'transfer' && (!formData.fromStorageTypeId || !formData.toStorageTypeId))
            }
          >
            {loading ? dict.dialogs.submitting : dict.dialogs.save}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default EditTransactionDialog
