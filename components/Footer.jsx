"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, Heart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import TunisiaFlag from '@/components/TunisiaFlag';

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Hide footer on focused app screens
  const isExcludedPage = ['/chat', '/auth', '/dash', '/create-listing'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isExcludedPage) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="hidden md:block bg-[#0e0f0c] text-[#e8ebe6] mt-12 sm:mt-16 font-body">

      {/* 1. Back to Top Strip */}
      <div className="max-w-[1380px] mx-auto px-4 pt-6 pb-2 flex justify-center border-b border-white/10">
        <button
          onClick={scrollToTop}
          className="bg-white/10 text-white border-none hover:bg-[#9fe870] hover:text-[#0e0f0c] text-xs font-semibold py-2 px-5 rounded-full transition cursor-pointer flex items-center gap-2"
          aria-label={t('footerBackToTop')}
        >
          <span>{t('footerBackToTop')}</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Main Footer Sitemap */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">

        {/* Brand Column */}
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              <img src="/logoBg.png" alt="TanitMarket Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-heading font-black text-white flex items-center gap-1.5">
              <span>TanitMarket</span>
              <TunisiaFlag className="w-5 h-3.5 rounded-[2px] inline-block align-middle" />
            </span>
          </Link>
          <p className="text-xs text-[#e8ebe6]/80 leading-relaxed">
            {t('footerTagline')}
          </p>
          <p className="text-[11px] text-[#e8ebe6]/60">
            {t('footerDesc')}
          </p>
        </div>

        {/* Navigation Column */}
        <div>
          <h4 className="font-heading font-bold text-base text-[#9fe870] mb-3">{t('footerNavHeading')}</h4>
          <ul className="space-y-2 text-xs text-[#e8ebe6]/80">
            <li><Link href="#explore" className="hover:text-white transition">{t('footerNavExplore')}</Link></li>
            <li><Link href="/create-listing" className="text-[#9fe870] font-semibold hover:underline transition">{t('footerNavSell')}</Link></li>
            <li><Link href="#explore?cat=electronics" className="hover:text-white transition">{t('footerNavElectronics')}</Link></li>
            <li><Link href="#explore?cat=vehicles" className="hover:text-white transition">{t('footerNavVehicles')}</Link></li>
            <li><Link href="#explore?cat=realestate" className="hover:text-white transition">{t('footerNavRealestate')}</Link></li>
          </ul>
        </div>

        {/* Account & Safety Column */}
        <div>
          <h4 className="font-heading font-bold text-base text-[#9fe870] mb-3">{t('footerAccountHeading')}</h4>
          <ul className="space-y-2 text-xs text-[#e8ebe6]/80">
            <li><Link href="/profile" className="hover:text-white transition">{t('footerAccountProfile')}</Link></li>
            <li><Link href="/chat" className="hover:text-white transition">{t('footerAccountChat')}</Link></li>
            <li><Link href="/favoris" className="hover:text-white transition">{t('footerAccountFavorites')}</Link></li>
            <li><Link href="/auth" className="hover:text-white transition">{t('footerAccountAuth')}</Link></li>
            <li><Link href="/dash" className="hover:text-white transition">{t('footerAccountAdmin')}</Link></li>
          </ul>
        </div>

        {/* Regions & Local Information */}
        <div>
          <h4 className="font-heading font-bold text-base text-[#9fe870] mb-3">{t('footerRegionsHeading')}</h4>
          <p className="text-xs text-[#e8ebe6]/80 leading-relaxed mb-3">
            {t('footerRegionsDesc')}
          </p>
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-[11px] text-[#9fe870]">
            <Heart className="w-3.5 h-3.5 fill-[#9fe870]" />
            <span>{t('footerMadeForTunisia')}</span>
          </div>
        </div>

      </div>

      {/* 3. Legal & Credits Bar */}
      <div className="py-6 text-center text-xs text-[#e8ebe6]/60 border-t border-white/10">
        <div className="max-w-[1380px] mx-auto px-4 space-y-2">
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="hover:text-white">{t('footerTerms')}</a>
            <a href="#" className="hover:text-white">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-white">{t('footerLegal')}</a>
            <a href="#" className="hover:text-white">{t('footerCredits')}</a>
          </div>
          <div className="pt-2 text-[11px] flex items-center justify-center gap-1.5 flex-wrap">
            <span>© 2026, TanitMarket</span>
            <TunisiaFlag className="w-4 h-2.5 rounded-[1.5px] inline-block align-middle" />
            <span>{t('footerBottomNote')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
