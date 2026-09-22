import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { MOCK_FEATURED_PRODUCTS } from '../mockData';

const LISTINGS_COLLECTION = 'ads';

/**
 * Canonicalize a listing's moderation status, accepting legacy French
 * values written by older code paths. `fallback` is used when the raw
 * value is missing entirely (e.g. a doc created before the field existed).
 */
export function normalizeStatus(rawStatus, fallback = 'pending') {
  if (rawStatus === 'approved' || rawStatus === 'Approuvée') return 'approved';
  if (rawStatus === 'rejected' || rawStatus === 'Rejetée') return 'rejected';
  if (rawStatus === 'pending' || rawStatus === 'En attente') return 'pending';
  // A deal was struck in chat over this listing — it's withdrawn from the
  // public marketplace (excluded by the `status === 'approved'` filters
  // below) without being flagged as moderation-rejected.
  if (rawStatus === 'reserved' || rawStatus === 'Réservée') return 'reserved';
  return fallback;
}

/**
 * Real-time listener for approved marketplace ads only (public storefront).
 * Pending/rejected listings are excluded until an admin approves them.
 */
export function subscribeToListings(callback) {
  const getMockApproved = () => MOCK_FEATURED_PRODUCTS.map(p => ({
    ...p,
    status: normalizeStatus(p.status, 'approved')
  }));

  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    return onSnapshot(listingsRef, (snapshot) => {
      if (snapshot.empty) {
        seedInitialListingsIfEmpty().catch(() => {});
        callback(getMockApproved());
      } else {
        let items = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          status: normalizeStatus(d.data().status, 'pending')
        }));
        items = items.filter((item) => item.status === 'approved');
        // Sort newest first
        items.sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.id ? 0 : Date.now());
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.id ? 0 : Date.now());
          return timeB - timeA;
        });
        callback(items);
      }
    }, (err) => {
      console.warn("Firestore Listings Note:", err.message);
      callback(getMockApproved());
    });
  } catch (err) {
    console.warn("Subscribe listings error:", err.message);
    callback(getMockApproved());
    return () => {};
  }
}

/**
 * Fetch approved listings only (public storefront), with optional category
 * & governorate filters.
 */
export async function fetchListings(categoryFilter = null, governorateFilter = null) {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const snapshot = await getDocs(listingsRef);

    if (snapshot.empty) {
      await seedInitialListingsIfEmpty();
      return MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') }));
    }

    let items = snapshot.docs.map(d => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status, 'pending') }));
    items = items.filter((item) => item.status === 'approved');

    items.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.id ? 0 : Date.now());
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.id ? 0 : Date.now());
      return timeB - timeA;
    });

    if (categoryFilter && categoryFilter !== 'All') {
      items = items.filter(item => item.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (governorateFilter && governorateFilter !== 'Toute la Tunisie') {
      items = items.filter(item => item.seller?.location?.includes(governorateFilter));
    }

    return items.length > 0 ? items : MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') }));
  } catch (err) {
    return MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') }));
  }
}

/**
 * Fetch a single product by ID, regardless of status — the caller (product
 * detail page) is responsible for gating non-approved listings to their
 * owner/an admin only, since this is also used for admin/owner previews.
 */
export async function fetchProductById(id) {
  if (!id) return null;
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, String(id));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...data, status: normalizeStatus(data.status, 'pending') };
    }

    return MOCK_FEATURED_PRODUCTS.find(p => String(p.id) === String(id)) || null;
  } catch (err) {
    return MOCK_FEATURED_PRODUCTS.find(p => String(p.id) === String(id)) || null;
  }
}

/**
 * Create a new listing in Firestore. A regular seller's listing always
 * starts 'pending' under their own uid — it only becomes publicly visible
 * once an admin approves it in /dash, and Firestore rules enforce both of
 * those for any non-admin caller regardless of what's passed here.
 *
 * An admin may pass an explicit `sellerId` (e.g. a synthetic guest id) and
 * `status` to publish a listing attributed to a third-party seller — their
 * own contact info, not the admin's account — optionally already approved.
 * Firestore rules only allow that override for an admin caller.
 */
export async function createListing(listingData) {
  const currentUid = auth.currentUser?.uid || `seller-${Date.now()}`;
  const sellerId = listingData.sellerId || currentUid;
  const status = listingData.status || 'pending';
  const listingsRef = collection(db, LISTINGS_COLLECTION);
  const newDoc = await addDoc(listingsRef, {
    ...listingData,
    sellerId,
    status,
    rejectionReason: null,
    rating: listingData.rating ?? 5.0,
    reviewsCount: listingData.reviewsCount ?? 1,
    createdAt: serverTimestamp()
  });

  return { id: newDoc.id, ...listingData, sellerId, status };
}

/**
 * Delete a listing from Firestore
 */
export async function deleteListingFromDb(id) {
  const docRef = doc(db, LISTINGS_COLLECTION, String(id));
  await deleteDoc(docRef);
  return true;
}

/**
 * Update listing status (Admin). `reason` is stored when rejecting so the
 * seller can see why, and cleared on approval.
 */
export async function updateListingStatusInDb(id, newStatus, reason = null) {
  if (!id) return false;
  const docRef = doc(db, LISTINGS_COLLECTION, String(id));
  await setDoc(docRef, {
    status: newStatus,
    rejectionReason: newStatus === 'rejected' ? (reason || null) : null,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

/**
 * Update an existing listing's content (owner edit). Always sends the
 * listing back to 'pending' moderation since its content changed — the
 * seller must not be able to bypass approval by editing after publish.
 */
export async function updateListingInDb(id, listingData) {
  if (!id) throw new Error("ID de l'annonce manquant.");
  const docRef = doc(db, LISTINGS_COLLECTION, String(id));
  await setDoc(docRef, {
    ...listingData,
    status: 'pending',
    rejectionReason: null,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

/**
 * Set the single Hero Featured listing shown on the homepage — clears the
 * flag on every other listing first so exactly one is ever featured.
 */
export async function setHeroFeaturedListingInDb(id) {
  if (!id) return false;
  const cleanId = String(id);
  const listingsRef = collection(db, LISTINGS_COLLECTION);
  const currentHeroQuery = query(listingsRef, where('isHeroFeatured', '==', true));
  const currentHeroSnap = await getDocs(currentHeroQuery);

  const batch = writeBatch(db);
  currentHeroSnap.docs.forEach((d) => {
    if (d.id !== cleanId) {
      batch.set(d.ref, { isHeroFeatured: false }, { merge: true });
    }
  });
  batch.set(doc(db, LISTINGS_COLLECTION, cleanId), { isHeroFeatured: true, updatedAt: serverTimestamp() }, { merge: true });

  await batch.commit();
  return true;
}

/**
 * Toggle a listing's "Sponsorisé" promotional flag (admin-only — enforced by
 * Firestore rules, not just the UI). Unlike the hero feature, any number of
 * listings can be sponsored at once — sponsored listings are simply sorted
 * to the front of the public feed (see useListings' sponsored-first sort).
 */
export async function setSponsoredStatusInDb(id, isSponsored) {
  if (!id) return false;
  const docRef = doc(db, LISTINGS_COLLECTION, String(id));
  await setDoc(docRef, { isSponsored: !!isSponsored, updatedAt: serverTimestamp() }, { merge: true });
  return true;
}

/**
 * Fetch listings by user
 */
export async function fetchUserListingsFromDb(userId) {
  try {
    if (!userId) return [];
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const snapshot = await getDocs(listingsRef);
    if (snapshot.empty) return [];
    
    let items = snapshot.docs.map(d => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status, 'pending') }));
    items = items.filter(item => item.sellerId === userId || item.seller?.id === userId);
    items.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.id ? 0 : Date.now());
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.id ? 0 : Date.now());
      return timeB - timeA;
    });
    return items;
  } catch (err) {
    return [];
  }
}

/**
 * Fetch all listings for Admin
 */
export async function fetchAdminListingsFromDb() {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const snapshot = await getDocs(listingsRef);
    if (snapshot.empty) {
      return MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') }));
    }
    let items = snapshot.docs.map(d => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status, 'pending') }));
    items.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.id ? 0 : Date.now());
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.id ? 0 : Date.now());
      return timeB - timeA;
    });
    return items;
  } catch (err) {
    return MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') }));
  }
}

/**
 * Real-time listener for Admin listings (unfiltered — every status, for moderation)
 */
export function subscribeAdminListings(callback) {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    return onSnapshot(listingsRef, (snapshot) => {
      if (snapshot.empty) {
        callback(MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') })));
      } else {
        let items = snapshot.docs.map(d => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status, 'pending') }));
        items.sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.id ? 0 : Date.now());
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.id ? 0 : Date.now());
          return timeB - timeA;
        });
        callback(items.length > 0 ? items : MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') })));
      }
    }, () => {
      callback(MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') })));
    });
  } catch (err) {
    callback(MOCK_FEATURED_PRODUCTS.map(p => ({ ...p, status: normalizeStatus(p.status, 'approved') })));
    return () => {};
  }
}

/**
 * Seed demo listings if Firestore is completely empty. These are curated
 * placeholder listings, not real user submissions, so they go live immediately.
 */
export async function seedInitialListingsIfEmpty() {
  try {
    const listingsRef = collection(db, LISTINGS_COLLECTION);
    const snapshot = await getDocs(listingsRef);

    if (snapshot.empty) {
      for (const item of MOCK_FEATURED_PRODUCTS) {
        await addDoc(listingsRef, {
          ...item,
          sellerId: auth.currentUser?.uid || 'seller-admin',
          status: 'approved',
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (err) {}
}
