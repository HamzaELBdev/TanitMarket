"use client";
import React from 'react';
import { TrendingDown, Minus, TrendingUp } from 'lucide-react';

const STYLES = {
  good: { Icon: TrendingDown, cls: 'text-[#2f5711] bg-[#e2f6d5]' },
  market: { Icon: Minus, cls: 'text-[#0e0f0c] bg-[#e8ebe6]' },
  high: { Icon: TrendingUp, cls: 'text-[#a72027] bg-[#FFEDE8]' },
};

/** `labels` = { good, market, high, hint(insight) } so FR/AR callers own the wording. */
export default function PriceInsightBadge({ insight, labels }) {
  if (!insight) return null;
  const { Icon, cls } = STYLES[insight.level];
  return (
    <span title={labels.hint(insight)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {labels[insight.level]}
    </span>
  );
}
