import Swal from 'sweetalert2';

// TanitMarket-branded SweetAlert2 wrapper — lime/dark palette, pill buttons,
// consistent with the rest of the design system (button-tanit-* classes).
const tanitSwal = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: 'rounded-[24px] font-body',
    title: 'font-heading text-[#0e0f0c]',
    htmlContainer: 'text-[#454745] text-sm',
    confirmButton: 'button-tanit-primary text-xs font-bold px-6 py-2.5 mx-1.5',
    cancelButton: 'button-tanit-secondary text-xs font-bold px-6 py-2.5 mx-1.5',
    denyButton: 'button-tanit-tertiary text-xs font-bold px-6 py-2.5 mx-1.5',
  },
});

export function showSuccess(title, text) {
  return tanitSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    iconColor: '#0e0f0c',
  });
}

export function showError(title, text) {
  return tanitSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Compris',
    iconColor: '#a72027',
  });
}

export function showInfo(title, text) {
  return tanitSwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    iconColor: '#0e0f0c',
  });
}

/**
 * Returns true if the user confirmed, false otherwise (cancelled/dismissed).
 */
export async function showConfirm(title, text, confirmButtonText = 'Confirmer', { danger = false } = {}) {
  const result = await tanitSwal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Annuler',
    iconColor: danger ? '#a72027' : '#b86700',
    customClass: {
      ...tanitSwal.mixinConfig?.customClass,
      popup: 'rounded-[24px] font-body',
      title: 'font-heading text-[#0e0f0c]',
      htmlContainer: 'text-[#454745] text-sm',
      confirmButton: danger
        ? 'bg-[#a72027] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-full mx-1.5 cursor-pointer border-none'
        : 'button-tanit-primary text-xs font-bold px-6 py-2.5 mx-1.5',
      cancelButton: 'button-tanit-secondary text-xs font-bold px-6 py-2.5 mx-1.5',
    },
  });
  return result.isConfirmed;
}

/**
 * Small, non-blocking toast for quick success/error feedback that shouldn't
 * interrupt the user (e.g. "Profil enregistré", "Lien copié").
 */
export function showToast(message, icon = 'success') {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    iconColor: icon === 'error' ? '#a72027' : '#0e0f0c',
    customClass: {
      popup: 'rounded-2xl font-body text-xs shadow-lg',
    },
  });
}

export default tanitSwal;
