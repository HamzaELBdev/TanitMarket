"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { TUNISIAN_GOVERNORATES } from '@/lib/mockData';

const ALL_GOV = 'Toute la Tunisie';

// Header search: free-text query + governorate. Navigates to the home page
// with ?search=&gov= — the home listing grid reads those params.
// layout="inline" (desktop: one row) | "stacked" (mobile: two full-width rows).
export default function SearchBar({ layout = 'inline', className = '' }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [gov, setGov] = useState(ALL_GOV);

  const go = (q, g) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('search', q.trim());
    if (g !== ALL_GOV) params.set('gov', g);
    const qs = params.toString();
    router.push(`/${qs ? `?${qs}` : ''}#explore`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    go(query, gov);
  };

  const onGovChange = (e) => {
    setGov(e.target.value);
    go(query, e.target.value);
  };

  const stacked = layout === 'stacked';
  const fieldBase =
    'flex items-center rounded-full border border-[#dfe7d8] bg-white transition-colors duration-200 focus-within:border-brand-forest focus-within:ring-2 focus-within:ring-brand-lime/40';

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`${stacked ? 'flex flex-col gap-2' : 'flex items-center gap-2'} ${className}`}
    >
      <div className={`${fieldBase} h-11 flex-1 min-w-0 ps-1 pe-4`}>
        <button
          type="submit"
          aria-label={t('searchBtn')}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#5c6657] hover:text-brand-forest hover:bg-brand-mint transition-colors cursor-pointer"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
        <input
          type="search"
          enterKeyHint="search"
          aria-label={t('searchPlaceholderTunisia')}
          placeholder={t('searchPlaceholderTunisia')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 text-sm text-[#0e0f0c] placeholder-[#7b8576] bg-transparent focus:outline-none font-medium [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <label className={`${fieldBase} relative h-11 shrink-0 ${stacked ? 'w-full' : 'w-[136px] xl:w-[172px]'}`}>
        <span className="sr-only">{t('locationLabel')}</span>
        <MapPin aria-hidden="true" className="w-4 h-4 text-[#5c6657] absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <select
          value={gov}
          onChange={onGovChange}
          className="w-full h-full ps-10 pe-9 rounded-full bg-transparent text-sm font-semibold text-[#0e0f0c] appearance-none cursor-pointer focus:outline-none truncate"
        >
          {TUNISIAN_GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="w-4 h-4 text-[#5c6657] absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </label>
    </form>
  );
}
