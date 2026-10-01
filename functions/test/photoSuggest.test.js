// Run with: npm test --prefix functions
//
// A wrong category on a pre-filled form is worse than an empty form: the
// seller trusts it. These pin the cases where a naive "top label wins"
// mapping goes wrong.

const test = require('node:test');
const assert = require('node:assert/strict');
const { suggestFromLabels, CATEGORY_KEYWORDS } = require('../photoSuggest');

const L = (...pairs) => pairs.map(([description, score]) => ({ description, score }));

test('a clear phone photo is electronics, titled in French', () => {
  const r = suggestFromLabels(L(['Mobile phone', 0.97], ['Gadget', 0.95], ['Communication Device', 0.9]));
  assert.equal(r.category, 'electronics');
  assert.equal(r.title, 'Téléphone portable');
});

test('other everyday objects land in their category', () => {
  assert.equal(suggestFromLabels(L(['Couch', 0.95], ['Furniture', 0.93])).category, 'home');
  assert.equal(suggestFromLabels(L(['Bicycle', 0.96], ['Bicycle wheel', 0.9])).category, 'sports');
  assert.equal(suggestFromLabels(L(['Dog', 0.98], ['Dog breed', 0.9])).category, 'pets');
  assert.equal(suggestFromLabels(L(['Sneakers', 0.95], ['Footwear', 0.94])).category, 'fashion');
  assert.equal(suggestFromLabels(L(['Car', 0.97], ['Motor vehicle', 0.95])).category, 'vehicles');
});

test('weak labels are ignored: no evidence, no suggestion', () => {
  assert.equal(suggestFromLabels(L(['Mobile phone', 0.5], ['Gadget', 0.4])), null);
  assert.equal(suggestFromLabels([]), null);
  assert.equal(suggestFromLabels(null), null);
  assert.equal(suggestFromLabels([{ description: 'Dog', score: 'high' }, { score: 0.9 }, null]), null);
});

test('a label only matches a whole keyword, so "carpet" is not a car', () => {
  const r = suggestFromLabels(L(['Carpet', 0.95]));
  assert.equal(r.category, 'home');
  assert.equal(suggestFromLabels(L(['Cartoon', 0.95])), null);
});

test('an unclear photo (two categories tied) suggests nothing rather than guessing', () => {
  assert.equal(suggestFromLabels(L(['Dog', 0.9], ['Car', 0.9])), null);
});

test('the title never falls back to an English or generic label', () => {
  const r = suggestFromLabels(L(['Gadget', 0.95], ['Electronic device', 0.93], ['Product', 0.9]));
  assert.equal(r.category, 'electronics');
  assert.equal(r.title, '', 'nothing in French to say, so the title is left for the seller');
});

test('the strongest nameable label is used, not just the first', () => {
  const r = suggestFromLabels(L(['Gadget', 0.99], ['Laptop', 0.96], ['Computer', 0.95]));
  assert.equal(r.title, 'Ordinateur portable');
});

test('every keyword is lower-case, so matching is a plain comparison', () => {
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) assert.equal(w, w.toLowerCase(), `${cat}: ${w}`);
  }
});

test('the evidence is returned so the UI can show what was seen', () => {
  const r = suggestFromLabels(L(['Couch', 0.95], ['Furniture', 0.93], ['Living room', 0.9]));
  assert.deepEqual(r.labels, ['couch', 'furniture', 'living room']);
});
