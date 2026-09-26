"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PenLine, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { StatusBadge } from '@/components/account/ui';
import ListingActionsMenu from '@/components/account/ListingActionsMenu';
import { getPriceInfo } from '@/lib/priceInfo';
import { normalizeStatus } from '@/lib/services/listingsService';
import { DURATION, EASE_OUT, staggerDelay } from '@/lib/design';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

function useListingView(item) {
  const { t, lang, formatPrice } = useLanguage();
  const p = getPriceInfo(item);
  let price;
  if (p.isFree) price = formatPrice(0);
  else if (p.hasAmount) price = `${p.amount.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} ${lang === 'ar' ? 'د.ت' : 'TND'}`;
  else price = t('mlNegotiable');
  const raw = item.image || item.images?.[0];
  const src = raw && (raw.startsWith('http') || raw.startsWith('/')) ? raw : FALLBACK_IMAGE;
  const rejected = normalizeStatus(item.status) === 'rejected' && item.rejectionReason;
  return { t, price, src, rejected };
}

function Thumb({ src, className, eager }) {
  const [s, setS] = useState(src);
  return (
    <span className={`relative block overflow-hidden rounded-xl bg-brand-mint shrink-0 ${className}`}>
      <Image src={s} alt="" fill sizes="96px" loading={eager ? 'eager' : 'lazy'} className="object-cover" onError={() => setS(FALLBACK_IMAGE)} />
    </span>
  );
}

// Shared list-item motion: short stagger for the first items only, fade on
// removal, layout transition when filters/sort re-order the list.
const itemMotion = (index) => ({
  layout: 'position',
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.section, ease: EASE_OUT, delay: staggerDelay(index) } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.micro } },
  transition: { layout: { duration: DURATION.panel, ease: EASE_OUT } },
});

const btnEdit = 'inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-brand-mint hover:bg-[#dff2d3] text-[#163300] text-sm font-bold transition-colors active:scale-[0.98]';
const btnView = 'inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl border border-[#163300]/15 bg-white hover:bg-[#f3f7ef] text-[#163300] text-sm font-bold transition-colors active:scale-[0.98]';

/** Desktop row (md+): photo + title | status | price | actions. */
export function ListingRow({ item, index, busy, onPreview, onDelete }) {
  const { t, price, src, rejected } = useListingView(item);
  return (
    <motion.div
      role="row"
      {...itemMotion(index)}
      aria-busy={busy || undefined}
      className={`grid grid-cols-[minmax(0,1fr)_150px_120px_auto] xl:grid-cols-[minmax(0,1fr)_170px_140px_auto] items-center gap-4 px-4 py-3 border-t border-[#163300]/[0.07] first:border-t-0 hover:bg-[#fafcf8] transition-[opacity,background-color] ${busy ? 'opacity-50' : ''}`}
    >
      <div role="cell" className="flex items-center gap-4 min-w-0">
        <Thumb src={src} eager={index < 4} className="w-[72px] h-[60px]" />
        <div className="min-w-0">
          <Link href={`/product/${item.id}`} className="font-semibold text-[15px] text-[#0e0f0c] hover:underline line-clamp-2 rounded">{item.title}</Link>
          {rejected && <p className="text-xs text-[#a72027] mt-1 line-clamp-1"><strong>{t('mlRejectReason')}</strong> {item.rejectionReason}</p>}
        </div>
      </div>
      <div role="cell"><StatusBadge status={item.status} /></div>
      <div role="cell" className="font-heading font-extrabold text-[#0e0f0c] tabular-nums whitespace-nowrap">{price}</div>
      <div role="cell" className="flex items-center gap-2 justify-end">
        <Link href={`/create-listing?editId=${item.id}`} className={btnEdit} aria-label={`${t('mlEdit')} — ${item.title}`}>
          <PenLine className="w-4 h-4" /> <span className="hidden xl:inline">{t('mlEdit')}</span>
        </Link>
        <Link href={`/product/${item.id}`} className={btnView} aria-label={`${t('mlView')} — ${item.title}`}>
          <ExternalLink className="w-4 h-4" /> <span className="hidden xl:inline">{t('mlView')}</span>
        </Link>
        <ListingActionsMenu item={item} busy={busy} onPreview={onPreview} onDelete={onDelete} />
      </div>
    </motion.div>
  );
}

/** Mobile card (< md). */
export function ListingMobileCard({ item, index, busy, onPreview, onDelete }) {
  const { t, price, src, rejected } = useListingView(item);
  return (
    <motion.li
      {...itemMotion(index)}
      aria-busy={busy || undefined}
      className={`bg-white rounded-card border border-[#163300]/[0.08] shadow-card p-3 transition-opacity ${busy ? 'opacity-50' : ''}`}
    >
      <div className="flex gap-3">
        <Thumb src={src} eager={index < 3} className="w-[84px] h-[84px]" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href={`/product/${item.id}`} className="block font-semibold text-sm text-[#0e0f0c] line-clamp-2 rounded">{item.title}</Link>
          <StatusBadge status={item.status} long />
          <p className="font-heading font-extrabold text-[#0e0f0c] tabular-nums">{price}</p>
        </div>
      </div>
      {rejected && <p className="text-xs text-[#a72027] bg-[#fdecea] rounded-lg p-2 mt-2"><strong>{t('mlRejectReason')}</strong> {item.rejectionReason}</p>}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#163300]/[0.07]">
        <Link href={`/create-listing?editId=${item.id}`} className={`${btnEdit} flex-1`}>
          <PenLine className="w-4 h-4" /> {t('mlEdit')}
        </Link>
        <Link href={`/product/${item.id}`} className={`${btnView} flex-1`}>
          <ExternalLink className="w-4 h-4" /> {t('mlView')}
        </Link>
        <ListingActionsMenu item={item} busy={busy} onPreview={onPreview} onDelete={onDelete} />
      </div>
    </motion.li>
  );
}

export function ListingRowSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_150px_120px_auto] xl:grid-cols-[minmax(0,1fr)_170px_140px_auto] items-center gap-4 px-4 py-3 border-t border-[#163300]/[0.07] first:border-t-0">
      <div className="flex items-center gap-4"><div className="w-[72px] h-[60px] rounded-xl skeleton" /><div className="h-4 w-2/3 rounded-full skeleton" /></div>
      <div className="h-7 w-24 rounded-full skeleton" />
      <div className="h-5 w-20 rounded-full skeleton" />
      <div className="flex gap-2"><div className="w-11 xl:w-28 h-11 rounded-xl skeleton" /><div className="w-11 xl:w-24 h-11 rounded-xl skeleton" /><div className="w-11 h-11 rounded-full skeleton" /></div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white rounded-card border border-[#163300]/[0.08] shadow-card p-3">
      <div className="flex gap-3">
        <div className="w-[84px] h-[84px] rounded-xl skeleton" />
        <div className="flex-1 space-y-2 pt-1"><div className="h-4 w-4/5 rounded-full skeleton" /><div className="h-6 w-2/3 rounded-full skeleton" /><div className="h-5 w-1/3 rounded-full skeleton" /></div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-[#163300]/[0.07]"><div className="flex-1 h-11 rounded-xl skeleton" /><div className="flex-1 h-11 rounded-xl skeleton" /><div className="w-11 h-11 rounded-full skeleton" /></div>
    </div>
  );
}
