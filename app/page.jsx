"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Tag,
  ShieldCheck,
  Laptop,
  Home as HomeIcon,
  Car,
  Shirt,
  Dumbbell,
  Building,
  Briefcase,
  Layers,
  Baby
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import NegotiationModal from '@/components/NegotiationModal';
import TunisiaFlag from '@/components/TunisiaFlag';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useListings } from '@/hooks/useListings';
import { useLanguage } from '@/context/LanguageContext';

const CATEGORIES = [
  { id: 'All', key: 'qcAll', icon: Layers },
  { id: 'electronics', key: 'qcElectronics', icon: Laptop },
  { id: 'home', key: 'qcHome', icon: HomeIcon },
  { id: 'vehicles', key: 'homeCatVehicles', icon: Car },
  { id: 'fashion', key: 'homeCatFashion', icon: Shirt },
  { id: 'sports', key: 'catSports', icon: Dumbbell },
  { id: 'realestate', key: 'catRealestateFull', icon: Building },
  { id: 'jobs', key: 'catJobsFull', icon: Briefcase },
  { id: 'baby', key: 'homeCatBaby', icon: Baby },
];

function HomeContent() {
  const { t, formatPrice } = useLanguage();
  const searchParams = useSearchParams();
  const [selectedProductForNegotiation, setSelectedProductForNegotiation] = useState(null);

  const {
    filteredListings,
    heroProduct,
    loading,
    selectedCategory,
    setSelectedCategory,
    setSelectedGovernorate,
    setSearchQuery,
    getCategoryCount,
    resetFilters
  } = useListings();

  // Sync filters from the header's search bar / quick-category pills, which
  // navigate via URL params (?search=&cat=&gov=) rather than shared state.
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('cat') || 'All');
    setSelectedGovernorate(searchParams.get('gov') || 'Toute la Tunisie');
  }, [searchParams]);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-12 font-body text-[#0e0f0c]">

      {/* 1. HERO BAND — modern spotlight layout. On mobile the admin-featured
          product renders FIRST (order-1) as a compact floating-card visual
          sized to fit entirely within the first viewport with zero scrolling;
          the marketing copy follows underneath (order-2). Desktop reverts to
          a side-by-side split since vertical space isn't constrained there. */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0e0f0c] via-[#13150f] to-[#1b1f16] p-4 sm:p-8 md:p-10 lg:p-14">
        {/* Decorative glow blobs — clipped by section's overflow-hidden, never affect layout width */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-56 sm:w-72 h-56 sm:h-72 bg-[#9fe870]/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-52 sm:w-64 h-52 sm:h-64 bg-[#9fe870]/10 rounded-full blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* Featured Product Spotlight — first on mobile, right column on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-5 w-full min-w-0 animate-rise-in">
            <div className="relative">

              {/* Live badge, floating above the image */}
              <div className="absolute -top-3 start-4 z-20 flex items-center gap-1.5 bg-[#0e0f0c] text-[#9fe870] text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg ring-1 ring-white/10">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9fe870] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#9fe870]" />
                </span>
                <span>{t('heroFeaturedBadge')}</span>
              </div>

              {/* Product Image */}
              <div className="relative w-full max-w-full aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden group bg-white/5 shadow-2xl ring-1 ring-white/10">
                <img
                  src={heroProduct?.image || heroProduct?.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"}
                  alt={heroProduct?.title || t('heroDefaultTitle')}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Floating white info card — overlaps the image's bottom edge for a layered, premium feel */}
              <div className="relative -mt-9 sm:-mt-10 mx-3 sm:mx-5 bg-white rounded-2xl shadow-2xl p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-[#e2f6d5] text-[#163300] font-bold text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider truncate max-w-[55%]">
                    {heroProduct?.category || t('heroDefaultCategory')}
                  </span>
                  <span className="text-sm sm:text-lg font-black text-[#0e0f0c] shrink-0">
                    {heroProduct?.price !== undefined ? formatPrice(heroProduct.price) : ''}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-sm sm:text-base text-[#0e0f0c] line-clamp-1">
                  {heroProduct?.title || t('heroDefaultTitle')}
                </h3>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#0e0f0c]/10">
                  <span className="flex items-center gap-1 text-[#454745] font-semibold text-[11px] min-w-0 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />
                    <span className="truncate">{heroProduct?.location || heroProduct?.governorate || t('heroDefaultLocation')}</span>
                  </span>

                  <Link
                    href={`/product/${heroProduct?.id || ''}`}
                    className="bg-[#0e0f0c] text-white hover:bg-[#9fe870] hover:text-[#0e0f0c] font-semibold text-[11px] px-3 py-1.5 rounded-full transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{t('heroViewListing')}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>

              <p className="text-center text-[11px] text-white/40 font-medium pt-3">
                {t('heroCitiesNote')}
              </p>
            </div>
          </div>

          {/* Marketing Copy — second on mobile, left column on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-3.5 sm:space-y-5 animate-rise-in min-w-0" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full">
              <span>{t('heroTopBadge')}</span>
              <TunisiaFlag className="w-5 h-3.5 rounded-[2px] inline-block align-middle shrink-0" />
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-heading font-black text-white tracking-tight leading-[1.08] sm:leading-[0.95]">
              {t('heroTitleLine1')}<br className="hidden sm:block" /> <span className="text-[#9fe870]">{t('heroTitleLine2')}</span>
            </h1>

            <p className="text-sm sm:text-lg text-white/70 max-w-xl font-normal leading-relaxed">
              {t('heroDescLong')}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Button href="#explore" variant="primary" size="lg" iconRight={ArrowRight}>
                {t('heroCta')}
              </Button>
              <div className="text-xs font-semibold text-white/50 flex items-center gap-2">
                <span>{t('heroSimpleTagline')}</span>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 mt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/80">
                <MapPin className="w-3.5 h-3.5 text-[#9fe870] shrink-0" />
                <span>{t('heroNearYouBadge')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/80">
                <Tag className="w-3.5 h-3.5 text-[#9fe870] shrink-0" />
                <span>{t('negotiable')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-white/80">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9fe870] shrink-0" />
                <span>{t('verifiedSeller')}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#0e0f0c]/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0e0f0c] text-[#9fe870] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#9fe870] fill-[#9fe870]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-heading font-black text-[#0e0f0c] tracking-tight">
                {t('exploreByCategory')}
              </h2>
              <p className="text-xs text-[#868685]">{t('exploreByCategorySub')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              {t('opportunitiesAvailable', { n: filteredListings.length })}
            </Badge>
          </div>
        </div>

        {/* Category Cards: horizontal scroll on mobile, grid from sm+ */}
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-9 gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible snap-x snap-mandatory sm:snap-none">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative group shrink-0 w-[108px] sm:w-auto snap-start p-3.5 sm:p-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-between text-center gap-2.5 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-[#0e0f0c] text-white scale-[1.03]'
                    : 'bg-[#ffffff] hover:bg-[#e2f6d5] text-[#454745]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center text-[10px] font-bold animate-in zoom-in-50">
                    ✓
                  </span>
                )}

                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  isSelected
                    ? 'bg-[#9fe870] text-[#0e0f0c]'
                    : 'bg-[#e8ebe6] text-[#0e0f0c] group-hover:bg-[#0e0f0c] group-hover:text-[#9fe870]'
                }`}>
                  <IconComp className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="space-y-1 w-full">
                  <span className={`text-xs font-semibold block truncate leading-tight ${isSelected ? 'text-[#9fe870]' : 'text-[#0e0f0c]'}`}>
                    {t(cat.key)}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#e8ebe6] text-[#868685] group-hover:bg-white/60 group-hover:text-[#0e0f0c]'
                  }`}>
                    {count} {count > 1 ? t('listingPlural') : t('listingSingular')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. MAIN PRODUCT CATALOG */}
      <section id="explore" className="space-y-4 sm:space-y-6">

        {filteredListings.length === 0 ? (
          <div className="card-tanit-panel text-center p-12 space-y-3">
            <p className="text-sm font-semibold text-[#0e0f0c]">
              {t('noListingsMatch')}
            </p>
            <Button variant="lime" size="sm" onClick={resetFilters}>
              {t('resetFiltersBtn')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredListings.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onNegotiate={(p) => setSelectedProductForNegotiation(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. SELLER BANNER — polarity-flipped dark card, lime text */}
      <section className="bg-[#0e0f0c] rounded-xl p-6 sm:p-10 text-[#9fe870] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <Badge variant="lime" size="sm" className="mb-1">
            {t('sellerBannerBadge')}
          </Badge>
          <h3 className="text-2xl sm:text-3xl font-heading font-black text-[#9fe870]">
            {t('sellerBannerTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-[#e8ebe6]/80 max-w-xl">
            {t('sellerBannerDesc')}
          </p>
        </div>

        <Button href="/create-listing" variant="lime" size="lg" className="flex-shrink-0">
          {t('sellerBannerCta')}
        </Button>
      </section>

      {/* PRICE NEGOTIATION MODAL */}
      <NegotiationModal
        product={selectedProductForNegotiation}
        isOpen={!!selectedProductForNegotiation}
        onClose={() => setSelectedProductForNegotiation(null)}
      />

    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
