"use client";
import { useState, useEffect } from 'react';
import { fetchListings } from '@/lib/services/listingsService';
import { getPriceInsight } from '@/lib/priceInsight';

// One fetch per category per page load, shared by the detail page and modal.
const cache = new Map();
function loadCategory(category) {
  if (!cache.has(category)) {
    cache.set(category, fetchListings(category).catch(() => { cache.delete(category); return []; }));
  }
  return cache.get(category);
}

export function usePriceInsight(product) {
  const [insight, setInsight] = useState(null);
  const id = product?.id;
  const category = product?.category;
  const price = product?.price;
  const priceType = product?.priceType;
  const isFree = product?.isFree;

  useEffect(() => {
    let alive = true;
    if (!category) { setInsight(null); return; }
    loadCategory(category).then((listings) => {
      if (alive) setInsight(getPriceInsight({ id, category, price, priceType, isFree }, listings));
    });
    return () => { alive = false; };
  }, [id, category, price, priceType, isFree]);

  return insight;
}
