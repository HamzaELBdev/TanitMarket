"use client";
import { useLanguage } from '@/context/LanguageContext';

const LANGS = [
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'ar', label: 'AR', name: 'العربية' },
];

/** FR | AR toggle. Switching language only re-labels the page — typed values stay. */
export default function AuthLanguageSwitch({ tone = 'light' }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div role="group" aria-label={t('authLangLabel')} className="flex items-center" dir="ltr">
      {LANGS.map((l, i) => {
        const active = lang === l.code;
        return (
          <span key={l.code} className="flex items-center">
            {i > 0 ? <span className={`h-4 w-px ${tone === 'dark' ? 'bg-white/30' : 'bg-[#cfd6c9]'}`} aria-hidden="true" /> : null}
            <button
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={active}
              lang={l.code}
              title={l.name}
              className={`min-w-11 h-11 px-2.5 text-sm font-bold rounded-full cursor-pointer transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss
                ${active ? 'text-brand-forest' : 'text-[#8a9185] hover:text-brand-forest'}`}
            >
              <span className="sr-only">{l.name}</span>
              <span aria-hidden="true">{l.label}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
