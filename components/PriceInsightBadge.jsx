"use client";
import React from 'react';
import { TrendingDown, Equal, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const LEVELS = {
  low: { key: 'priceInsightLow', cls: 'bg-[#e2f6d5] text-[#054d28]', Icon: TrendingDown },
  fair: { key: 'priceInsightFair', cls: 'bg-[#e8ebe6] text-[#0e0f0c]', Icon: Equal },
  high: { key: 'priceInsightHigh', cls: 'bg-[#fff0df] text-[#8a4d00]', Icon: TrendingUp },
};

/**
 * "Bon prix / Prix correct / Au-dessus du marché", with what it rests on. The
 * basis is shown on purpose: a verdict with no visible evidence reads as an
 * opinion, and "12 annonces similaires" is what lets a buyer judge it.
 */
export default function PriceInsightBadge({ insight, className = '' }) {
  const { t, formatPrice } = useLanguage();
  if (!insight || insight.status !== 'ok') return null;
  const { key, cls, Icon } = LEVELS[insight.level] || LEVELS.fair;
  return (
    <div className={className}>
      <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full ${cls}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        {t(key)}
      </span>
      <p className="text-[11px] text-[#868685] mt-1">
        {t('priceInsightBasis', { median: formatPrice(insight.median), n: insight.n })}
      </p>
    </div>
  );
}
