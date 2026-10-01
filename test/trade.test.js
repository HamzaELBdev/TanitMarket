// Run with: npm test   (Node's built-in runner, no deps)
//
// A trade proposal is two people agreeing to swap goods. The failures that
// matter: offering something that is not yours or not live, accepting your own
// proposal, and a malformed message breaking the thread.

const test = require('node:test');
const assert = require('node:assert/strict');

let m;
test.before(async () => { m = await import('../lib/trade.js'); });

const mine = (extra = {}) => ({ id: 'ad-bike', sellerId: 'alice', status: 'approved', title: 'Vélo de ville', images: ['https://img.example/bike.jpg'], ...extra });

// ── building ──

test('a valid proposal carries the item and the top-up', () => {
  const r = m.buildTrade({ offered: mine(), cash: '50', uid: 'alice', targetListingId: 'ad-console' });
  assert.deepEqual(r, { ok: true, data: { offeredListingId: 'ad-bike', offeredTitle: 'Vélo de ville', offeredImage: 'https://img.example/bike.jpg', cash: 50 } });
  assert.equal(m.buildTrade({ offered: mine(), cash: '', uid: 'alice' }).data.cash, 0);
  assert.equal(m.buildTrade({ offered: mine(), uid: 'alice' }).data.cash, 0);
});

test('you can only offer your own live listing', () => {
  assert.equal(m.buildTrade({ offered: mine(), uid: 'bob' }).error, 'not-yours');
  assert.equal(m.buildTrade({ offered: mine({ status: 'pending' }), uid: 'alice' }).error, 'not-live');
  assert.equal(m.buildTrade({ offered: mine({ status: 'sold' }), uid: 'alice' }).error, 'not-live');
  assert.equal(m.buildTrade({ offered: null, uid: 'alice' }).error, 'no-item');
  assert.equal(m.buildTrade({ offered: mine(), uid: '' }).error, 'not-signed-in');
});

test('you cannot trade a listing for itself', () => {
  assert.equal(m.buildTrade({ offered: mine({ id: 'x' }), uid: 'alice', targetListingId: 'x' }).error, 'same-item');
});

test('the top-up must be a sane, non-negative amount', () => {
  for (const cash of ['abc', -1, '-5', 1e9]) assert.equal(m.buildTrade({ offered: mine(), cash, uid: 'alice' }).error, 'bad-cash', String(cash));
  assert.equal(m.buildTrade({ offered: mine(), cash: 12.6, uid: 'alice' }).data.cash, 13);
});

test('an unsafe or missing image is dropped, not stored', () => {
  assert.equal(m.buildTrade({ offered: mine({ images: ['javascript:alert(1)'] }), uid: 'alice' }).data.offeredImage, null);
  assert.equal(m.buildTrade({ offered: mine({ images: ['http://insecure/x.jpg'] }), uid: 'alice' }).data.offeredImage, null);
  assert.equal(m.buildTrade({ offered: mine({ images: [], image: undefined }), uid: 'alice' }).data.offeredImage, null);
});

test('every error code has a translation key', () => {
  for (const c of ['not-signed-in', 'no-item', 'not-yours', 'not-live', 'same-item', 'bad-cash', 'other']) assert.match(m.tradeErrorKey(c), /^trade/);
});

// ── reading what other people wrote ──

test('malformed proposals and replies are ignored', () => {
  for (const bad of [null, {}, { trade: 'x' }, { trade: { offeredListingId: '', offeredTitle: 'A', cash: 0 } }, { trade: { offeredListingId: 'a', offeredTitle: '  ', cash: 0 } }, { trade: { offeredListingId: 'a', offeredTitle: 'A', cash: -3 } }, { trade: { offeredListingId: 'a', offeredTitle: 'A', cash: 'lots' } }, { trade: { offeredListingId: 5, offeredTitle: 'A', cash: 0 } }]) {
    assert.equal(m.readTrade(bad), null, JSON.stringify(bad));
  }
  for (const bad of [null, {}, { tradeReply: { to: 1, answer: 'accept' } }, { tradeReply: { to: 'p', answer: 'steal' } }]) {
    assert.equal(m.readTradeReply(bad), null, JSON.stringify(bad));
  }
});

test('a stored image that is not https is not rendered', () => {
  const t = m.readTrade({ trade: { offeredListingId: 'a', offeredTitle: 'A', offeredImage: 'javascript:alert(1)', cash: 0 } });
  assert.equal(t.offeredImage, null);
});

// ── state ──

const proposal = () => ({ id: 'p1', senderId: 'alice', trade: { offeredListingId: 'ad-bike', offeredTitle: 'Vélo', cash: 20 } });
const reply = (answer, senderId, to = 'p1') => ({ id: `r-${answer}-${senderId}`, senderId, tradeReply: { to, answer } });

test('the other person accepts or declines; the proposer withdraws', () => {
  assert.equal(m.tradeStatus(proposal(), [proposal()]), 'proposed');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('accept', 'bob')]), 'accepted');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('decline', 'bob')]), 'declined');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('withdraw', 'alice')]), 'withdrawn');
});

test('nobody can accept their own proposal, or withdraw someone else\'s', () => {
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('accept', 'alice')]), 'proposed');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('decline', 'alice')]), 'proposed');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('withdraw', 'bob')]), 'proposed');
});

test('the last valid answer wins, and answers to other proposals do not count', () => {
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('accept', 'bob'), reply('withdraw', 'alice')]), 'withdrawn');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('accept', 'bob'), reply('decline', 'bob')]), 'declined');
  assert.equal(m.tradeStatus(proposal(), [proposal(), reply('accept', 'bob', 'other')]), 'proposed');
  assert.equal(m.tradeStatus({ id: 'p', senderId: 'a' }, []), null);
});

test('what a viewer may do follows the state and their side', () => {
  assert.deepEqual(m.tradeActions('proposed', { isProposer: false }), ['accept', 'decline']);
  assert.deepEqual(m.tradeActions('proposed', { isProposer: true }), ['withdraw']);
  assert.deepEqual(m.tradeActions('accepted', { isProposer: false }), ['decline']);
  for (const s of ['declined', 'withdrawn']) assert.deepEqual(m.tradeActions(s, { isProposer: true }), [], s);
});

test('the stored text reads sensibly in a notification', () => {
  assert.equal(m.tradeSummary({ offeredTitle: 'Vélo', cash: 50 }), '🔄 Proposition de troc : « Vélo » + 50 TND');
  assert.equal(m.tradeSummary({ offeredTitle: 'Vélo', cash: 0 }), '🔄 Proposition de troc : « Vélo »');
  assert.match(m.tradeReplySummary('accept', { offeredTitle: 'Vélo' }), /accepté/);
  assert.match(m.tradeReplySummary('decline', { offeredTitle: 'Vélo' }), /refusé/);
  assert.match(m.tradeReplySummary('withdraw', { offeredTitle: 'Vélo' }), /retiré/);
});
