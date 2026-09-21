"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MapPin,
  Clock,
  Check,
  MessageSquare,
  Plane,
  Repeat,
  Package,
  Home,
  Smartphone,
  Shirt,
  Car,
  Building,
  Bike,
  Briefcase,
  Baby,
  PawPrint,
  Palette,
  Tag,
  Megaphone
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { resolveFirebaseImageUrl } from '@/lib/firestoreService';
import { timeAgo } from '@/lib/timeAgo';
import { getPriceInfo } from '@/lib/priceInfo';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80';

// Category ids (create-listing) and legacy display-name strings (mock data)
// both map to a representative icon/label — falls back to a generic tag and
// the raw value when nothing matches.
const CATEGORY_MATCHERS = [
  { test: /home|maison|d[ée]co/, icon: Home, label: 'Maison' },
  { test: /electronic|[ée]lectro|high-?tech|multim[ée]dia/, icon: Smartphone, label: 'Multimédia' },
  { test: /fashion|mode|v[êe]tement/, icon: Shirt, label: 'Mode' },
  { test: /vehicle|v[ée]hicule|auto/, icon: Car, label: 'Véhicules' },
  { test: /realestate|immobilier/, icon: Building, label: 'Immobilier' },
  { test: /sport|loisir|v[ée]lo/, icon: Bike, label: 'Sports & Loisirs' },
  { test: /job|emploi|service/, icon: Briefcase, label: 'Emploi & Services' },
  { test: /baby|b[ée]b[ée]|enfant/, icon: Baby, label: 'Bébé & Enfant' },
  { test: /pet|animau/, icon: PawPrint, label: 'Animaux' },
  { test: /art|collection|antiquit/, icon: Palette, label: 'Art' },
];

function matchCategory(category) {
  const key = String(category || '').toLowerCase();
  return CATEGORY_MATCHERS.find((c) => c.test.test(key)) || null;
}

function getCategoryIcon(category) {
  return matchCategory(category)?.icon || Tag;
}

// Short category ids (e.g. "home") get a nice French label; legacy mock data
// already stores a human-readable display name, so it's shown as-is.
function getCategoryLabel(category, fallback) {
  if (!category) return fallback;
  const match = matchCategory(category);
  return match && category.length <= 12 ? match.label : category;
}

export default function ProductCard({ product, onNegotiate }) {
  const { t, formatPrice } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();

  const activeFav = isWishlisted(product?.id);
  const locationName = product?.seller?.location || product?.location || t('pcDefaultLocation');
  const sellerName = product?.seller?.name || product?.sellerName || t('pcDefaultSeller');
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const sellerId = product?.seller?.id || product?.sellerId || null;
  const CategoryIcon = getCategoryIcon(product?.category);
  const categoryLabel = getCategoryLabel(product?.category, t('heroDefaultCategory'));
  const publishedLabel = timeAgo(product?.createdAt?.seconds, t);
  const priceInfo = getPriceInfo(product);

  const rawImage = product?.image || product?.images?.[0] || FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(rawImage);

  useEffect(() => {
    let isMounted = true;
    if (rawImage && (rawImage.startsWith('gs://') || !rawImage.startsWith('http'))) {
      resolveFirebaseImageUrl(rawImage).then(url => {
        if (isMounted && url) setImageSrc(url);
      });
    } else {
      setImageSrc(rawImage);
    }
    return () => { isMounted = false; };
  }, [rawImage]);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    router.push(`/product/${product.id}`);
  };

  const hasMentions = product.priceType === 'fixed' || product.isImported || product.allowTrade || product.availability === 'on_order';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden group flex flex-col cursor-pointer font-body shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-[#e8ebe6] overflow-hidden">
        <img
          src={imageSrc}
          alt={product.title}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
        />

        {/* Top-left badges: Sponsorisé (admin-chosen, stacks above) + discount / custom tag / category */}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col items-start gap-1 max-w-[65%]">
          {product.isSponsored && (
            <span className="bg-[#ffc091] text-[#4a1b0c] font-bold text-[9px] sm:text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-sm">
              <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">Sponsorisé</span>
            </span>
          )}
          {product.discountBadge ? (
            <span className="bg-[#0e0f0c] text-[#9fe870] font-bold text-[9px] sm:text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full truncate max-w-full">
              {product.discountBadge}
            </span>
          ) : product.tag ? (
            <span className="bg-[#0e0f0c] text-white font-bold text-[9px] sm:text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full truncate max-w-full">
              {product.tag}
            </span>
          ) : (
            <span className="bg-white/95 backdrop-blur-sm text-[#0e0f0c] font-bold text-[9px] sm:text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 truncate max-w-full shadow-sm">
              <CategoryIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{categoryLabel}</span>
            </span>
          )}
        </div>

        {/* Heart Wishlist Overlay Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={activeFav ? t('pcRemoveFav') : t('pcAddFav')}
          className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition active:scale-90 shadow-sm ${
            activeFav ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-white/95 backdrop-blur-sm text-[#0e0f0c] hover:bg-[#9fe870]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeFav ? 'fill-[#0e0f0c] text-[#0e0f0c]' : 'text-[#0e0f0c]'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col gap-1.5 sm:gap-2.5">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-[9px] sm:text-[11px] font-extrabold text-[#163300] uppercase tracking-wider truncate">
            {product.condition || t('pcDefaultCondition')}
          </div>
          <Link href={`/product/${product.id}`} className="block focus:outline-none">
            <h3 className="text-xs sm:text-lg font-heading font-extrabold text-[#0e0f0c] line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {priceInfo.isFree ? (
            <span className="text-sm sm:text-2xl font-black text-[#0e0f0c] bg-[#e2f6d5] px-2 py-0.5 sm:py-1 rounded-lg">
              {formatPrice(0)}
            </span>
          ) : priceInfo.hasAmount ? (
            <span className="flex items-baseline gap-1 min-w-0">
              <span className="text-base sm:text-3xl font-black text-[#0e0f0c] leading-none truncate">{product.price}</span>
              <span className="text-[10px] sm:text-sm font-bold text-[#868685] shrink-0">TND</span>
              {product.originalPrice && (
                <span className="hidden sm:inline text-xs text-[#868685] line-through ml-1">{product.originalPrice} TND</span>
              )}
            </span>
          ) : null}
          {priceInfo.isFixed && !priceInfo.isFree && (
            <span className="text-[9px] sm:text-xs font-bold text-[#0e0f0c] bg-[#e2f6d5] px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full shrink-0">
              {t('badgeFixedPrice')}
            </span>
          )}
          {priceInfo.isNegotiable && (
            <span className="text-[9px] sm:text-xs font-bold text-[#0e0f0c] bg-[#e2f6d5] px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full shrink-0">
              {t('negotiable')}
            </span>
          )}
        </div>

        {/* Mentions */}
        {hasMentions && (
          <div className="flex flex-wrap items-center gap-1">
            {product.isImported && (
              <span className="text-[9px] sm:text-xs font-bold text-[#0e0f0c] bg-[#e8ebe6] px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 rounded-full flex items-center gap-0.5">
                <Plane className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> {t('badgeImported')}
              </span>
            )}
            {product.allowTrade && (
              <span className="text-[9px] sm:text-xs font-bold text-[#0e0f0c] bg-[#e8ebe6] px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 rounded-full flex items-center gap-0.5">
                <Repeat className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> {t('badgeTrade')}
              </span>
            )}
            {product.availability === 'on_order' && (
              <span className="text-[9px] sm:text-xs font-bold text-[#b86700] bg-[#fff5da] px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 rounded-full flex items-center gap-0.5">
                <Package className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> {t('badgeOnOrder')}
              </span>
            )}
          </div>
        )}

        {/* Location & Time */}
        <div className="flex items-center justify-between text-[9px] sm:text-xs text-[#868685] font-medium pt-1.5 sm:pt-2.5 border-t border-[#0e0f0c]/10">
          <div className="flex items-center gap-1 truncate max-w-[60%]">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#868685] flex-shrink-0" />
            <span className="truncate">{locationName.split(',')[0]}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#868685]" />
            <span>{publishedLabel || t('twoHoursAgo')}</span>
          </div>
        </div>

        {/* Seller row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {sellerId ? (
            <Link href={`/seller/${sellerId}`} className="flex items-center gap-1.5 sm:gap-2 min-w-0 hover:opacity-80 transition">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-extrabold text-xs sm:text-sm flex items-center justify-center flex-shrink-0">
                {sellerInitial}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0e0f0c] truncate max-w-[60px] sm:max-w-[90px]">{sellerName.split(' ')[0]}</span>
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#163300] flex items-center justify-center flex-shrink-0">
                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3} />
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-extrabold text-xs sm:text-sm flex items-center justify-center flex-shrink-0">
                {sellerInitial}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0e0f0c] truncate max-w-[60px] sm:max-w-[90px]">{sellerName.split(' ')[0]}</span>
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#163300] flex items-center justify-center flex-shrink-0">
                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3} />
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onNegotiate) {
                onNegotiate(product);
              } else {
                router.push(`/chat?productId=${product.id}`);
              }
            }}
            aria-label={t('discussBtn')}
            title={t('discussBtn')}
            className="shrink-0 w-7 h-7 sm:w-auto sm:h-auto sm:py-2 sm:px-4 rounded-full bg-[#9fe870] text-[#0e0f0c] text-xs font-extrabold flex items-center justify-center sm:gap-1.5 hover:brightness-95 transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="hidden sm:inline">{t('discussBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
