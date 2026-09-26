"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Search,
  Lock,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { resolveFirebaseImageUrl, normalizeStatus } from '@/lib/firestoreService';
import ProductCard from '@/components/ProductCard';
import { showConfirm, showToast } from '@/lib/swal';
import { getPriceInfo } from '@/lib/priceInfo';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

/** Single-column favorite card for the mobile "Mes favoris" layout. */
function FavorisMobileCard({ item, formatPrice }) {
  const { t } = useLanguage();
  const { toggleWishlist } = useWishlist();
  const priceInfo = getPriceInfo(item);
  const rawImage = item.image || item.images?.[0] || FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(rawImage);
  const isAvailable = normalizeStatus(item.status, 'approved') === 'approved';

  useEffect(() => {
    let isMounted = true;
    if (rawImage && (rawImage.startsWith('gs://') || !rawImage.startsWith('http'))) {
      resolveFirebaseImageUrl(rawImage).then(url => { if (isMounted && url) setImageSrc(url); });
    } else {
      setImageSrc(rawImage);
    }
    return () => { isMounted = false; };
  }, [rawImage]);

  return (
    <div className="bg-white rounded-2xl border border-[#e8ebe6] overflow-hidden">
      <div className="relative aspect-[4/3]">
        <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => toggleWishlist(item).catch(() => showToast(t('favError'), 'error'))}
          aria-label="Retirer des favoris"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#0e0f0c] hover:bg-white transition active:scale-90"
        >
          <Heart className="w-4 h-4 fill-[#0e0f0c]" />
        </button>
        <span className={`absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
          isAvailable ? 'bg-[#e2f6d5] text-[#0e0f0c]' : 'bg-[#e8ebe6] text-[#868685]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#2ead4b]' : 'bg-[#868685]'}`} />
          {isAvailable ? 'En ligne' : 'Indisponible'}
        </span>
      </div>
      <div className="p-3.5 space-y-2.5">
        <div>
          <Link href={`/product/${item.id}`} className="block">
            <h3 className="text-sm font-bold text-[#0e0f0c] line-clamp-1">{item.title}</h3>
          </Link>
          <p className="text-lg font-black text-[#0e0f0c] mt-0.5">
            {priceInfo.isFree || priceInfo.hasAmount ? formatPrice(priceInfo.isFree ? 0 : item.price) : t('pdPriceToNegotiate')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/product/${item.id}`}
            className="flex-1 py-2.5 rounded-full bg-[#0e0f0c] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#163300] transition active:scale-[0.98]"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Voir l'annonce
          </Link>
          <Link
            href={`/chat?productId=${item.id}`}
            aria-label="Discuter avec le vendeur"
            className="shrink-0 w-10 h-10 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center hover:bg-[#9FE870] transition active:scale-90"
          >
            <MessageSquare className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FavorisContent() {
  const { t, formatPrice } = useLanguage();
  const { wishlist, clearWishlist } = useWishlist();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilter, setMobileFilter] = useState('all');

  // Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthChecking(false);
      } else {
        setCurrentUser(null);
        setAuthChecking(false);
        router.push('/auth');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleClearAll = async () => {
    const confirmed = await showConfirm(
      t('favClearConfirmTitle'),
      t('favClearConfirmDesc'),
      t('favClearAll'),
      { danger: true }
    );
    if (!confirmed) return;
    try {
      await clearWishlist();
      showToast(t('favClearedToast'));
    } catch {
      showToast(t('favError'), 'error');
    }
  };

  const totalValue = wishlist.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

  let filteredItems = wishlist.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  if (sortBy === 'price-asc') {
    filteredItems = [...filteredItems].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  } else if (sortBy === 'price-desc') {
    filteredItems = [...filteredItems].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  }

  const recommendedItems = MOCK_FEATURED_PRODUCTS.filter(p => !wishlist.some(w => w.id === p.id)).slice(0, 4);

  if (authChecking) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-bold text-[#868685]">
        {t('favLoadingWishlist')}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-xl border border-[#e8ebe6] shadow-xl text-center space-y-4 font-body text-[#454745]">
        <div className="w-16 h-16 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
          <Lock className="w-8 h-8 text-[#0e0f0c]" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-[#0e0f0c]">{t('favLoginPromptTitle')}</h2>
        <p className="text-xs text-[#868685]">{t('favLoginPromptDesc')}</p>
        <Link href="/auth" className="button-tanit-primary inline-block text-xs font-bold py-3 px-6 shadow-md">
          {t('favLoginBtn')}
        </Link>
      </div>
    );
  }

  const availableCount = wishlist.filter(item => normalizeStatus(item.status, 'approved') === 'approved').length;
  const mobileItems = mobileFilter === 'available'
    ? wishlist.filter(item => normalizeStatus(item.status, 'approved') === 'approved')
    : wishlist;

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-12 font-body text-[#454745]">

      {/* Mobile layout — single-column cards, filter pills, back navigation */}
      <div className="sm:hidden space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="w-9 h-9 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center shrink-0 transition active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-extrabold text-[#0e0f0c]">Mes favoris</h1>
              <span className="bg-[#e2f6d5] text-[#0e0f0c] text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{wishlist.length}</span>
            </div>
            <p className="text-xs text-[#868685]">Vos coups de cœur, au même endroit.</p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilter('all')}
              className={`py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mobileFilter === 'all' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
              }`}
            >
              Tout <span className="opacity-70">{wishlist.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileFilter('available')}
              className={`py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mobileFilter === 'available' ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-[#e8ebe6] text-[#454745] hover:bg-[#e2f6d5]'
              }`}
            >
              Disponible <span className="opacity-70">{availableCount}</span>
            </button>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="card-tanit-panel p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7 fill-[#9FE870] text-[#0e0f0c]" />
            </div>
            <h2 className="text-lg font-heading font-extrabold text-[#0e0f0c]">{t('favEmptyTitle')}</h2>
            <p className="text-xs text-[#868685]">{t('favEmptyDesc')}</p>
            <Link href="/" className="button-tanit-lime text-xs shadow-md inline-block">{t('favDiscoverBtn')}</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {mobileItems.map(item => (
                <FavorisMobileCard key={item.id} item={item} formatPrice={formatPrice} />
              ))}
            </div>

            {/* Discover-more nudge */}
            <div className="bg-[#e2f6d5] rounded-2xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-white/60 text-[#0e0f0c] flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-heading font-extrabold text-[#0e0f0c]">Une envie en tête ?</h3>
              <p className="text-xs text-[#454745]">Explorez les annonces et gardez vos coups de cœur ici.</p>
              <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-[#0e0f0c] underline underline-offset-2">
                Découvrir les annonces <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Desktop / tablet layout — wide grid with search, category & sort controls */}
      <div className="hidden sm:block space-y-4 sm:space-y-6">
      {/* Page Header Card */}
      <div className="card-tanit-panel p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#9FE870] text-[#0e0f0c]">
              <Heart className="w-5 h-5 fill-[#0e0f0c] text-[#0e0f0c]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0e0f0c]">{t('favLoginPromptTitle')}</h1>
            <span className="bg-[#0e0f0c] text-[#9FE870] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {wishlist.length}
            </span>
          </div>
          <p className="text-xs text-[#868685]">
            {t('favPageDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {wishlist.length > 0 && (
            <div className="bg-[#e2f6d5] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0e0f0c] flex items-center gap-2 border border-[#0e0f0c]/10">
              <TrendingUp className="w-4 h-4 text-[#0e0f0c]" />
              <span>{t('favEstimatedValue')}</span>
              <span className="text-sm font-black text-[#0e0f0c]">{totalValue} TND</span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {wishlist.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-[#a72027] hover:bg-[#FFEDE8] px-3 py-1.5 rounded-full transition flex items-center gap-1.5 border border-[#a72027]/20 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t('favClearAll')}</span>
              </button>
            )}
            <Link href="/" className="button-tanit-tertiary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap shrink-0">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-[#0e0f0c] shrink-0" /> {t('favExplore')}
            </Link>
          </div>
        </div>
      </div>

      {/* Filter, Search and Sort controls */}
      {wishlist.length > 0 && (
        <div className="card-tanit-panel p-4 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder={t('favSearchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-lg border border-[#e8ebe6] focus:outline-none focus:border-[#0e0f0c] bg-[#e8ebe6] text-[#454745]"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto py-1">
            {['All', 'fashion', 'electronics', 'home', 'sports'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition capitalize whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0e0f0c] text-[#9FE870] shadow-xs'
                    : 'bg-[#e8ebe6] text-[#454745] border border-[#e8ebe6] hover:bg-[#e2f6d5]'
                }`}
              >
                {cat === 'All' ? t('favCatAllChip') : cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#868685]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#e8ebe6] border border-[#e8ebe6] rounded-lg px-3 py-1.5 text-xs font-bold text-[#454745] focus:outline-none cursor-pointer"
            >
              <option value="newest">{t('favSortNewest')}</option>
              <option value="price-asc">{t('favSortPriceAsc')}</option>
              <option value="price-desc">{t('favSortPriceDesc')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid of Favorite Items */}
      {wishlist.length === 0 ? (
        <div className="card-tanit-panel p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#e2f6d5] text-[#0e0f0c] flex items-center justify-center mx-auto border border-[#0e0f0c]/10">
            <Heart className="w-8 h-8 fill-[#9FE870] text-[#0e0f0c]" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#0e0f0c]">{t('favEmptyTitle')}</h2>
          <p className="text-xs text-[#868685]">
            {t('favEmptyDesc')}
          </p>
          <Link href="/" className="button-tanit-lime text-xs shadow-md">
            {t('favDiscoverBtn')}
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center card-tanit-panel text-xs font-bold text-[#868685]">
          {t('favNoMatch')}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredItems.map(item => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}

      {/* Recommended Products */}
      {recommendedItems.length > 0 && (
        <div className="pt-6 sm:pt-8 border-t border-[#e8ebe6] space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0e0f0c]" />
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-[#0e0f0c]">{t('favRecommended')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {recommendedItems.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function FavorisPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-bold text-[#868685]">
        {t('favLoadingPage')}
      </div>
    }>
      <FavorisContent />
    </Suspense>
  );
}
