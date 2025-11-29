import Swal from 'sweetalert2'

// Custom z-index to appear above navbar
const customZIndex = 99999

// Toast notification
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    container: 'swal-container-top'
  },
  didOpen: toast => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
    // Ensure toast is above navbar
    const container = document.querySelector('.swal2-container') as HTMLElement
    if (container) {
      container.style.zIndex = String(customZIndex)
    }
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

export const showDeleteConfirm = async (message: string = 'Data ini akan dihapus permanen!'): Promise<boolean> => {
  const result = await Swal.fire({
    title: 'Yakin ingin menghapus?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
    customClass: {
      container: 'swal-container-top'
    },
    didOpen: () => {
      const container = document.querySelector('.swal2-container') as HTMLElement
      if (container) {
        container.style.zIndex = String(customZIndex)
      }
    }
  })
  return result.isConfirmed
}

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    customClass: {
      container: 'swal-container-top'
    },
    didOpen: () => {
      const container = document.querySelector('.swal2-container') as HTMLElement
      if (container) {
        container.style.zIndex = String(customZIndex)
      }
    }
  })
}

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    customClass: {
      container: 'swal-container-top'
    },
    didOpen: () => {
      const container = document.querySelector('.swal2-container') as HTMLElement
      if (container) {
        container.style.zIndex = String(customZIndex)
      }
    }
  })
}

export default Swal
