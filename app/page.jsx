"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  SlidersHorizontal,
  PlusCircle,
  Truck,
  Handshake,
  BadgePercent,
  Megaphone
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import NegotiationModal from '@/components/NegotiationModal';
import { useListings } from '@/hooks/useListings';
import { useLanguage } from '@/context/LanguageContext';
import { CATEGORIES } from '@/lib/categories';

// Fixed brand shot (TanitMarket signage) — desktop hero photo panel.
const HERO_BRAND_IMAGE = '/images/tanitmarket-signage.jpg';

const QUICK_CHIPS = [{ id: 'All', emoji: '🔥', name: 'Tout' }, ...CATEGORIES];

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
    listings,
    filteredListings,
    loading,
    selectedCategory,
    setSelectedCategory,
    selectedGovernorate,
    setSelectedGovernorate,
    setSearchQuery,
    getCategoryCount,
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
  const sponsoredListing = listings.find(p => p.isSponsored) || listings[0];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8 sm:space-y-12 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-12 font-body text-[#0e0f0c]">

      {/* QUICK CATEGORY CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {QUICK_CHIPS.map((c) => {
          const isSelected = c.id === 'All' ? selectedCategory === 'All' : selectedCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCategory(isSelected && c.id !== 'All' ? 'All' : c.id);
                document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`shrink-0 flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                isSelected ? 'bg-[#0e0f0c] text-[#9fe870]' : 'bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#e2f6d5]'
              }`}
            >
              <span>{c.emoji}</span>{c.name}
            </button>
          );
        })}
      </div>

      {/* 1. HERO */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-[#e8ebe6] p-6 sm:p-10 lg:p-14"
      >
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <motion.div
            className="lg:col-span-7 space-y-4 sm:space-y-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.span variants={fadeUp} className="inline-block bg-[#0e0f0c] text-[#9fe870] font-bold text-[10px] sm:text-[11px] tracking-widest px-3 py-1.5 rounded-full">
              LA MARKETPLACE QUI NOUS RAPPROCHE
            </motion.span>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl lg:text-[64px] font-heading font-black text-[#0e0f0c] leading-[1.05] tracking-tight">
              {t('heroTitleLine1')}
              <br />
              <span className="bg-[#9fe870] px-3 py-0.5 rounded-2xl box-decoration-clone">{t('heroTitleLine2')}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-sm sm:text-lg text-[#454745] max-w-lg leading-relaxed">
              {t('heroDescLong')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-1">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#explore"
                className="inline-flex items-center gap-2 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-bold text-sm sm:text-base rounded-full px-6 py-3.5 transition-colors"
              >
                <Search className="w-4 h-4" /> {t('heroCta')}
              </motion.a>
              <span className="text-xs sm:text-sm font-medium text-[#454745]">📍 100 % près de vous · Tunis, Sousse, Sfax…</span>
            </motion.div>
          </motion.div>

          {/* Desktop-only photo panel with a floating sponsored-listing card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:col-span-5 relative rounded-[32px] overflow-hidden min-h-[360px] bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_BRAND_IMAGE})` }}
          >
            {sponsoredListing && (
              <Link
                href={`/product/${sponsoredListing.id}`}
                className="absolute left-7 bottom-7 w-[300px] bg-white rounded-2xl p-3 flex items-center gap-3 shadow-xl hover:scale-[1.02] transition-transform"
              >
                <img
                  src={sponsoredListing.image || sponsoredListing.images?.[0]}
                  alt=""
                  className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0 bg-[#e8ebe6]"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="self-start flex items-center gap-1 bg-[#0e0f0c] text-[#9fe870] text-[9px] font-bold tracking-widest px-2 py-1 rounded-full">
                    <Megaphone className="w-2.5 h-2.5" /> SPONSORISÉ
                  </span>
                  <span className="text-sm font-semibold text-[#0e0f0c] truncate">{sponsoredListing.title}</span>
                  <span className="font-heading font-black text-[#0e0f0c]">
                    {sponsoredListing.price} <span className="text-xs font-bold text-[#868685]">TND</span>
                  </span>
                </div>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* 2. CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-[#0e0f0c]">Explorez par catégorie</h2>
          <button
            type="button"
            onClick={() => { setSelectedCategory('All'); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-xs sm:text-sm font-bold text-[#454745] hover:text-[#0e0f0c] flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            Voir toutes les catégories <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);
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
                className={`text-left flex flex-col gap-2.5 sm:gap-3 p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#0e0f0c]' : 'bg-[#e8ebe6] hover:bg-[#e2f6d5]'
                }`}
              >
                <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl ${
                  isSelected ? 'bg-[#0e0f0c] ring-1 ring-[#9fe870]/40' : 'bg-white'
                }`}>
                  {cat.emoji}
                </span>
                <span className={`text-xs sm:text-sm font-heading font-extrabold leading-tight ${isSelected ? 'text-[#9fe870]' : 'text-[#0e0f0c]'}`}>
                  {cat.name}
                </span>
                <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${isSelected ? 'text-[#9fe870]/70' : 'text-[#454745]'}`}>
                  {count} annonce{count > 1 ? 's' : ''}
                </span>
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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
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
        className="relative overflow-hidden bg-[#0e0f0c] rounded-3xl p-8 sm:p-11 flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        <h3 className="text-2xl sm:text-4xl font-heading font-black text-[#9fe870] leading-tight text-center lg:text-left max-w-xl">
          Ce qui dort chez vous peut faire un heureux.
        </h3>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="shrink-0">
          <Link
            href="/create-listing"
            className="inline-flex items-center gap-2 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-bold text-sm sm:text-base px-6 py-3.5 sm:py-4 rounded-full transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" /> Je dépose mon annonce
          </Link>
        </motion.div>
      </motion.section>

      {/* 5. TRUST BADGES */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
        {[
          { icon: Truck, title: 'Paiement à la livraison', desc: "Vous payez quand l'article arrive chez vous." },
          { icon: Handshake, title: 'Remise en main propre', desc: 'Rencontrez le vendeur près de chez vous.' },
          { icon: BadgePercent, title: '100 % gratuit', desc: "Aucune commission, ni pour l'acheteur ni pour le vendeur." },
        ].map((b) => (
          <div key={b.title} className="border border-[#e8ebe6] rounded-3xl p-5 flex flex-col gap-1.5">
            <b.icon className="w-5 h-5 text-[#163300] shrink-0" />
            <span className="font-heading font-extrabold text-base text-[#0e0f0c]">{b.title}</span>
            <span className="text-sm text-[#454745]">{b.desc}</span>
          </div>
        ))}
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
