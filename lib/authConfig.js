import { LEGAL_ROUTES } from '@/lib/legal/config';

// Where the legal links on /auth point.
export const LEGAL_URLS = LEGAL_ROUTES;

// Post-auth destinations (unchanged from the previous auth page): admins go
// to the dashboard, members to their profile — where e-mail verification
// (ContactSection) happens after sign-up.
export function redirectTarget(isAdmin) {
  return isAdmin ? '/dash' : '/profile';
}

// Short pause so the "success" state on the button is seen before navigating.
export const SUCCESS_REDIRECT_DELAY_MS = 650;
