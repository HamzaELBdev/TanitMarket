"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

const LANGS = [
  { id: 'fr', label: 'FR', name: 'Français' },
  { id: 'ar', label: 'AR', name: 'العربية' },
];

// "FR | AR" segmented toggle. Each option is its own button (aria-pressed) so
// the current language is announced and either one can be picked directly.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('languageLabel')}
      className={`flex items-center h-11 text-xs font-bold text-[#5c6657] ${className}`}
    >
      {LANGS.map((l, i) => (
        <React.Fragment key={l.id}>
          {i > 0 && <span aria-hidden="true" className="w-px h-3.5 bg-[#163300]/20" />}
          <button
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={lang === l.id}
            lang={l.id}
            title={l.name}
            className={`h-11 min-w-9 px-2 rounded-full transition-colors duration-200 cursor-pointer ${
              lang === l.id ? 'text-[#163300]' : 'hover:text-[#163300]'
            }`}
          >
            <span className={lang === l.id ? 'border-b-2 border-brand-lime pb-0.5' : ''}>{l.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
