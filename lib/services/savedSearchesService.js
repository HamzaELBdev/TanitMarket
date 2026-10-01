import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { buildSavedSearch } from '@/lib/savedSearch';

const COLLECTION = 'savedSearches';

/**
 * Live list of the member's own saved searches, oldest first. The query is
 * filtered by userId because firestore.rules only lets a member read their own
 * documents, and a rule-denied collection read fails as a whole.
 */
export function subscribeSavedSearches(uid, callback) {
  const q = query(collection(db, COLLECTION), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.createdAt?.toMillis?.() || Infinity) - (b.createdAt?.toMillis?.() || Infinity));
      callback(items);
    },
    (err) => { console.warn('Saved searches subscription error:', err); callback([]); },
  );
}

/** Resolves to { ok: true } or { ok: false, error } with a stable code. */
export async function addSavedSearch({ uid, query: text, governorate, maxPrice, existing }) {
  const built = buildSavedSearch({ query: text, governorate, maxPrice }, { uid, existing });
  if (!built.ok) return built;
  try {
    await addDoc(collection(db, COLLECTION), { ...built.data, createdAt: serverTimestamp() });
    return { ok: true };
  } catch (err) {
    console.warn('Save search error:', err);
    return { ok: false, error: 'failed' };
  }
}

export async function removeSavedSearch(id) {
  await deleteDoc(doc(db, COLLECTION, String(id)));
}
