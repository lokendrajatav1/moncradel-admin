import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Generic Toast Configuration
const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

/**
 * Show a success toast message
 */
export const showSuccess = (title: string) => {
  return Toast.fire({
    icon: 'success',
    title
  });
};

/**
 * Show an error toast message
 */
export const showError = (title: string) => {
  return Toast.fire({
    icon: 'error',
    title
  });
};

/**
 * Show a generic confirmation dialog (e.g. for Delete actions)
 */
export const confirmDelete = async (itemName: string) => {
  const result = await MySwal.fire({
    title: 'Are you sure?',
    text: `You are about to delete ${itemName}. This cannot be undone!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!'
  });
  return result.isConfirmed;
};

export const confirmAction = async (title: string, text: string, confirmText: string = 'Yes, do it!') => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText
  });
  return result.isConfirmed;
};

/**
 * Show a full-screen loading spinner overlay
 */
export const showLoading = (title: string = 'Loading...') => {
  MySwal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      MySwal.showLoading();
    }
  });
};

/**
 * Close any active sweet alert (including loading)
 */
export const hideAlert = () => {
  MySwal.close();
};
