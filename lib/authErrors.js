// Maps Firebase Auth error codes to a translation key and, when the error is
// about one field, the field to attach it to (so it shows next to the input
// instead of in a modal).

const MAP = {
  'auth/invalid-credential': { key: 'authErrInvalidCredentials', field: 'password' },
  'auth/invalid-login-credentials': { key: 'authErrInvalidCredentials', field: 'password' },
  'auth/wrong-password': { key: 'authErrInvalidCredentials', field: 'password' },
  'auth/user-not-found': { key: 'authErrInvalidCredentials', field: 'password' },
  'auth/invalid-email': { key: 'authErrEmailInvalid', field: 'email' },
  'auth/missing-email': { key: 'authErrEmailRequired', field: 'email' },
  'auth/email-already-in-use': { key: 'authErrEmailInUse', field: 'email' },
  'auth/weak-password': { key: 'authErrWeakPassword', field: 'password' },
  'auth/password-does-not-meet-requirements': { key: 'authErrWeakPassword', field: 'password' },
  'auth/missing-password': { key: 'authErrPasswordRequired', field: 'password' },
  'auth/user-disabled': { key: 'authErrUserDisabled' },
  'auth/too-many-requests': { key: 'authErrTooManyRequests' },
  'auth/network-request-failed': { key: 'authErrNetwork' },
  'auth/timeout': { key: 'authErrNetwork' },
  'auth/popup-blocked': { key: 'authErrPopupBlocked' },
  'auth/account-exists-with-different-credential': { key: 'authErrDifferentCredential' },
};

export function describeAuthError(err) {
  const code = err?.code || '';
  return MAP[code] || { key: 'authErrorDefault' };
}

/** Firebase codes that mean the user simply closed / replaced the Google popup. */
export function isPopupCancellation(err) {
  const code = err?.code || '';
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled';
}
