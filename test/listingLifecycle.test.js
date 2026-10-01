// Run with: npm test
//
// lib/listingLifecycle.js is a copy of functions/lifecycle.js (the two cannot
// import each other). A copy is only safe if something notices when it drifts:
// this runs both over the same grid of listings and demands identical answers.

const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../functions/lifecycle.js');

let client;
test.before(async () => { client = await import('../lib/listingLifecycle.js'); });

const NOW = Date.parse('2026-10-01T12:00:00Z');
const DAY = 86400000;
const ago = (d) => NOW - d * DAY;

test('both sides use the same constants', () => {
  assert.equal(client.EXPIRY_AFTER_DAYS, server.EXPIRY_AFTER_DAYS);
  assert.equal(client.GRACE_DAYS, server.GRACE_DAYS);
  assert.equal(client.DAY_MS, server.DAY_MS);
});

test('both sides read timestamps identically', () => {
  const ms = Date.parse('2026-09-01T00:00:00Z');
  for (const v of [{ toMillis: () => ms }, { seconds: ms / 1000, nanoseconds: 5e6 }, '2026-09-01T00:00:00Z', ms, null, undefined, '', 'nope', NaN, {}]) {
    assert.equal(client.toMillis(v), server.toMillis(v), JSON.stringify(v));
  }
});

test('both sides count the days left the same way, across every state a listing can be in', () => {
  const statuses = ['approved', 'pending', 'rejected', 'reserved', 'sold', 'expired', undefined];
  const ages = [0, 1, 10, 29.5, 30, 30.5, 36, 37, 38, 90, 400];
  const reminders = [undefined, 0.5, 3, 6.9, 7, 8, 50];
  const renewals = [undefined, 2, 31, 200];
  const approvals = [undefined, 4, 45];

  let compared = 0;
  for (const status of statuses) {
    for (const age of ages) {
      for (const rem of reminders) {
        for (const ren of renewals) {
          for (const app of approvals) {
            const listing = {
              status,
              createdAt: ago(age),
              ...(rem !== undefined ? { expiryReminderSentAt: ago(rem) } : {}),
              ...(ren !== undefined ? { renewedAt: ago(ren) } : {}),
              ...(app !== undefined ? { approvedAt: ago(app) } : {}),
            };
            assert.equal(
              client.daysUntilExpiry(listing, NOW),
              server.daysUntilExpiry(listing, NOW),
              `diverged on ${JSON.stringify(listing)}`
            );
            compared += 1;
          }
        }
      }
    }
  }
  assert.ok(compared > 3000, `grid too small to mean anything: ${compared}`);
});

test('near-expiry turns on inside the window and not before', () => {
  const live = (age) => ({ status: 'approved', createdAt: ago(age) });
  // 37 days total: 10 days left starts at age 27.
  assert.equal(client.isNearExpiry(live(20), NOW), false);
  assert.equal(client.isNearExpiry(live(27), NOW), true);
  assert.equal(client.isNearExpiry(live(36), NOW), true);
  assert.equal(client.isNearExpiry({ status: 'sold', createdAt: ago(36) }, NOW), false, 'not live, nothing to renew');
  assert.equal(client.isNearExpiry({ status: 'approved' }, NOW), false, 'no date, no guess');
});
