"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fadeUp, staggerContainer, EASE_OUT } from '@/lib/design';
import HeroBadge from '@/components/home/hero/HeroBadge';
import HeroActions from '@/components/home/hero/HeroActions';
import HeroMascot from '@/components/home/hero/HeroMascot';
import TrustPoints from '@/components/home/hero/TrustPoints';

// Splits a headline into per-word spans. The words stay real text nodes, so
// selection, translation and screen readers are unaffected.
function Words({ text, className = '' }) {
  const words = String(text ?? '').split(' ');
  return (
    <span className={`block ${className}`}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <motion.span
            variants={{
              hidden: { opacity: 0, y: '0.45em' },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  const features = [
    { icon: MapPin, title: t('heroFeatLocalTitle'), sub: t('heroFeatLocalSub') },
    { icon: ShieldCheck, title: t('heroFeatVerifiedTitle'), sub: t('heroFeatVerifiedSub') },
    { icon: MapIcon, title: t('heroFeatAllTitle'), sub: t('heroFeatAllSub') },
  ];

  const cards = [
    { src: '/images/auth/sneakers.webp', label: t('heroCardShoes') },
    { src: '/images/auth/lamp.webp', label: t('heroCardLamp') },
    { src: '/images/auth/phone.webp', label: t('heroCardPhone') },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-panel bg-brand-hero px-5 pt-6 pb-6 sm:px-8 sm:pt-8 md:p-8 lg:px-12 lg:py-12"
    >
      {/* Soft lime glow */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 end-[-6rem] w-[26rem] h-[26rem] rounded-full bg-brand-lime/25 blur-3xl hidden md:block hero-glow" />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer(0.07)}
        className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-cols-12 gap-x-6 lg:gap-x-8 gap-y-6 md:gap-y-8 items-center"
      >
        {/* Copy — a size container so the headline scales with its column and
            can never overflow it, whatever the language. */}
        <div className="md:col-span-1 lg:col-span-7 space-y-4 md:space-y-5 [container-type:inline-size]">
          <motion.div variants={fadeUp}>
            <HeroBadge>{t('heroBadge')}</HeroBadge>
          </motion.div>

          <motion.h1
            id="hero-title"
            variants={staggerContainer(0.055)}
            className="font-heading font-black text-brand-forest text-[clamp(1.625rem,9.6cqw,4.5rem)] leading-[1.05] tracking-[-0.02em]"
          >
            <Words text={t('heroTitleLine1')} />
            <Words text={t('heroTitleLine2')} className="text-brand-moss" />
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-lg md:text-xl text-[#2f3a28] max-w-md leading-relaxed">
            {t('heroDescShort')}
          </motion.p>

          <motion.div variants={fadeUp} className="pt-1 md:pt-2">
            <HeroActions exploreLabel={t('heroExplore')} sellLabel={t('heroSell')} />
          </motion.div>
        </div>

        {/* Mascot + listing cards */}
        <motion.div variants={fadeUp} className="md:col-span-1 lg:col-span-5">
          <HeroMascot alt={t('heroMascotAlt')} cards={cards} />
        </motion.div>

        {/* Reassurance */}
        <motion.div variants={fadeUp} className="md:col-span-2 lg:col-span-12 pt-4 md:pt-0 border-t border-brand-line md:border-0">
          <TrustPoints items={features} />
        </motion.div>
      </motion.div>
    </section>
  );
}
