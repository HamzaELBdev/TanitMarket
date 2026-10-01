/**
 * What a saved search is, decided before anything is written. Mirrors what
 * firestore.rules enforces (that is what protects the collection; this gives
 * the member a clear message instead of a permission error).
 *
 * The matching itself runs on the server when a listing is approved
 * (functions/searchMatch.js); `matchesSavedSearch` is re-exported here only so
 * the client can say "this search already matches N listings".
 */

import { searchWords } from './searchText.js';

export const MAX_SAVED_SEARCHES = 10;
export const QUERY_MAX = 80;
export const ALL_TUNISIA = 'Toute la Tunisie';

/** @returns {{ok:true, data}|{ok:false, error}} error is a stable code for the UI. */
export function buildSavedSearch({ query, governorate, maxPrice }, { existing = [], uid } = {}) {
  if (!uid) return { ok: false, error: 'not-signed-in' };
  const text = String(query ?? '').trim().replace(/\s+/g, ' ');
  if (searchWords(text).length === 0) return { ok: false, error: 'empty-query' };
  if (text.length > QUERY_MAX) return { ok: false, error: 'query-too-long' };

  let max = null;
  if (maxPrice !== null && maxPrice !== undefined && String(maxPrice).trim() !== '') {
    max = Number(maxPrice);
    if (!Number.isFinite(max) || max <= 0 || max > 10_000_000) return { ok: false, error: 'bad-price' };
    max = Math.round(max);
  }

  const gov = governorate && governorate !== ALL_TUNISIA ? String(governorate).trim() : ALL_TUNISIA;
  const key = (s) => `${searchWords(s.query).join(' ')}|${s.governorate || ALL_TUNISIA}|${s.maxPrice ?? ''}`;
  const candidate = { query: text, governorate: gov, maxPrice: max };
  if (existing.some((s) => key(s) === key(candidate))) return { ok: false, error: 'duplicate' };
  if (existing.length >= MAX_SAVED_SEARCHES) return { ok: false, error: 'limit' };

  return { ok: true, data: { userId: uid, ...candidate } };
}

/** Error code -> translation key. */
export function savedSearchErrorKey(code) {
  return {
    'not-signed-in': 'savedSearchLogin',
    'empty-query': 'savedSearchEmpty',
    'query-too-long': 'savedSearchTooLong',
    'bad-price': 'savedSearchBadPrice',
    duplicate: 'savedSearchDuplicate',
    limit: 'savedSearchLimit',
  }[code] || 'savedSearchFailed';
}
