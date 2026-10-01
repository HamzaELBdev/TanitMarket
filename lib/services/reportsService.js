import { collection, doc, setDoc, updateDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { buildReport } from '@/lib/report';

const REPORTS_COLLECTION = 'reports';

/**
 * File a report against a listing. Resolves to { ok: true } or
 * { ok: false, error } with a stable error code the UI turns into a message.
 *
 * `already-reported` is how a second attempt shows up: the document id is
 * derived from listing + reporter, firestore.rules only lets a non-admin
 * create it, so overwriting it is refused with permission-denied.
 */
export async function submitListingReport({ listing, reason, details, reporterName }) {
  const user = auth.currentUser;
  const built = buildReport({
    listing,
    reason,
    details,
    reporter: { uid: user?.uid, name: reporterName || user?.displayName || '' },
  });
  if (!built.ok) return built;

  try {
    await setDoc(doc(db, REPORTS_COLLECTION, built.id), {
      ...built.data,
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    if (err?.code === 'permission-denied') return { ok: false, error: 'already-reported' };
    console.warn('Report listing error:', err);
    return { ok: false, error: 'failed' };
  }
}

/**
 * Live list of reports, newest first. Admin only: firestore.rules refuses the
 * read to everyone else, which is what keeps a reporter's identity from the
 * seller they reported.
 */
export function subscribeToReports(callback, onError) {
  const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('Reports subscription error:', err);
      if (typeof onError === 'function') onError(err);
    }
  );
}

/** An admin has dealt with a report. */
export async function resolveReport(id) {
  await updateDoc(doc(db, REPORTS_COLLECTION, String(id)), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: auth.currentUser?.uid || null,
  });
}
