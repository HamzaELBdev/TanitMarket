"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged, signOut, updateProfile } from '@/lib/firebase';
import {
  getUserProfileFromDb,
  updateUserProfileInDb,
  saveUserProfileToDb,
  subscribeToUserChats,
  subscribeAdminListings,
  deleteListingFromDb,
  markListingSoldInDb,
  renewListingInDb,
  checkIfUserIsAdminInDb,
  uploadImageWithProgress,
} from '@/lib/firestoreService';
import { isUserAdmin } from '@/lib/phoneUtils';
import { useAuth } from '@/hooks/useAuth';

/**
 * Data + actions for the account area (/profile). Same sources as before the
 * redesign: auth guard → /auth, Firestore profile, admin check, live owned
 * listings and chats. Every save resolves only once Firestore confirmed it
 * (updateUserProfileInDb returns false instead of throwing, so that is
 * turned into an error here) and never mutates local state on failure.
 */
export function useAccount() {
  const router = useRouter();
  const { updateProfileData } = useAuth();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profile, setProfile] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(false);
  const [listingsKey, setListingsKey] = useState(0);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    let unsubChats = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setChecking(false);
        router.push('/auth');
        return;
      }
      setUser(u);
      setChecking(false);

      // Forms are initialised from the profile, so they render once it is
      // loaded (or failed to load — the page stays usable either way).
      try {
        const p = await getUserProfileFromDb(u.uid);
        setIsAdmin(isUserAdmin(p) || await checkIfUserIsAdminInDb(u.uid, u.email));
        if (p) {
          setProfile(p);
        } else {
          await saveUserProfileToDb(u, { phoneNumber: '+216 ', isPhoneVerified: false });
        }
      } catch (e) {
        console.warn('Account profile load error:', e);
      } finally {
        setProfileLoaded(true);
      }

      unsubChats = subscribeToUserChats(u.uid, (c) => setChats(c || []));
    });
    return () => {
      unsubAuth();
      unsubChats();
    };
  }, [router]);

  // Owned listings (live). Re-subscribes on retry.
  useEffect(() => {
    if (!user?.uid) return undefined;
    setListingsLoading(true);
    setListingsError(false);
    let failed = false;
    const unsub = subscribeAdminListings(
      (all) => {
        if (!failed) setListings((all || []).filter((i) => i.sellerId === user.uid || i.seller?.id === user.uid));
        setListingsLoading(false);
      },
      () => {
        failed = true;
        setListingsError(true);
        setListings([]);
      }
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [user, listingsKey]);

  const saveFields = useCallback(async (data) => {
    if (!user?.uid) throw new Error('not-signed-in');
    // updateProfileData also refreshes the header's copy of the profile.
    const ok = updateProfileData ? await updateProfileData(data) : await updateUserProfileInDb(user.uid, data);
    if (!ok) throw new Error('save-failed');
    setProfile((prev) => ({ ...prev, ...data }));
  }, [user, updateProfileData]);

  const saveProfile = useCallback(async ({ name, bio }) => {
    await saveFields({ name, bio });
    if (auth.currentUser && name) {
      try { await updateProfile(auth.currentUser, { displayName: name }); } catch (e) { console.warn('Auth displayName update:', e); }
    }
  }, [saveFields]);

  const saveLocation = useCallback(async (gov, city) => {
    await saveFields({ location: `${city}, ${gov}`, selectedGov: gov, selectedCity: city });
  }, [saveFields]);

  const uploadAvatar = useCallback(async (file, onProgress) => {
    const url = await uploadImageWithProgress(file, 'users', user?.uid, onProgress);
    await saveFields({ avatarUrl: url });
    return url;
  }, [user, saveFields]);

  const deleteListing = useCallback(async (id) => {
    await deleteListingFromDb(id);
    setListings((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const markListingSold = useCallback(async (id) => {
    await markListingSoldInDb(id);
    setListings((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'sold' } : i)));
  }, []);

  const renewListing = useCallback(async (id, currentStatus) => {
    await renewListingInDb(id, currentStatus);
    setListings((prev) => prev.map((i) => (i.id === id
      ? { ...i, status: 'approved', renewedAt: Date.now(), expiryReminderSentAt: null }
      : i)));
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/auth');
  }, [router]);

  const displayName = profile?.name || user?.displayName || user?.email || '';
  const avatarUrl = profile?.avatarUrl || user?.photoURL || null;
  const emailVerified = !!(user?.emailVerified || profile?.emailVerified);
  const phoneVerified = !!profile?.isPhoneVerified;

  return {
    checking,
    profileLoaded,
    user,
    profile,
    setProfile,
    isAdmin,
    listings,
    listingsLoading,
    listingsError,
    retryListings: () => setListingsKey((k) => k + 1),
    chats,
    displayName,
    avatarUrl,
    emailVerified,
    phoneVerified,
    // Same rule as before the redesign: both contact channels verified.
    accountVerified: emailVerified && phoneVerified,
    saveProfile,
    saveLocation,
    saveFields,
    uploadAvatar,
    deleteListing,
    markListingSold,
    renewListing,
    logout,
  };
}

// Profile completion from fields actually filled in (no invented criteria).
export function getProfileCompletion(acc) {
  const p = acc.profile || {};
  const checks = [
    { key: 'accChkName', done: (acc.displayName || '').trim().length > 1 },
    { key: 'accChkPhoto', done: !!acc.avatarUrl },
    { key: 'accChkBio', done: !!(p.bio && p.bio.trim()) },
    { key: 'accChkLocation', done: !!(p.location && p.location.trim()) },
    { key: 'accChkEmail', done: acc.emailVerified },
    { key: 'accChkPhone', done: acc.phoneVerified },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done) };
}
