import Swal from 'sweetalert2';

// Standardized SweetAlert2 theme matching EduSphere LMS design palette
const edusphereSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-[28px] dark:bg-slate-900 dark:text-slate-100 font-sans border border-slate-200 dark:border-slate-800 shadow-2xl p-6',
    title: 'text-xl font-black text-slate-900 dark:text-slate-100',
    htmlContainer: 'text-xs text-slate-600 dark:text-slate-300 font-medium',
    confirmButton: 'px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mx-1.5',
    cancelButton: 'px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all mx-1.5',
    denyButton: 'px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mx-1.5',
  },
  buttonsStyling: false,
});

/**
 * Toast-style notification helper
 */
export const showToastAlert = (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success',
  timer = 3000
) => {
  return Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-2xl dark:bg-slate-900 dark:text-slate-100 font-sans border border-slate-200 dark:border-slate-800 shadow-xl px-4 py-3',
      title: 'text-xs font-bold text-slate-900 dark:text-slate-100',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  }).fire({
    icon,
    title,
  });
};

export const showSuccessToast = (title: string, timer = 3000) => showToastAlert(title, 'success', timer);
export const showErrorToast = (title: string, timer = 3000) => showToastAlert(title, 'error', timer);

/**
 * Success Alert Dialog
 */
export const showSuccessAlert = (title = 'Success!', text = 'Action completed successfully.') => {
  return edusphereSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    iconColor: '#10B981',
  });
};

/**
 * Error Alert Dialog
 */
export const showErrorAlert = (title = 'Error!', text = 'Something went wrong. Please try again.') => {
  return edusphereSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    iconColor: '#EF4444',
  });
};

/**
 * Warning Alert Dialog
 */
export const showWarningAlert = (title = 'Warning!', text = 'Please check the required conditions before continuing.') => {
  return edusphereSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'Understood',
    iconColor: '#F59E0B',
  });
};

/**
 * Information Alert Dialog
 */
export const showInfoAlert = (title = 'Information', text = 'Please review the system details.') => {
  return edusphereSwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'Got It',
    iconColor: '#6366F1',
  });
};

/**
 * Destructive / Action Confirmation Alert Dialog
 */
export const showConfirmAlert = async (
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon: 'warning' | 'question' | 'error' = 'warning'
): Promise<boolean> => {
  const result = await edusphereSwal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    iconColor: icon === 'warning' ? '#F59E0B' : icon === 'error' ? '#EF4444' : '#6366F1',
  });

  return result.isConfirmed;
};

/**
 * Standard Sign Out Confirmation Alert Dialog
 */
export const showSignOutAlert = async (): Promise<boolean> => {
  const result = await edusphereSwal.fire({
    icon: 'question',
    title: 'Sign Out',
    text: 'Are you sure you want to sign out?',
    showCancelButton: true,
    confirmButtonText: 'Sign Out',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    iconColor: '#F43F5E',
    customClass: {
      popup: 'rounded-[28px] dark:bg-slate-900 dark:text-slate-100 font-sans border border-slate-200 dark:border-slate-800 shadow-2xl p-6',
      title: 'text-xl font-black text-slate-900 dark:text-slate-100',
      htmlContainer: 'text-xs text-slate-600 dark:text-slate-300 font-medium',
      confirmButton: 'px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mx-1.5',
      cancelButton: 'px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all mx-1.5',
    },
    buttonsStyling: false,
  });

  return result.isConfirmed;
};

export default edusphereSwal;
