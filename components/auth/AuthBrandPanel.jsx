"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import AuthLogo from './AuthLogo';

// Separate, pre-optimised product photos (public/images/auth/*.webp, 560px,
// ~6–13 KB). Tilt/position recreate the mockup's collage.
const CARDS = [
  { src: '/images/auth/sneakers.webp', alt: 'Baskets', tilt: '-6deg', delay: '0.28s',
    pos: 'start-[4%] top-[4%] w-[52%] z-10' },
  { src: '/images/auth/lamp.webp', alt: 'Lampe design', tilt: '6deg', delay: '0.38s',
    pos: 'end-[3%] top-[18%] w-[40%] z-20' },
  { src: '/images/auth/phone.webp', alt: 'Smartphone', tilt: '-3deg', delay: '0.48s',
    pos: 'start-[14%] bottom-[2%] w-[46%] z-30' },
];

function Sparkle({ className }) {
  return (
    <svg className={className} width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M8 30 18 14" stroke="#9FE870" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 36 36 28" stroke="#9FE870" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Dark-green brand side of the desktop layout: logo, back link, slogan,
 * a collage of product cards (staggered pop-in, a few seconds of float,
 * lift on hover) and two reassurance points. Decorative animations pause
 * while the tab is hidden; it is not rendered below lg.
 */
export default function AuthBrandPanel() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.visibilityState !== 'visible');
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <aside
      className={`relative hidden lg:flex flex-col overflow-hidden text-white p-10 xl:p-12
        bg-[radial-gradient(120%_90%_at_0%_0%,#255207_0%,#163300_45%,#0d2100_100%)] ${paused ? 'auth-paused' : ''}`}
    >
      <div className="pointer-events-none absolute -top-24 -end-24 w-72 h-72 rounded-full bg-brand-lime/10 blur-3xl" aria-hidden="true" />

      <div className="relative space-y-5">
        <div className="auth-rise" style={{ '--auth-i': 0 }}>
          <AuthLogo size="lg" tone="dark" tagline={t('authBrandTagline')} />
        </div>
        <Link href="/" style={{ '--auth-i': 1 }}
          className="auth-rise inline-flex items-center gap-2 min-h-11 -my-2 text-[15px] text-white/85 hover:text-white rounded-full
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('authBackHome')}
        </Link>
      </div>

      <div className="relative mt-8 xl:mt-10">
        <p className="auth-rise font-heading font-extrabold tracking-[-0.03em] leading-[1.02] text-[46px] xl:text-[56px]"
          style={{ '--auth-i': 2 }}>
          <span className="block">{t('authBrandHeadlineA')}</span>
          <span className="block text-brand-lime">{t('authBrandHeadlineB')}</span>
        </p>
        <p className="auth-rise mt-5 text-lg xl:text-[19px] leading-snug text-white/90 max-w-[22rem]" style={{ '--auth-i': 3 }}>
          {t('authBrandLead')}
        </p>
      </div>

      {/* Collage */}
      <div className="relative flex-1 min-h-[300px] xl:min-h-[340px] my-6" aria-hidden="true">
        <svg className="auth-blob absolute inset-0 w-full h-full" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet" fill="none">
          <path d="M60 120c-40 40-52 118 6 160s124 40 170 8 36-86 90-104 78-80 30-120-116-10-160 6-96 10-136 50z" fill="#9FE870" opacity="0.9" />
          <path d="M250 40c40-30 120-6 120 60s-40 70-70 60-90-90-50-120z" fill="#7ED957" opacity="0.55" />
        </svg>
        <Sparkle className="absolute end-[6%] top-[-4%]" />
        <Sparkle className="absolute start-[-2%] bottom-[16%] -scale-x-100" />
        {CARDS.map((c) => (
          <div key={c.src} className={`auth-card absolute ${c.pos}`}
            style={{ '--auth-card-tilt': c.tilt, '--auth-card-delay': c.delay }}>
            <div className="auth-card-inner rounded-[22px] border-[6px] border-white bg-white overflow-hidden shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)]">
              <Image src={c.src} alt={c.alt} width={560} height={560} sizes="(min-width: 1024px) 240px, 1px"
                className="w-full h-auto aspect-square object-cover" />
            </div>
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-2 gap-4 xl:gap-6 pt-6 border-t border-white/15">
        {[
          { icon: MessageCircle, title: t('authFeatureChatTitle'), desc: t('authFeatureChatDesc') },
          { icon: MapPin, title: t('authFeatureLocalTitle'), desc: t('authFeatureLocalDesc') },
        ].map((f, i) => (
          <div key={f.title} className={`auth-rise flex items-start gap-3 xl:gap-3.5 ${i ? 'ps-4 xl:ps-6 border-s border-white/15' : ''}`}
            style={{ '--auth-i': 5 + i }}>
            <span className="w-10 h-10 xl:w-12 xl:h-12 rounded-full border-2 border-brand-lime flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-brand-lime" strokeWidth={2} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold text-[15px] leading-tight">{f.title}</span>
              <span className="block mt-1 text-[13px] text-white/70 leading-snug">{f.desc}</span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
