/**
 * When an approved listing goes stale, and what to do about it.
 *
 * Pure on purpose: the scheduled function that acts on this reads Firestore,
 * but the decision itself is arithmetic on a listing's own fields, which is
 * where the mistakes are (a renewal that does not reset the clock, a reminder
 * that fires every day, a listing expired a day early). Kept free of
 * firebase-admin so it can be tested without it.
 *
 * The cycle for an approved listing:
 *
 *   approved ──30 days without a renewal──▶ reminder sent ("still available?")
 *   reminder ──7 more days of silence────▶ expired (hidden, owner can renew)
 *   renewing at any point                ──▶ clock restarts
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// How long a listing stays up before the owner is asked if it is still for
// sale, and how long they then have to answer before it is taken down.
const EXPIRY_AFTER_DAYS = 30;
const GRACE_DAYS = 7;

/**
 * A Firestore Timestamp, its plain { seconds } form, an ISO string, or epoch
 * milliseconds, as milliseconds — or null when it is not a usable time.
 */
function toMillis(value) {
  if (value == null || value === '') return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value.seconds === 'number') return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * The moment the listing's freshness is measured from: the later of the last
 * renewal and the last approval (an edited listing goes back through
 * moderation, and its clock should start from when it was approved again, not
 * from when it was first created). Falls back to creation. Null when nothing
 * usable is recorded — callers must then leave the listing alone rather than
 * guess an age for it.
 */
function baselineMs(listing) {
  const fresh = [toMillis(listing?.renewedAt), toMillis(listing?.approvedAt)].filter((v) => v != null);
  if (fresh.length) return Math.max(...fresh);
  return toMillis(listing?.createdAt);
}

/**
 * @returns {'none' | 'remind' | 'expire'}
 */
function expiryDecision(listing, now = Date.now()) {
  // Only live listings age out. Pending, rejected, reserved, sold and expired
  // ones are not on the marketplace, so there is nothing to take down.
  if (listing?.status !== 'approved') return 'none';

  const baseline = baselineMs(listing);
  if (baseline == null) return 'none';
  if (now - baseline < EXPIRY_AFTER_DAYS * DAY_MS) return 'none';

  // A reminder only counts if it was sent for the current cycle. One that
  // predates the baseline belongs to a cycle the owner already closed by
  // renewing (or by being re-approved), so it must not start the grace period
  // of the next one.
  const reminded = toMillis(listing?.expiryReminderSentAt);
  if (reminded == null || reminded < baseline) return 'remind';

  return now - reminded >= GRACE_DAYS * DAY_MS ? 'expire' : 'none';
}

/** Whole days until the listing would expire, for the owner-facing hint. */
function daysUntilExpiry(listing, now = Date.now()) {
  if (listing?.status !== 'approved') return null;
  const baseline = baselineMs(listing);
  if (baseline == null) return null;
  const reminded = toMillis(listing?.expiryReminderSentAt);
  const deadline = reminded != null && reminded >= baseline
    ? reminded + GRACE_DAYS * DAY_MS
    : baseline + (EXPIRY_AFTER_DAYS + GRACE_DAYS) * DAY_MS;
  return Math.max(0, Math.ceil((deadline - now) / DAY_MS));
}

module.exports = {
  DAY_MS,
  EXPIRY_AFTER_DAYS,
  GRACE_DAYS,
  toMillis,
  baselineMs,
  expiryDecision,
  daysUntilExpiry
};
