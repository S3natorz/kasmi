import Swal from 'sweetalert2'

// Toast notification
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  }
})

export const showSuccessToast = (message: string) => {
  Toast.fire({
    icon: 'success',
    title: message
  })
}

export const showErrorToast = (message: string) => {
  Toast.fire({
    icon: 'error',
    title: message
  })
}

export const showDeleteConfirm = async (itemName: string = 'item ini'): Promise<boolean> => {
  const result = await Swal.fire({
    title: 'Yakin ingin menghapus?',
    text: `${itemName} akan dihapus permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  })
  return result.isConfirmed
}

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK'
  })
}

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK'
  })
}

export default Swal
