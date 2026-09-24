import { app, auth, db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { MOCK_ADMIN_USERS } from '../mockData';

const USERS_COLLECTION = 'users';

// The one account that is always an admin, independent of any Firestore
// field — avoids a bootstrap problem where nobody can grant the first
// admin. Any other admin must be promoted by this account (or another
// admin) via the dashboard, which sets `isAdmin: true` in Firestore.
const PRIMARY_ADMIN_EMAIL = 'hamza.elborjeni@gmail.com';

/**
 * Get user profile document from Firestore
 */
export async function getUserProfileFromDb(uid) {
  try {
    if (!uid) return null;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.warn("Get User Profile Error:", err.message);
    return null;
  }
}

/**
 * Check if a user UID/email has admin privileges
 */
export async function checkIfUserIsAdminInDb(uid, email = null) {
  try {
    if (!uid && !email) return false;

    // The permanent primary admin, regardless of any Firestore field.
    if (email && String(email).trim().toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      return true;
    }

    // 1. Check direct document in Firestore 'users'
    if (uid) {
      const userRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.isAdmin === true || data?.role === 'Admin' || data?.role?.toLowerCase() === 'admin') {
          return true;
        }
      }
    }

    // 2. Query by email
    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        for (const userDoc of querySnap.docs) {
          const data = userDoc.data();
          if (data?.isAdmin === true || data?.role === 'Admin' || data?.role?.toLowerCase() === 'admin') {
            return true;
          }
        }
      }
    }

    return false;
  } catch (err) {
    console.warn("Check Admin Error:", err.message);
    return false;
  }
}

/**
 * Save or update user profile document upon login or registration
 */
export async function saveUserProfileToDb(user, extraData = {}) {
  try {
    if (!user || !user.uid) return null;
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile = {
        name: user.displayName || extraData.name || (user.email ? user.email.split('@')[0] : 'Utilisateur TanitMarket'),
        email: user.email || '',
        role: extraData.role || 'Particulier',
        isAdmin: false,
        status: 'Vérifié',
        emailVerified: user.emailVerified || false,
        phoneNumber: extraData.phoneNumber || '',
        location: extraData.location || '',
        joined: new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        listings: 0,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      await setDoc(userRef, newUserProfile);
      return newUserProfile;
    } else if (Object.keys(extraData).length > 0) {
      await setDoc(userRef, { ...extraData, updatedAt: serverTimestamp() }, { merge: true });
      return { id: docSnap.id, ...docSnap.data(), ...extraData };
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    console.warn("Save User Profile Fallback:", err.message);
    return null;
  }
}

/**
 * Update User Profile fields
 */
export async function updateUserProfileInDb(uid, updateData) {
  try {
    if (!uid) return false;
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { ...updateData, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Update User Profile Error:", err.message);
    return false;
  }
}

/**
 * Attach a Web Push (FCM) token to a user's profile, so server-side
 * notifications (Cloud Functions) know where to deliver push messages.
 * A user can have several tokens (one per browser/device).
 */
export async function saveFcmTokenToDb(uid, token) {
  try {
    if (!uid || !token) return false;
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { fcmTokens: arrayUnion(token), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Save FCM Token Error:", err.message);
    return false;
  }
}

/**
 * Remove a stale/invalid Web Push token from a user's profile.
 */
export async function removeFcmTokenFromDb(uid, token) {
  try {
    if (!uid || !token) return false;
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, { fcmTokens: arrayRemove(token) }, { merge: true });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Fetch all users for Admin Dashboard
 */
export async function fetchUsersFromDb() {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(usersRef);
    if (snapshot.empty) return MOCK_ADMIN_USERS;
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    return MOCK_ADMIN_USERS;
  }
}

/**
 * Subscribe to all users for Admin
 */
export function subscribeAdminUsers(callback) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    return onSnapshot(usersRef, (snapshot) => {
      if (snapshot.empty) {
        callback(MOCK_ADMIN_USERS);
      } else {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items.length > 0 ? items : MOCK_ADMIN_USERS);
      }
    }, () => callback(MOCK_ADMIN_USERS));
  } catch (err) {
    callback(MOCK_ADMIN_USERS);
    return () => {};
  }
}

/**
 * Update user status (Admin)
 */
export async function updateUserStatusInDb(id, newStatus) {
  try {
    if (!id) return false;
    const docRef = doc(db, USERS_COLLECTION, String(id));
    await setDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Update user role (Admin)
 */
export async function updateUserRoleInDb(id, newRole) {
  try {
    if (!id) return false;
    const docRef = doc(db, USERS_COLLECTION, String(id));
    const isAdminFlag = newRole === 'Admin' || newRole?.toLowerCase() === 'admin';
    await setDoc(docRef, { role: newRole, isAdmin: isAdminFlag, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Record the member's latest sign-in on their profile (shown to admins as
 * "Dernière connexion"). updateDoc on purpose: it never creates a bare
 * profile — saveUserProfileToDb owns profile creation.
 */
export async function recordUserLogin(uid) {
  try {
    if (!uid) return;
    await updateDoc(doc(db, USERS_COLLECTION, String(uid)), { lastLoginAt: serverTimestamp() });
  } catch (err) {
    // Profile not created yet or offline — the next session will record it.
  }
}

/**
 * Delete a member account (Admin). Goes through the `adminDeleteUser` Cloud
 * Function, which also removes the Firebase Auth account and the member's
 * listings. If that function isn't deployed yet, fall back to deleting the
 * Firestore profile only (allowed to admins by firestore.rules) and report
 * it, so the admin knows the sign-in account still exists.
 */
export async function adminDeleteUserAccount(uid) {
  if (!uid) throw new Error('Identifiant du membre manquant.');
  try {
    const call = httpsCallable(getFunctions(app), 'adminDeleteUser');
    const { data } = await call({ uid: String(uid) });
    return { ...data, partial: false };
  } catch (err) {
    const code = err?.code || '';
    if (code === 'functions/not-found' || code === 'functions/unavailable' || code === 'functions/internal') {
      await deleteDoc(doc(db, USERS_COLLECTION, String(uid)));
      return { deletedListings: 0, authDeleted: false, partial: true };
    }
    throw err;
  }
}
