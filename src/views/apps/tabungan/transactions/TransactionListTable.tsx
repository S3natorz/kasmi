'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// Type Imports
import type { ThemeColor } from '@core/types'
import type {
  TransactionType,
  FamilyMemberType,
  SavingsCategoryType,
  ExpenseCategoryType,
  StorageTypeType
} from '@/types/apps/tabunganTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)
    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Format number with thousand separator (dots)
const formatRupiahInput = (value: string) => {
  // Remove non-digit characters
  const numericValue = value.replace(/\D/g, '')
  // Add thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Parse formatted value back to number string
const parseRupiahInput = (value: string) => {
  return value.replace(/\./g, '')
}

const typeConfig: Record<string, { label: string; color: ThemeColor; icon: string }> = {
  income: { label: 'Pemasukan', color: 'success', icon: 'tabler-arrow-up' },
  expense: { label: 'Pengeluaran', color: 'error', icon: 'tabler-arrow-down' },
  savings: { label: 'Tabungan', color: 'info', icon: 'tabler-coin' },
  transfer: { label: 'Transfer', color: 'warning', icon: 'tabler-transfer' }
}

const columnHelper = createColumnHelper<TransactionType>()

const TransactionListTable = () => {
  // States
  const [data, setData] = useState<TransactionType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null)
  const [loading, setLoading] = useState(true)

  // Form states
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transRes, membersRes, savingsRes, expensesRes, storageRes] = await Promise.all([
        fetch('/api/apps/tabungan/transactions'),
        fetch('/api/apps/tabungan/family-members'),
        fetch('/api/apps/tabungan/savings-categories'),
        fetch('/api/apps/tabungan/expense-categories'),
        fetch('/api/apps/tabungan/storage-types')
      ])

      const [transactions, members, savings, expenses, storages] = await Promise.all([
        transRes.json(),
        membersRes.json(),
        savingsRes.json(),
        expensesRes.json(),
        storageRes.json()
      ])

      setData(transactions)
      setFamilyMembers(members)
      setSavingsCategories(savings)
      setExpenseCategories(expenses)
      setStorageTypes(storages)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenDialog = (transaction?: TransactionType) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setFormData({
        type: transaction.type,
        amount: formatRupiahInput(transaction.amount.toString()),
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        familyMemberId: transaction.familyMemberId || '',
        savingsCategoryId: transaction.savingsCategoryId || '',
        expenseCategoryId: transaction.expenseCategoryId || '',
        fromStorageTypeId: transaction.fromStorageTypeId || '',
        toStorageTypeId: transaction.toStorageTypeId || ''
      })
    } else {
      setEditingTransaction(null)
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
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingTransaction(null)
  }

  const handleSubmit = async () => {
    try {
      const url = '/api/apps/tabungan/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'
      const submitData = {
        ...formData,
        amount: parseRupiahInput(formData.amount)
      }
      const body = editingTransaction ? { ...submitData, id: editingTransaction.id } : submitData

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      handleCloseDialog()
      fetchData()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        await fetch(`/api/apps/tabungan/transactions?id=${id}`, {
          method: 'DELETE'
        })
        fetchData()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
      }
    }
  }

  const filteredData = useMemo(() => {
    let filtered = data

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(t => t.type === typeFilter)
    }

    // Filter by category based on type
    if (categoryFilter) {
      filtered = filtered.filter(t => {
        if (typeFilter === 'savings') {
          return t.savingsCategoryId === categoryFilter
        } else if (typeFilter === 'expense') {
          return t.expenseCategoryId === categoryFilter
        }
        return true
      })
    }

    return filtered
  }, [data, typeFilter, categoryFilter])

  // Reset category filter when type changes
  useEffect(() => {
    setCategoryFilter('')
  }, [typeFilter])

  // Get categories based on selected type
  const getCategoryOptions = () => {
    if (typeFilter === 'savings') {
      return savingsCategories.map(cat => ({ id: cat.id, name: cat.name }))
    } else if (typeFilter === 'expense') {
      return expenseCategories.map(cat => ({ id: cat.id, name: cat.name }))
    }
    return []
  }

  const columns = useMemo<ColumnDef<TransactionType, any>[]>(
    () => [
      columnHelper.accessor('type', {
        header: 'Tipe',
        cell: ({ row }) => {
          const config = typeConfig[row.original.type]
          return (
            <div className='flex items-center gap-3'>
              <CustomAvatar color={config.color} variant='rounded' size={34} skin='light'>
                <i className={config.icon} />
              </CustomAvatar>
              <Chip label={config.label} color={config.color} size='small' variant='tonal' />
            </div>
          )
        }
      }),
      columnHelper.accessor('amount', {
        header: 'Jumlah',
        cell: ({ row }) => (
          <Typography
            color={
              row.original.type === 'income'
                ? 'success.main'
                : row.original.type === 'expense'
                  ? 'error.main'
                  : 'info.main'
            }
            fontWeight={500}
          >
            {row.original.type === 'income' ? '+' : '-'}
            {formatCurrency(row.original.amount)}
          </Typography>
        )
      }),
      columnHelper.accessor('description', {
        header: 'Keterangan',
        cell: ({ row }) => <Typography>{row.original.description || '-'}</Typography>
      }),
      columnHelper.accessor('familyMember', {
        header: 'Anggota',
        cell: ({ row }) => <Typography>{row.original.familyMember?.name || '-'}</Typography>
      }),
      columnHelper.accessor('date', {
        header: 'Tanggal',
        cell: ({ row }) => (
          <Typography>
            {new Date(row.original.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Typography>
        )
      }),
      {
        id: 'category',
        header: 'Kategori / Transfer',
        cell: ({ row }) => {
          if (row.original.type === 'transfer') {
            const from = row.original.fromStorageType?.name || '-'
            const to = row.original.toStorageType?.name || '-'
            return (
              <div className='flex items-center gap-1'>
                <Typography variant='body2'>{from}</Typography>
                <i className='tabler-arrow-right text-textSecondary' />
                <Typography variant='body2'>{to}</Typography>
              </div>
            )
          }
          const cat =
            row.original.type === 'savings'
              ? row.original.savingsCategory?.name
              : row.original.type === 'expense'
                ? row.original.expenseCategory?.name
                : null
          return <Typography>{cat || '-'}</Typography>
        }
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={() => handleOpenDialog(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original.id)}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        )
      }
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Daftar Transaksi' />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex flex-wrap gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Cari transaksi...'
              className='max-sm:is-full'
            />
            <CustomTextField
              select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className='min-is-[150px]'
              placeholder='Filter Tipe'
            >
              <MenuItem value=''>Semua Tipe</MenuItem>
              <MenuItem value='income'>Pemasukan</MenuItem>
              <MenuItem value='expense'>Pengeluaran</MenuItem>
              <MenuItem value='savings'>Tabungan</MenuItem>
              <MenuItem value='transfer'>Transfer</MenuItem>
            </CustomTextField>
            {(typeFilter === 'savings' || typeFilter === 'expense') && (
              <CustomTextField
                select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className='min-is-[180px]'
                placeholder='Filter Kategori'
              >
                <MenuItem value=''>Semua Kategori</MenuItem>
                {getCategoryOptions().map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          </div>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => handleOpenDialog()}>
            Tambah Transaksi
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className='tabler-chevron-up text-xl' />,
                            desc: <i className='tabler-chevron-down text-xl' />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    {loading ? 'Memuat...' : 'Tidak ada data transaksi'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='pt-4'>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Tipe Transaksi'
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value='income'>Pemasukan</MenuItem>
                <MenuItem value='expense'>Pengeluaran</MenuItem>
                <MenuItem value='savings'>Tabungan</MenuItem>
                <MenuItem value='transfer'>Transfer</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Jumlah (Rp)'
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: formatRupiahInput(e.target.value) })}
                placeholder='0'
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Keterangan'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                type='date'
                label='Tanggal'
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                select
                fullWidth
                label='Anggota Keluarga'
                value={formData.familyMemberId}
                onChange={e => setFormData({ ...formData, familyMemberId: e.target.value })}
              >
                <MenuItem value=''>Pilih Anggota</MenuItem>
                {familyMembers.map(member => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            {formData.type === 'savings' && (
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Kategori Tabungan'
                  value={formData.savingsCategoryId}
                  onChange={e => setFormData({ ...formData, savingsCategoryId: e.target.value })}
                >
                  <MenuItem value=''>Pilih Kategori</MenuItem>
                  {savingsCategories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
            )}
            {formData.type === 'expense' && (
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  select
                  fullWidth
                  label='Kategori Pengeluaran'
                  value={formData.expenseCategoryId}
                  onChange={e => setFormData({ ...formData, expenseCategoryId: e.target.value })}
                >
                  <MenuItem value=''>Pilih Kategori</MenuItem>
                  {expenseCategories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
            )}
            {formData.type === 'transfer' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Dari Simpanan'
                    value={formData.fromStorageTypeId}
                    onChange={e => setFormData({ ...formData, fromStorageTypeId: e.target.value })}
                  >
                    <MenuItem value=''>Pilih Sumber</MenuItem>
                    {storageTypes
                      .filter(st => st.id !== formData.toStorageTypeId)
                      .map(st => (
                        <MenuItem key={st.id} value={st.id}>
                          {st.name} ({formatCurrency(st.balance || 0)})
                        </MenuItem>
                      ))}
                  </CustomTextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    select
                    fullWidth
                    label='Ke Simpanan'
                    value={formData.toStorageTypeId}
                    onChange={e => setFormData({ ...formData, toStorageTypeId: e.target.value })}
                  >
                    <MenuItem value=''>Pilih Tujuan</MenuItem>
                    {storageTypes
                      .filter(st => st.id !== formData.fromStorageTypeId)
                      .map(st => (
                        <MenuItem key={st.id} value={st.id}>
                          {st.name} ({formatCurrency(st.balance || 0)})
                        </MenuItem>
                      ))}
                  </CustomTextField>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Batal
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            {editingTransaction ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default TransactionListTable
