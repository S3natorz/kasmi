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
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'

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
import type { StorageTypeType } from '@/types/apps/tabunganTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
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
  const numericValue = value.replace(/\D/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Parse formatted value back to number string
const parseRupiahInput = (value: string) => {
  return value.replace(/\./g, '')
}

// Icon suggestions for storage types
const iconSuggestions = [
  // Uang Tunai
  { label: 'Cash', value: 'tabler-cash' },
  { label: 'Uang', value: 'tabler-currency-dollar' },
  { label: 'Koin', value: 'tabler-coin' },
  { label: 'Dompet', value: 'tabler-wallet' },
  // Bank
  { label: 'Bank', value: 'tabler-building-bank' },
  { label: 'Kartu Debit', value: 'tabler-credit-card' },
  { label: 'Transfer', value: 'tabler-transfer' },
  { label: 'ATM', value: 'tabler-device-mobile' },
  // E-Wallet
  { label: 'E-Wallet', value: 'tabler-brand-google-pay' },
  { label: 'QR Code', value: 'tabler-qrcode' },
  { label: 'Scan', value: 'tabler-scan' },
  // Investasi
  { label: 'Emas', value: 'tabler-diamond' },
  { label: 'Saham', value: 'tabler-chart-line' },
  { label: 'Crypto', value: 'tabler-currency-bitcoin' },
  // Lainnya
  { label: 'Brankas', value: 'tabler-safe' },
  { label: 'Celengan', value: 'tabler-piggy-bank' },
  { label: 'Tabungan', value: 'tabler-moneybag' }
]

// Color presets
const colorPresets = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#9e9e9e',
  '#607d8b',
  '#000000'
]

const columnHelper = createColumnHelper<StorageTypeType>()

const StorageTypesTable = () => {
  const [data, setData] = useState<StorageTypeType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<StorageTypeType | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
    accountNumber: '',
    balance: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/apps/tabungan/storage-types')
      const items = await res.json()
      setData(items)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenDialog = (item?: StorageTypeType) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        icon: item.icon || '',
        color: item.color || '',
        accountNumber: item.accountNumber || '',
        balance: item.balance ? formatRupiahInput(item.balance.toString()) : ''
      })
    } else {
      setEditingItem(null)
      setFormData({ name: '', description: '', icon: '', color: '', accountNumber: '', balance: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingItem(null)
  }

  const handleSubmit = async () => {
    try {
      const url = '/api/apps/tabungan/storage-types'
      const method = editingItem ? 'PUT' : 'POST'
      const submitData = {
        ...formData,
        balance: parseRupiahInput(formData.balance)
      }
      const body = editingItem ? { ...submitData, id: editingItem.id } : submitData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        alert('Gagal menyimpan: ' + (errorData.error || 'Unknown error'))
        return
      }

      handleCloseDialog()
      fetchData()
    } catch (error) {
      console.error('Failed to save storage type:', error)
      alert('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus jenis simpan ini?')) {
      try {
        await fetch(`/api/apps/tabungan/storage-types?id=${id}`, {
          method: 'DELETE'
        })
        fetchData()
      } catch (error) {
        console.error('Failed to delete storage type:', error)
      }
    }
  }

  const columns = useMemo<ColumnDef<StorageTypeType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.icon && (
              <i className={`${row.original.icon} text-xl`} style={{ color: row.original.color || undefined }} />
            )}
            <Typography fontWeight={500}>{row.original.name}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('description', {
        header: 'Deskripsi',
        cell: ({ row }) => <Typography>{row.original.description || '-'}</Typography>
      }),
      columnHelper.accessor('accountNumber', {
        header: 'No. Rekening',
        cell: ({ row }) => <Typography>{row.original.accountNumber || '-'}</Typography>
      }),
      columnHelper.accessor('balance', {
        header: 'Saldo',
        cell: ({ row }) => (
          <Typography fontWeight={500} color='primary.main'>
            {formatCurrency(row.original.balance)}
          </Typography>
        )
      }),
      columnHelper.accessor('color', {
        header: 'Warna',
        cell: ({ row }) =>
          row.original.color ? (
            <Chip label={row.original.color} size='small' sx={{ backgroundColor: row.original.color, color: '#fff' }} />
          ) : (
            <Typography>-</Typography>
          )
      }),
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
    data,
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
        <CardHeader
          title='Jenis Simpan'
          action={
            <div className='flex items-center gap-4'>
              <CustomTextField
                placeholder='Cari...'
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
              />
              <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => handleOpenDialog()}>
                Tambah
              </Button>
            </div>
          }
        />
        <Divider />
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='text-center py-10'>
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center py-10'>
                    Belum ada data
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          component='div'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPageOptions={[10, 25, 50]}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Edit Jenis Simpan' : 'Tambah Jenis Simpan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='pt-4'>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Nama'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder='Cash, Bank BCA, GoPay, dll'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Deskripsi (opsional)'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='No. Rekening (opsional)'
                value={formData.accountNumber}
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder='1234567890'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Saldo Awal'
                value={formData.balance}
                onChange={e => setFormData({ ...formData, balance: formatRupiahInput(e.target.value) })}
                placeholder='0'
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={iconSuggestions}
                getOptionLabel={option => (typeof option === 'string' ? option : option.value)}
                value={formData.icon}
                onChange={(_, newValue) => {
                  const value = typeof newValue === 'string' ? newValue : newValue?.value || ''
                  setFormData({ ...formData, icon: value })
                }}
                onInputChange={(_, newValue) => {
                  setFormData({ ...formData, icon: newValue })
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props
                  return (
                    <Box
                      component='li'
                      key={key}
                      {...otherProps}
                      sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <i className={`${option.value} text-xl`} />
                      <span>{option.label}</span>
                    </Box>
                  )
                }}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Icon'
                    placeholder='Pilih icon'
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: formData.icon ? (
                          <i
                            className={`${formData.icon} text-xl`}
                            style={{ marginRight: 8, color: formData.color || undefined }}
                          />
                        ) : null
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label='Warna'
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                placeholder='#4caf50'
                onClick={e => setColorAnchorEl(e.currentTarget)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          backgroundColor: formData.color || '#ccc',
                          border: '1px solid rgba(0,0,0,0.2)',
                          mr: 1,
                          cursor: 'pointer'
                        }}
                      />
                    )
                  }
                }}
              />
              <Popover
                open={Boolean(colorAnchorEl)}
                anchorEl={colorAnchorEl}
                onClose={() => setColorAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                  {colorPresets.map(color => (
                    <Box
                      key={color}
                      onClick={() => {
                        setFormData({ ...formData, color })
                        setColorAnchorEl(null)
                      }}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid #000' : '1px solid rgba(0,0,0,0.2)',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'transform 0.2s'
                      }}
                    />
                  ))}
                </Box>
              </Popover>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Batal
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            {editingItem ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StorageTypesTable
