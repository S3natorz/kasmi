'use client'

// React Imports
import { forwardRef, useState } from 'react'
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
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Slide from '@mui/material/Slide'
import type { SlideProps } from '@mui/material/Slide'
import { useTheme } from '@mui/material/styles'

// Types
import type { FamilyMemberType } from '@/types/apps/tabunganTypes'

// Utils
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '@/utils/swal'

// Skeletons
import { MobileListSkeleton } from './MobileSkeletons'

// Hooks
import { useTabunganData, invalidateTabuganKeys } from '@/hooks/useTabunganData'

// Contexts
import { useTabunganDictionary } from '@/contexts/TabunganDictionaryContext'

const Transition = forwardRef(function Transition(
  props: SlideProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />
})

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const MobileFamilyMembers = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const dict = useTabunganDictionary()

  const { data, isLoading, mutate } = useTabunganData<FamilyMemberType[]>('/api/apps/tabungan/family-members')

  const members = Array.isArray(data) ? data : []
  const loading = isLoading && members.length === 0

  const [openDialog, setOpenDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMemberType | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: ''
  })

  const refresh = () => {
    mutate().catch(() => {})
    invalidateTabuganKeys(['/api/apps/tabungan/stats'])
  }

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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))

        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save')
      }

      handleCloseDialog()
      refresh()
      showSuccessToast(editingMember ? dict.familyMembers.updateSuccess : dict.familyMembers.addSuccess)
    } catch (error) {
      console.error('Failed to save member:', error)
      showErrorToast(editingMember ? dict.familyMembers.updateFail : dict.familyMembers.addFail)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm(dict.familyMembers.deleteConfirm)

    if (confirmed) {
      try {
        const res = await fetch(`/api/apps/tabungan/family-members?id=${id}`, {
          method: 'DELETE'
        })

        if (!res.ok) throw new Error('Failed to delete')
        refresh()
        showSuccessToast(dict.familyMembers.deleteSuccess)
      } catch (error) {
        console.error('Failed to delete member:', error)
        showErrorToast(dict.familyMembers.deleteFail)
      }
    }
  }

  if (loading) {
    return <MobileListSkeleton rows={4} />
  }

  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 12 }}>
      {/* Total summary */}
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
            {dict.familyMembers.title}
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
            <i className='tabler-users' style={{ fontSize: 18, color: theme.palette.primary.main }} />
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: 'primary.main' }}>
          {members.length}
        </Typography>
        <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Total anggota terdaftar
        </Typography>
      </Box>

      {/* Member list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {members.map(member => (
          <Box
            key={member.id}
            sx={{
              p: 2,
              borderRadius: '16px',
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
              <Avatar
                src={member.avatar || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}
              >
                {member.name.charAt(0).toUpperCase()}
              </Avatar>
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
                  {member.name}
                </Typography>
                <Typography
                  variant='caption'
                  sx={{ fontSize: '0.78rem', color: 'primary.main', fontWeight: 600, display: 'block' }}
                >
                  {member.role}
                </Typography>
                <Typography variant='caption' sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  Terdaftar {formatDate(member.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size='small'
                  onClick={() => handleOpenDialog(member)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    backgroundColor: isDark ? 'rgba(115, 103, 240, 0.15)' : 'rgba(115, 103, 240, 0.08)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(115, 103, 240, 0.25)' : 'rgba(115, 103, 240, 0.15)'
                    }
                  }}
                >
                  <i className='tabler-edit' style={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size='small'
                  onClick={() => handleDelete(member.id)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    backgroundColor: isDark ? 'rgba(234, 84, 85, 0.15)' : 'rgba(234, 84, 85, 0.08)',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(234, 84, 85, 0.25)' : 'rgba(234, 84, 85, 0.15)'
                    }
                  }}
                >
                  <i className='tabler-trash' style={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {members.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <i className='tabler-users-off' style={{ fontSize: 64, opacity: 0.3 }} />
          <Typography sx={{ mt: 1, fontSize: '0.9rem' }}>{dict.familyMembers.empty}</Typography>
        </Box>
      )}

      {/* Floating Action Button */}
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

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            backgroundColor: isDark ? theme.palette.background.default : '#fff'
          }
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
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {editingMember ? dict.familyMembers.edit : dict.familyMembers.add}
          </Typography>
          <IconButton onClick={handleCloseDialog} size='small'>
            <i className='tabler-x' style={{ fontSize: 22 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label={dict.familyMembers.name}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label={dict.familyMembers.role}
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            />
            <TextField
              fullWidth
              label={dict.familyMembers.color}
              value={formData.avatar}
              onChange={e => setFormData({ ...formData, avatar: e.target.value })}
            />
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

export default MobileFamilyMembers
