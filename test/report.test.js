// Run with: npm test   (Node's built-in runner, no deps)
//
// What a report must satisfy before it is written. firestore.rules is what
// really guards the collection; these pin the same rules client-side so a
// member gets a clear message instead of a permission-denied.

const test = require('node:test');
const assert = require('node:assert/strict');

let mod;
test.before(async () => { mod = await import('../lib/report.js'); });

const listing = { id: 'l1', title: 'Vélo VTT', sellerId: 'u-seller' };
const reporter = { uid: 'u-buyer', name: 'Ali' };

test('a complete report is accepted and shaped for storage', () => {
  const r = mod.buildReport({ listing, reason: 'scam', details: '  Demande un virement avant de me montrer l\'article  ', reporter });
  assert.equal(r.ok, true);
  assert.equal(r.id, 'l1_u-buyer');
  assert.equal(r.data.status, 'open');
  assert.equal(r.data.reporterId, 'u-buyer');
  assert.equal(r.data.sellerId, 'u-seller');
  assert.equal(r.data.details, "Demande un virement avant de me montrer l'article", 'details are trimmed');
});

test('the id is derived from the listing and the reporter, so a repeat hits the same document', () => {
  const a = mod.buildReport({ listing, reason: 'scam', reporter });
  const b = mod.buildReport({ listing, reason: 'duplicate', reporter });
  assert.equal(a.id, b.id, 'same member + same listing must collide, whatever the reason');
  const other = mod.buildReport({ listing, reason: 'scam', reporter: { uid: 'u-other' } });
  assert.notEqual(a.id, other.id, 'a different member must not collide');
});

test('a signed-out visitor cannot report', () => {
  for (const r of [null, undefined, {}, { uid: '' }]) {
    assert.deepEqual(mod.buildReport({ listing, reason: 'scam', reporter: r }), { ok: false, error: 'not-signed-in' });
  }
});

test('nobody reports their own listing, however it was attributed', () => {
  for (const own of [
    { id: 'l', sellerId: 'u-buyer' },
    { id: 'l', seller: { id: 'u-buyer' } },
    { id: 'l', sellerId: 'guest-1', postedByUid: 'u-buyer' },
  ]) {
    assert.deepEqual(mod.buildReport({ listing: own, reason: 'scam', reporter }), { ok: false, error: 'own-listing' });
  }
});

test('only known reasons are accepted', () => {
  for (const bad of [undefined, '', 'spam', 'SCAM', 'scam ', null, 42]) {
    assert.deepEqual(mod.buildReport({ listing, reason: bad, reporter }), { ok: false, error: 'bad-reason' }, JSON.stringify(bad));
  }
  for (const good of mod.REPORT_REASONS) {
    assert.equal(mod.buildReport({ listing, reason: good, details: 'précisions suffisantes', reporter }).ok, true, good);
  }
});

test('details are optional except for "other", and capped at the limit the rules enforce', () => {
  assert.equal(mod.buildReport({ listing, reason: 'scam', reporter }).ok, true, 'optional for a specific reason');
  assert.deepEqual(mod.buildReport({ listing, reason: 'other', details: '  ok ', reporter }), { ok: false, error: 'details-required' });
  assert.equal(mod.buildReport({ listing, reason: 'other', details: 'plus de cinq lettres', reporter }).ok, true);

  const atLimit = 'x'.repeat(mod.REPORT_DETAILS_MAX);
  assert.equal(mod.buildReport({ listing, reason: 'scam', details: atLimit, reporter }).ok, true, 'exactly at the limit');
  assert.deepEqual(mod.buildReport({ listing, reason: 'scam', details: atLimit + 'x', reporter }), { ok: false, error: 'details-too-long' });
});

test('stored text fields are bounded, so one huge title cannot bloat the document', () => {
  const r = mod.buildReport({ listing: { id: 'l', title: 'T'.repeat(5000), sellerId: 'u-seller' }, reason: 'scam', reporter: { uid: 'u1', name: 'N'.repeat(5000) } });
  assert.equal(r.data.listingTitle.length, 200);
  assert.equal(r.data.reporterName.length, 100);
});

test('a missing listing is refused', () => {
  assert.deepEqual(mod.buildReport({ listing: null, reason: 'scam', reporter }), { ok: false, error: 'no-listing' });
  assert.deepEqual(mod.buildReport({ listing: {}, reason: 'scam', reporter }), { ok: false, error: 'no-listing' });
});

test('every error a report can produce has a message in both languages', async () => {
  const { translations } = await import('../lib/translations.js');
  // The codes buildReport and the service can return.
  const codes = ['not-signed-in', 'no-listing', 'own-listing', 'bad-reason', 'details-too-long', 'details-required', 'already-reported', 'failed', 'something-unforeseen'];
  for (const code of codes) {
    const key = mod.reportErrorKey(code);
    for (const lang of ['fr', 'ar']) {
      const text = translations[lang][key];
      assert.ok(typeof text === 'string' && text.length > 0, `no ${lang} message for error "${code}" (key ${key})`);
    }
  }
});

test('every reason has a label in both languages', async () => {
  const { translations } = await import('../lib/translations.js');
  for (const reason of mod.REPORT_REASONS) {
    for (const lang of ['fr', 'ar']) {
      assert.ok(translations[lang][`reportReason_${reason}`], `missing ${lang} label for reason "${reason}"`);
    }
  }
});

test('errors the member can fix are told apart from the generic failure', () => {
  assert.equal(mod.reportErrorKey('already-reported'), 'reportErrAlready');
  assert.equal(mod.reportErrorKey('details-required'), 'reportErrDetails');
  assert.equal(mod.reportErrorKey('own-listing'), 'reportErrOwn');
  assert.equal(mod.reportErrorKey('failed'), 'reportErrFailed');
  assert.equal(mod.reportErrorKey(undefined), 'reportErrFailed');
});
