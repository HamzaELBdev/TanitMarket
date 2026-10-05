"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Search, Tag, MapPin, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fadeUp, staggerContainer, DURATION, EASE_OUT } from '@/lib/design';

// Curated brand visuals (local, preloaded) — fixed so the hero never swaps
// images once listings load. The collage cycles these three between its three
// frames, so no frame ever shows the same photo as its neighbour and the
// rotation costs no extra bytes (all three are already preloaded).
const HERO_IMAGES = [
  { src: '/images/hero-collage-1.webp', alt: '' },
  { src: '/images/hero-collage-3.webp', alt: '' },
  { src: '/images/hero-collage-2.webp', alt: '' },
];

// Every frame declares the same `sizes`, so the three photos resolve to one
// identical srcset and rotating between them is always served from cache
// rather than triggering a fresh fetch per frame.
const HERO_SIZES = '(min-width: 768px) 260px, 110px';

const ROTATE_MS = 4500;

// Decorative motion (drift, parallax, tilt, photo rotation) only on large,
// hover-capable screens and never under prefers-reduced-motion.
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

// Advances the collage every ROTATE_MS, paused while the tab is hidden so a
// backgrounded page never animates.
function usePhotoRotation(active) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let id;
    const start = () => {
      id = window.setInterval(() => setStep((s) => s + 1), ROTATE_MS);
    };
    const onVisibility = () => {
      window.clearInterval(id);
      if (!document.hidden) start();
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
  return step;
}

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

function Photo({ frame, step, className, delay, drift, driftDelay = 0, parallax }) {
  // Which of the three photos this frame shows right now. The frame offset
  // keeps the three frames on distinct images at every step.
  const active = (frame + step) % HERO_IMAGES.length;
  const rotating = drift;
  const shown = rotating ? HERO_IMAGES : [HERO_IMAGES[frame]];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE_OUT, delay } },
      }}
      className={`absolute ${className}`}
    >
      {/* Scroll parallax — own layer so it never fights the entrance or drift. */}
      <motion.div style={drift ? { y: parallax } : undefined} className="w-full h-full">
        <motion.div
          animate={drift ? { y: [0, -7, 0] } : { y: 0 }}
          transition={drift ? { duration: 7, ease: 'easeInOut', repeat: Infinity, delay: driftDelay } : { duration: 0 }}
          className="relative w-full h-full rounded-2xl md:rounded-[22px] overflow-hidden border-[3px] md:border-[5px] border-white shadow-float bg-brand-mint"
        >
          {shown.map((img, i) => {
            const visible = rotating ? i === active : true;
            return (
              <motion.div
                key={img.src}
                animate={{ opacity: visible ? 1 : 0 }}
                initial={false}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                className="absolute inset-0"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={HERO_SIZES}
                  /* Only the frame's own photo is preloaded; the two it rotates
                     through are already preloaded by the other frames. */
                  preload={!rotating || i === frame}
                  className="object-cover"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  const drift = useDecorativeMotion();
  const step = usePhotoRotation(drift);
  const sectionRef = useRef(null);

  // Scroll parallax: the collage drifts up a little faster than the page.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const parallax1 = useTransform(scrollYProgress, [0, 1], [0, -46]);
  const parallax2 = useTransform(scrollYProgress, [0, 1], [0, -74]);
  const parallax3 = useTransform(scrollYProgress, [0, 1], [0, -26]);

  // Pointer tilt on the whole collage — one perspective group, three photos.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 20 });
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });

  const onPointerMove = (e) => {
    if (!drift) return;
    const box = sectionRef.current?.getBoundingClientRect();
    if (!box) return;
    pointerX.set((e.clientX - box.left) / box.width - 0.5);
    pointerY.set((e.clientY - box.top) / box.height - 0.5);
  };
  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const features = [
    { icon: MapPin, title: t('heroFeatLocalTitle'), sub: t('heroFeatLocalSub') },
    { icon: ShieldCheck, title: t('heroFeatVerifiedTitle'), sub: t('heroFeatVerifiedSub') },
    { icon: MapIcon, title: t('heroFeatAllTitle'), sub: t('heroFeatAllSub') },
  ];

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-panel bg-brand-forest md:bg-brand-hero px-4 pt-5 pb-4 sm:px-8 sm:pt-8 md:p-10 lg:px-12 lg:py-12"
    >
      {/* Soft lime glow (desktop light surface) */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 end-[-6rem] w-[26rem] h-[26rem] rounded-full bg-brand-lime/25 blur-3xl hidden md:block hero-glow" />

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
            variants={staggerContainer(0.055)}
            className="font-heading font-black text-white md:text-[#163300] text-[25px] leading-[1.1] sm:text-4xl md:text-[44px] lg:text-[54px] md:leading-[1.03] tracking-[-0.02em]"
          >
            <Words text={t('heroTitleLine1')} />
            <Words text={t('heroTitleLine2')} className="text-brand-lime md:text-brand-moss" />
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
          className="relative md:col-span-5 lg:col-span-6 w-[100px] h-[190px] min-[380px]:w-[112px] sm:w-[170px] sm:h-[240px] md:w-full md:h-[300px] lg:h-[340px] self-start md:self-center [perspective:1100px]"
        >
          <motion.div
            style={drift ? { rotateX: tiltX, rotateY: tiltY, transformStyle: 'preserve-3d' } : undefined}
            className="absolute inset-0"
          >
            {/* sketch accents + lime blob (desktop) */}
            <div className="hidden md:block absolute inset-[8%_6%_4%_10%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-brand-lime/55 hero-blob" />
            <svg className="hidden md:block absolute top-[38%] start-[-4%] w-10 h-16 text-[#163300] rtl:-scale-x-100" viewBox="0 0 40 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M4 8 L30 16" /><path d="M2 32 L32 32" /><path d="M4 56 L30 48" />
            </svg>

            <Photo frame={0} step={step} delay={0.1} drift={drift} parallax={parallax1}
              className="top-0 end-0 w-[88px] h-[100px] min-[380px]:w-[96px] sm:w-[130px] sm:h-[140px] rotate-3 md:end-auto md:start-[6%] md:top-[6%] md:w-[44%] md:h-[62%] md:-rotate-3" />
            <Photo frame={1} step={step} delay={0.18} drift={drift} driftDelay={1.2} parallax={parallax2}
              className="hidden md:block md:end-[2%] md:top-0 md:w-[46%] md:h-[56%] md:rotate-3" />
            <Photo frame={2} step={step} delay={0.26} drift={drift} driftDelay={2.4} parallax={parallax3}
              className="bottom-0 start-0 w-[84px] h-[84px] min-[380px]:w-[92px] min-[380px]:h-[92px] sm:w-[120px] sm:h-[120px] -rotate-6 md:start-[40%] md:bottom-[2%] md:w-[38%] md:h-[48%] md:rotate-[5deg]" />
          </motion.div>
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
