// Run with: npm test --prefix functions
//
// The expiry cycle is arithmetic on a listing's own timestamps, and the ways
// it goes wrong are all off-by-one-cycle: a renewal that does not restart the
// clock, a reminder that fires every day, a listing taken down a day early.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DAY_MS, EXPIRY_AFTER_DAYS, GRACE_DAYS,
  toMillis, baselineMs, expiryDecision, daysUntilExpiry
} = require('../lifecycle');

const NOW = Date.parse('2026-10-01T12:00:00Z');
const daysAgo = (n) => NOW - n * DAY_MS;
const approved = (extra = {}) => ({ status: 'approved', createdAt: daysAgo(40), ...extra });

test('toMillis accepts every shape a timestamp reaches us in', () => {
  const ms = Date.parse('2026-09-01T00:00:00Z');
  assert.equal(toMillis({ toMillis: () => ms }), ms, 'Firestore Timestamp');
  assert.equal(toMillis({ seconds: ms / 1000, nanoseconds: 0 }), ms, 'plain { seconds }');
  assert.equal(toMillis('2026-09-01T00:00:00Z'), ms, 'ISO string');
  assert.equal(toMillis(ms), ms, 'epoch ms');
});

test('toMillis refuses anything that is not a time, instead of returning NaN', () => {
  for (const bad of [null, undefined, '', 'pas-une-date', NaN, {}, []]) {
    assert.equal(toMillis(bad), null, JSON.stringify(bad));
  }
});

test('a fresh listing is left alone', () => {
  assert.equal(expiryDecision(approved({ createdAt: daysAgo(3) }), NOW), 'none');
  assert.equal(expiryDecision(approved({ createdAt: daysAgo(EXPIRY_AFTER_DAYS - 1) }), NOW), 'none');
});

test('a listing is reminded at the threshold, not a day before', () => {
  assert.equal(expiryDecision(approved({ createdAt: daysAgo(EXPIRY_AFTER_DAYS) }), NOW), 'remind');
  assert.equal(expiryDecision(approved({ createdAt: daysAgo(EXPIRY_AFTER_DAYS - 0.01) }), NOW), 'none');
});

test('the reminder is sent once: a reminded listing is not reminded again the next day', () => {
  const listing = approved({ createdAt: daysAgo(31), expiryReminderSentAt: daysAgo(1) });
  assert.equal(expiryDecision(listing, NOW), 'none');
});

test('a reminded listing expires only after the whole grace period', () => {
  const justShort = approved({ createdAt: daysAgo(40), expiryReminderSentAt: daysAgo(GRACE_DAYS - 0.01) });
  const exactly = approved({ createdAt: daysAgo(40), expiryReminderSentAt: daysAgo(GRACE_DAYS) });
  assert.equal(expiryDecision(justShort, NOW), 'none');
  assert.equal(expiryDecision(exactly, NOW), 'expire');
});

test('renewing restarts the clock', () => {
  const renewed = approved({ createdAt: daysAgo(100), renewedAt: daysAgo(2) });
  assert.equal(expiryDecision(renewed, NOW), 'none');
  const renewedLongAgo = approved({ createdAt: daysAgo(100), renewedAt: daysAgo(31) });
  assert.equal(expiryDecision(renewedLongAgo, NOW), 'remind');
});

test('a reminder from a cycle the owner already closed does not start the next grace period', () => {
  // Reminded 40 days ago, renewed 31 days ago. The reminder predates the
  // renewal, so it belongs to the previous cycle: this one is old enough for
  // a reminder of its own, and must not jump straight to expiry on the
  // strength of the old one.
  const listing = approved({
    createdAt: daysAgo(100),
    expiryReminderSentAt: daysAgo(40),
    renewedAt: daysAgo(31)
  });
  assert.equal(expiryDecision(listing, NOW), 'remind');
});

test('being approved again after an edit restarts the clock', () => {
  const edited = approved({ createdAt: daysAgo(200), approvedAt: daysAgo(5) });
  assert.equal(expiryDecision(edited, NOW), 'none');
});

test('the later of renewal and approval wins', () => {
  assert.equal(baselineMs({ createdAt: daysAgo(90), renewedAt: daysAgo(20), approvedAt: daysAgo(3) }), daysAgo(3));
  assert.equal(baselineMs({ createdAt: daysAgo(90), renewedAt: daysAgo(3), approvedAt: daysAgo(20) }), daysAgo(3));
});

test('only live listings age out', () => {
  for (const status of ['pending', 'rejected', 'reserved', 'sold', 'expired', undefined]) {
    assert.equal(expiryDecision({ status, createdAt: daysAgo(400) }, NOW), 'none', String(status));
  }
});

test('a listing with no usable timestamp is never touched', () => {
  // Guessing an age for it would take down a listing on no evidence.
  for (const createdAt of [undefined, null, '', 'pas-une-date']) {
    assert.equal(expiryDecision({ status: 'approved', createdAt }, NOW), 'none', JSON.stringify(createdAt));
  }
  assert.equal(expiryDecision(null, NOW), 'none');
});

test('daysUntilExpiry counts down to the real deadline and never goes negative', () => {
  assert.equal(daysUntilExpiry(approved({ createdAt: daysAgo(10) }), NOW), EXPIRY_AFTER_DAYS + GRACE_DAYS - 10);
  assert.equal(daysUntilExpiry(approved({ createdAt: daysAgo(31), expiryReminderSentAt: daysAgo(2) }), NOW), GRACE_DAYS - 2);
  assert.equal(daysUntilExpiry(approved({ createdAt: daysAgo(400) }), NOW), 0);
  assert.equal(daysUntilExpiry({ status: 'sold', createdAt: daysAgo(5) }, NOW), null);
});
