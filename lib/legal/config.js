// Single source for the legal pages' facts. Update here — the CGU,
// the privacy policy, the footer and the auth screens all read from it.

export const LEGAL_ROUTES = {
  terms: '/conditions-utilisation',
  privacy: '/confidentialite',
};

export const CONTACT_EMAIL = 'contact@tanitmarket.com';

// Shown as the publisher. Replace with the legal entity (name, address,
// RNE / tax ID) before an official launch.
export const PUBLISHER = {
  fr: "l'équipe TanitMarket",
  ar: 'فريق TanitMarket',
};

// Bump whenever the text of either page changes materially.
export const LAST_UPDATED = '2026-09-27';
