"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MapPin, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { resolveFirebaseImageUrl } from '@/lib/firestoreService';

export default function ProductCard({ product, onNegotiate }) {
  const { t, formatPrice } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();

  const activeFav = isWishlisted(product?.id);
  const locationName = product?.seller?.location || product?.location || t('pcDefaultLocation');
  const sellerName = product?.seller?.name || product?.sellerName || t('pcDefaultSeller');
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const sellerId = product?.seller?.id || product?.sellerId || null;

  const rawImage = product?.image || product?.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80';
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

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#ffffff] rounded-xl p-2.5 sm:p-4 group flex flex-col justify-between relative cursor-pointer font-body transition-colors hover:bg-[#e2f6d5]"
    >
      <div>
        {/* Image Container */}
        <div className="relative aspect-[1.2] w-full rounded-lg overflow-hidden bg-[#e8ebe6] mb-2 sm:mb-3 flex items-center justify-center p-1.5 sm:p-2">
          <img
            src={imageSrc}
            alt={product.title}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80';
            }}
            className="max-h-full max-w-full object-cover rounded-md group-hover:scale-[1.045] transition-transform duration-300"
          />

          {/* Badges Top Left (À la une / Bon plan / Nouvelle) */}
          {product.discountBadge ? (
            <span className="absolute top-2 left-2 bg-[#0e0f0c] text-[#9fe870] font-semibold text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-[70%]">
              {product.discountBadge}
            </span>
          ) : product.tag ? (
            <span className="absolute top-2 left-2 bg-[#0e0f0c] text-white font-semibold text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-[70%]">
              {product.tag}
            </span>
          ) : (
            <span className="absolute top-2 left-2 bg-[#ffffff] text-[#0e0f0c] font-semibold text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full truncate max-w-[70%]">
              {product.category || t('heroDefaultCategory')}
            </span>
          )}

          {/* Heart Wishlist Overlay Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={activeFav ? t('pcRemoveFav') : t('pcAddFav')}
            className={`absolute top-2 right-2 p-1.5 sm:p-2 rounded-full transition active:scale-90 z-10 ${
              activeFav
                ? 'bg-[#9fe870] text-[#0e0f0c]'
                : 'bg-white/90 text-[#0e0f0c] hover:bg-[#9fe870]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeFav ? 'fill-[#0e0f0c] text-[#0e0f0c]' : 'text-[#0e0f0c]'}`} />
          </button>
        </div>

        {/* Object Condition Label in Small Caps */}
        <div className="text-[9px] sm:text-[10px] font-semibold text-[#868685] uppercase tracking-wider mb-0.5 sm:mb-1">
          {product.condition || t('pcDefaultCondition')}
        </div>

        {/* Title */}
        <Link href={`/product/${product.id}`} className="block focus:outline-none">
          <h3 className="text-xs sm:text-[15px] font-medium text-[#0e0f0c] line-clamp-1 transition mb-1 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1 my-1">
          {product.isFree || product.price === 0 || product.price === '0' || product.priceType === 'free' ? (
            <span className="text-sm sm:text-base font-bold text-[#0e0f0c] bg-[#e2f6d5] px-2 py-0.5 rounded-md">
              {formatPrice(0)}
            </span>
          ) : (
            <span className="text-base sm:text-[19px] font-bold text-[#0e0f0c]">
              {product.price} <span className="text-[10px] sm:text-xs font-semibold text-[#868685]">TND</span>
            </span>
          )}
          {product.originalPrice && !product.isFree && product.price !== 0 && product.price !== '0' && (
            <span className="text-[10px] sm:text-xs text-[#868685] line-through hidden sm:inline">
              {product.originalPrice} TND
            </span>
          )}
        </div>

        {/* Location & Time Metadata */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#868685] font-medium pt-0.5">
          <div className="flex items-center gap-1 truncate max-w-[70%]">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0e0f0c] flex-shrink-0" />
            <span className="truncate">{locationName.split(',')[0]}</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#868685]">{t('twoHoursAgo')}</span>
        </div>
      </div>

      {/* Seller Divider Bar */}
      <div className="pt-2 mt-2 border-t border-[#0e0f0c]/10 flex items-center justify-between">
        {sellerId ? (
          <Link
            href={`/seller/${sellerId}`}
            className="flex items-center gap-1.5 min-w-0 hover:underline"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-semibold text-[9px] sm:text-[10px] flex items-center justify-center flex-shrink-0">
              {sellerInitial}
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-[#454745] truncate max-w-[65px] sm:max-w-[100px]">
              {sellerName.split(' ')[0]}
            </span>
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2ead4b] flex-shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#e2f6d5] text-[#0e0f0c] font-semibold text-[9px] sm:text-[10px] flex items-center justify-center flex-shrink-0">
              {sellerInitial}
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-[#454745] truncate max-w-[65px] sm:max-w-[100px]">
              {sellerName.split(' ')[0]}
            </span>
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2ead4b] flex-shrink-0" />
          </div>
        )}

        {/* Action button */}
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
          className="text-[10px] sm:text-[11px] font-semibold text-[#0e0f0c] hover:underline cursor-pointer flex-shrink-0"
        >
          {t('discussBtn')}
        </button>
      </div>
    </div>
  );
}
