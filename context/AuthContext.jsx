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
  requestFcmToken
} from '@/lib/firebase';
import {
  checkIfUserIsAdminInDb,
  saveUserProfileToDb,
  getUserProfileFromDb,
  updateUserProfileInDb,
  saveFcmTokenToDb
} from '@/lib/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
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
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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
      // Local fallback for testing (offline/misconfigured Firebase) — this
      // account is never a real authenticated user, so it is never admin,
      // regardless of what email address was typed.
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

  const signupWithEmail = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userObj = cred.user;
      if (name?.trim()) {
        try {
          await updateProfile(userObj, { displayName: name.trim() });
        } catch (e) {}
      }
      await saveUserProfileToDb(userObj, {
        name: name?.trim() || email.split('@')[0]
      });
      const adminCheck = await checkIfUserIsAdminInDb(userObj.uid, userObj.email);
      setIsAdmin(adminCheck);
      return { success: true, user: userObj, isAdmin: adminCheck };
    } catch (err) {
      // Local fallback for testing (offline/misconfigured Firebase) — this
      // account is never a real authenticated user, so it is never admin,
      // regardless of what email address was typed.
      const cleanEmail = email.trim().toLowerCase();
      const mockUid = `user-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      const mockUser = {
        uid: mockUid,
        email: cleanEmail,
        displayName: name?.trim() || cleanEmail.split('@')[0],
        emailVerified: true
      };

      await saveUserProfileToDb(mockUser, {
        name: name?.trim() || email.split('@')[0]
      });
      setUser(mockUser);
      setIsAdmin(false);
      return { success: true, user: mockUser, isAdmin: false };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userObj = result.user;
      const profile = await saveUserProfileToDb(userObj, { name: userObj.displayName });
      const adminCheck = await checkIfUserIsAdminInDb(userObj.uid, userObj.email);
      setUser(userObj);
      setUserProfile(profile || { name: userObj.displayName, email: userObj.email });
      setIsAdmin(adminCheck);
      return { success: true, user: userObj, isAdmin: adminCheck };
    } catch (err) {
      console.warn("Google auth note:", err.code, err.message);

      // If domain not authorized on localhost or provider not configured, use demo user
      if (
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/configuration-not-found' ||
        err.code === 'auth/cancelled-popup-request' ||
        (err.message && err.message.includes('unauthorized-domain'))
      ) {
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
      } else if (err.code === 'auth/popup-closed-by-user') {
        throw new Error("La fenêtre de connexion Google a été fermée.");
      }
      throw err;
    }
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
