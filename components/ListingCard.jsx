"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Heart,
  MapPin,
  Clock,
  Check,
  MessageCircle,
  Plane,
  Repeat,
  Package,
  Home,
  Smartphone,
  Shirt,
  Car,
  Building,
  Gamepad2,
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
import { showToast } from '@/lib/swal';
import { DURATION, EASE_OUT } from '@/lib/design';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

// Category ids (create-listing) and legacy display-name strings (mock data)
// both map to a representative icon/label — falls back to a generic tag and
// the raw value when nothing matches.
const CATEGORY_MATCHERS = [
  { test: /home|maison|d[ée]co/, icon: Home, key: 'catNavHome' },
  { test: /electronic|[ée]lectro|high-?tech|multim[ée]dia/, icon: Smartphone, key: 'catNavMultimedia' },
  { test: /fashion|mode|v[êe]tement/, icon: Shirt, key: 'catNavFashion' },
  { test: /vehicle|v[ée]hicule|auto/, icon: Car, key: 'catNavVehicles' },
  { test: /realestate|immobilier/, icon: Building, key: 'catNavRealEstate' },
  { test: /sport|loisir|v[ée]lo/, icon: Gamepad2, key: 'catNavLeisure' },
  { test: /job|emploi|service/, icon: Briefcase, key: 'catNavJobs' },
  { test: /baby|b[ée]b[ée]|enfant/, icon: Baby, label: 'Bébé & Enfant' },
  { test: /pet|animau/, icon: PawPrint, label: 'Animaux' },
  { test: /art|collection|antiquit/, icon: Palette, label: 'Art' },
];

function matchCategory(category) {
  const key = String(category || '').toLowerCase();
  return CATEGORY_MATCHERS.find((c) => c.test.test(key)) || null;
}

function formatAmount(price) {
  const n = parseFloat(price);
  if (!Number.isFinite(n)) return String(price);
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
}

/**
 * Marketplace listing card: photo, category + favourite, condition, title,
 * price in TND, location/time and seller. The seller check mark is shown
 * only when the listing's seller data says the account is verified
 * (`seller.verified`, set at publish time for phone-verified accounts).
 */
export default function ListingCard({ product, onNegotiate, eager = false }) {
  const { t, lang, formatPrice } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();
  const [favBusy, setFavBusy] = useState(false);
  const [favPulse, setFavPulse] = useState(0);

  const activeFav = isWishlisted(product?.id);
  const locationName = product?.seller?.location || product?.location || t('pcDefaultLocation');
  const sellerName = product?.seller?.name || product?.sellerName || t('pcDefaultSeller');
  const sellerFirstName = sellerName.split(' ')[0];
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const sellerId = product?.seller?.id || product?.sellerId || null;
  const sellerVerified = product?.seller?.verified === true;
  const category = matchCategory(product?.category);
  const CategoryIcon = category?.icon || Tag;
  const categoryLabel = category
    ? (category.key && (product.category.length <= 12 || lang === 'ar') ? t(category.key) : (category.label || product.category))
    : (product?.category || t('heroDefaultCategory'));
  const publishedLabel = timeAgo(product?.createdAt?.seconds, t);
  const priceInfo = getPriceInfo(product);
  const currency = lang === 'ar' ? 'د.ت' : 'TND';

  const rawImage = product?.image || product?.images?.[0] || FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(
    rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage : FALLBACK_IMAGE
  );

  useEffect(() => {
    let isMounted = true;
    if (rawImage && !rawImage.startsWith('/') && (rawImage.startsWith('gs://') || !rawImage.startsWith('http'))) {
      resolveFirebaseImageUrl(rawImage).then(url => {
        if (isMounted && url) setImageSrc(url);
      });
    } else {
      setImageSrc(rawImage);
    }
    return () => { isMounted = false; };
  }, [rawImage]);

  const href = `/product/${product.id}`;

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    router.push(href);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (favBusy) return;
    setFavBusy(true);
    setFavPulse((n) => n + 1);
    try {
      const { added } = await toggleWishlist(product);
      showToast(added ? t('favAdded') : t('favRemoved'));
    } catch {
      showToast(t('favError'), 'error');
    } finally {
      setFavBusy(false);
    }
  };

  const hasMentions = product.isImported || product.allowTrade || product.availability === 'on_order';

  return (
    <motion.article
      onClick={handleCardClick}
      whileHover={{ y: -4 }}
      transition={{ duration: DURATION.micro, ease: EASE_OUT }}
      className="relative h-full bg-white rounded-card overflow-hidden group flex flex-col cursor-pointer border border-[#163300]/[0.07] shadow-card hover:shadow-card-hover transition-shadow duration-200"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full bg-brand-mint overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.title || ''}
          fill
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setImageSrc(FALLBACK_IMAGE)}
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />

        {/* Top-start badges: sponsored (admin-chosen) + discount / custom tag / category */}
        <div className="absolute top-2 start-2 sm:top-2.5 sm:start-2.5 flex flex-col items-start gap-1 max-w-[70%]">
          {product.isSponsored && (
            <span className="bg-[#ffc091] text-[#4a1b0c] font-bold text-[10px] sm:text-[11px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Megaphone className="w-3 h-3 shrink-0" />
              <span className="truncate">{t('heroFeaturedBadge')}</span>
            </span>
          )}
          {product.discountBadge ? (
            <span className="bg-brand-forest text-brand-lime font-bold text-[10px] sm:text-[11px] px-2 py-1 rounded-full truncate max-w-full">
              {product.discountBadge}
            </span>
          ) : product.tag ? (
            <span className="bg-brand-forest text-white font-bold text-[10px] sm:text-[11px] px-2 py-1 rounded-full truncate max-w-full">
              {product.tag}
            </span>
          ) : (
            <span className="bg-white/95 text-[#163300] font-bold text-[10px] sm:text-[11px] px-2 py-1 rounded-full flex items-center gap-1 max-w-full shadow-sm">
              <CategoryIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">{categoryLabel}</span>
            </span>
          )}
        </div>

        {/* Favourite */}
        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={activeFav}
          aria-label={activeFav ? t('pcRemoveFav') : t('pcAddFav')}
          className={`tap-target absolute top-2 end-2 sm:top-2.5 sm:end-2.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full shadow-sm transition-colors duration-200 cursor-pointer ${
            activeFav ? 'bg-brand-lime text-[#163300]' : 'bg-white/95 text-[#163300] hover:bg-brand-mint'
          }`}
        >
          <motion.span
            key={favPulse}
            initial={favPulse ? { scale: 0.55 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 520, damping: 14 }}
            className="flex"
          >
            <Heart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${activeFav ? 'fill-[#163300]' : ''}`} />
          </motion.span>
        </button>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col gap-1.5 sm:gap-2">
        <div className="space-y-0.5">
          {product.condition && (
            <p className="text-[9.5px] sm:text-[11px] font-extrabold text-brand-moss uppercase tracking-wider truncate">
              {product.condition}
            </p>
          )}
          <h3 className="text-[13px] sm:text-[15px] font-heading font-extrabold text-[#0e0f0c] line-clamp-2 leading-snug">
            <Link href={href} className="rounded">
              {product.title}
            </Link>
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap">
          {priceInfo.isFree ? (
            <span className="text-sm sm:text-lg font-black text-[#163300] bg-brand-mint px-2 py-0.5 rounded-lg">
              {formatPrice(0)}
            </span>
          ) : priceInfo.hasAmount ? (
            <span className="flex items-baseline gap-1 min-w-0">
              <span className="text-base sm:text-[22px] font-black text-[#0e0f0c] leading-none tabular-nums truncate">{formatAmount(product.price)}</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#5c6657] shrink-0">{currency}</span>
            </span>
          ) : null}
          {priceInfo.isFixed && !priceInfo.isFree && (
            <span className="text-[9.5px] sm:text-[11px] font-bold text-[#163300] bg-brand-mint px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              {t('badgeFixedPrice')}
            </span>
          )}
          {priceInfo.isNegotiable && (
            <span className="text-[9.5px] sm:text-[11px] font-bold text-[#163300] bg-brand-mint px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              {t('negotiable')}
            </span>
          )}
        </div>

        {hasMentions && (
          <div className="flex flex-wrap items-center gap-1">
            {product.isImported && (
              <span className="text-[9.5px] sm:text-[11px] font-bold text-[#163300] bg-[#eef1ec] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Plane className="w-3 h-3 shrink-0" /> {t('badgeImported')}
              </span>
            )}
            {product.allowTrade && (
              <span className="text-[9.5px] sm:text-[11px] font-bold text-[#163300] bg-[#eef1ec] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Repeat className="w-3 h-3 shrink-0" /> {t('badgeTrade')}
              </span>
            )}
            {product.availability === 'on_order' && (
              <span className="text-[9.5px] sm:text-[11px] font-bold text-[#8a4d00] bg-[#fff5da] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Package className="w-3 h-3 shrink-0" /> {t('badgeOnOrder')}
              </span>
            )}
          </div>
        )}

        {/* Location & time */}
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-[#5c6657] font-medium">
          <span className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{locationName.split(',')[0]}</span>
          </span>
          {publishedLabel && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{publishedLabel}</span>
            </span>
          )}
        </div>

        {/* Seller + contact */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[#163300]/[0.07]">
          {(() => {
            const inner = (
              <>
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-mint text-[#163300] font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0">
                  {sellerInitial}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0e0f0c] truncate">{sellerFirstName}</span>
                {sellerVerified && (
                  <span
                    className="w-4 h-4 rounded-full bg-brand-forest flex items-center justify-center shrink-0"
                    role="img"
                    aria-label={t('verifiedSeller')}
                    title={t('verifiedSeller')}
                  >
                    <Check className="w-2.5 h-2.5 text-brand-lime" strokeWidth={3.5} />
                  </span>
                )}
              </>
            );
            return sellerId ? (
              <Link href={`/seller/${sellerId}`} className="flex items-center gap-1.5 min-w-0 min-h-9 rounded-full hover:opacity-80 transition-opacity">
                {inner}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 min-w-0 min-h-9">{inner}</span>
            );
          })()}

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={{ duration: DURATION.micro }}
            onClick={(e) => {
              e.stopPropagation();
              if (onNegotiate) onNegotiate(product);
              else router.push(`/chat?productId=${product.id}`);
            }}
            aria-label={`${t('discussBtn')} — ${sellerFirstName}`}
            title={t('discussBtn')}
            className="tap-target relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-lime hover:bg-brand-lime-hover text-[#163300] flex items-center justify-center transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.25} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

// Placeholder with the exact footprint of a ListingCard (no layout shift).
export function ListingCardSkeleton() {
  return (
    <div aria-hidden="true" className="h-full bg-white rounded-card overflow-hidden border border-[#163300]/[0.07] shadow-card flex flex-col">
      <div className="aspect-[4/3] w-full skeleton" />
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col gap-2">
        <div className="h-2.5 w-1/3 rounded-full skeleton" />
        <div className="h-3.5 w-11/12 rounded-full skeleton" />
        <div className="h-3.5 w-2/3 rounded-full skeleton" />
        <div className="h-5 w-1/2 rounded-full skeleton" />
        <div className="h-2.5 w-3/4 rounded-full skeleton" />
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#163300]/[0.07]">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full skeleton" />
            <div className="h-3 w-12 rounded-full skeleton" />
          </div>
          <div className="w-9 h-9 rounded-full skeleton" />
        </div>
      </div>
    </div>
  );
}
