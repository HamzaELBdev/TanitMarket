"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { subscribeToListings } from '@/lib/services/listingsService';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';

export function matchesCategory(prodCat, catId) {
  if (!catId || catId === 'All') return true;
  const cat = (prodCat || '').toLowerCase();
  const target = catId.toLowerCase();

  if (cat.includes(target)) return true;
  
  if (target === 'fashion' && (cat.includes('mode') || cat.includes('vêtement') || cat.includes('vetement') || cat.includes('style') || cat.includes('chaussure'))) return true;
  if (target === 'electronics' && (cat.includes('high-tech') || cat.includes('hightech') || cat.includes('électronique') || cat.includes('electronique') || cat.includes('multimédia') || cat.includes('multimedia') || cat.includes('tech'))) return true;
  if (target === 'vehicles' && (cat.includes('véhicule') || cat.includes('vehicule') || cat.includes('auto') || cat.includes('voiture') || cat.includes('moto'))) return true;
  if (target === 'home' && (cat.includes('maison') || cat.includes('jardin') || cat.includes('déco') || cat.includes('deco') || cat.includes('meuble'))) return true;
  if (target === 'sports' && (cat.includes('sport') || cat.includes('loisir') || cat.includes('fitness'))) return true;
  if (target === 'realestate' && (cat.includes('immobilier') || cat.includes('appartement') || cat.includes('maison') || cat.includes('terrain'))) return true;
  if (target === 'jobs' && (cat.includes('emploi') || cat.includes('service') || cat.includes('job'))) return true;
  if (target === 'baby' && (cat.includes('bébé') || cat.includes('bebe') || cat.includes('enfant') || cat.includes('poussette'))) return true;

  return false;
}

// True when a listing is located in `gov`. Compares whole location parts
// ("Ville, Gouvernorat") so "Tunis" doesn't match "…, Tunisie".
export function matchesGovernorate(prod, gov) {
  if (!gov || gov === 'Toute la Tunisie') return true;
  const target = gov.trim().toLowerCase();
  const parts = [prod.governorate, prod.city, prod.seller?.location, prod.location]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim().toLowerCase());
  return parts.includes(target);
}

export function useListings() {
  // null until the first snapshot arrives, so the UI can show skeletons
  // instead of flashing placeholder data. subscribeToListings already falls
  // back to the demo catalogue itself when Firestore is empty/unreachable.
  const [listings, setListings] = useState(null);
  const loading = listings === null;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGovernorate, setSelectedGovernorate] = useState('Toute la Tunisie');
  const [searchQuery, setSearchQuery] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribe;

    try {
      unsubscribe = subscribeToListings((items) => {
        if (!isMountedRef.current) return;
        setListings(Array.isArray(items) ? items : []);
      });
    } catch (err) {
      console.warn("useListings subscribe error:", err);
      setListings(MOCK_FEATURED_PRODUCTS);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const filteredListings = useMemo(() => {
    const filtered = (listings || []).filter((prod) => {
      const matchesGov = matchesGovernorate(prod, selectedGovernorate);

      const matchesCat = matchesCategory(prod.category, selectedCategory);

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        (prod.title || '').toLowerCase().includes(q) ||
        (prod.description || '').toLowerCase().includes(q) ||
        (prod.category || '').toLowerCase().includes(q);

      return matchesGov && matchesCat && matchesQuery;
    });

    // Sponsored listings (admin-chosen, any number at once) surface first —
    // a stable sort keeps everything else in its existing relative order.
    return [...filtered].sort((a, b) => (b.isSponsored ? 1 : 0) - (a.isSponsored ? 1 : 0));
  }, [listings, selectedCategory, selectedGovernorate, searchQuery]);

  const heroProduct = useMemo(() => {
    if (!listings) return null;
    return listings.find(p => p.isHeroFeatured) || listings[0];
  }, [listings]);

  const getCategoryCount = (catId) => {
    if (!listings) return 0;
    if (catId === 'All') return listings.length;
    return listings.filter(p => matchesCategory(p.category, catId)).length;
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedGovernorate('Toute la Tunisie');
    setSearchQuery('');
  };

  return {
    listings: listings || [],
    filteredListings,
    heroProduct,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedGovernorate,
    setSelectedGovernorate,
    searchQuery,
    setSearchQuery,
    getCategoryCount,
    resetFilters
  };
}
