// Shared SEO constants, reused by the root layout, sitemap/robots routes,
// and the per-listing/per-seller generateMetadata functions.

export const SITE_URL = 'https://tanitmarket.com';
export const SITE_NAME = 'TanitMarket';
export const DEFAULT_TITLE = 'TanitMarket - Les bonnes affaires. Juste à côté. | Place de Marché P2P Tunisie';
export const DEFAULT_DESCRIPTION = 'Marketplace entre particuliers en Tunisie. Achetez, vendez et négociez en Dinars Tunisiens (TND) directement avec les vendeurs.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function truncate(text, maxLength = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 1).trimEnd() + '…';
}
