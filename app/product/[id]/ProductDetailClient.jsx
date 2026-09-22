"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Share2,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Phone,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Gift,
  Sparkles,
  Star,
  Package,
  Image as ImageIcon,
  Loader2,
  Ban,
  Plane,
  Repeat,
  ExternalLink,
  Megaphone
} from 'lucide-react';
import { MOCK_FEATURED_PRODUCTS } from '@/lib/mockData';
import NegotiationModal from '@/components/NegotiationModal';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { fetchProductById, resolveFirebaseImageUrl, checkIfUserIsAdminInDb } from '@/lib/firestoreService';
import { showToast } from '@/lib/swal';
import { timeAgo } from '@/lib/timeAgo';
import { getPriceInfo } from '@/lib/priceInfo';
import ProductCard from '@/components/ProductCard';

// Category-specific spec fields worth surfacing on the detail page — pulled
// from the `details` object created in /create-listing, skipping empty values.
function getSpecEntries(product, t) {
  const d = product?.details || {};
  const entries = [];
  const push = (label, value) => {
    if (value !== null && value !== undefined && value !== '') entries.push({ label, value });
  };
  const bool = (v) => v === true ? t('yesWord') : v === false ? t('noWord') : null;

  switch (product?.category) {
    case 'electronics':
      push(t('specBrand'), d.brand);
      push(t('specModel'), d.model);
      push(t('specStorage'), d.storageCapacity);
      push(t('specBattery'), d.batteryHealth);
      push(t('specAccessories'), d.accessories);
      break;
    case 'vehicles':
      push(t('specBrand'), d.brand);
      push(t('specModel'), d.model);
      push(t('specYear'), d.year);
      push(t('specMileage'), d.mileage ? `${d.mileage} km` : null);
      push(t('specFuel'), d.fuel);
      push(t('specTransmission'), d.transmission);
      push(t('specFiscalPower'), d.fiscalPower);
      push(t('specColor'), d.color);
      break;
    case 'realestate':
      push(t('specContract'), d.contractType);
      push(t('specPropertyType'), d.propertyType);
      push(t('specSurface'), d.surface ? `${d.surface} m²` : null);
      push(t('specRooms'), d.rooms);
      push(t('specFurnished'), bool(d.furnished));
      push(t('specElevator'), bool(d.elevator));
      break;
    case 'fashion':
      push(t('specSize'), d.size);
      push(t('specGender'), d.gender);
      push(t('specBrand'), d.brand);
      break;
    case 'jobs':
      push(t('specType'), d.jobType);
      push(t('specExperience'), d.experienceLevel);
      break;
    case 'pets':
      push(t('specAnimal'), d.petType);
      push(t('specBreed'), d.petBreed);
      push(t('specVaccinated'), bool(d.vaccinated));
      break;
    case 'baby':
      push(t('specCategory'), d.babyCategory);
      break;
    case 'art':
      push(t('specEra'), d.artEra);
      break;
    default:
      push(t('specBrand'), d.brand);
  }

  return entries;
}

// wa.me deep links take digits only (no "+", spaces or dashes).
function toWhatsappLink(phone, title) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  const text = title ? `Bonjour, votre annonce "${title}" sur TanitMarket m'intéresse.` : undefined;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

function ProductDetailContent() {
  const { t, formatPrice } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const [isAdminViewer, setIsAdminViewer] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Robustly resolve product ID. On the client, the real browser URL is
  // always trusted first: this is a static export where every /product/**
  // request the hosting rewrite can't match to a pre-built page falls back
  // to serving product/prod-1's shell (see firebase.json) — so for any
  // listing created after the last deploy, Next's own `useParams()` would
  // incorrectly resolve to whatever id that shell was built for ("prod-1"),
  // even though the address bar (and thus the actual product to fetch) is
  // correct. `params?.id` is only meaningful during static generation
  // (no `window`), when it IS the id of the page currently being built.
  const getResolvedProductId = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const prodIdx = pathParts.indexOf('product');
      if (prodIdx !== -1 && pathParts[prodIdx + 1]) {
        return decodeURIComponent(pathParts[prodIdx + 1]);
      }

      const queryId = searchParams?.get('id') || searchParams?.get('productId');
      if (queryId) return String(queryId);
    }

    let id = params?.id;
    if (Array.isArray(id)) id = id[0];
    if (id && id !== 'undefined' && id !== 'null') return String(id);

    return 'prod-1';
  };

  const productId = getResolvedProductId();

  const [product, setProduct] = useState(
    MOCK_FEATURED_PRODUCTS.find(p => String(p.id) === String(productId)) || null
  );
  const [loading, setLoading] = useState(true);
  const activeFav = isWishlisted(product?.id);
  const [selectedImage, setSelectedImage] = useState(product?.images?.[0] || product?.image);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure loading state completes after 1s max
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    async function loadProduct() {
      try {
        const item = await fetchProductById(productId);
        if (!isMounted) return;
        setProduct(item || null);
        if (item) {
          const rawImg = item.images?.[0] || item.image;
          if (rawImg && (rawImg.startsWith('gs://') || !rawImg.startsWith('http'))) {
            const resolved = await resolveFirebaseImageUrl(rawImg);
            if (isMounted) setSelectedImage(resolved || rawImg);
          } else {
            setSelectedImage(rawImg);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch product from Firestore:", err);
      } finally {
        clearTimeout(timer);
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [productId]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      setIsAdminViewer(false);
      return;
    }
    checkIfUserIsAdminInDb(user.uid, user.email).then((result) => {
      if (isMounted) setIsAdminViewer(!!result);
    });
    return () => { isMounted = false; };
  }, [user?.uid]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: product?.title, url });
      } catch (err) {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        showToast(t('pdLinkCopied'));
      } catch (err) {
        console.warn('Clipboard share error:', err);
      }
    }
  };

  if (!product) {
    if (loading) {
      return (
        <div className="max-w-7xl mx-auto p-16 flex flex-col items-center gap-3 text-center text-xs font-semibold text-[#868685]">
          <Loader2 className="w-7 h-7 text-[#0e0f0c] animate-spin" />
          {t('pdLoading')}
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl text-center space-y-4 font-body text-[#0e0f0c] shadow-sm animate-rise-in">
        <div className="w-14 h-14 rounded-full bg-[#e8ebe6] text-[#868685] flex items-center justify-center mx-auto">
          <Ban className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-heading font-black text-[#0e0f0c]">{t('pdNotFoundTitle')}</h2>
        <p className="text-xs text-[#868685]">{t('pdNotFoundDesc')}</p>
        <Link href="/" className="button-tanit-primary inline-block text-xs">
          {t('pdBackHomeBtn')}
        </Link>
      </div>
    );
  }

  const isOwner = !!user?.uid && (product.sellerId === user.uid || product.seller?.id === user.uid);
  if (product.status && product.status !== 'approved' && !isOwner && !isAdminViewer) {
    const isReserved = product.status === 'reserved';
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl text-center space-y-4 font-body text-[#0e0f0c] shadow-sm animate-rise-in">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${isReserved ? 'bg-[#e8ebe6] text-[#868685]' : 'bg-[#fff5da] text-[#b86700]'}`}>
          {isReserved ? <Ban className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
        </div>
        <h2 className="text-2xl font-heading font-black text-[#0e0f0c]">{isReserved ? t('pdReservedTitle') : t('pdPendingTitle')}</h2>
        <p className="text-xs text-[#868685]">
          {isReserved ? t('pdReservedDesc') : t('pdPendingDesc')}
        </p>
        <Link href="/" className="button-tanit-primary inline-block text-xs">
          {t('pdBackHomeBtn')}
        </Link>
      </div>
    );
  }

  const recommendedItems = MOCK_FEATURED_PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);
  const galleryImages = product.images?.length > 0 ? product.images : [product.image].filter(Boolean);
  const activeIndex = Math.max(0, galleryImages.indexOf(selectedImage));
  const specEntries = getSpecEntries(product, t);
  const priceInfo = getPriceInfo(product);
  const priceDisplay = priceInfo.isFree || priceInfo.hasAmount ? formatPrice(priceInfo.isFree ? 0 : product.price) : t('pdPriceToNegotiate');
  const infoEntries = [
    { label: t('specCondition'), value: product.condition || t('pdDefaultCondition') },
    { label: t('specLocation'), value: product.location || t('heroDefaultLocation') },
    ...specEntries,
  ];
  const sellerRating = Math.round(product.seller?.rating || product.rating || 5);
  const publishedLabel = timeAgo(product.createdAt?.seconds, t);
  const showStickyBar = !isOwner;

  return (
    <div className={`max-w-[1380px] mx-auto px-4 sm:px-8 py-6 space-y-5 sm:space-y-6 font-body text-[#0e0f0c] ${
      showStickyBar ? 'pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] lg:pb-12' : 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-12'
    }`}>

      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between gap-3 animate-rise-in">
        <Link
          href="/"
          title={t('pdBack')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] shrink-0 transition-all hover:scale-105 active:scale-90"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        </Link>
        <span
          className="text-xs font-semibold text-[#868685] truncate text-right"
          title={t('pdListingNumber', { id: product.id })}
        >
          {t('pdListingNumber', { id: String(product.id).slice(0, 8) })}
        </span>
      </div>

      {/* Title & quick meta chips — full width so it's the first thing read */}
      <div className="space-y-2.5 animate-rise-in">
        <h1 className="font-heading font-black text-xl sm:text-3xl text-[#0e0f0c] leading-tight">
          {product.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {product.isSponsored && (
            <span className="flex items-center gap-1.5 bg-[#ffc091] text-[#4a1b0c] px-2.5 py-1 rounded-full">
              <Megaphone className="w-3.5 h-3.5 shrink-0" /> Sponsorisé
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-[#e8ebe6] text-[#0e0f0c] px-2.5 py-1 rounded-full">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> {product.location || t('heroDefaultLocation')}
          </span>
          {product.condition && (
            <span className="flex items-center gap-1.5 bg-[#e8ebe6] text-[#0e0f0c] px-2.5 py-1 rounded-full">
              <Package className="w-3.5 h-3.5 shrink-0" /> {product.condition}
            </span>
          )}
          {publishedLabel && (
            <span className="flex items-center gap-1.5 text-[#868685] px-1 py-1">
              <Clock className="w-3.5 h-3.5 shrink-0" /> {publishedLabel}
            </span>
          )}
          {product.priceType === 'fixed' && !product.isFree && (
            <span className="flex items-center gap-1.5 bg-[#0e0f0c] text-[#9fe870] px-2.5 py-1 rounded-full">
              {t('badgeFixedPrice')}
            </span>
          )}
          {product.isImported && (
            <span className="flex items-center gap-1.5 bg-[#e2f6d5] text-[#0e0f0c] px-2.5 py-1 rounded-full">
              <Plane className="w-3.5 h-3.5 shrink-0" /> {t('badgeImported')}
            </span>
          )}
          {product.allowTrade && (
            <span className="flex items-center gap-1.5 bg-[#e2f6d5] text-[#0e0f0c] px-2.5 py-1 rounded-full">
              <Repeat className="w-3.5 h-3.5 shrink-0" /> {t('badgeTrade')}
            </span>
          )}
          {product.availability === 'on_order' && (
            <span className="flex items-center gap-1.5 bg-[#fff5da] text-[#b86700] px-2.5 py-1 rounded-full">
              <Package className="w-3.5 h-3.5 shrink-0" /> {t('badgeOnOrder')}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* Left Column: Image Gallery & Description */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6 animate-rise-in">

          {/* Main Showcase Image */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#e8ebe6] aspect-square sm:aspect-16/10 shadow-sm group">
            <img
              key={selectedImage}
              src={selectedImage || product.image}
              alt={product.title}
              className="w-full h-full object-cover animate-chat-bubble group-hover:scale-105 transition-transform duration-500"
            />

            {/* Price-type badge */}
            {(product.isFree || (product.priceType === 'negotiable' && !product.isFree)) && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                {product.isFree ? (
                  <span className="flex items-center gap-1.5 bg-[#0e0f0c] text-[#9fe870] font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
                    <Gift className="w-3.5 h-3.5" /> {t('pdFreeGift')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-[#9fe870] text-[#0e0f0c] font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0e0f0c] animate-pulse shrink-0" /> {t('negotiable')}
                  </span>
                )}
              </div>
            )}

            {/* Floating Action Buttons */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-[#0e0f0c] hover:bg-white transition-all hover:scale-110 active:scale-90 shadow-sm cursor-pointer"
                title={t('pdShare')}
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-2.5 rounded-full transition-all hover:scale-110 active:scale-90 shadow-sm cursor-pointer ${
                  activeFav ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-white/90 backdrop-blur-md text-[#0e0f0c] hover:bg-white'
                }`}
                title={t('pcAddFav')}
              >
                <Heart className={`w-4.5 h-4.5 ${activeFav ? 'fill-[#0e0f0c]' : ''}`} />
              </button>
            </div>

            {/* Photo counter */}
            {galleryImages.length > 1 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#0e0f0c]/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" /> {activeIndex + 1}/{galleryImages.length}
              </span>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === imgUrl
                      ? 'border-[#9fe870] ring-2 ring-[#0e0f0c] scale-100'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={imgUrl} alt={t('pdThumbnail', { n: idx + 1 })} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="card-tanit-panel space-y-4">
            <h3 className="font-heading font-black text-lg sm:text-xl text-[#0e0f0c] border-b border-[#0e0f0c]/10 pb-3">
              {t('pdDescTitle')}
            </h3>
            <p className="text-sm leading-relaxed text-[#454745] whitespace-pre-line max-h-72 overflow-y-auto pr-1">
              {product.description || t('pdNoDesc')}
            </p>

            {/* Attributes & Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#0e0f0c]/10 text-xs">
              {infoEntries.map((entry) => (
                <div key={entry.label} className="bg-[#e8ebe6] p-3 rounded-lg">
                  <span className="text-[#868685] block text-[11px]">{entry.label} :</span>
                  <span className="font-semibold text-[#0e0f0c]">{entry.value}</span>
                </div>
              ))}
              <div className="bg-[#e8ebe6] p-3 rounded-lg">
                <span className="text-[#868685] block text-[11px]">{t('pdSellerVerif')}</span>
                <span className="font-semibold text-[#0e0f0c] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ead4b]" /> {t('pdVerifiedWord')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing & Seller Box */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6 animate-rise-in" style={{ animationDelay: '120ms' }}>

          {/* Price & Primary CTAs */}
          <div className="card-tanit-panel space-y-5">
            <div>
              <span className="text-xs font-semibold text-[#868685] uppercase tracking-wider block mb-1">
                {t('pdPrice')}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#0e0f0c]">
                {priceDisplay}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {/* Negotiation Offer CTA */}
              <button
                onClick={() => setIsNegotiationOpen(true)}
                className="w-full button-tanit-primary text-sm py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-4.5 h-4.5 text-[#0e0f0c] shrink-0" />
                <span>{t('pdNegotiateBtn')}</span>
              </button>

              {/* Chat Direct CTA */}
              <Link
                href={`/chat?productId=${product.id}`}
                className="w-full button-tanit-secondary text-sm py-3 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t('pdSendMessage')}</span>
              </Link>
            </div>
          </div>

          {/* Seller Card */}
          <div className="card-tanit-panel space-y-4">
            <h4 className="font-heading font-black text-base text-[#0e0f0c] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0e0f0c]" /> {t('pdAboutSeller')}
            </h4>

            {(() => {
              const sellerId = product.seller?.id || product.sellerId;
              const SellerWrapper = sellerId ? Link : 'div';
              const wrapperProps = sellerId ? { href: `/seller/${sellerId}` } : {};
              return (
                <SellerWrapper {...wrapperProps} className={`flex items-center gap-3 ${sellerId ? 'hover:opacity-80 transition' : ''}`}>
                  <img
                    src={product.seller?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'}
                    alt={product.seller?.name || t('chatDefaultSeller')}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#9fe870] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-sm text-[#0e0f0c] truncate">{product.seller?.name || 'Mohamed Ben Ali'}</h5>
                    <span className="text-xs text-[#868685] flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />
                      <span className="truncate">{product.seller?.location || product.location || t('pcDefaultLocation')}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" title={`${sellerRating}/5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < sellerRating ? 'fill-[#9fe870] text-[#0e0f0c]' : 'text-[#e8ebe6]'}`}
                      />
                    ))}
                  </div>
                </SellerWrapper>
              );
            })()}

            <div className="p-3 bg-[#e2f6d5] rounded-lg text-xs font-semibold text-[#0e0f0c] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#054d28] flex-shrink-0" />
              <span>{t('pdVerifiedSms')}</span>
            </div>

            {product.seller?.phone && (
              <a
                href={`tel:${product.seller.phone}`}
                className="w-full button-tanit-lime text-xs py-2.5 px-4 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 text-[#0e0f0c] shrink-0" />
                <span className="truncate">{t('pdCall', { phone: product.seller.phone })}</span>
              </a>
            )}

            {product.seller?.phone && (
              <a
                href={toWhatsappLink(product.seller.phone, product.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white text-xs py-2.5 px-4 rounded-full font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] hover:brightness-95"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('pdWhatsappBtn')}</span>
              </a>
            )}

            {product.seller?.socialUrl && (
              <a
                href={product.seller.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full button-tanit-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('pdFacebookBtn')}</span>
              </a>
            )}
          </div>

        </div>

      </div>

      {/* Recommended Products Carousel / Grid */}
      {recommendedItems.length > 0 && (
        <div className="pt-8 space-y-4 border-t border-[#0e0f0c]/10 animate-rise-in">
          <h3 className="font-heading font-black text-lg sm:text-xl text-[#0e0f0c] flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-[#0e0f0c]" /> {t('pdSimilar')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {recommendedItems.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Mobile Action Bar */}
      {showStickyBar && (
        <div className="lg:hidden fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 bg-white border-t border-[#0e0f0c]/10 px-4 py-3 flex items-center gap-2 animate-rise-in">
          <Link
            href={`/chat?productId=${product.id}`}
            aria-label={t('pdSendMessage')}
            className="w-[52px] h-[52px] shrink-0 rounded-2xl bg-[#e8ebe6] flex items-center justify-center"
          >
            <MessageSquare className="w-5 h-5 text-[#0e0f0c]" />
          </Link>
          <button
            onClick={() => setIsNegotiationOpen(true)}
            className="flex-1 h-[52px] rounded-2xl bg-[#9fe870] hover:bg-[#cdffad] font-bold text-sm text-[#0e0f0c] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{t('pdNegotiateBtn')}</span>
          </button>
        </div>
      )}

      {/* Negotiation Modal */}
      <NegotiationModal
        product={product}
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
      />

    </div>
  );
}

export default function ProductDetailClient() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-12 text-center text-xs font-semibold text-[#868685]">
        {t('pdLoading')}
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}
