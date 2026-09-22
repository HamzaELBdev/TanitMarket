// Shared phone number validation/formatting for the profile & create-listing
// forms. Regular sellers are restricted to Tunisian numbers (+216, 8 digits)
// since that's who buyers expect to reach locally. Admin accounts are also
// allowed to register/verify a French number (+33), since TanitMarket's
// primary admin operates from France.
const TUNISIAN_PHONE_REGEX = /^(?:\+216|216)?[24579]\d{7}$/;
const FRENCH_PHONE_REGEX = /^(?:\+33|33|0)[1-9]\d{8}$/;

/**
 * Validate & normalize a phone number to E.164.
 * @param {string} raw - user-entered phone number
 * @param {{ allowFrench?: boolean }} options - allowFrench: also accept French (+33) numbers (admin-only)
 * @returns {{ valid: boolean, formatted: string|null, country: 'TN'|'FR'|null }}
 */
export function validatePhoneNumber(raw, { allowFrench = false } = {}) {
  const cleaned = String(raw || '').trim().replace(/[\s\-\(\)]/g, '');

  if (TUNISIAN_PHONE_REGEX.test(cleaned)) {
    let formatted = cleaned;
    if (!formatted.startsWith('+216')) {
      formatted = formatted.startsWith('216') ? `+${formatted}` : `+216${formatted}`;
    }
    return { valid: true, formatted, country: 'TN' };
  }

  if (allowFrench && FRENCH_PHONE_REGEX.test(cleaned)) {
    let formatted = cleaned;
    if (formatted.startsWith('0')) {
      formatted = `+33${formatted.slice(1)}`;
    } else if (formatted.startsWith('33')) {
      formatted = `+${formatted}`;
    }
    return { valid: true, formatted, country: 'FR' };
  }

  return { valid: false, formatted: null, country: null };
}

export function isUserAdmin(profile) {
  return !!(profile?.isAdmin === true || profile?.role === 'Admin' || profile?.role?.toLowerCase?.() === 'admin');
}
