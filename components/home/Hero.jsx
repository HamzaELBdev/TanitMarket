"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, Tag, MapPin, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fadeUp, staggerContainer, DURATION, EASE_OUT } from '@/lib/design';

// Curated brand visuals (local, preloaded) — fixed so the hero never swaps
// images once listings load.
const HERO_IMAGES = [
  { src: '/images/hero-collage-1.webp', alt: '' },
  { src: '/images/hero-collage-3.webp', alt: '' },
  { src: '/images/hero-collage-2.webp', alt: '' },
];

// Decorative drift only on large, hover-capable screens and never under
// prefers-reduced-motion.
function useDecorativeMotion() {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop && !reduce;
}

function Photo({ img, className, sizes, delay, drift, driftDelay = 0 }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE_OUT, delay } },
      }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={drift ? { y: [0, -7, 0] } : { y: 0 }}
        transition={drift ? { duration: 7, ease: 'easeInOut', repeat: Infinity, delay: driftDelay } : { duration: 0 }}
        className="relative w-full h-full rounded-2xl md:rounded-[22px] overflow-hidden border-[3px] md:border-[5px] border-white shadow-float bg-brand-mint"
      >
        <Image src={img.src} alt={img.alt} fill sizes={sizes} preload className="object-cover" />
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  const drift = useDecorativeMotion();

  const features = [
    { icon: MapPin, title: t('heroFeatLocalTitle'), sub: t('heroFeatLocalSub') },
    { icon: ShieldCheck, title: t('heroFeatVerifiedTitle'), sub: t('heroFeatVerifiedSub') },
    { icon: MapIcon, title: t('heroFeatAllTitle'), sub: t('heroFeatAllSub') },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-panel bg-brand-forest md:bg-brand-hero px-4 pt-5 pb-4 sm:px-8 sm:pt-8 md:p-10 lg:px-12 lg:py-12"
    >
      {/* Soft lime glow (desktop light surface) */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 end-[-6rem] w-[26rem] h-[26rem] rounded-full bg-brand-lime/25 blur-3xl hidden md:block" />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.07)}
        className="relative grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-x-3 md:gap-x-8 gap-y-5 md:gap-y-8 items-center"
      >
        {/* Copy */}
        <div className="md:col-span-7 lg:col-span-6 space-y-3 md:space-y-5">
          <motion.h1
            id="hero-title"
            variants={fadeUp}
            className="font-heading font-black text-white md:text-[#163300] text-[25px] leading-[1.1] sm:text-4xl md:text-[44px] lg:text-[54px] md:leading-[1.03] tracking-[-0.02em]"
          >
            <span className="block">{t('heroTitleLine1')}</span>
            <span className="block text-brand-lime md:text-brand-moss">{t('heroTitleLine2')}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-[13px] sm:text-base md:text-lg text-white/80 md:text-[#2f3a28] max-w-md leading-relaxed">
            {t('heroDescShort')}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
            <motion.a
              href="#explore"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: DURATION.micro }}
              className="focus-visible:outline-brand-lime md:focus-visible:outline-brand-forest inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-11 md:min-h-[52px] rounded-full px-3 min-[380px]:px-4 md:px-5 xl:px-6 text-[12.5px] min-[380px]:text-[13px] md:text-[15px] xl:text-base font-extrabold bg-brand-lime text-[#163300] md:bg-brand-forest md:text-white hover:brightness-105 md:hover:bg-brand-forest-hover shadow-card transition-colors"
            >
              <Search className="hidden min-[380px]:block w-4 h-4 md:w-5 md:h-5 shrink-0" strokeWidth={2.5} /> {t('heroExplore')}
            </motion.a>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: DURATION.micro }}>
              <Link
                href="/create-listing"
                className="focus-visible:outline-brand-lime md:focus-visible:outline-brand-forest whitespace-nowrap w-full inline-flex items-center justify-center gap-2 min-h-11 md:min-h-[52px] rounded-full px-3 min-[380px]:px-4 md:px-5 xl:px-6 text-[12.5px] min-[380px]:text-[13px] md:text-[15px] xl:text-base font-extrabold border-[1.5px] border-white/70 text-white md:border-[#163300] md:text-[#163300] hover:bg-white/10 md:hover:bg-white transition-colors"
              >
                <Tag className="hidden min-[380px]:block w-4 h-4 md:w-5 md:h-5 shrink-0" strokeWidth={2.25} /> {t('heroSell')}
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Visual collage */}
        <motion.div
          variants={staggerContainer(0.08, 0.1)}
          aria-hidden="true"
          className="relative md:col-span-5 lg:col-span-6 w-[100px] h-[190px] min-[380px]:w-[112px] sm:w-[170px] sm:h-[240px] md:w-full md:h-[300px] lg:h-[340px] self-start md:self-center"
        >
          {/* sketch accents + lime blob (desktop) */}
          <div className="hidden md:block absolute inset-[8%_6%_4%_10%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-brand-lime/55" />
          <svg className="hidden md:block absolute top-[38%] start-[-4%] w-10 h-16 text-[#163300] rtl:-scale-x-100" viewBox="0 0 40 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M4 8 L30 16" /><path d="M2 32 L32 32" /><path d="M4 56 L30 48" />
          </svg>

          <Photo img={HERO_IMAGES[0]} delay={0.1} drift={drift}
            className="top-0 end-0 w-[88px] h-[100px] min-[380px]:w-[96px] sm:w-[130px] sm:h-[140px] rotate-3 md:end-auto md:start-[6%] md:top-[6%] md:w-[44%] md:h-[62%] md:-rotate-3"
            sizes="(min-width: 768px) 260px, 110px" />
          <Photo img={HERO_IMAGES[1]} delay={0.18} drift={drift} driftDelay={1.2}
            className="hidden md:block md:end-[2%] md:top-0 md:w-[46%] md:h-[56%] md:rotate-3"
            sizes="260px" />
          <Photo img={HERO_IMAGES[2]} delay={0.26} drift={drift} driftDelay={2.4}
            className="bottom-0 start-0 w-[84px] h-[84px] min-[380px]:w-[92px] min-[380px]:h-[92px] sm:w-[120px] sm:h-[120px] -rotate-6 md:start-[40%] md:bottom-[2%] md:w-[38%] md:h-[48%] md:rotate-[5deg]"
            sizes="(min-width: 768px) 220px, 100px" />
        </motion.div>

        {/* Reassurance row */}
        <motion.ul
          variants={fadeUp}
          className="col-span-2 md:col-span-12 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-x-10 md:gap-y-3 pt-3 md:pt-0 border-t border-white/15 md:border-0"
        >
          {features.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-center md:items-start gap-2 md:gap-3 min-w-0">
              <Icon className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-brand-lime md:text-[#163300]" strokeWidth={1.9} />
              <span className="min-w-0">
                <span className="block text-[11px] sm:text-xs md:text-sm font-bold text-white/90 md:text-[#163300] leading-tight">{title}</span>
                <span className="hidden md:block text-xs text-[#4b5745] mt-0.5">{sub}</span>
              </span>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
