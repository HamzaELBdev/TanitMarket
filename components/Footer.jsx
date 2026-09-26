"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  // Hide footer on focused app screens
  const isExcludedPage = ['/chat', '/auth', '/dash', '/create-listing'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isExcludedPage) {
    return null;
  }

  const linkCls = 'text-sm font-semibold text-white/80 hover:text-brand-lime transition-colors rounded focus-ring-light';

  // Hidden below lg: the fixed bottom nav covers navigation on phones/tablets.
  return (
    <footer className="hidden lg:block mt-16 font-body max-w-[1280px] w-full mx-auto px-8 pb-8">
      <div className="bg-brand-forest text-white rounded-panel px-8 py-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 focus-ring-light rounded-lg">
            <span className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
              <Image src="/logoBg.png" alt="" width={32} height={32} className="w-full h-full object-contain" />
            </span>
            <span className="text-lg font-heading font-black">TanitMarket</span>
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <Link href="/#explore" className={linkCls}>{t('footerAbout')}</Link>
            <Link href="/#explore" className={linkCls}>{t('footerHelp')}</Link>
            <a href="#" className={linkCls}>{t('footerPrivacy')}</a>
            <a href="#" className={linkCls}>{t('footerTerms')}</a>
          </nav>
        </div>

        <div className="flex items-center gap-5 text-xs text-white/70">
          <div role="group" aria-label={t('languageLabel')} className="flex items-center gap-1 font-bold">
            {['fr', 'ar'].map((l, i) => (
              <React.Fragment key={l}>
                {i > 0 && <span aria-hidden="true" className="text-white/30">|</span>}
                <button
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`px-1.5 py-1 rounded focus-ring-light cursor-pointer ${lang === l ? 'text-brand-lime' : 'hover:text-white'}`}
                >
                  {l.toUpperCase()}
                </button>
              </React.Fragment>
            ))}
          </div>
          <span>© {new Date().getFullYear()} TanitMarket. {t('footerRights')}</span>
        </div>
      </div>
    </footer>
  );
}
