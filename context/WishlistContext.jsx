"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
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
      if (saved) {
        savedLocal = JSON.parse(saved);
      } else {
        savedLocal = MOCK_FEATURED_PRODUCTS.slice(0, 3);
      }
    } catch (e) {
      savedLocal = MOCK_FEATURED_PRODUCTS.slice(0, 3);
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

  // Save wishlist changes to localStorage and Firestore
  const saveWishlistState = (newWishlist) => {
    setWishlist(newWishlist);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tanit_market_wishlist', JSON.stringify(newWishlist));
      } catch (e) {
        console.warn("Could not save wishlist to localStorage:", e);
      }
    }

    if (currentUser?.uid) {
      updateUserProfileInDb(currentUser.uid, { favorites: newWishlist }).catch(err => {
        console.warn("Could not sync wishlist to Firestore:", err);
      });
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (!product || !product.id) return;
    const exists = wishlist.some(item => item.id === product.id);
    let updated;
    if (exists) {
      updated = wishlist.filter(item => item.id !== product.id);
    } else {
      updated = [...wishlist, product];
    }
    saveWishlistState(updated);
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item.id !== productId);
    saveWishlistState(updated);
  };

  const clearWishlist = () => {
    saveWishlistState([]);
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
