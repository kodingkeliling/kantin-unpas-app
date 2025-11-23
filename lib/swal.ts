import Swal from 'sweetalert2';

export const showAlert = {
  success: (message: string, title = 'Berhasil!') => {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#003366',
      confirmButtonText: 'OK',
    });
  },

  successToast: (message: string) => {
    return Swal.fire({
      icon: 'success',
      title: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
  },

  error: (message: string, title = 'Error!') => {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'OK',
    });
  },

  warning: (message: string, title = 'Peringatan!') => {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#FFB800',
      confirmButtonText: 'OK',
    });
  },

  info: (message: string, title = 'Info') => {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#003366',
      confirmButtonText: 'OK',
    });
  },

  confirm: (message: string, title = 'Konfirmasi', confirmText = 'Ya', cancelText = 'Batal') => {
    return Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    });
  },
};

