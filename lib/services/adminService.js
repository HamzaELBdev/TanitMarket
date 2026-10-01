import { db, auth } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';
const EMAIL_LOGS_COLLECTION = 'emailLogs';
const REVIEWS_COLLECTION = 'sellerReviews';
const AD_STATS_COLLECTION = 'adStats';

export const REPORT_REASONS = [
  { key: 'scam', label: 'Arnaque ou fraude' },
  { key: 'prohibited', label: 'Article interdit' },
  { key: 'duplicate', label: 'Annonce en double' },
  { key: 'wrong_info', label: 'Informations erronées' },
  { key: 'other', label: 'Autre' },
];

/** File a report on a listing as the signed-in user (rules enforce this). */
export async function createReport({ listingId, listingTitle, reason, details = '' }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous pour signaler une annonce.');
  if (!listingId || !reason) throw new Error('Annonce ou motif manquant.');
  await addDoc(collection(db, REPORTS_COLLECTION), {
    listingId: String(listingId),
    listingTitle: String(listingTitle || '').slice(0, 200),
    reason,
    details: String(details).trim().slice(0, 500),
    reporterId: user.uid,
    status: 'open',
    createdAt: serverTimestamp(),
  });
  return true;
}

function subscribeList(collectionName, constraints, callback) {
  try {
    return onSnapshot(
      query(collection(db, collectionName), ...constraints),
      (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => { console.warn(`${collectionName} listener error:`, err); callback([]); }
    );
  } catch (err) {
    callback([]);
    return () => {};
  }
}

/** Admin only (firestore.rules). */
export const subscribeAdminReports = (callback) =>
  subscribeList(REPORTS_COLLECTION, [orderBy('createdAt', 'desc'), limit(200)], callback);

export const subscribeEmailLogs = (callback) =>
  subscribeList(EMAIL_LOGS_COLLECTION, [orderBy('createdAt', 'desc'), limit(200)], callback);

/** Admin only. Emits { [listingId]: { views, messages } }. */
export function subscribeAdStats(callback) {
  try {
    return onSnapshot(
      collection(db, AD_STATS_COLLECTION),
      (snapshot) => callback(Object.fromEntries(snapshot.docs.map((d) => [d.id, d.data()]))),
      (err) => { console.warn('adStats listener error:', err); callback({}); }
    );
  } catch (err) {
    callback({});
    return () => {};
  }
}

/**
 * Count one view of a listing, at most once per browser session. The seller
 * and admins looking at their own pages are not counted. Never throws.
 */
export async function trackListingView(listingId) {
  if (!listingId || typeof window === 'undefined') return false;
  const key = `tanit_viewed_${listingId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
  } catch { /* storage blocked: count anyway */ }
  try {
    await setDoc(doc(db, AD_STATS_COLLECTION, String(listingId)), { views: increment(1) }, { merge: true });
    return true;
  } catch (err) {
    console.warn('trackListingView error:', err);
    return false;
  }
}

/** Public read; used for seller ratings in the dashboard. */
export const subscribeAllSellerReviews = (callback) =>
  subscribeList(REVIEWS_COLLECTION, [limit(1000)], callback);

export async function updateReportStatusInDb(id, status) {
  await updateDoc(doc(db, REPORTS_COLLECTION, String(id)), {
    status,
    handledAt: serverTimestamp(),
  });
  return true;
}
