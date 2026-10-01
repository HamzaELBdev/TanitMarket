"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  getAdditionalUserInfo,
  requestFcmToken,
  isPushOptedOut
} from '@/lib/firebase';
import {
  checkIfUserIsAdminInDb,
  saveUserProfileToDb,
  getUserProfileFromDb,
  updateUserProfileInDb,
  saveFcmTokenToDb,
  recordUserLogin
} from '@/lib/services/authService';

const AuthContext = createContext(null);

// Firebase answered that this deployment can't use the sign-in method at all
// (bad API key, provider disabled, domain not authorised). Only then do we
// fall back to the local demo accounts used for testing.
const FIREBASE_UNAVAILABLE = [
  'auth/invalid-api-key',
  'auth/configuration-not-found',
  'auth/operation-not-allowed',
  'auth/unauthorized-domain',
  'auth/admin-restricted-operation'
];

function isFirebaseUnavailable(err) {
  const code = err?.code || '';
  return FIREBASE_UNAVAILABLE.includes(code) || code.startsWith('auth/api-key-not-valid');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // "Dernière connexion" for the admin dashboard — once per browser
        // session, not on every page load.
        try {
          const key = `tm_login_recorded_${firebaseUser.uid}`;
          if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            recordUserLogin(firebaseUser.uid);
          }
        } catch (e) {
          recordUserLogin(firebaseUser.uid);
        }

        try {
          const profile = await getUserProfileFromDb(firebaseUser.uid);
          setUserProfile(profile);
          const adminCheck = await checkIfUserIsAdminInDb(firebaseUser.uid, firebaseUser.email);
          setIsAdmin(adminCheck);
        } catch (e) {
          console.warn("Auth sync error:", e);
        }

        // Refresh the push token silently ONLY if the user already granted
        // notification permission in a previous session. First-time consent
        // is asked via NotificationPermissionPrompt (with an explanation
        // first) rather than firing the native browser dialog unannounced.
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && !isPushOptedOut()) {
          requestFcmToken()
            .then((token) => {
              if (token) saveFcmTokenToDb(firebaseUser.uid, token);
            })
            .catch(() => {});
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userObj = cred.user;
      await saveUserProfileToDb(userObj);
      const adminCheck = await checkIfUserIsAdminInDb(userObj.uid, userObj.email);
      setIsAdmin(adminCheck);
      return { success: true, user: userObj, isAdmin: adminCheck };
    } catch (err) {
      // Wrong password, unknown account, offline… must reach the form.
      if (!isFirebaseUnavailable(err)) throw err;

      // Local fallback for testing (misconfigured Firebase) — this account is
      // never a real authenticated user, so it is never admin, regardless of
      // what email address was typed.
      const cleanEmail = email.trim().toLowerCase();
      const mockUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      const mockUser = {
        uid: mockUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        emailVerified: true
      };

      await saveUserProfileToDb(mockUser);
      setUser(mockUser);
      setIsAdmin(false);
      return { success: true, user: mockUser, isAdmin: false };
    }
  };

  // role: 'Particulier' | 'Boutique Pro' — stored on the profile at creation
  // (firestore.rules only lets the client set it on create, never 'Admin').
  const signupWithEmail = async (email, password, name, role = 'Particulier') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userObj = cred.user;
      if (name?.trim()) {
        try {
          await updateProfile(userObj, { displayName: name.trim() });
        } catch (e) {}
      }
      await saveUserProfileToDb(userObj, {
        name: name?.trim() || email.split('@')[0],
        role
      });
      const adminCheck = await checkIfUserIsAdminInDb(userObj.uid, userObj.email);
      setIsAdmin(adminCheck);
      return { success: true, user: userObj, isAdmin: adminCheck };
    } catch (err) {
      // E-mail already used, weak password, offline… must reach the form.
      if (!isFirebaseUnavailable(err)) throw err;

      // Local fallback for testing (misconfigured Firebase) — this account is
      // never a real authenticated user, so it is never admin, regardless of
      // what email address was typed.
      const cleanEmail = email.trim().toLowerCase();
      const mockUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      const mockUser = {
        uid: mockUid,
        email: cleanEmail,
        displayName: name?.trim() || cleanEmail.split('@')[0],
        emailVerified: true
      };

      await saveUserProfileToDb(mockUser, {
        name: name?.trim() || email.split('@')[0],
        role
      });
      setUser(mockUser);
      setIsAdmin(false);
      return { success: true, user: mockUser, isAdmin: false };
    }
  };

  // `role` only applies when this Google sign-in creates the account; an
  // existing profile keeps its role (the rules forbid changing it anyway).
  const loginWithGoogle = async ({ role } = {}) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = result.user;
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
      const extra = { name: userObj.displayName };
      if (isNewUser && role) extra.role = role;
      const profile = await saveUserProfileToDb(userObj, extra);
      const adminCheck = await checkIfUserIsAdminInDb(userObj.uid, userObj.email);
      setUser(userObj);
      setUserProfile(profile || { name: userObj.displayName, email: userObj.email });
      setIsAdmin(adminCheck);
      return { success: true, user: userObj, isAdmin: adminCheck };
    } catch (err) {
      console.warn("Google auth note:", err.code);

      // Google sign-in not usable on this deployment (domain not authorised
      // on localhost, provider not configured): use the demo user. A closed
      // or blocked popup is thrown so the form can tell the user.
      if (isFirebaseUnavailable(err) || (err.message && err.message.includes('unauthorized-domain'))) {
        const demoUser = {
          uid: 'google-user-demo-123',
          email: 'google.user@tanitmarket.tn',
          displayName: 'Membre Google (Démo)',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
          emailVerified: true
        };
        const profile = await saveUserProfileToDb(demoUser, { name: demoUser.displayName });
        setUser(demoUser);
        setUserProfile(profile || demoUser);
        setIsAdmin(false);
        return { success: true, user: demoUser, isAdmin: false };
      }
      throw err;
    }
  };

  // Firebase sends the reset link. With e-mail enumeration protection on, an
  // unknown address also "succeeds" — the UI never says whether it exists.
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      if (err?.code === 'auth/user-not-found') return { success: true };
      throw err;
    }
    return { success: true };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const updateProfileData = async (data) => {
    if (!user?.uid) return false;
    const success = await updateUserProfileInDb(user.uid, data);
    if (success) {
      setUserProfile((prev) => ({ ...prev, ...data }));
    }
    return success;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAdmin,
      loading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      resetPassword,
      logout,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
