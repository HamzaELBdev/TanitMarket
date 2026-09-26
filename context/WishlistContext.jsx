"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { getUserProfileFromDb, updateUserProfileInDb } from '@/lib/firestoreService';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize wishlist from localStorage or Firestore upon Auth
  useEffect(() => {
    let savedLocal = [];
    try {
      const saved = localStorage.getItem('tanit_market_wishlist');
      if (saved) savedLocal = JSON.parse(saved);
    } catch (e) {
      savedLocal = [];
    }
    setWishlist(savedLocal);
    setIsInitialized(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfileFromDb(user.uid);
        if (profile?.favorites && Array.isArray(profile.favorites) && profile.favorites.length > 0) {
          setWishlist(profile.favorites);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const persistLocal = (list) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tanit_market_wishlist', JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save wishlist to localStorage:", e);
    }
  };

  // Save wishlist changes to localStorage and Firestore. Resolves once the
  // change is actually persisted (Firestore for signed-in users) so callers
  // can confirm it; on a sync failure the previous list is restored and the
  // promise rejects.
  const saveWishlistState = async (newWishlist, previousWishlist = wishlist) => {
    setWishlist(newWishlist);
    persistLocal(newWishlist);

    if (currentUser?.uid) {
      try {
        // updateUserProfileInDb swallows errors and returns false instead.
        const ok = await updateUserProfileInDb(currentUser.uid, { favorites: newWishlist });
        if (ok === false) throw new Error('Wishlist sync failed');
      } catch (err) {
        console.warn("Could not sync wishlist to Firestore:", err);
        setWishlist(previousWishlist);
        persistLocal(previousWishlist);
        throw err;
      }
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Returns a promise resolving to { added } once persisted (see above).
  const toggleWishlist = async (product) => {
    if (!product || !product.id) return { added: false };
    const exists = wishlist.some(item => item.id === product.id);
    let updated;
    if (exists) {
      updated = wishlist.filter(item => item.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    await saveWishlistState(updated);
    return { added: !exists };
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item.id !== productId);
    return saveWishlistState(updated);
  };

  const clearWishlist = () => {
    return saveWishlistState([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
