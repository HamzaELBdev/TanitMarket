"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Tag,
  Truck,
  ShieldCheck,
  Users,
  Heart,
  ChevronRight,
  SlidersHorizontal,
  Headphones,
  Car,
  Sofa,
  Shirt,
  Building,
  Gamepad2,
  Wrench,
  Briefcase,
  PlusCircle
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import NegotiationModal from '@/components/NegotiationModal';
import { useListings } from '@/hooks/useListings';
import { useLanguage } from '@/context/LanguageContext';

const CATEGORIES = [
  { id: 'electronics', label: 'Multimédia', icon: Headphones },
  { id: 'vehicles', label: 'Véhicules', icon: Car },
  { id: 'home', label: 'Maison', icon: Sofa },
  { id: 'fashion', label: 'Mode', icon: Shirt },
  { id: 'realestate', label: 'Immobilier', icon: Building },
  { id: 'sports', label: 'Loisirs', icon: Gamepad2 },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'jobs', label: 'Emploi', icon: Briefcase },
];

const FALLBACK_COLLAGE = [
  '/images/hero-collage-1.png',
  '/images/hero-collage-2.png',
  '/images/hero-collage-3.png',
];

// Fixed brand shot (TanitMarket signage) — always shown in the hero,
// unlike the collage images which get replaced by real listing photos.
const HERO_BRAND_IMAGE = '/images/tanitmarket-signage.jpg';

const PAGE_SIZE = 6;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05 } })
};

function HomeContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [selectedProductForNegotiation, setSelectedProductForNegotiation] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'nearby' | 'cheap'
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const {
    filteredListings,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedGovernorate,
    setSelectedGovernorate,
    setSearchQuery,
    resetFilters
  } = useListings();

  // Sync filters from the header's search bar, which navigates via URL
  // params (?search=&gov=) rather than shared state.
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('cat') || 'All');
    setSelectedGovernorate(searchParams.get('gov') || 'Toute la Tunisie');
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [quickFilter, selectedCategory, selectedGovernorate]);

  const sortedListings = useMemo(() => {
    if (quickFilter === 'cheap') {
      return [...filteredListings].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    }
    return filteredListings;
  }, [filteredListings, quickFilter]);

  const visibleListings = sortedListings.slice(0, visibleCount);
  const collageImages = filteredListings.slice(0, 3).map(p => p.image || p.images?.[0]).filter(Boolean);
  while (collageImages.length < 3) collageImages.push(FALLBACK_COLLAGE[collageImages.length]);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-10 sm:space-y-14 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-12 font-body text-[#0e0f0c]">

      {/* 1. HERO */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0f0c] via-[#13150f] to-[#1b2415] p-6 sm:p-10 lg:p-14"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 bg-[#9fe870]/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-[#9fe870]/10 rounded-full blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <motion.div
            className="lg:col-span-7 space-y-4 sm:space-y-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-[56px] font-heading font-black text-white leading-[1.08] sm:leading-[1.02]">
              {t('heroTitleLine1')}
              <br className="hidden sm:block" />{' '}
              <span className="text-[#9fe870]">{t('heroTitleLine2')}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-sm sm:text-lg text-white/70 max-w-lg leading-relaxed">
              {t('heroDescLong')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-1">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#explore"
                className="inline-flex items-center gap-2 bg-white hover:bg-[#e8ebe6] text-[#0e0f0c] font-bold text-sm rounded-full px-5 py-3 transition-colors"
              >
                <Search className="w-4 h-4" /> {t('heroCta')}
              </motion.a>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/create-listing"
                  className="inline-flex items-center gap-2 border border-white/25 hover:bg-white/10 text-white font-bold text-sm rounded-full px-5 py-3 transition-colors"
                >
                  <Tag className="w-4 h-4" /> Vendre un article
                </Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 mt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <Truck className="w-4 h-4 text-[#9fe870] shrink-0" />
                <span>Annonces locales</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <ShieldCheck className="w-4 h-4 text-[#9fe870] shrink-0" />
                <span>Transactions plus sûres</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <Users className="w-4 h-4 text-[#9fe870] shrink-0" />
                <span>Une communauté tunisienne</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Product collage illustration — images use fixed, container-width-
              independent pixel dimensions (not %-width + aspect-*), so the
              bottom-anchored square never grows taller than the container
              and spills above it. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hidden sm:block lg:col-span-5 relative h-[230px] sm:h-[270px] lg:h-[310px]"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="absolute top-0 right-0 w-[210px] h-[158px] sm:w-[260px] sm:h-[195px] lg:w-[300px] lg:h-[225px] rounded-2xl overflow-hidden shadow-2xl rotate-2 ring-4 ring-[#0e0f0c]"
            >
              <img src={HERO_BRAND_IMAGE} alt="TanitMarket" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="absolute bottom-0 left-0 w-[135px] h-[135px] sm:w-[165px] sm:h-[165px] lg:w-[190px] lg:h-[190px] rounded-2xl overflow-hidden shadow-2xl -rotate-6 ring-4 ring-[#0e0f0c]"
            >
              <img src={collageImages[0]} alt="" className="w-full h-full object-cover" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              className="absolute bottom-3 right-3 bg-white text-[#0e0f0c] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-10"
            >
              <Heart className="w-3.5 h-3.5 fill-[#9fe870] text-[#163300]" /> 100% Tunisien
            </motion.span>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#0e0f0c]">Explorez les catégories</h2>
          <button
            type="button"
            onClick={() => { setSelectedCategory('All'); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-xs sm:text-sm font-bold text-[#454745] hover:text-[#0e0f0c] flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            Voir toutes les catégories <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <motion.div
          className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'All' : cat.id);
                  document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-[#0e0f0c] text-[#9fe870]' : 'bg-[#e2f6d5] text-[#163300]'
                }`}>
                  <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#0e0f0c] text-center leading-tight">{cat.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* 3. MAIN PRODUCT CATALOG */}
      <section id="explore" className="space-y-4 sm:space-y-5 scroll-mt-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#0e0f0c]">Les dernières annonces</h2>
          <Link href="/favoris" className="sm:hidden text-xs font-bold text-[#163300] flex items-center gap-0.5">
            Tout voir <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'nearby', label: 'À proximité' },
              { id: 'cheap', label: 'Petits prix' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={`shrink-0 py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  quickFilter === f.id ? 'bg-[#0e0f0c] text-[#9fe870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative hidden sm:block shrink-0">
            <select
              value={quickFilter === 'cheap' ? 'cheap' : 'newest'}
              onChange={(e) => setQuickFilter(e.target.value === 'cheap' ? 'cheap' : 'all')}
              className="h-10 pl-9 pr-8 rounded-full border border-[#e8ebe6] bg-white text-sm font-semibold text-[#0e0f0c] appearance-none cursor-pointer focus:outline-none focus:border-[#0e0f0c]"
            >
              <option value="newest">Plus récentes</option>
              <option value="cheap">Prix croissant</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 text-[#868685] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e8ebe6] text-center p-12 space-y-3">
            <p className="text-sm font-semibold text-[#0e0f0c]">{t('noListingsMatch')}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-bold text-xs px-4 py-2.5 rounded-full transition"
            >
              {t('resetFiltersBtn')}
            </button>
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {visibleListings.map((prod) => (
                <motion.div key={prod.id} variants={fadeUp}>
                  <ProductCard
                    product={prod}
                    onNegotiate={(p) => setSelectedProductForNegotiation(p)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {visibleCount < sortedListings.length && (
              <div className="flex justify-center pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-1.5 border border-[#0e0f0c]/15 hover:bg-[#e8ebe6] text-[#0e0f0c] font-bold text-sm px-5 py-3 rounded-full transition-colors cursor-pointer"
                >
                  Voir plus d'annonces <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 4. SELLER BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-[#e2f6d5] rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-heading font-black text-[#0e0f0c]">
            Faites de la place. <span className="text-[#163300]">Vendez vos objets.</span>
          </h3>
          <p className="text-sm text-[#454745] max-w-md">
            Votre prochaine annonce commence ici.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="shrink-0">
          <Link
            href="/create-listing"
            className="inline-flex items-center gap-2 bg-[#0e0f0c] hover:bg-[#252622] text-[#9fe870] font-bold text-sm px-5 py-3.5 rounded-full transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" /> Déposer une annonce
          </Link>
        </motion.div>
      </motion.section>

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
