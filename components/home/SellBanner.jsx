"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlusCircle, Package, Lamp, Camera, Sprout } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fadeUp, REVEAL_VIEWPORT, DURATION } from '@/lib/design';

// Small decorative "things to sell" cluster (icons only, aria-hidden).
function Illustration() {
  return (
    <div aria-hidden="true" className="relative w-[120px] h-[84px] sm:w-[150px] sm:h-[100px] shrink-0">
      <span className="absolute bottom-0 start-4 w-[76px] h-[58px] sm:w-[92px] sm:h-[68px] rounded-xl bg-[#d9b27c] border-2 border-[#163300]/15 flex items-center justify-center shadow-card">
        <Package className="w-8 h-8 sm:w-9 sm:h-9 text-[#5b3b12]" strokeWidth={1.6} />
      </span>
      <span className="absolute top-0 start-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center shadow-card -rotate-6">
        <Sprout className="w-5 h-5 text-brand-moss" />
      </span>
      <span className="absolute top-1 end-3 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center shadow-card rotate-6">
        <Lamp className="w-5 h-5 text-[#163300]" />
      </span>
      <span className="absolute bottom-3 end-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-forest flex items-center justify-center shadow-card">
        <Camera className="w-[18px] h-[18px] text-brand-lime" />
      </span>
    </div>
  );
}

export default function SellBanner() {
  const { t } = useLanguage();

  return (
    <motion.section
      aria-labelledby="sell-banner-title"
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      variants={fadeUp}
      className="relative overflow-hidden bg-brand-mint rounded-panel px-5 py-5 sm:px-8 sm:py-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-8"
    >
      <Illustration />
      <div className="flex-1 space-y-1 text-center lg:text-start">
        <h2 id="sell-banner-title" className="text-lg sm:text-2xl font-heading font-black text-[#163300]">
          {t('sellBannerTitle1')} {t('sellBannerTitle2')}
        </h2>
        <p className="text-sm text-[#4b5745]">{t('sellBannerSub')}</p>
      </div>
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: DURATION.micro }} className="shrink-0 w-full sm:w-auto">
        <Link
          href="/create-listing"
          className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] bg-brand-forest hover:bg-brand-forest-hover text-white font-extrabold text-sm sm:text-base px-7 rounded-full shadow-card transition-colors"
        >
          <PlusCircle className="w-5 h-5 text-brand-lime" /> {t('postListingCta')}
        </Link>
      </motion.div>
    </motion.section>
  );
}
