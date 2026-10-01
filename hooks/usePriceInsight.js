"use client";
import { useState, useEffect } from 'react';
import { fetchComparableListings } from '@/lib/services/listingsService';
import { computePriceInsight } from '@/lib/priceInsight';

// The product page and the negotiation modal both want the verdict for the
// same listing. Fetching the comparables twice would double the reads for no
// reason, so the pool is shared per category for a few minutes. A failed fetch
// is dropped from the cache, so it is retried next time instead of being
// remembered as a permanent "no data".
const POOL_TTL_MS = 5 * 60 * 1000;
const pools = new Map();

function getPool(listing) {
  const key = String(listing.category);
  const hit = pools.get(key);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.promise;
  const promise = fetchComparableListings(listing).catch((err) => {
    pools.delete(key);
    throw err;
  });
  pools.set(key, { at: Date.now(), promise });
  return promise;
}

/**
 * Is this listing's price fair, compared with similar live listings?
 *
 * null until known — and for good when there is nothing to show (no price, no
 * category, too few comparables, or the lookup failed). Callers render nothing
 * for null: a missing verdict must never look like a bad one, and a failure
 * here must never get in the way of the page.
 */
export function usePriceInsight(listing) {
  const [insight, setInsight] = useState(null);
  const id = listing?.id;
  const category = listing?.category;
  const price = listing?.price;

  useEffect(() => {
    let alive = true;
    setInsight(null);
    if (!id || !category) return undefined;
    getPool(listing)
      .then((pool) => {
        if (!alive) return;
        const result = computePriceInsight(listing, pool);
        setInsight(result.status === 'ok' ? result : null);
      })
      .catch(() => {});
    return () => { alive = false; };
    // `listing` is deliberately not a dependency: only these three fields
    // change the answer, and the object is rebuilt on every snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, category, price]);

  return insight;
}
