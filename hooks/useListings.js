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

export function useListings() {
  const [listings, setListings] = useState(MOCK_FEATURED_PRODUCTS);
  const [loading, setLoading] = useState(false);
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
        if (items && items.length > 0) {
          setListings(items);
        }
      });
    } catch (err) {
      console.warn("useListings subscribe error:", err);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((prod) => {
      const matchesGov = selectedGovernorate === 'Toute la Tunisie' || 
        (prod.seller?.location || prod.location || prod.governorate || '').toLowerCase().includes(selectedGovernorate.toLowerCase());
      
      const matchesCat = matchesCategory(prod.category, selectedCategory);
      
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        (prod.title || '').toLowerCase().includes(q) ||
        (prod.description || '').toLowerCase().includes(q) ||
        (prod.category || '').toLowerCase().includes(q);

      return matchesGov && matchesCat && matchesQuery;
    });
  }, [listings, selectedCategory, selectedGovernorate, searchQuery]);

  const heroProduct = useMemo(() => {
    return listings.find(p => p.isHeroFeatured) || listings[0];
  }, [listings]);

  const getCategoryCount = (catId) => {
    if (catId === 'All') return listings.length;
    return listings.filter(p => matchesCategory(p.category, catId)).length;
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedGovernorate('Toute la Tunisie');
    setSearchQuery('');
  };

  return {
    listings,
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
