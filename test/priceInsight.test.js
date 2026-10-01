// Run with: npm test   (Node's built-in runner, no deps)
//
// A "fair price" verdict is something a buyer acts on, so the failure that
// matters is a confident label on too little evidence, or on evidence
// distorted by junk listings. These pin the places a naive median goes wrong.

const test = require('node:test');
const assert = require('node:assert/strict');

let m;
test.before(async () => { m = await import('../lib/priceInsight.js'); });

let nextId = 1;
const ad = (price, extra = {}) => ({ id: `ad${nextId++}`, status: 'approved', category: 'electronics', price, ...extra });
const pool = (prices, extra) => prices.map((p) => ad(p, extra));
const subject = (price, extra = {}) => ({ id: 'subject', category: 'electronics', price, ...extra });

// 12 phones between 700 and 900, median 800.
const PHONES = [700, 720, 750, 770, 790, 800, 800, 820, 840, 860, 880, 900];

test('with too few comparable listings there is no verdict, not a shaky one', () => {
  const r = m.computePriceInsight(subject(800), pool([700, 800, 900]));
  assert.equal(r.status, 'unavailable');
  assert.equal(r.reason, 'small-sample');
  assert.equal(r.n, 3);
  assert.equal(m.computePriceInsight(subject(800), []).status, 'unavailable');
  assert.equal(m.computePriceInsight(subject(800), null).status, 'unavailable');
});

test('the threshold is exact: one short is unavailable, exactly enough is a verdict', () => {
  assert.equal(m.computePriceInsight(subject(800), pool(PHONES.slice(0, m.MIN_SAMPLE - 1))).status, 'unavailable');
  assert.equal(m.computePriceInsight(subject(800), pool(PHONES.slice(0, m.MIN_SAMPLE))).status, 'ok');
});

test('a price in line with the market is fair, below is low, above is high', () => {
  const p = pool(PHONES);
  assert.equal(m.computePriceInsight(subject(800), p).level, 'fair');
  assert.equal(m.computePriceInsight(subject(500), p).level, 'low');
  assert.equal(m.computePriceInsight(subject(1300), p).level, 'high');
});

test('the verdict reports the median and how many listings it rests on', () => {
  const r = m.computePriceInsight(subject(800), pool(PHONES));
  assert.equal(r.median, 800);
  assert.equal(r.n, PHONES.length);
  assert.equal(r.deltaPct, 0);
  assert.equal(m.computePriceInsight(subject(1000), pool(PHONES)).deltaPct, 25);
});

test('junk listings do not drag the median: a 1 TND placeholder and a typo are ignored', () => {
  const polluted = pool([...PHONES, 1, 1, 99999]);
  const r = m.computePriceInsight(subject(800), polluted);
  assert.equal(r.status, 'ok');
  assert.equal(r.median, 800, 'median must be the real market, not pulled by the junk');
  assert.equal(r.n, PHONES.length, 'the three outliers are trimmed from the count');
});

test('a tightly bunched category does not call a small difference "above market"', () => {
  // Everyone copies the same price. Without a tolerance floor the interquartile
  // range is zero and even 3% over would read as an outlier.
  const bunched = pool(Array(10).fill(1000));
  assert.equal(m.computePriceInsight(subject(1030), bunched).level, 'fair');
  assert.equal(m.computePriceInsight(subject(970), bunched).level, 'fair');
  assert.equal(m.computePriceInsight(subject(1200), bunched).level, 'high', 'but a real gap still shows');
});

test('a listing is never compared with itself', () => {
  const me = ad(800, { id: 'me' });
  const r = m.computePriceInsight(me, [me, ...pool(PHONES)]);
  assert.equal(r.n, PHONES.length, 'its own price must not be counted among its comparables');
});

test('only live listings of the same category count', () => {
  const noise = [
    ...pool(Array(20).fill(50), { category: 'fashion' }),
    ...pool(Array(20).fill(50), { status: 'pending' }),
    ...pool(Array(20).fill(50), { status: 'sold' }),
  ];
  assert.equal(m.computePriceInsight(subject(800), noise).status, 'unavailable');
  assert.equal(m.computePriceInsight(subject(800), [...noise, ...pool(PHONES)]).median, 800);
});

test('free, unpriced and malformed listings are not comparables', () => {
  const junk = [
    ...pool(Array(10).fill(0)),
    ...pool(Array(10).fill(500), { isFree: true }),
    ...pool(Array(10).fill(500), { priceType: 'free' }),
    ...pool(Array(10).fill('abc')),
    ...pool(Array(10).fill(null)),
  ];
  assert.equal(m.computePriceInsight(subject(800), junk).status, 'unavailable');
});

test('a listing with no usable price gets no verdict', () => {
  for (const price of [0, null, undefined, 'abc']) {
    assert.deepEqual(m.computePriceInsight(subject(price), pool(PHONES)), { status: 'unavailable', reason: 'no-price' });
  }
  assert.equal(m.computePriceInsight({ ...subject(800), isFree: true }, pool(PHONES)).status, 'unavailable');
});

test('it narrows to the same brand when there are enough, because brands are not interchangeable', () => {
  const iphones = pool([1000, 1020, 1050, 1080, 1100, 1120, 1150, 1180], { details: { brand: 'Apple' } });
  const cheap = pool([200, 220, 240, 250, 260, 280, 300, 320, 330, 350], { details: { brand: 'Nokia' } });
  const r = m.computePriceInsight(subject(1000, { details: { brand: 'Apple' } }), [...iphones, ...cheap]);
  assert.equal(r.scope, 'brand');
  assert.ok(r.median > 1000, `median ${r.median} must come from the Apple listings only`);
});

test('and to the same condition within a brand, when that is still big enough', () => {
  const used = pool([500, 520, 540, 550, 560, 580, 600, 620], { details: { brand: 'Apple' }, condition: 'Occasion' });
  const sealed = pool([900, 920, 940, 950, 960, 980, 1000, 1020], { details: { brand: 'Apple' }, condition: 'Neuf' });
  const r = m.computePriceInsight(subject(550, { details: { brand: 'Apple' }, condition: 'Occasion' }), [...used, ...sealed]);
  assert.equal(r.scope, 'brand+condition');
  assert.ok(r.median < 700, `a used phone must be judged against used phones, not sealed ones (median ${r.median})`);
  assert.equal(r.level, 'fair');
});

test('it falls back to the whole category when the brand group is too small', () => {
  const few = pool([1000, 1100, 1200], { details: { brand: 'Rare' } });
  const r = m.computePriceInsight(subject(900, { details: { brand: 'Rare' } }), [...few, ...pool(PHONES)]);
  assert.equal(r.scope, 'category');
  assert.equal(r.status, 'ok');
});

test('matching is not thrown by case or stray spaces in brand, condition and category', () => {
  const p = pool([1000, 1020, 1050, 1080, 1100, 1120, 1150, 1180], { details: { brand: ' apple ' }, condition: 'neuf', category: 'Electronics' });
  const r = m.computePriceInsight(subject(1000, { details: { brand: 'Apple' }, condition: 'Neuf' }), p);
  assert.equal(r.scope, 'brand+condition');
});

// ── Suggested opening offer ──

test('without a verdict the offer keeps the 15% off the modal always used', () => {
  assert.equal(m.suggestOffer(200, null), 170);
  assert.equal(m.suggestOffer(200, { status: 'unavailable' }), 170);
});

test('above the market, the offer meets the market — but never below 70% of the ask', () => {
  assert.equal(m.suggestOffer(400, { status: 'ok', level: 'high', median: 330 }), 330);
  assert.equal(m.suggestOffer(400, { status: 'ok', level: 'high', median: 200 }), 280, 'a median far below is a lowball, not an opening offer');
});

test('a fair price gets the usual 10% off, a good deal barely any', () => {
  assert.equal(m.suggestOffer(200, { status: 'ok', level: 'fair', median: 200 }), 180);
  assert.equal(m.suggestOffer(200, { status: 'ok', level: 'low', median: 300 }), 190);
});

test('the suggestion is always an offer: positive, a figure a person would type, and not above the ask', () => {
  for (const ask of [1, 3, 9, 49, 100, 137, 999, 1000, 2599, 45000]) {
    for (const insight of [null, { status: 'ok', level: 'high', median: 1 }, { status: 'ok', level: 'high', median: 10 ** 9 }, { status: 'ok', level: 'fair', median: ask }, { status: 'ok', level: 'low', median: ask * 2 }]) {
      const s = m.suggestOffer(ask, insight);
      assert.ok(Number.isInteger(s) && s >= 1 && s <= ask, `ask ${ask} -> ${s}`);
    }
  }
  assert.equal(m.suggestOffer(137, null) % 5, 0, 'rounded to the nearest 5 above 100');
  assert.equal(m.suggestOffer(2599, null) % 10, 0, 'rounded to the nearest 10 above 1000');
});

test('no usable asking price means no suggestion', () => {
  for (const ask of [0, -5, null, undefined, 'abc']) assert.equal(m.suggestOffer(ask, null), null);
});

test('median handles odd, even and empty input, and skips non-numbers', () => {
  assert.equal(m.median([3, 1, 2]), 2);
  assert.equal(m.median([1, 2, 3, 4]), 2.5);
  assert.equal(m.median([]), null);
  assert.equal(m.median([NaN, 'x', 5]), 5);
});
