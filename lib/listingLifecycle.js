/**
 * The client's view of a listing's expiry cycle: how long it has left, so the
 * owner is told before it comes down rather than after.
 *
 * This is deliberately a COPY of the arithmetic in functions/lifecycle.js —
 * the Cloud Functions package is deployed on its own and cannot import from
 * here, nor can the browser import from there. The decision of when a listing
 * is actually reminded or expired is made server-side; this only mirrors it
 * for display. test/listingLifecycle.test.js runs both over the same grid of
 * inputs and fails if they ever disagree, which is the only thing keeping a
 * copy honest.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const EXPIRY_AFTER_DAYS = 30;
export const GRACE_DAYS = 7;

// Show "still available?" controls this many days before the end, so there is
// time to act on them without waiting for the reminder to arrive.
export const NEAR_EXPIRY_DAYS = 10;

export function toMillis(value) {
  if (value == null || value === '') return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value.seconds === 'number') return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function baselineMs(listing) {
  const fresh = [toMillis(listing?.renewedAt), toMillis(listing?.approvedAt)].filter((v) => v != null);
  if (fresh.length) return Math.max(...fresh);
  return toMillis(listing?.createdAt);
}

/** Whole days until the listing would be taken down; null when it is not live or has no usable date. */
export function daysUntilExpiry(listing, now = Date.now()) {
  if (listing?.status !== 'approved') return null;
  const baseline = baselineMs(listing);
  if (baseline == null) return null;
  const reminded = toMillis(listing?.expiryReminderSentAt);
  const deadline = reminded != null && reminded >= baseline
    ? reminded + GRACE_DAYS * DAY_MS
    : baseline + (EXPIRY_AFTER_DAYS + GRACE_DAYS) * DAY_MS;
  return Math.max(0, Math.ceil((deadline - now) / DAY_MS));
}

/** True when the owner should be offered "still available" on a live listing. */
export function isNearExpiry(listing, now = Date.now()) {
  const days = daysUntilExpiry(listing, now);
  return days != null && days <= NEAR_EXPIRY_DAYS;
}
