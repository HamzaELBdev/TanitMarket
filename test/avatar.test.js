// Run with: npm test   (Node's built-in runner, no deps)
//
// These are the rules that decide whose photo shows up across the whole site.
// The bug they lock down: listings used to record only Firebase Auth's
// photoURL, so a member who uploaded a photo in their account settings kept
// appearing without one on every listing, card and chat thread.

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveUserAvatar, resolveSellerAvatar, initialOf } = require('../lib/avatar.js');

test('the uploaded photo wins over the auth provider photo', () => {
  const profile = { avatarUrl: 'https://storage/uploaded.jpg' };
  const authUser = { photoURL: 'https://google/social.jpg' };
  assert.equal(resolveUserAvatar(profile, authUser), 'https://storage/uploaded.jpg');
});

test('the auth provider photo is used when nothing was uploaded', () => {
  assert.equal(
    resolveUserAvatar({ avatarUrl: '' }, { photoURL: 'https://google/social.jpg' }),
    'https://google/social.jpg'
  );
  assert.equal(resolveUserAvatar(null, { photoURL: 'https://google/social.jpg' }), 'https://google/social.jpg');
});

test('no photo anywhere resolves to null, never to undefined or a stray string', () => {
  for (const args of [[null, null], [{}, {}], [undefined, undefined], [{ avatarUrl: '' }, { photoURL: '' }]]) {
    assert.equal(resolveUserAvatar(...args), null);
  }
});

test("a seller's live profile overrides the photo copied onto the listing", () => {
  const product = { seller: { avatar: 'https://old/stale.jpg' } };
  const sellerDoc = { avatarUrl: 'https://storage/current.jpg' };
  assert.equal(resolveSellerAvatar(product, sellerDoc), 'https://storage/current.jpg');
});

test('the listing photo is used when the seller profile is not loaded', () => {
  const product = { seller: { avatar: 'https://copied/at-publish.jpg' } };
  assert.equal(resolveSellerAvatar(product, null), 'https://copied/at-publish.jpg');
  assert.equal(resolveSellerAvatar(product), 'https://copied/at-publish.jpg');
});

test('a listing with no seller photo resolves to null so the UI shows an initial', () => {
  assert.equal(resolveSellerAvatar({ seller: { avatar: '' } }, { avatarUrl: '' }), null);
  assert.equal(resolveSellerAvatar({}), null);
  assert.equal(resolveSellerAvatar(null), null);
});

test('initialOf falls through the candidates and is always one upper-case letter', () => {
  assert.equal(initialOf('Hamza'), 'H');
  assert.equal(initialOf('', 'ali@x.tn'), 'A');
  assert.equal(initialOf(null, undefined, 'sana'), 'S');
  assert.equal(initialOf('  leila'), 'L', 'leading spaces must not produce a blank initial');
  assert.equal(initialOf('émilie'), 'É');
});

test('initialOf never returns an empty string', () => {
  for (const args of [[], [''], [null], [undefined], ['   '], [0], [false]]) {
    const result = initialOf(...args);
    assert.equal(result.length >= 1, true, `empty initial for ${JSON.stringify(args)}`);
  }
});
