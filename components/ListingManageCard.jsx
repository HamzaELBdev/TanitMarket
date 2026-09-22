"use client";
import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Edit3, MoreHorizontal } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getPriceInfo } from '@/lib/priceInfo';

const FALLBACK_IMAGE = '/images/product-placeholder.svg';

/**
 * A single "Mes Annonces" row: thumbnail + title/status/price, with
 * Modifier / Voir / ••• actions below. The ••• button opens the quick-view
 * modal, which also holds the destructive Supprimer action — kept out of
 * this row so a stray tap can't delete a listing. Pure presentation — all
 * data mutations happen in the parent.
 */
export default function ListingManageCard({ item, formatPrice, onQuickView }) {
  const prefersReducedMotion = useReducedMotion();
  const isRejected = item.status === 'rejected' || item.status === 'Rejetée';
  const priceInfo = getPriceInfo(item);

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-2xl border border-[#e8ebe6] shadow-sm hover:shadow-md transition-shadow duration-300 group p-3 sm:p-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Thumbnail */}
        <Link
          href={`/product/${item.id}`}
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#e8ebe6] shrink-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c]"
        >
          <img
            src={item.image || item.images?.[0] || FALLBACK_IMAGE}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Title, status, price */}
        <div className="flex-1 min-w-0">
          <Link href={`/product/${item.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c] rounded w-fit max-w-full">
            <h4 className="font-bold text-sm sm:text-base text-[#0e0f0c] line-clamp-1 sm:line-clamp-2 leading-snug group-hover:text-[#454745] transition">
              {item.title}
            </h4>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatusBadge status={item.status} />
            <span className="font-black text-sm sm:text-base text-[#0e0f0c]">
              {priceInfo.isFree || priceInfo.hasAmount ? formatPrice(priceInfo.isFree ? 0 : item.price) : 'Prix à négocier'}
            </span>
          </div>

          {isRejected && item.rejectionReason && (
            <div className="hidden sm:block text-[11px] text-[#a72027] bg-[#FFEDE8] border border-[#a72027]/20 rounded-lg p-2 font-medium mt-2 max-w-md">
              <span className="font-extrabold">Motif du refus :</span> {item.rejectionReason}
            </div>
          )}
        </div>

      </div>

      {isRejected && item.rejectionReason && (
        <div className="text-[11px] text-[#a72027] bg-[#FFEDE8] border border-[#a72027]/20 rounded-lg p-2 font-medium mt-3">
          <span className="font-extrabold">Motif du refus :</span> {item.rejectionReason}
        </div>
      )}

      {/* Actions: Modifier / Voir / ••• (quick view + delete) */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e8ebe6]">
        <Link
          href={`/create-listing?editId=${item.id}`}
          title="Modifier l'annonce"
          aria-label="Modifier l'annonce"
          className="flex-1 min-h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#0e0f0c] bg-[#e2f6d5] hover:bg-[#9FE870] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c]"
        >
          <Edit3 className="w-3.5 h-3.5" /> Modifier
        </Link>
        <Link
          href={`/product/${item.id}`}
          title="Voir l'annonce"
          className="flex-1 min-h-11 flex items-center justify-center gap-1.5 text-xs font-bold text-[#0e0f0c] bg-white border border-[#e8ebe6] hover:bg-[#e8ebe6] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c]"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Voir
        </Link>
        <button
          onClick={() => onQuickView(item)}
          title="Plus d'options"
          aria-label="Plus d'options (aperçu, supprimer)"
          className="shrink-0 min-h-11 min-w-11 flex items-center justify-center text-[#0e0f0c] bg-[#e8ebe6] hover:bg-[#e2f6d5] rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c]"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
