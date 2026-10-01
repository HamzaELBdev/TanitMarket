/**
 * Reporting a listing: what a valid report is, decided before anything is
 * written. Pure, so the rules a report must satisfy are testable — and they
 * mirror what firestore.rules enforces, which is what actually protects the
 * collection; this is the same check run early, so a member gets a clear
 * message instead of a permission-denied error.
 */

export const REPORT_REASONS = [
  'scam',
  'prohibited',
  'wrong_category',
  'duplicate',
  'sold_already',
  'other',
];

export const REPORT_DETAILS_MAX = 500;

/**
 * One report per member per listing: the document id is derived from both, so
 * a second attempt targets the same document and the rules (create-only for
 * non-admins) reject it. That is what stops one account from flooding the
 * admins with the same complaint.
 */
export function reportId(listingId, reporterUid) {
  return `${listingId}_${reporterUid}`;
}

/**
 * Validate and shape a report. Returns { ok: true, id, data } or
 * { ok: false, error } where `error` is a stable code the UI maps to a
 * translated message.
 */
export function buildReport({ listing, reason, details, reporter }) {
  if (!reporter?.uid) return { ok: false, error: 'not-signed-in' };
  if (!listing?.id) return { ok: false, error: 'no-listing' };

  const ownerIds = [listing.sellerId, listing.seller?.id, listing.postedByUid].filter(Boolean);
  if (ownerIds.includes(reporter.uid)) return { ok: false, error: 'own-listing' };

  if (!REPORT_REASONS.includes(reason)) return { ok: false, error: 'bad-reason' };

  const cleanDetails = String(details ?? '').trim();
  if (cleanDetails.length > REPORT_DETAILS_MAX) return { ok: false, error: 'details-too-long' };
  // "Autre" with nothing written tells the admins nothing to act on.
  if (reason === 'other' && cleanDetails.length < 5) return { ok: false, error: 'details-required' };

  return {
    ok: true,
    id: reportId(listing.id, reporter.uid),
    data: {
      listingId: String(listing.id),
      listingTitle: String(listing.title || '').slice(0, 200),
      sellerId: String(listing.sellerId || listing.seller?.id || ''),
      reporterId: reporter.uid,
      reporterName: String(reporter.name || '').slice(0, 100),
      reason,
      details: cleanDetails,
      status: 'open',
    },
  };
}

/**
 * The translation key shown for each error code. Anything not listed — an
 * unexpected failure, a malformed report — falls back to the generic message
 * rather than leaving the member with a silent button.
 */
export const REPORT_ERROR_KEYS = {
  'not-signed-in': 'reportLoginNeeded',
  'own-listing': 'reportErrOwn',
  'details-required': 'reportErrDetails',
  'details-too-long': 'reportErrTooLong',
  'already-reported': 'reportErrAlready',
};

export function reportErrorKey(code) {
  return REPORT_ERROR_KEYS[code] || 'reportErrFailed';
}
