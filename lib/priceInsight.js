/**
 * "Is this a fair price?" — judged against the other live listings of the same
 * kind, and the opening offer a buyer is nudged towards because of it.
 *
 * Pure: the page fetches a pool of listings and hands it here, so the
 * judgement itself — the part that can be wrong in ways a buyer would act on —
 * is testable without Firestore.
 *
 * What it will NOT do is guess. With too few comparable listings a "median"
 * is noise presented as a fact, so below MIN_SAMPLE the answer is
 * "unavailable" and the UI shows nothing at all. An app that is still small
 * should show this for a few categories and stay silent for the rest, not
 * label everything on three data points.
 */

import { getPriceInfo } from './priceInfo.js';

/** Fewest comparable listings for which a verdict is shown. */
export const MIN_SAMPLE = 8;

/**
 * Within this fraction of the median a price is always "fair", however tight
 * the other listings are bunched. Without a floor, a category where most
 * sellers copy the same price would call a 3% difference "above market".
 */
export const FAIR_TOLERANCE = 0.10;

// Listings further out than this many interquartile ranges are junk for the
// purpose of a typical price: a "1 TND" placeholder, a typo with an extra zero.
const OUTLIER_FENCE = 1.5;

/** The listing's asking price as a number, or null when it has none worth comparing. */
export function priceOf(listing) {
  const info = getPriceInfo(listing);
  return info.hasAmount ? info.amount : null;
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const sameText = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/**
 * The most specific group of comparable listings that is still large enough:
 * same brand and condition, else same brand, else same category. Specific is
 * better — a used phone is not a fair comparison for a sealed one — but only
 * while there are enough of them to say anything.
 */
export function comparablesFor(listing, pool, minSample = MIN_SAMPLE) {
  const candidates = (pool || []).filter((p) => (
    p
    && String(p.id) !== String(listing?.id)
    && p.status === 'approved'
    && sameText(p.category, listing?.category)
    && priceOf(p) != null
  ));

  const brand = listing?.details?.brand;
  const condition = listing?.condition;
  const tiers = [];
  if (brand && condition) {
    tiers.push(['brand+condition', candidates.filter((p) => sameText(p.details?.brand, brand) && sameText(p.condition, condition))]);
  }
  if (brand) {
    tiers.push(['brand', candidates.filter((p) => sameText(p.details?.brand, brand))]);
  }
  tiers.push(['category', candidates]);

  for (const [scope, group] of tiers) {
    if (group.length >= minSample) return { scope, prices: group.map(priceOf) };
  }
  // None is big enough: report the broadest, so the caller can say how short we fell.
  return { scope: 'category', prices: candidates.map(priceOf) };
}

/**
 * @returns {{status:'unavailable', reason:string, n?:number}
 *   | {status:'ok', level:'low'|'fair'|'high', median:number, n:number,
 *      scope:string, deltaPct:number}}
 */
export function computePriceInsight(listing, pool, { minSample = MIN_SAMPLE } = {}) {
  const price = priceOf(listing);
  if (price == null) return { status: 'unavailable', reason: 'no-price' };

  const { scope, prices } = comparablesFor(listing, pool, minSample);
  if (prices.length < minSample) return { status: 'unavailable', reason: 'small-sample', n: prices.length };

  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const trimmed = sorted.filter((p) => p >= q1 - OUTLIER_FENCE * iqr && p <= q3 + OUTLIER_FENCE * iqr);
  // Trimming can leave too few to trust; then there is no verdict.
  if (trimmed.length < minSample) return { status: 'unavailable', reason: 'small-sample', n: trimmed.length };

  const median = quantile(trimmed, 0.5);
  const tq1 = quantile(trimmed, 0.25);
  const tq3 = quantile(trimmed, 0.75);
  const lowBound = Math.min(tq1, median * (1 - FAIR_TOLERANCE));
  const highBound = Math.max(tq3, median * (1 + FAIR_TOLERANCE));

  return {
    status: 'ok',
    level: price < lowBound ? 'low' : price > highBound ? 'high' : 'fair',
    median: Math.round(median),
    n: trimmed.length,
    scope,
    deltaPct: Math.round(((price - median) / median) * 100),
  };
}

/** Round to a figure a person would actually type: whole dinars, nearest 5 above 100, 10 above 1000. */
function roundToStep(value, asking) {
  const step = asking >= 1000 ? 10 : asking >= 100 ? 5 : 1;
  return Math.round(value / step) * step;
}

/**
 * The offer the negotiation modal opens on.
 *
 * Without a verdict it keeps the 15% off the modal always used. With one, the
 * suggestion follows the market instead of a flat discount: for a price above
 * it, offer the median but never less than 70% of the ask (below that is a
 * lowball, not a negotiation); for a fair one, the usual 10% off; for one
 * already below the market, barely any, because pushing hard on a good deal is
 * how a buyer loses it. It is never above 95% of the ask, or it would not be an
 * offer.
 */
export function suggestOffer(asking, insight) {
  const ask = Number(asking);
  if (!(ask > 0)) return null;

  let target;
  if (insight?.status === 'ok') {
    if (insight.level === 'high') target = Math.max(insight.median, ask * 0.7);
    else if (insight.level === 'low') target = ask * 0.95;
    else target = ask * 0.9;
    target = Math.min(target, ask * 0.95);
  } else {
    target = ask * 0.85;
  }

  return Math.min(ask, Math.max(1, roundToStep(target, ask)));
}
