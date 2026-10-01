// Run with: npm test   (Node's built-in runner, no deps)
const test = require('node:test');
const assert = require('node:assert/strict');
const { getPriceInsight, median, MIN_COMPARABLES } = require('../lib/priceInsight.js');

const mk = (id, price, extra = {}) => ({ id, price, category: 'Phones', priceType: 'fixed', status: 'approved', ...extra });
const market = [100, 100, 100, 100, 100].map((p, i) => mk('m' + i, p));

test('median handles odd, even and empty input', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});

test('classifies against the category median', () => {
  assert.equal(getPriceInsight(mk('p', 70), market).level, 'good');
  assert.equal(getPriceInsight(mk('p', 100), market).level, 'market');
  assert.equal(getPriceInsight(mk('p', 115), market).level, 'market');
  assert.equal(getPriceInsight(mk('p', 130), market).level, 'high');
  assert.equal(getPriceInsight(mk('p', 130), market).deltaPct, 30);
});

test('says nothing without enough comparables', () => {
  assert.equal(getPriceInsight(mk('p', 50), market.slice(0, MIN_COMPARABLES - 1)), null);
});

test('ignores itself, other categories, non-approved and non-fixed listings', () => {
  const noise = [
    mk('p', 1), mk('x1', 1, { category: 'Cars' }), mk('x2', 1, { status: 'pending' }),
    mk('x3', 0, { priceType: 'negotiable' }), mk('x4', 0, { isFree: true, priceType: 'free' }),
  ];
  assert.equal(getPriceInsight(mk('p', 100), [...market, ...noise]).median, 100);
});

test('never judges free or negotiable listings', () => {
  assert.equal(getPriceInsight(mk('p', 0, { isFree: true, priceType: 'free' }), market), null);
  assert.equal(getPriceInsight(mk('p', 0, { priceType: 'negotiable' }), market), null);
  assert.equal(getPriceInsight(mk('p', 50, { priceType: 'negotiable' }), market), null);
});

test('no category, no verdict', () => {
  assert.equal(getPriceInsight(mk('p', 50, { category: undefined }), market), null);
});
