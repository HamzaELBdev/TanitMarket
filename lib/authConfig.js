// Where the legal links on /auth point. There are no dedicated CGU / privacy
// pages yet (the footer links are placeholders too) — update both here once
// they exist.
export const LEGAL_URLS = {
  terms: '/',
  privacy: '/',
};

// Post-auth destinations (unchanged from the previous auth page): admins go
// to the dashboard, members to their profile — where e-mail verification
// (ContactSection) happens after sign-up.
export function redirectTarget(isAdmin) {
  return isAdmin ? '/dash' : '/profile';
}

// Short pause so the "success" state on the button is seen before navigating.
export const SUCCESS_REDIRECT_DELAY_MS = 650;
