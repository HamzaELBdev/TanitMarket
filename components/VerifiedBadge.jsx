"use client";
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

// 3D "verified account" badge. `size` is the rendered width/height in px; the
// 160px source stays crisp up to ~80px on high-density screens.
export default function VerifiedBadge({ size = 18, className = '' }) {
  const { t } = useLanguage();
  const label = t('verifiedSeller');
  return (
    <Image
      src="/images/verified-badge.webp"
      alt={label}
      title={label}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
    />
  );
}
