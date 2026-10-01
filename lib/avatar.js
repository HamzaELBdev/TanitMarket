/**
 * One place that decides which photo represents a person.
 *
 * Two sources exist and they are not interchangeable:
 *  - `users/{uid}.avatarUrl` — the photo the member uploaded in their account
 *    settings (see useAccount.uploadAvatar). This is the one they chose.
 *  - Firebase Auth's `photoURL` — only set when the account came from a social
 *    provider, and never updated when the member uploads their own photo.
 *
 * The uploaded photo therefore always wins. Reading only `photoURL`, as the
 * listing-publishing code used to, means a member who uploads a photo keeps
 * showing up without one everywhere their listings appear.
 */

/** Photo for a signed-in member, from their Firestore profile and auth record. */
export function resolveUserAvatar(profile, authUser) {
  return profile?.avatarUrl || authUser?.photoURL || null;
}

/**
 * Photo for a listing's seller. `seller.avatar` is denormalized onto the
 * listing when it is published, so it can be stale or empty on listings
 * created before the member uploaded a photo; pass the seller's live user doc
 * as `sellerDoc` wherever it is already loaded and it takes precedence.
 */
export function resolveSellerAvatar(product, sellerDoc = null) {
  return sellerDoc?.avatarUrl || product?.seller?.avatar || product?.sellerAvatar || null;
}

/**
 * The letter shown when there is no photo. Falls back through the fields most
 * likely to hold something human-readable, and never renders an empty circle.
 */
export function initialOf(...candidates) {
  for (const value of candidates) {
    const trimmed = String(value || '').trim();
    if (trimmed) return trimmed.charAt(0).toUpperCase();
  }
  return '?';
}
