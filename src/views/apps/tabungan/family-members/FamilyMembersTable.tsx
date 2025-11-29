'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'

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
import type { FamilyMemberType } from '@/types/apps/tabunganTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<FamilyMemberType>()

const FamilyMembersTable = () => {
  const [data, setData] = useState<FamilyMemberType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMemberType | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/apps/tabungan/family-members')
      const members = await res.json()
      setData(members)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenDialog = (member?: FamilyMemberType) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        name: member.name,
        role: member.role,
        avatar: member.avatar || ''
      })
    } else {
      setEditingMember(null)
      setFormData({ name: '', role: '', avatar: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingMember(null)
  }

  const handleSubmit = async () => {
    try {
      const url = '/api/apps/tabungan/family-members'
      const method = editingMember ? 'PUT' : 'POST'
      const body = editingMember ? { ...formData, id: editingMember.id } : formData

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      handleCloseDialog()
      fetchData()
    } catch (error) {
      console.error('Failed to save member:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        await fetch(`/api/apps/tabungan/family-members?id=${id}`, {
          method: 'DELETE'
        })
        fetchData()
      } catch (error) {
        console.error('Failed to delete member:', error)
      }
    }
  }

  const columns = useMemo<ColumnDef<FamilyMemberType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar src={row.original.avatar || undefined} size={40}>
              {row.original.name.charAt(0)}
            </CustomAvatar>
            <Typography fontWeight={500}>{row.original.name}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Peran',
        cell: ({ row }) => <Typography>{row.original.role}</Typography>
      }),
      columnHelper.accessor('createdAt', {
        header: 'Terdaftar',
        cell: ({ row }) => (
          <Typography>
            {new Date(row.original.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Typography>
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
        <CardHeader title='Anggota Keluarga' />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Cari anggota...'
            className='max-sm:is-full'
          />
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => handleOpenDialog()}>
            Tambah Anggota
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
                    {loading ? 'Memuat...' : 'Tidak ada data anggota'}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingMember ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={4} className='pt-4'>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Nama'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Peran (Ayah, Ibu, Anak, dll)'
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='URL Avatar (opsional)'
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Batal
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            {editingMember ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default FamilyMembersTable
