"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, MapPin, SearchX } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ListingCard, { ListingCardSkeleton } from '@/components/ListingCard';
import { TUNISIAN_GOVERNORATES } from '@/lib/mockData';
import { DURATION, EASE_OUT, fadeUp, REVEAL_VIEWPORT } from '@/lib/design';

export const QUICK_FILTERS = [
  { id: 'all', key: 'filterAll' },
  { id: 'nearby', key: 'filterNearby' },
  { id: 'cheap', key: 'filterCheap' },
];

const GRID = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5';

function FilterTabs({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div role="group" aria-label={t('listingFiltersLabel')} className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
      {QUICK_FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            aria-pressed={active}
            className={`relative shrink-0 min-h-11 px-4 sm:px-5 rounded-full text-[13px] sm:text-sm font-bold cursor-pointer transition-colors duration-200 ${
              active ? 'text-brand-lime' : 'text-[#3d4638] bg-[#f1f4ee] hover:bg-brand-mint'
            }`}
          >
            {active && (
              <motion.span
                layoutId="listing-filter-pill"
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="absolute inset-0 rounded-full bg-brand-forest"
              />
            )}
            <span className="relative">{t(f.key)}</span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, message, children }) {
  return (
    <div className="bg-brand-mint/60 rounded-card border border-[#163300]/[0.07] text-center px-6 py-12 space-y-4">
      <span className="mx-auto w-12 h-12 rounded-full bg-white text-[#163300] flex items-center justify-center shadow-card">
        <Icon className="w-5 h-5" />
      </span>
      <p className="text-sm font-semibold text-[#0e0f0c] max-w-sm mx-auto">{message}</p>
      {children}
    </div>
  );
}

/**
 * "Les dernières annonces": title, quick filters and the listing grid with
 * loading (skeleton), empty and "nearby needs a governorate" states.
 */
export default function ListingGrid({
  listings,
  loading,
  quickFilter,
  onQuickFilter,
  resultKey,
  hasMore,
  onLoadMore,
  onSeeAll,
  onReset,
  needsNearbyLocation,
  nearbyGov,
  onChooseNearbyGov,
  onNegotiate,
}) {
  const { t } = useLanguage();

  let body;
  if (loading) {
    body = (
      <div className={GRID} role="status" aria-live="polite">
        <span className="sr-only">{t('listingsLoading')}</span>
        {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    );
  } else if (needsNearbyLocation) {
    body = (
      <EmptyState icon={MapPin} message={t('nearbyNeedsLocation')}>
        <label className="relative inline-flex items-center">
          <span className="sr-only">{t('nearbyChooseGov')}</span>
          <MapPin aria-hidden="true" className="w-4 h-4 text-[#163300] absolute start-4 pointer-events-none" />
          <select
            defaultValue=""
            onChange={(e) => e.target.value && onChooseNearbyGov(e.target.value)}
            className="h-11 ps-10 pe-10 rounded-full bg-white border border-[#163300]/15 text-sm font-bold text-[#163300] appearance-none cursor-pointer"
          >
            <option value="" disabled>{t('nearbyChooseGov')}</option>
            {TUNISIAN_GOVERNORATES.filter((g) => g !== 'Toute la Tunisie').map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="w-4 h-4 text-[#163300] absolute end-4 pointer-events-none" />
        </label>
      </EmptyState>
    );
  } else if (listings.length === 0) {
    body = (
      <EmptyState
        icon={SearchX}
        message={quickFilter === 'nearby' && nearbyGov ? t('nearbyEmpty', { gov: nearbyGov }) : t('noListingsMatch')}
      >
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 bg-brand-lime hover:bg-brand-lime-hover text-[#163300] font-bold text-sm px-5 rounded-full transition-colors cursor-pointer"
        >
          {t('resetFiltersBtn')}
        </button>
      </EmptyState>
    );
  } else {
    body = (
      <>
        <ul className={GRID}>
          {listings.map((prod, i) => (
            <li key={prod.id} className="min-w-0">
              <ListingCard product={prod} onNegotiate={onNegotiate} eager={i < 4} />
            </li>
          ))}
        </ul>

        {hasMore && (
          <div className="flex justify-center pt-6">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: DURATION.micro }}
              type="button"
              onClick={onLoadMore}
              className="inline-flex items-center gap-1.5 min-h-11 border border-[#163300]/20 hover:bg-brand-mint text-[#163300] font-bold text-sm px-6 rounded-full transition-colors cursor-pointer"
            >
              {t('loadMoreListings')} <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </>
    );
  }

  return (
    <motion.section
      id="explore"
      aria-labelledby="latest-title"
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      variants={fadeUp}
      className="space-y-3 sm:space-y-4 scroll-mt-20 lg:scroll-mt-28"
    >
      {/* mobile: title + "Tout voir", filters below — md+: one row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <h2 id="latest-title" className="order-1 text-[17px] min-[380px]:text-lg sm:text-2xl whitespace-nowrap font-heading font-black text-[#0e0f0c]">
          {t('latestListings')}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="order-2 md:order-3 ms-auto min-h-11 -me-2 px-2 rounded-full text-xs sm:text-sm font-bold text-[#163300] hover:bg-brand-mint flex items-center gap-0.5 shrink-0 cursor-pointer transition-colors"
        >
          {t('seeAll')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
        <div className="order-3 md:order-2 w-full md:w-auto min-w-0">
          <FilterTabs value={quickFilter} onChange={onQuickFilter} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={loading ? 'loading' : resultKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.micro, ease: EASE_OUT }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}
