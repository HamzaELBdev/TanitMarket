// Pure aggregations behind the admin dashboard's insight panels. Kept free of
// React/Firebase so they can be unit-tested with Node's runner (npm test).
import { median } from './priceInsight.js';

const DAY = 86400;

export const isApproved = (l) => l?.status === 'approved' || l?.status === 'Approuvée';
export const isRejected = (l) => l?.status === 'rejected' || l?.status === 'Rejetée';
export const isPending = (l) => l?.status === 'pending' || l?.status === 'En attente';

// Firestore Timestamp ({ seconds }), Date, ISO string or millis → seconds.
export function tsSeconds(ts) {
  if (!ts) return null;
  if (typeof ts.seconds === 'number') return ts.seconds;
  const ms = typeof ts === 'number' ? ts : new Date(ts).getTime();
  return Number.isNaN(ms) ? null : ms / 1000;
}

const priceOf = (l) => {
  const n = parseFloat(l?.price);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Count + median price per key, biggest groups first. */
function groupBy(listings, keyOf, limit) {
  const groups = new Map();
  for (const l of listings) {
    const key = keyOf(l);
    if (!key) continue;
    const g = groups.get(key) || { key, count: 0, prices: [] };
    g.count += 1;
    const p = priceOf(l);
    if (p != null) g.prices.push(p);
    groups.set(key, g);
  }
  const rows = [...groups.values()]
    .map(({ key, count, prices }) => ({
      key,
      count,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      medianPrice: median(prices),
    }))
    .sort((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
  return limit ? rows.slice(0, limit) : rows;
}

export const listingsByCategory = (listings) => groupBy(listings, (l) => l.category);
export const listingsByGovernorate = (listings, limit = 8) =>
  groupBy(listings, (l) => l.governorate || l.location?.split(',')[1]?.trim(), limit);

/** Daily counts for the last `days` days (oldest first), by `createdAt`. */
export function dailySeries(items, now = Date.now() / 1000, days = 30) {
  const today = Math.floor(now / DAY);
  const series = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i), count: 0 }));
  for (const item of items) {
    const s = tsSeconds(item.createdAt);
    if (s == null) continue;
    const slot = series[Math.floor(s / DAY) - (today - days + 1)];
    if (slot) slot.count += 1;
  }
  return series.map(({ day, count }) => ({ date: new Date(day * DAY * 1000), count }));
}

/** Approval / rejection share among decided listings (pending excluded). */
export function decisionRates(listings) {
  const approved = listings.filter(isApproved).length;
  const rejected = listings.filter(isRejected).length;
  const decided = approved + rejected;
  return {
    approved,
    rejected,
    approvalPct: decided ? Math.round((approved / decided) * 100) : null,
    rejectionPct: decided ? Math.round((rejected / decided) * 100) : null,
  };
}

/** AI vs human decisions, AI rejections, and the oldest listing still waiting. */
export function moderationQuality(listings, now = Date.now() / 1000) {
  const decided = listings.filter((l) => isApproved(l) || isRejected(l));
  const byAi = decided.filter((l) => l.aiModeration?.decision).length;
  const aiRejected = listings.filter((l) => l.aiModeration?.decision === 'reject').length;
  const waiting = listings
    .filter(isPending)
    .map((l) => tsSeconds(l.createdAt))
    .filter((s) => s != null);
  const oldest = waiting.length ? Math.min(...waiting) : null;
  return {
    byAi,
    byHuman: decided.length - byAi,
    aiRejected,
    oldestPendingDays: oldest == null ? null : Math.max(0, Math.floor((now - oldest) / DAY)),
  };
}

/** Verification and role breakdown of the member base. */
export function userBreakdown(users) {
  const roles = {};
  for (const u of users) {
    const role = u.isAdmin === true ? 'Admin' : u.role || 'Particulier';
    roles[role] = (roles[role] || 0) + 1;
  }
  return {
    total: users.length,
    emailVerified: users.filter((u) => u.emailVerified === true).length,
    phoneVerified: users.filter((u) => u.isPhoneVerified === true).length,
    roles: Object.entries(roles)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Most active sellers by approved listings, with their average review rating
 * when `reviews` ([{ sellerId, rating }]) are supplied.
 */
export function topSellers(listings, users = [], reviews = [], limit = 5) {
  const names = new Map(users.map((u) => [u.id, u.name || u.email]));
  const counts = new Map();
  for (const l of listings.filter(isApproved)) {
    const id = l.sellerId || l.seller?.id;
    if (!id) continue;
    const entry = counts.get(id) || { id, name: l.seller?.name, listings: 0 };
    entry.listings += 1;
    counts.set(id, entry);
  }
  const ratings = new Map();
  for (const r of reviews) {
    const n = Number(r.rating);
    if (!r.sellerId || !Number.isFinite(n)) continue;
    const e = ratings.get(r.sellerId) || { sum: 0, n: 0 };
    e.sum += n;
    e.n += 1;
    ratings.set(r.sellerId, e);
  }
  return [...counts.values()]
    .map((s) => {
      const r = ratings.get(s.id);
      return {
        id: s.id,
        name: names.get(s.id) || s.name || 'Vendeur',
        listings: s.listings,
        rating: r ? Math.round((r.sum / r.n) * 10) / 10 : null,
        reviews: r ? r.n : 0,
      };
    })
    .sort((a, b) => b.listings - a.listings || (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

export function promotionSummary(listings) {
  return {
    hero: listings.find((l) => l.isHeroFeatured) || null,
    sponsored: listings.filter((l) => l.isSponsored),
  };
}

/** Delivery stats over `emailLogs` documents ({ status: 'sent' | 'failed' }). */
export function emailSummary(logs) {
  const sent = logs.filter((l) => l.status === 'sent').length;
  const failed = logs.filter((l) => l.status === 'failed').length;
  const total = sent + failed;
  return { sent, failed, total, successPct: total ? Math.round((sent / total) * 100) : null };
}

/**
 * Listings ranked by views, with how many members favorited them (from each
 * user's `favorites` array) and how many chat messages they received
 * (`adStats`: { [listingId]: { views, messages } }).
 */
export function listingEngagement(listings, users = [], adStats = {}, limit = 5) {
  const favorites = new Map();
  for (const u of users) {
    for (const f of Array.isArray(u.favorites) ? u.favorites : []) {
      const id = f?.id != null ? String(f.id) : null;
      if (id) favorites.set(id, (favorites.get(id) || 0) + 1);
    }
  }
  return listings
    .map((l) => {
      const stats = adStats[String(l.id)] || {};
      return {
        id: l.id,
        title: l.title,
        views: stats.views || 0,
        messages: stats.messages || 0,
        favorites: favorites.get(String(l.id)) || 0,
      };
    })
    .filter((r) => r.views || r.messages || r.favorites)
    .sort((a, b) => b.views - a.views || b.favorites - a.favorites || b.messages - a.messages)
    .slice(0, limit);
}
