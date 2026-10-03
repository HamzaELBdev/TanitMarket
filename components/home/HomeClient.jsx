"use client";
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import Hero from '@/components/home/Hero';
import CategoryGrid from '@/components/home/CategoryGrid';
import ListingGrid from '@/components/home/ListingGrid';
import SellBanner from '@/components/home/SellBanner';
import SavedSearchesBar from '@/components/home/SavedSearchesBar';
import NegotiationModal from '@/components/NegotiationModal';
import { useListings, matchesGovernorate } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { getPriceInfo } from '@/lib/priceInfo';

const PAGE_SIZE = 8; // two rows of four on desktop
const ALL_GOV = 'Toute la Tunisie';
const NEARBY_GOV_KEY = 'tanit_market_nearby_gov';

// Governorate from a saved profile location ("Ville, Gouvernorat").
function govFromProfile(profile) {
  const loc = profile?.governorate || profile?.location || '';
  const parts = String(loc).split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || null;
}

// Reads the filter params the header's search bar navigates with
// (?search=&gov=&cat=) and hands them to the page.
//
// useSearchParams opts the client tree up to the nearest Suspense boundary
// out of prerendering, so it is isolated here, behind its own boundary and
// rendering nothing: everything else on the home page — the hero, the
// categories, the banners — still prerenders into the static HTML.
function UrlFilterSync({ onChange }) {
  const searchParams = useSearchParams();
  // A ref keeps the effect keyed on the params alone, so re-rendering the
  // parent never re-applies the URL over filters the user has since changed.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current({
      search: searchParams.get('search') || '',
      category: searchParams.get('cat') || 'All',
      governorate: searchParams.get('gov') || ALL_GOV,
      query: searchParams.toString(),
    });
  }, [searchParams]);

  return null;
}

function cheapRank(prod) {
  const p = getPriceInfo(prod);
  if (p.isFree) return 0;
  return p.hasAmount ? p.amount : Number.POSITIVE_INFINITY;
}

export default function HomeClient() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { userProfile } = useAuth();
  const [negotiating, setNegotiating] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'nearby' | 'cheap'
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [chosenNearbyGov, setChosenNearbyGov] = useState(null);
  const [urlQuery, setUrlQuery] = useState('');

  const {
    filteredListings,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedGovernorate,
    setSelectedGovernorate,
    searchQuery,
    setSearchQuery,
    resetFilters
  } = useListings();

  // Applied by <UrlFilterSync> below: the header's search bar navigates via
  // URL params rather than shared state.
  const applyUrlFilters = ({ search, category, governorate, query }) => {
    setSearchQuery(search);
    setSelectedCategory(category);
    setSelectedGovernorate(governorate);
    setUrlQuery(query);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NEARBY_GOV_KEY);
      if (saved) setChosenNearbyGov(saved);
    } catch {}
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [quickFilter, selectedCategory, selectedGovernorate, searchQuery]);

  // "À proximité": the governorate picked in the header wins, then the one
  // saved on the user's profile, then one chosen here.
  const nearbyGov =
    (selectedGovernorate !== ALL_GOV && selectedGovernorate) ||
    govFromProfile(userProfile) ||
    chosenNearbyGov;
  const needsNearbyLocation = quickFilter === 'nearby' && !nearbyGov;

  const results = useMemo(() => {
    if (quickFilter === 'nearby') {
      return nearbyGov ? filteredListings.filter((p) => matchesGovernorate(p, nearbyGov)) : [];
    }
    if (quickFilter === 'cheap') {
      return [...filteredListings].sort((a, b) => cheapRank(a) - cheapRank(b));
    }
    return filteredListings;
  }, [filteredListings, quickFilter, nearbyGov]);

  const scrollToListings = () => {
    document.getElementById('explore')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const selectCategory = (id) => {
    setSelectedCategory(id);
    scrollToListings();
  };

  const showAll = () => {
    resetFilters();
    setQuickFilter('all');
    if (urlQuery) router.replace('/#explore', { scroll: false });
    scrollToListings();
  };

  const chooseNearbyGov = (gov) => {
    setChosenNearbyGov(gov);
    try { localStorage.setItem(NEARBY_GOV_KEY, gov); } catch {}
  };

  const resultKey = [quickFilter, selectedCategory, selectedGovernorate, searchQuery, nearbyGov].join('|');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-7 sm:space-y-12 pb-[calc(var(--tm-bottom-nav)+1.5rem)] lg:pb-0 font-body text-[#0e0f0c]">
      <Suspense fallback={null}>
        <UrlFilterSync onChange={applyUrlFilters} />
      </Suspense>

      <Hero />

      <CategoryGrid
        selected={selectedCategory}
        onSelect={selectCategory}
        onShowAll={showAll}
      />

      <SavedSearchesBar searchQuery={searchQuery} governorate={selectedGovernorate} />

      <ListingGrid
        listings={results.slice(0, visibleCount)}
        loading={loading}
        quickFilter={quickFilter}
        onQuickFilter={setQuickFilter}
        resultKey={resultKey}
        hasMore={visibleCount < results.length}
        onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
        onSeeAll={showAll}
        onReset={showAll}
        needsNearbyLocation={needsNearbyLocation}
        nearbyGov={nearbyGov}
        onChooseNearbyGov={chooseNearbyGov}
        onNegotiate={setNegotiating}
      />

      <SellBanner />

      <NegotiationModal
        product={negotiating}
        isOpen={!!negotiating}
        onClose={() => setNegotiating(null)}
      />
    </div>
  );
}
