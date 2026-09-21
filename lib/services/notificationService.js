import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  query,
  where
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function createPendingAdNotification(adData, adId, currentUid) {
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    
    const notifData = {
      body: `${adData.title} par ${adData.seller?.name || 'Utilisateur'}`,
      createdAt: new Date().toISOString(),
      id: notifId,
      link: `/product/${adId}`,
      read: false,
      title: "Nouvelle annonce à approuver",
      type: "ad_pending",
      userId: currentUid || adData.sellerId || "admin"
    };

    await setDoc(notifRef, notifData);
    return notifData;
  } catch (err) {
    return null;
  }
}

/**
 * Notify a seller that an admin approved or rejected their listing.
 */
export async function createModerationNotification({ sellerId, adId, adTitle, decision, reason }) {
  try {
    if (!sellerId) return null;
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);

    const isApproved = decision === 'approved';
    const notifData = {
      body: isApproved
        ? `Votre annonce "${adTitle}" a été approuvée et est désormais visible sur TanitMarket.`
        : `Votre annonce "${adTitle}" a été refusée${reason ? ` : ${reason}` : '.'}`,
      createdAt: new Date().toISOString(),
      id: notifId,
      link: `/product/${adId}`,
      read: false,
      type: isApproved ? 'ad_approved' : 'ad_rejected',
      title: isApproved ? 'Annonce approuvée ✅' : 'Annonce refusée ⚠️',
      userId: sellerId
    };

    await setDoc(notifRef, notifData);
    return notifData;
  } catch (err) {
    console.warn('Create moderation notification error:', err);
    return null;
  }
}

/**
 * Real-time notifications for the current user. Firestore rejects an
 * unconstrained listener on this collection for anyone but an admin (the
 * security rule only grants read per-document, and Firestore can't verify
 * an unfiltered query against a per-document rule) — so a non-admin MUST
 * query scoped to their own `userId`, while an admin can also see the
 * shared `admin` feed (e.g. new listings awaiting moderation).
 */
export function subscribeToNotifications(userId, callback, isAdmin = false) {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = isAdmin
      ? query(notifRef, where('userId', 'in', [userId, 'admin']))
      : query(notifRef, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback([]);
      } else {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        callback(items);
      }
    }, () => callback([]));
  } catch (err) {
    callback([]);
    return () => {};
  }
}

export async function markNotificationAsReadInDb(notifId) {
  try {
    if (!notifId) return;
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
    await updateDoc(docRef, { read: true });
    return true;
  } catch (err) {
    console.warn('markNotificationAsReadInDb error:', err);
    return false;
  }
}
