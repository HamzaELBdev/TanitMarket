/**
 * Who a buyer actually reaches when they open a chat on a listing.
 *
 * Most listings are published by their own seller, so the contact is that
 * seller's uid. But an admin can publish a listing on someone else's behalf
 * (create-listing and the dashboard both offer it), and those listings get a
 * synthetic `guest-<timestamp>` sellerId that matches no user document.
 *
 * A conversation addressed to such an id reaches nobody: there is no profile
 * to read an e-mail or a push token from, and no account that can open the
 * thread. Those listings now also record `postedByUid` — the admin who
 * published them — and that is who the conversation is routed to.
 */

/** A sellerId the listing flow invented because there is no real account behind it. */
export function isPlaceholderSellerId(sellerId) {
  const id = String(sellerId || '');
  return id.startsWith('guest-') || id.startsWith('seller-') || id === 'admin-root';
}

/**
 * The uid the conversation should be opened against, or null when the listing
 * names nobody reachable — in which case the caller must not start a chat,
 * because the buyer would be talking into the void.
 */
export function resolveListingContactId(product) {
  const sellerId = product?.sellerId || product?.seller?.id || null;
  if (sellerId && !isPlaceholderSellerId(sellerId)) return sellerId;
  // Published on someone's behalf: the admin who posted it answers for it.
  return product?.postedByUid || null;
}
