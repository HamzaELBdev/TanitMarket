"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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

  return (
    <footer className="hidden md:block bg-white border-t border-[#0e0f0c]/8 mt-12 sm:mt-16 font-body">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="text-base font-heading font-black text-[#0e0f0c]">
          Tanit<span className="text-[#163300]">Market</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#454745]">
          <Link href="/#explore" className="hover:text-[#0e0f0c] transition">À propos</Link>
          <Link href="/#explore" className="hover:text-[#0e0f0c] transition">Aide</Link>
          <a href="#" className="hover:text-[#0e0f0c] transition">{t('footerPrivacy')}</a>
          <a href="#" className="hover:text-[#0e0f0c] transition">{t('footerTerms')}</a>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#454745] bg-[#f4f6f2] px-3 py-1.5 rounded-full shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          <span>Tunisie · Français · TND</span>
        </div>
      </div>
    </footer>
  );
}
