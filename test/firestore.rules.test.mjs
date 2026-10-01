// Firestore security rules, exercised against the emulator.
//
//   npm run test:rules
//
// Skipped (not failed) when no emulator is running, so a plain `npm test`
// stays green on a machine without Java or the Firebase CLI. The rules here
// are the only thing between a seller and approving their own rejected
// listing, which is why they have tests of their own rather than trusting
// the client code that is meant to call them correctly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST;
const skip = EMULATOR ? false : 'no Firestore emulator (run: npm run test:rules)';

let testEnv;
let sdk;
let fs;

test.before(async () => {
  if (!EMULATOR) return;
  sdk = await import('@firebase/rules-unit-testing');
  fs = await import('firebase/firestore');
  const [host, port] = EMULATOR.split(':');
  testEnv = await sdk.initializeTestEnvironment({
    projectId: 'tanitmarket-rules-test',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
  });
});

test.after(async () => { await testEnv?.cleanup(); });

test.beforeEach(async () => {
  if (!testEnv) return;
  await testEnv.clearFirestore();
});

const seedAd = (status, extra = {}) => testEnv.withSecurityRulesDisabled(async (ctx) => {
  await fs.setDoc(fs.doc(ctx.firestore(), 'ads', 'ad1'), { sellerId: 'u-seller', title: 'Vélo', status, ...extra });
});
const asOwner = () => testEnv.authenticatedContext('u-seller').firestore();
const asStranger = () => testEnv.authenticatedContext('u-other').firestore();
const asAdmin = () => testEnv.authenticatedContext('u-admin', { email: 'hamza.elborjeni@gmail.com' }).firestore();
const setStatus = (db, status) => fs.updateDoc(fs.doc(db, 'ads', 'ad1'), { status });

// ── An owner moves a listing only along the paths that are theirs to take ──

test('owner: editing sends a live listing back to pending', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(setStatus(asOwner(), 'pending'));
});

test('owner: can mark a live listing sold, and reserve it', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(setStatus(asOwner(), 'sold'));
  await seedAd('approved');
  await sdk.assertSucceeds(setStatus(asOwner(), 'reserved'));
});

test('owner: can put a sold, reserved or expired listing back online', { skip }, async () => {
  for (const before of ['sold', 'reserved', 'expired']) {
    await seedAd(before);
    await sdk.assertSucceeds(setStatus(asOwner(), 'approved'));
  }
});

test('owner: CANNOT approve a rejected listing', { skip }, async () => {
  await seedAd('rejected');
  await sdk.assertFails(setStatus(asOwner(), 'approved'));
});

test('owner: CANNOT approve a pending listing', { skip }, async () => {
  await seedAd('pending');
  await sdk.assertFails(setStatus(asOwner(), 'approved'));
});

test('owner: CANNOT reach sold or reserved from rejected or pending, the back door to approved', { skip }, async () => {
  for (const before of ['rejected', 'pending']) {
    for (const after of ['sold', 'reserved']) {
      await seedAd(before);
      await sdk.assertFails(setStatus(asOwner(), after));
    }
  }
});

test('owner: CANNOT write the scheduler-only status expired', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(setStatus(asOwner(), 'expired'));
});

test('owner: updating other fields of a rejected listing without touching status still works', { skip }, async () => {
  await seedAd('rejected');
  await sdk.assertSucceeds(fs.updateDoc(fs.doc(asOwner(), 'ads', 'ad1'), { title: 'Vélo (corrigé)' }));
});

test('a legacy "Approuvée" listing can still be marked sold', { skip }, async () => {
  await seedAd('Approuvée');
  await sdk.assertSucceeds(setStatus(asOwner(), 'sold'));
});

test('a stranger cannot change anyone else\'s listing', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(setStatus(asStranger(), 'sold'));
});

test('admin: can set any status, including approving a rejected listing', { skip }, async () => {
  await seedAd('rejected');
  await sdk.assertSucceeds(setStatus(asAdmin(), 'approved'));
});

// ── Reports ──

const reportDoc = (overrides = {}) => ({
  listingId: 'ad1', listingTitle: 'Vélo', sellerId: 'u-seller',
  reporterId: 'u-buyer', reporterName: 'Ali',
  reason: 'scam', details: '', status: 'open', createdAt: fs.serverTimestamp(),
  ...overrides,
});
const asBuyer = () => testEnv.authenticatedContext('u-buyer').firestore();
const reportRef = (db, id = 'ad1_u-buyer') => fs.doc(db, 'reports', id);

test('report: a signed-in member can report someone else\'s listing', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(fs.setDoc(reportRef(asBuyer()), reportDoc()));
});

test('report: a second report from the same member on the same listing is refused', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(fs.setDoc(reportRef(asBuyer()), reportDoc()));
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ reason: 'duplicate' })));
});

test('report: the owner cannot report their own listing', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(fs.setDoc(reportRef(asOwner(), 'ad1_u-seller'), reportDoc({ reporterId: 'u-seller' })));
});

test('report: cannot be filed under someone else\'s id or identity', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer(), 'ad1_u-victim'), reportDoc()));
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ reporterId: 'u-victim' })));
});

test('report: unknown reason, oversized details, extra fields and a forged timestamp are refused', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ reason: 'spam' })));
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ details: 'x'.repeat(501) })));
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ isResolved: true })));
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer()), reportDoc({ createdAt: new Date('2020-01-01') })));
});

test('report: a report on a listing that does not exist is refused', { skip }, async () => {
  await sdk.assertFails(fs.setDoc(reportRef(asBuyer(), 'ghost_u-buyer'), reportDoc({ listingId: 'ghost' })));
});

test('report: signed-out visitors cannot report', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertFails(fs.setDoc(reportRef(testEnv.unauthenticatedContext().firestore()), reportDoc()));
});

test('report: the reporter and the seller cannot read it; an admin can', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(fs.setDoc(reportRef(asBuyer()), reportDoc()));
  await sdk.assertFails(fs.getDoc(reportRef(asBuyer())));
  await sdk.assertFails(fs.getDoc(reportRef(asOwner())));
  await sdk.assertSucceeds(fs.getDoc(reportRef(asAdmin())));
});

test('report: only an admin can change or delete one', { skip }, async () => {
  await seedAd('approved');
  await sdk.assertSucceeds(fs.setDoc(reportRef(asBuyer()), reportDoc()));
  await sdk.assertFails(fs.updateDoc(reportRef(asBuyer()), { status: 'resolved' }));
  await sdk.assertFails(fs.deleteDoc(reportRef(asBuyer())));
  await sdk.assertSucceeds(fs.updateDoc(reportRef(asAdmin()), { status: 'resolved' }));
});

// ── Saved searches ──

const savedSearch = (extra = {}) => ({ userId: 'u-other', query: 'iphone 13', governorate: 'Toute la Tunisie', maxPrice: null, createdAt: fs.serverTimestamp(), ...extra });
const searches = (db) => fs.collection(db, 'savedSearches');

test('saved search: a member can save one as themselves', { skip }, async () => {
  await sdk.assertSucceeds(fs.addDoc(searches(asStranger()), savedSearch()));
  await sdk.assertSucceeds(fs.addDoc(searches(asStranger()), savedSearch({ maxPrice: 1500 })));
});

test('saved search: not under someone else\'s identity, not signed out', { skip }, async () => {
  await sdk.assertFails(fs.addDoc(searches(asStranger()), savedSearch({ userId: 'u-seller' })));
  await sdk.assertFails(fs.addDoc(searches(testEnv.unauthenticatedContext().firestore()), savedSearch()));
});

test('saved search: empty or oversized query, bad budget, extra fields and a forged timestamp are refused', { skip }, async () => {
  const db = asStranger();
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ query: '' })));
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ query: 'a'.repeat(81) })));
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ maxPrice: -1 })));
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ maxPrice: '100' })));
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ lastNotifiedAt: 1 })));
  await sdk.assertFails(fs.addDoc(searches(db), savedSearch({ createdAt: fs.Timestamp.fromMillis(1) })));
});

test('saved search: only its owner can read or delete it; nobody can edit it', { skip }, async () => {
  const ref = await fs.addDoc(searches(asStranger()), savedSearch());
  const at = (db) => fs.doc(db, 'savedSearches', ref.id);
  await sdk.assertSucceeds(fs.getDoc(at(asStranger())));
  await sdk.assertFails(fs.getDoc(at(asOwner())));
  await sdk.assertFails(fs.getDoc(at(asAdmin())));
  await sdk.assertFails(fs.updateDoc(at(asStranger()), { query: 'autre' }));
  await sdk.assertFails(fs.deleteDoc(at(asOwner())));
  await sdk.assertSucceeds(fs.deleteDoc(at(asStranger())));
});

test('saved search: a member can list only their own', { skip }, async () => {
  await fs.addDoc(searches(asStranger()), savedSearch());
  await sdk.assertSucceeds(fs.getDocs(fs.query(searches(asStranger()), fs.where('userId', '==', 'u-other'))));
  await sdk.assertFails(fs.getDocs(searches(asStranger())));
});
