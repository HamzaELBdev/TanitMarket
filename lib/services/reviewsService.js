import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const REVIEWS_COLLECTION = 'sellerReviews';

// One review per (seller, author) pair — resubmitting updates it in place
// rather than creating a duplicate.
function buildReviewId(sellerId, authorId) {
  return `${sellerId}__${authorId}`;
}

/**
 * Create or update the current user's star rating + comment for a seller.
 */
export async function submitSellerReview(sellerId, { authorId, authorName, authorAvatar, rating, comment }) {
  if (!sellerId || !authorId) throw new Error('Vendeur ou auteur manquant.');
  if (sellerId === authorId) throw new Error('Vous ne pouvez pas évaluer votre propre profil.');

  const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));
  const ref = doc(db, REVIEWS_COLLECTION, buildReviewId(sellerId, authorId));
  await setDoc(ref, {
    sellerId,
    authorId,
    authorName: authorName || 'Utilisateur TanitMarket',
    authorAvatar: authorAvatar || '',
    rating: clampedRating,
    comment: comment?.trim() || '',
    createdAt: serverTimestamp()
  }, { merge: true });

  return true;
}

/**
 * Real-time list of every review left for a given seller, newest first.
 */
export function subscribeToSellerReviews(sellerId, callback) {
  if (!sellerId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), where('sellerId', '==', sellerId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      callback(items);
    }, () => callback([]));
  } catch (err) {
    callback([]);
    return () => {};
  }
}
