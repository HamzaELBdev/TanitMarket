// Run with: npm test   (Node's built-in runner, no deps)
//
// Search is where a seller's listing is either found or silently lost, so the
// pins are on both sides: variants that must match, and look-alikes that must not.

const test = require('node:test');
const assert = require('node:assert/strict');

let m;
test.before(async () => { m = await import('../lib/searchText.js'); });

test('an empty query matches everything', () => {
  for (const q of ['', '   ', null, undefined]) assert.equal(m.matchesQuery('Peugeot 208', q), true);
});

test('case and French accents do not matter', () => {
  assert.equal(m.matchesQuery('Téléphone Samsung', 'telephone'), true);
  assert.equal(m.matchesQuery('telephone samsung', 'TÉLÉPHONE'), true);
  assert.equal(m.matchesQuery('Étagère en bois', 'etagere'), true);
});

test('a missed vowel or a half-typed word still finds the listing', () => {
  assert.equal(m.matchesQuery('iPhone 13 Pro', 'iphn'), true);
  assert.equal(m.matchesQuery('iPhone 13 Pro', 'iph'), true);
  assert.equal(m.matchesQuery('Ordinateur portable', 'ordinatur'), true);
});

test('Arabic and Latin spellings of the same word meet', () => {
  assert.equal(m.matchesQuery('تلفون سامسونغ', 'telefon'), true);
  assert.equal(m.matchesQuery('Telephone Samsung', 'تلفون'), true);
});

test('Arabic diacritics, letter variants and Arabic-Indic digits are flattened', () => {
  assert.equal(m.matchesQuery('سَيَّارَة', 'سيارة'), true);
  assert.equal(m.matchesQuery('أحمر', 'احمر'), true);
  assert.equal(m.matchesQuery('شقة ٣ غرف', 'شقة 3'), true);
});

test('arabizi digits stand for their Arabic letters', () => {
  assert.equal(m.matchesQuery('سيارة', 'sayara'), true);
  assert.equal(m.matchesQuery('كرهبة', 'karhba'), true);
  assert.equal(m.matchesQuery('عقار للبيع', '3akar'), true);
});

test('every word must be present, not just one', () => {
  assert.equal(m.matchesQuery('Samsung Galaxy S21', 'samsung galaxy'), true);
  assert.equal(m.matchesQuery('Samsung Galaxy S21', 'samsung iphone'), false);
});

test('a number must match exactly, so 12 does not find 128', () => {
  assert.equal(m.matchesQuery('iPhone 128 Go', '12'), false);
  assert.equal(m.matchesQuery('iPhone 12', '12'), true);
  assert.equal(m.matchesQuery('Peugeot 208', '208'), true);
});

test('unrelated words are not matched by the loosening', () => {
  assert.equal(m.matchesQuery('Peugeot 208', 'canape'), false);
  assert.equal(m.matchesQuery('Canapé 3 places', 'voiture'), false);
  assert.equal(m.matchesQuery('تلفون', 'سيارة'), false);
});

test('punctuation and odd input do not throw', () => {
  assert.equal(m.matchesQuery('Vélo (BMX) - neuf!', 'bmx'), true);
  assert.equal(m.matchesQuery(undefined, 'x'), false);
  assert.equal(m.matchesQuery(12345, '12345'), true);
});
