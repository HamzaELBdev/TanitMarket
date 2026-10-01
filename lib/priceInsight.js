// How a fixed price compares with similar listings. Only fixed prices are
// judged: "Gratuit" and "Négociable" have no asking amount to compare, and
// guessing from `price === 0` would be wrong (see lib/priceInfo.js).
import { getPriceInfo } from './priceInfo.js';

export const MIN_COMPARABLES = 5;
export const BAND = 0.15; // within ±15 % of the median counts as market price

export function median(values) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * @returns {{ level: 'good'|'market'|'high', median: number, deltaPct: number, sample: number } | null}
 * null when there is nothing trustworthy to say.
 */
export function getPriceInsight(product, listings = []) {
  const info = getPriceInfo(product);
  if (!info.isFixed || !info.hasAmount || !product?.category) return null;

  const category = String(product.category).toLowerCase();
  const prices = listings
    .filter((l) => l && l.id !== product.id && l.status === 'approved')
    .filter((l) => String(l.category || '').toLowerCase() === category)
    .map(getPriceInfo)
    .filter((p) => p.isFixed && p.hasAmount)
    .map((p) => p.amount);

  if (prices.length < MIN_COMPARABLES) return null;
  const med = median(prices);
  if (!med) return null;

  const delta = (info.amount - med) / med;
  const level = delta < -BAND ? 'good' : delta > BAND ? 'high' : 'market';
  return { level, median: med, deltaPct: Math.round(delta * 100), sample: prices.length };
}
