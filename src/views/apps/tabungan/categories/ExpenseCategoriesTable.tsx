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
import type { ExpenseCategoryType, StorageTypeType } from '@/types/apps/tabunganTypes'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import MenuItem from '@mui/material/MenuItem'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Utils
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'

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
  // Remove non-digit characters
  const numericValue = value.replace(/\D/g, '')
  // Add thousand separators
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Parse formatted value back to number string
const parseRupiahInput = (value: string) => {
  return value.replace(/\./g, '')
}

// Icon suggestions for expense categories
const iconSuggestions = [
  // Makanan & Minuman
  { label: 'Makanan', value: 'tabler-tools-kitchen-2' },
  { label: 'Restoran', value: 'tabler-chef-hat' },
  { label: 'Kopi', value: 'tabler-coffee' },
  { label: 'Pizza', value: 'tabler-pizza' },
  { label: 'Burger', value: 'tabler-burger' },
  { label: 'Es Krim', value: 'tabler-ice-cream' },
  { label: 'Buah', value: 'tabler-apple' },
  { label: 'Minuman', value: 'tabler-bottle' },
  { label: 'Beer', value: 'tabler-beer' },
  { label: 'Gelas', value: 'tabler-glass-full' },
  // Belanja
  { label: 'Belanja', value: 'tabler-shopping-cart' },
  { label: 'Tas Belanja', value: 'tabler-shopping-bag' },
  { label: 'Keranjang', value: 'tabler-basket' },
  { label: 'Toko', value: 'tabler-building-store' },
  { label: 'Barcode', value: 'tabler-barcode' },
  { label: 'Receipt', value: 'tabler-receipt' },
  // Transportasi
  { label: 'Mobil', value: 'tabler-car' },
  { label: 'Motor', value: 'tabler-motorbike' },
  { label: 'Sepeda', value: 'tabler-bike' },
  { label: 'Bus', value: 'tabler-bus' },
  { label: 'Kereta', value: 'tabler-train' },
  { label: 'Pesawat', value: 'tabler-plane' },
  { label: 'Taksi', value: 'tabler-car-taxi' },
  { label: 'Bensin', value: 'tabler-gas-station' },
  { label: 'Parkir', value: 'tabler-parking' },
  { label: 'Jalan Tol', value: 'tabler-road' },
  // Tagihan & Utilitas
  { label: 'Listrik', value: 'tabler-bolt' },
  { label: 'Air', value: 'tabler-droplet' },
  { label: 'Internet', value: 'tabler-wifi' },
  { label: 'Telepon', value: 'tabler-phone' },
  { label: 'TV Kabel', value: 'tabler-device-tv' },
  { label: 'Gas', value: 'tabler-flame' },
  { label: 'Tagihan', value: 'tabler-file-invoice' },
  // Rumah
  { label: 'Rumah', value: 'tabler-home' },
  { label: 'Sewa', value: 'tabler-key' },
  { label: 'Perabotan', value: 'tabler-armchair' },
  { label: 'Lampu', value: 'tabler-bulb' },
  { label: 'AC', value: 'tabler-air-conditioning' },
  { label: 'Tools', value: 'tabler-tool' },
  { label: 'Cat', value: 'tabler-paint' },
  { label: 'Kebersihan', value: 'tabler-spray' },
  // Kesehatan
  { label: 'Kesehatan', value: 'tabler-heart-rate-monitor' },
  { label: 'Dokter', value: 'tabler-stethoscope' },
  { label: 'Rumah Sakit', value: 'tabler-building-hospital' },
  { label: 'Obat', value: 'tabler-pill' },
  { label: 'Gigi', value: 'tabler-dental' },
  { label: 'Mata', value: 'tabler-eye' },
  { label: 'First Aid', value: 'tabler-first-aid-kit' },
  // Pendidikan
  { label: 'Pendidikan', value: 'tabler-school' },
  { label: 'Buku', value: 'tabler-book' },
  { label: 'Pensil', value: 'tabler-pencil' },
  { label: 'Backpack', value: 'tabler-backpack' },
  { label: 'Kursus', value: 'tabler-certificate' },
  // Hiburan
  { label: 'Hiburan', value: 'tabler-movie' },
  { label: 'Musik', value: 'tabler-music' },
  { label: 'Game', value: 'tabler-device-gamepad-2' },
  { label: 'Tiket', value: 'tabler-ticket' },
  { label: 'Konser', value: 'tabler-microphone-2' },
  { label: 'Bola', value: 'tabler-ball-football' },
  { label: 'Renang', value: 'tabler-swimming' },
  { label: 'Gym', value: 'tabler-barbell' },
  // Pakaian & Fashion
  { label: 'Pakaian', value: 'tabler-shirt' },
  { label: 'Sepatu', value: 'tabler-shoe' },
  { label: 'Jam Tangan', value: 'tabler-watch' },
  { label: 'Kacamata', value: 'tabler-sunglasses' },
  { label: 'Perhiasan', value: 'tabler-diamond' },
  // Perawatan
  { label: 'Perawatan', value: 'tabler-bath' },
  { label: 'Salon', value: 'tabler-scissors' },
  { label: 'Spa', value: 'tabler-massage' },
  { label: 'Parfum', value: 'tabler-perfume' },
  // Asuransi & Keuangan
  { label: 'Asuransi', value: 'tabler-shield-check' },
  { label: 'Pajak', value: 'tabler-receipt-tax' },
  { label: 'Bank', value: 'tabler-building-bank' },
  { label: 'Kredit', value: 'tabler-credit-card' },
  // Langganan
  { label: 'Langganan', value: 'tabler-repeat' },
  { label: 'Cloud', value: 'tabler-cloud' },
  { label: 'Streaming', value: 'tabler-player-play' },
  // Hadiah & Donasi
  { label: 'Hadiah', value: 'tabler-gift' },
  { label: 'Donasi', value: 'tabler-heart-handshake' },
  { label: 'Zakat', value: 'tabler-hand-love' },
  { label: 'Sedekah', value: 'tabler-coin' },
  // Lainnya
  { label: 'Peliharaan', value: 'tabler-paw' },
  { label: 'Tanaman', value: 'tabler-plant' },
  { label: 'Foto', value: 'tabler-camera' },
  { label: 'Print', value: 'tabler-printer' },
  { label: 'Lainnya', value: 'tabler-dots' },
  { label: 'Tanda Tanya', value: 'tabler-question-mark' }
]

// Color presets - Extended palette
const colorPresets = [
  // Merah
  '#f44336',
  '#e53935',
  '#d32f2f',
  '#c62828',
  '#b71c1c',
  // Pink
  '#e91e63',
  '#d81b60',
  '#c2185b',
  '#ad1457',
  '#880e4f',
  // Ungu
  '#9c27b0',
  '#8e24aa',
  '#7b1fa2',
  '#6a1b9a',
  '#4a148c',
  // Deep Purple
  '#673ab7',
  '#5e35b1',
  '#512da8',
  '#4527a0',
  '#311b92',
  // Indigo
  '#3f51b5',
  '#3949ab',
  '#303f9f',
  '#283593',
  '#1a237e',
  // Biru
  '#2196f3',
  '#1e88e5',
  '#1976d2',
  '#1565c0',
  '#0d47a1',
  // Light Blue
  '#03a9f4',
  '#039be5',
  '#0288d1',
  '#0277bd',
  '#01579b',
  // Cyan
  '#00bcd4',
  '#00acc1',
  '#0097a7',
  '#00838f',
  '#006064',
  // Teal
  '#009688',
  '#00897b',
  '#00796b',
  '#00695c',
  '#004d40',
  // Hijau
  '#4caf50',
  '#43a047',
  '#388e3c',
  '#2e7d32',
  '#1b5e20',
  // Light Green
  '#8bc34a',
  '#7cb342',
  '#689f38',
  '#558b2f',
  '#33691e',
  // Lime
  '#cddc39',
  '#c0ca33',
  '#afb42b',
  '#9e9d24',
  '#827717',
  // Kuning
  '#ffeb3b',
  '#fdd835',
  '#fbc02d',
  '#f9a825',
  '#f57f17',
  // Amber
  '#ffc107',
  '#ffb300',
  '#ffa000',
  '#ff8f00',
  '#ff6f00',
  // Orange
  '#ff9800',
  '#fb8c00',
  '#f57c00',
  '#ef6c00',
  '#e65100',
  // Deep Orange
  '#ff5722',
  '#f4511e',
  '#e64a19',
  '#d84315',
  '#bf360c',
  // Coklat
  '#795548',
  '#6d4c41',
  '#5d4037',
  '#4e342e',
  '#3e2723',
  // Abu-abu
  '#9e9e9e',
  '#757575',
  '#616161',
  '#424242',
  '#212121',
  // Blue Grey
  '#607d8b',
  '#546e7a',
  '#455a64',
  '#37474f',
  '#263238'
]

const columnHelper = createColumnHelper<ExpenseCategoryType>()

const ExpenseCategoriesTable = () => {
  const [data, setData] = useState<ExpenseCategoryType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryType | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null)
  const [storageTypes, setStorageTypes] = useState<StorageTypeType[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '',
    budgetLimit: '',
    storageTypeId: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, storageRes] = await Promise.all([
        fetch('/api/apps/tabungan/expense-categories'),
        fetch('/api/apps/tabungan/storage-types')
      ])
      const [categories, storages] = await Promise.all([catRes.json(), storageRes.json()])
      setData(Array.isArray(categories) ? categories : [])
      setStorageTypes(Array.isArray(storages) ? storages : [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenDialog = (category?: ExpenseCategoryType) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
        budgetLimit: category.budgetLimit ? formatRupiahInput(category.budgetLimit.toString()) : '',
        storageTypeId: category.storageTypeId || ''
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', icon: '', color: '', budgetLimit: '', storageTypeId: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCategory(null)
  }

  const handleSubmit = async () => {
    try {
      const url = '/api/apps/tabungan/expense-categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const submitData = {
        ...formData,
        budgetLimit: parseRupiahInput(formData.budgetLimit)
      }
      const body = editingCategory ? { ...submitData, id: editingCategory.id } : submitData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Failed to save')

      handleCloseDialog()
      fetchData()
      showSuccessToast(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan')
    } catch (error) {
      console.error('Failed to save category:', error)
      showErrorToast('Gagal menyimpan kategori')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('Yakin ingin menghapus kategori ini?')
    if (confirmed) {
      try {
        const res = await fetch(`/api/apps/tabungan/expense-categories?id=${id}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to delete')
        fetchData()
        showSuccessToast('Kategori berhasil dihapus')
      } catch (error) {
        console.error('Failed to delete category:', error)
        showErrorToast('Gagal menghapus kategori')
      }
    }
  }

  const columns = useMemo<ColumnDef<ExpenseCategoryType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Kategori',
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
      {
        id: 'storageType',
        header: 'Jenis Simpan',
        cell: ({ row }) => {
          const st = row.original.storageType
          if (!st) return <Typography>-</Typography>
          return (
            <div className='flex items-center gap-2'>
              {st.icon && <i className={`${st.icon} text-lg`} style={{ color: st.color || undefined }} />}
              <Typography>{st.name}</Typography>
            </div>
          )
        }
      },
      columnHelper.accessor('budgetLimit', {
        header: 'Budget Bulanan',
        cell: ({ row }) => (
          <Typography>{row.original.budgetLimit ? formatCurrency(row.original.budgetLimit) : '-'}</Typography>
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
        <CardHeader title='Kategori Pengeluaran' />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Cari kategori...'
            className='max-sm:is-full'
          />
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => handleOpenDialog()}>
            Tambah Kategori
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table} style={{ minWidth: 700 }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      style={
                        index === 0
                          ? {
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              backgroundColor: 'var(--mui-palette-background-paper)',
                              minWidth: 180
                            }
                          : undefined
                      }
                    >
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
            {loading ? (
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    {[...Array(table.getVisibleFlatColumns().length)].map((_, cellIndex) => (
                      <td
                        key={cellIndex}
                        className='py-3'
                        style={
                          cellIndex === 0
                            ? {
                                position: 'sticky',
                                left: 0,
                                zIndex: 1,
                                backgroundColor: 'var(--mui-palette-background-paper)'
                              }
                            : undefined
                        }
                      >
                        <div className='animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4'></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    Tidak ada data kategori
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell, index) => (
                      <td
                        key={cell.id}
                        style={
                          index === 0
                            ? {
                                position: 'sticky',
                                left: 0,
                                zIndex: 1,
                                backgroundColor: 'var(--mui-palette-background-paper)'
                              }
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='pt-4'>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Nama Kategori'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                renderOption={(props, option) => (
                  <Box component='li' {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <i className={`${option.value} text-xl`} />
                    <span>{option.label}</span>
                    <Typography variant='caption' color='text.secondary'>
                      ({option.value})
                    </Typography>
                  </Box>
                )}
                renderInput={params => (
                  <CustomTextField
                    {...params}
                    label='Icon'
                    placeholder='Pilih atau ketik icon'
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
                placeholder='#f44336'
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
                <Box sx={{ p: 2, maxWidth: 280, maxHeight: 300, overflowY: 'auto' }}>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                    Pilih Warna
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.5 }}>
                    {colorPresets.map(color => (
                      <Box
                        key={color}
                        onClick={() => {
                          setFormData({ ...formData, color })
                          setColorAnchorEl(null)
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 0.5,
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: formData.color === color ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)',
                          '&:hover': { transform: 'scale(1.2)', zIndex: 1 },
                          transition: 'transform 0.15s'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Popover>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Budget Bulanan (Rp)'
                value={formData.budgetLimit}
                onChange={e => setFormData({ ...formData, budgetLimit: formatRupiahInput(e.target.value) })}
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
                select
                fullWidth
                label='Jenis Simpan'
                value={formData.storageTypeId}
                onChange={e => setFormData({ ...formData, storageTypeId: e.target.value })}
              >
                <MenuItem value=''>Pilih Jenis Simpan</MenuItem>
                {storageTypes.map(st => (
                  <MenuItem key={st.id} value={st.id}>
                    <div className='flex items-center gap-2'>
                      {st.icon && <i className={st.icon} style={{ color: st.color || undefined }} />}
                      {st.name}
                    </div>
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Batal
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            {editingCategory ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ExpenseCategoriesTable
