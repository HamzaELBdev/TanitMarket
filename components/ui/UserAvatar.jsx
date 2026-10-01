"use client";
import React, { useState, useRef, useEffect } from 'react';
import { initialOf } from '@/lib/avatar';

/**
 * The round photo of a person, used everywhere someone is shown: listing
 * cards, listing detail, seller profile, chat, reviews, the admin dashboard.
 *
 * A photo URL can be broken — a deleted Storage object, an expired social
 * provider URL, a listing whose denormalized `seller.avatar` points at
 * something gone. When the image fails to load the component falls back to
 * the member's initial rather than leaving a broken-image icon, which is why
 * every call site goes through here instead of a bare <img>.
 */

const SIZES = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-xs sm:text-sm' },
  md: { box: 'w-9 h-9', text: 'text-xs' },
  lg: { box: 'w-10 h-10', text: 'text-sm' },
  xl: { box: 'w-12 h-12', text: 'text-base' },
  '2xl': { box: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-2xl sm:text-3xl' },
};

const TONES = {
  mint: 'bg-brand-mint text-[#163300]',
  forest: 'bg-[#0e0f0c] text-[#9FE870]',
  violet: 'bg-[#5b3fc4] text-white',
  pale: 'bg-[#e2f6d5] text-[#163300]',
};

export default function UserAvatar({
  src,
  name,
  email,
  size = 'md',
  tone = 'mint',
  ring = false,
  className = '',
  title,
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // The image can finish loading — or fail — before React hydrates and
  // attaches onError, in which case the handler never runs and the viewer is
  // left with a broken-image icon. On mount, ask the element directly: a
  // complete image with no intrinsic width did not load.
  //
  // This check is why the <img> below is not `loading="lazy"`: Chromium
  // reports a deferred lazy image as complete with naturalWidth 0 until it
  // scrolls into view, which is indistinguishable from a real failure. An
  // avatar is at most 96px, so eager loading costs almost nothing.
  useEffect(() => {
    setFailed(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  const s = SIZES[size] || SIZES.md;
  const initial = initialOf(name, email);
  const showPhoto = Boolean(src) && !failed;

  return (
    <span
      title={title}
      className={`relative ${s.box} rounded-full overflow-hidden shrink-0 flex items-center justify-center font-extrabold ${TONES[tone] || TONES.mint} ${
        ring ? 'border-2 border-[#9fe870]' : ''
      } ${s.text} ${className}`}
    >
      {showPhoto ? (
        <img
          ref={imgRef}
          src={src}
          alt={name ? `${name}` : ''}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
