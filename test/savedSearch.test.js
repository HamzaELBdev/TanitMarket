// Run with: npm test
//
// A saved search is a promise to notify. The failures that matter: alerting on
// listings that do not match (spam, and users switch notifications off), never
// alerting on ones that do, and the server's copy of the text matching
// disagreeing with the app's.

const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../functions/searchMatch.js');

let client; let lib;
test.before(async () => {
  client = await import('../lib/searchText.js');
  lib = await import('../lib/savedSearch.js');
});

const ad = (extra = {}) => ({ title: 'iPhone 13 Pro 128 Go', description: 'Très bon état', category: 'Électronique', price: 1800, location: 'Tunis, Tunis', ...extra });

test('a listing that contains the words matches', () => {
  assert.equal(server.matchesSavedSearch(ad(), { query: 'iphone 13' }), true);
  assert.equal(server.matchesSavedSearch(ad(), { query: 'samsung' }), false);
});

test('a search with no words never matches, instead of matching everything', () => {
  for (const query of ['', '   ', '!!!', null, undefined]) {
    assert.equal(server.matchesSavedSearch(ad(), { query }), false, JSON.stringify(query));
  }
});

test('the budget is a ceiling, inclusive, and an unpriced listing is not within it', () => {
  assert.equal(server.matchesSavedSearch(ad({ price: 1800 }), { query: 'iphone', maxPrice: 1800 }), true);
  assert.equal(server.matchesSavedSearch(ad({ price: 1801 }), { query: 'iphone', maxPrice: 1800 }), false);
  assert.equal(server.matchesSavedSearch(ad({ price: null }), { query: 'iphone', maxPrice: 2000 }), false);
  assert.equal(server.matchesSavedSearch(ad({ price: null }), { query: 'iphone' }), true, 'no budget set: price is irrelevant');
  assert.equal(server.matchesSavedSearch(ad({ price: 99999 }), { query: 'iphone', maxPrice: '' }), true);
});

test('the governorate matches a whole location part, not a substring', () => {
  const search = { query: 'iphone', governorate: 'Tunis' };
  assert.equal(server.matchesSavedSearch(ad({ location: 'La Marsa, Tunis' }), search), true);
  assert.equal(server.matchesSavedSearch(ad({ location: 'Ariana, Tunisie' }), search), false);
  assert.equal(server.matchesSavedSearch(ad({ location: 'Sfax' }), { query: 'iphone', governorate: 'Toute la Tunisie' }), true);
});

test('Arabic and arabizi spellings of a saved word still match', () => {
  assert.equal(server.matchesSavedSearch(ad({ title: 'سيارة بيجو 208' }), { query: 'sayara' }), true);
});

test('the server copy of the text matching agrees with the app on a shared corpus', () => {
  const texts = ['Téléphone Samsung', 'تلفون سامسونغ', 'سَيَّارَة', 'شقة ٣ غرف', 'iPhone 128 Go', 'Vélo (BMX) - neuf!', 'karhba 3adiya', 'Canapé 3 places', '3akar lil bay3'];
  const queries = ['telephone', 'تلفون', 'sayara', 'شقة 3', '12', 'iph', 'bmx', 'karhba', 'canape', '3akar', 'voiture', ''];
  for (const t of texts) {
    assert.deepEqual(server.searchWords(t), client.searchWords(t), `words of ${t}`);
    for (const q of queries) assert.equal(server.matchesQuery(t, q), client.matchesQuery(t, q), `${q} in ${t}`);
  }
});

// ── building a search on the client ──

const uid = 'u1';

test('a valid search is shaped for storage, with the owner', () => {
  const r = lib.buildSavedSearch({ query: '  iPhone   13 ', governorate: 'Tunis', maxPrice: '1500' }, { uid });
  assert.deepEqual(r, { ok: true, data: { userId: 'u1', query: 'iPhone 13', governorate: 'Tunis', maxPrice: 1500 } });
});

test('a search needs an account and real words', () => {
  assert.equal(lib.buildSavedSearch({ query: 'x' }, {}).error, 'not-signed-in');
  assert.equal(lib.buildSavedSearch({ query: '  ' }, { uid }).error, 'empty-query');
  assert.equal(lib.buildSavedSearch({ query: '?!' }, { uid }).error, 'empty-query');
  assert.equal(lib.buildSavedSearch({ query: 'a'.repeat(lib.QUERY_MAX + 1) }, { uid }).error, 'query-too-long');
});

test('a bad budget is refused rather than silently ignored', () => {
  for (const maxPrice of ['abc', '-5', '0', 1e12]) {
    assert.equal(lib.buildSavedSearch({ query: 'iphone', maxPrice }, { uid }).error, 'bad-price', String(maxPrice));
  }
  assert.equal(lib.buildSavedSearch({ query: 'iphone', maxPrice: null }, { uid }).data.maxPrice, null);
});

test('the same search twice is a duplicate, however it is spelled', () => {
  const existing = [{ query: 'iPhone 13', governorate: 'Toute la Tunisie', maxPrice: null }];
  assert.equal(lib.buildSavedSearch({ query: 'IPHONE   13' }, { uid, existing }).error, 'duplicate');
  assert.equal(lib.buildSavedSearch({ query: 'iphone 13', maxPrice: 900 }, { uid, existing }).ok, true);
});

test('the number of saved searches is capped', () => {
  const existing = Array.from({ length: lib.MAX_SAVED_SEARCHES }, (_, i) => ({ query: `mot${i}`, governorate: 'Toute la Tunisie', maxPrice: null }));
  assert.equal(lib.buildSavedSearch({ query: 'nouveau' }, { uid, existing }).error, 'limit');
});

test('every error code has a translation key', () => {
  for (const code of ['not-signed-in', 'empty-query', 'query-too-long', 'bad-price', 'duplicate', 'limit', 'whatever']) {
    assert.match(lib.savedSearchErrorKey(code), /^savedSearch/);
  }
});
