// Run with: npm test   (Node's built-in runner, no deps)
//
// Who a buyer reaches when they open a chat. Getting this wrong is silent:
// a conversation addressed to an id with no account behind it is created
// normally, accepts messages, and tells nobody — which is exactly the bug
// these rules exist to close.

const test = require('node:test');
const assert = require('node:assert/strict');
const { isPlaceholderSellerId, resolveListingContactId } = require('../lib/listingContact.js');

test('a real uid is not treated as a placeholder', () => {
  for (const id of ['abc123XYZ', 'kR3nF9qLmP', 'guestavenue']) {
    assert.equal(isPlaceholderSellerId(id), false, id);
  }
});

test('the ids the listing flow invents are recognised as placeholders', () => {
  // create-listing and the dashboard mint these when there is no account.
  assert.equal(isPlaceholderSellerId('guest-1733000000000'), true);
  assert.equal(isPlaceholderSellerId('seller-1733000000000'), true);
  assert.equal(isPlaceholderSellerId('admin-root'), true);
});

test('an absent id is a placeholder, not a crash', () => {
  for (const id of [undefined, null, '', 0, false]) {
    assert.equal(isPlaceholderSellerId(id), false, `${JSON.stringify(id)} is empty, not synthetic`);
  }
});

test('an ordinary listing routes to its seller', () => {
  assert.equal(resolveListingContactId({ sellerId: 'uid-seller' }), 'uid-seller');
  assert.equal(resolveListingContactId({ seller: { id: 'uid-seller' } }), 'uid-seller');
});

test('a listing posted on someone behalf routes to the admin who posted it', () => {
  const listing = { sellerId: 'guest-1733000000000', postedByUid: 'uid-admin', seller: { id: 'guest-1733000000000' } };
  assert.equal(resolveListingContactId(listing), 'uid-admin');
});

test('the real seller still wins over postedByUid when there is one', () => {
  // A normal listing should never be diverted, whatever else it carries.
  const listing = { sellerId: 'uid-seller', postedByUid: 'uid-admin' };
  assert.equal(resolveListingContactId(listing), 'uid-seller');
});

test('a placeholder with nobody behind it resolves to null, so no chat is opened', () => {
  // Listings published before postedByUid existed. The caller must refuse
  // rather than open a conversation that reaches no one.
  assert.equal(resolveListingContactId({ sellerId: 'guest-1733000000000' }), null);
  assert.equal(resolveListingContactId({ sellerId: 'guest-1', postedByUid: '' }), null);
  assert.equal(resolveListingContactId({}), null);
  assert.equal(resolveListingContactId(null), null);
  assert.equal(resolveListingContactId(undefined), null);
});
