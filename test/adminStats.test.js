// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const s = require('../lib/adminStats.js');

const NOW = 1_700_000_000;
const ts = (daysAgo) => ({ seconds: NOW - daysAgo * 86400 });
const ad = (id, extra = {}) => ({ id, status: 'approved', category: 'phones', price: 100, governorate: 'Tunis', sellerId: 's1', ...extra });

test('groups by category with count and average price, biggest first', () => {
  const rows = s.listingsByCategory([ad(1), ad(2, { price: 300 }), ad(3, { category: 'cars', price: 0 })]);
  assert.deepEqual(rows.map((r) => [r.key, r.count, r.avgPrice]), [['phones', 2, 200], ['cars', 1, null]]);
});

test('governorate falls back to the location string and respects the limit', () => {
  const rows = s.listingsByGovernorate([ad(1, { governorate: undefined, location: 'Ariana, Ariana' }), ad(2, { governorate: 'Sfax' })], 1);
  assert.equal(rows.length, 1);
});

test('daily series buckets by day and ignores older or undated items', () => {
  const series = s.dailySeries([{ createdAt: ts(0) }, { createdAt: ts(0) }, { createdAt: ts(2) }, { createdAt: ts(60) }, {}], NOW, 30);
  assert.equal(series.length, 30);
  assert.equal(series.at(-1).count, 2);
  assert.equal(series.at(-3).count, 1);
  assert.equal(series.reduce((a, b) => a + b.count, 0), 3);
});

test('decision rates exclude pending listings', () => {
  const r = s.decisionRates([ad(1), ad(2), ad(3, { status: 'rejected' }), ad(4, { status: 'pending' })]);
  assert.deepEqual([r.approvalPct, r.rejectionPct], [67, 33]);
  assert.equal(s.decisionRates([ad(1, { status: 'pending' })]).approvalPct, null);
});

test('moderation quality counts AI decisions and the oldest pending listing', () => {
  const q = s.moderationQuality([
    ad(1, { aiModeration: { decision: 'approve' } }),
    ad(2, { status: 'rejected', aiModeration: { decision: 'reject' } }),
    ad(3),
    ad(4, { status: 'pending', createdAt: ts(5) }),
    ad(5, { status: 'pending', createdAt: ts(2) }),
  ], NOW);
  assert.deepEqual([q.byAi, q.byHuman, q.aiRejected, q.oldestPendingDays], [2, 1, 1, 5]);
});

test('user breakdown counts verifications and roles (isAdmin wins)', () => {
  const b = s.userBreakdown([{ emailVerified: true }, { isPhoneVerified: true, role: 'Pro' }, { isAdmin: true, role: 'Particulier' }]);
  assert.equal(b.emailVerified, 1);
  assert.equal(b.phoneVerified, 1);
  assert.deepEqual(b.roles.map((r) => r.role).sort(), ['Admin', 'Particulier', 'Pro']);
});

test('top sellers rank by approved listings and average the ratings', () => {
  const top = s.topSellers(
    [ad(1), ad(2), ad(3, { sellerId: 's2' }), ad(4, { sellerId: 's2', status: 'pending' })],
    [{ id: 's1', name: 'Amel' }],
    [{ sellerId: 's1', rating: 5 }, { sellerId: 's1', rating: 4 }],
  );
  assert.deepEqual(top.map((t) => [t.id, t.name, t.listings, t.rating]), [['s1', 'Amel', 2, 4.5], ['s2', 'Vendeur', 1, null]]);
});

test('promotion summary and email summary', () => {
  const p = s.promotionSummary([ad(1, { isHeroFeatured: true }), ad(2, { isSponsored: true }), ad(3)]);
  assert.equal(p.hero.id, 1);
  assert.equal(p.sponsored.length, 1);
  assert.deepEqual(s.emailSummary([{ status: 'sent' }, { status: 'sent' }, { status: 'failed' }, { status: 'sent' }]), { sent: 3, failed: 1, total: 4, successPct: 75 });
  assert.equal(s.emailSummary([]).successPct, null);
});

test('engagement ranks by views and merges favorites and message counts', () => {
  const rows = s.listingEngagement(
    [ad(1, { title: 'A' }), ad(2, { title: 'B' }), ad(3, { title: 'C' })],
    [{ favorites: [{ id: 2 }, { id: '3' }] }, { favorites: [{ id: 2 }] }, {}],
    { 1: { views: 10, messages: 1 }, 2: { views: 10 } },
  );
  assert.deepEqual(rows.map((r) => [r.id, r.views, r.favorites, r.messages]), [[2, 10, 2, 0], [1, 10, 0, 1], [3, 0, 1, 0]]);
  assert.deepEqual(s.listingEngagement([ad(9)], [], {}), []);
});
