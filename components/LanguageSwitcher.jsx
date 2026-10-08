"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import TunisiaFlag from '@/components/TunisiaFlag';
import FranceFlag from '@/components/FranceFlag';

const LANGS = {
  fr: { name: 'Français', Flag: FranceFlag },
  ar: { name: 'العربية', Flag: TunisiaFlag },
};

// One flag: the current language's (France for French, Tunisia for Arabic).
// Clicking it switches to the other language. The flag carries no text, so the
// accessible label names the language the click leads to. `tone="dark"` is for
// the dark footer.
export default function LanguageSwitcher({ className = '', tone = 'light' }) {
  const { lang, setLang, t } = useLanguage();
  const current = LANGS[lang] || LANGS.fr;
  const nextId = lang === 'ar' ? 'fr' : 'ar';
  const next = LANGS[nextId];
  const { Flag } = current;

  return (
    <button
      type="button"
      onClick={() => setLang(nextId)}
      aria-label={`${t('languageLabel')} : ${next.name}`}
      title={next.name}
      dir="ltr"
      className={`h-11 min-w-11 flex items-center justify-center rounded-full cursor-pointer transition-transform duration-200 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 ${tone === 'dark' ? 'focus-visible:ring-brand-lime' : 'focus-visible:ring-brand-moss'} ${className}`}
    >
      <Flag className="w-7 h-[18px] rounded-[3px] shrink-0 ring-1 ring-black/10" />
    </button>
  );
}
