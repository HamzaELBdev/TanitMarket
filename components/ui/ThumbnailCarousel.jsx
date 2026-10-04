"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AUTO_DELAY = 5000;      // ms between auto-advances
const DRAG_BUFFER = 50;       // px the user must drag to change slide
const INACTIVE_SCALE = 0.92;  // neighbouring slides sit slightly back

const SPRING_OPTIONS = { type: 'spring', mass: 3, stiffness: 400, damping: 50 };

/**
 * Swipeable image carousel with a thumbnail strip.
 *
 * The index is controlled by the parent so it can render its own overlay
 * (a photo counter, badges, action buttons) against the same state.
 *
 * `dir="ltr"` is pinned on the track and the strip: the slide maths is
 * `translateX(-index * 100%)`, which would run backwards inside the Arabic
 * RTL document, and photos carry no reading direction anyway.
 */
export default function ThumbnailCarousel({
  images = [],
  activeIndex = 0,
  onIndexChange,
  alt = '',
  frameClassName = '',
  imageClassName = 'object-cover',
  thumbnailLabel = (n) => `${n}`,
  prevLabel = 'Previous image',
  nextLabel = 'Next image',
  autoPlayDelay = AUTO_DELAY,
  overlay = null,
}) {
  const count = images.length;
  const index = count ? Math.min(Math.max(activeIndex, 0), count - 1) : 0;
  const dragX = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  // Auto-advance is a hint for someone who has not noticed there are more
  // photos; once they drive it themselves it only gets in the way.
  const [userTookOver, setUserTookOver] = useState(false);

  // Refs keep the auto-advance interval from being torn down and restarted on
  // every render (which would stretch or reset the delay).
  const indexRef = useRef(index);
  indexRef.current = index;
  const changeRef = useRef(onIndexChange);
  changeRef.current = onIndexChange;

  const goTo = useCallback((next, { fromUser = true } = {}) => {
    if (!count) return;
    if (fromUser) setUserTookOver(true);
    changeRef.current?.(((next % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (userTookOver || reduceMotion || count < 2 || !autoPlayDelay) return;
    const interval = setInterval(() => {
      // Mid-drag: leave the slide where the finger put it.
      if (dragX.get() !== 0) return;
      goTo(indexRef.current + 1, { fromUser: false });
    }, autoPlayDelay);
    return () => clearInterval(interval);
  }, [userTookOver, reduceMotion, count, autoPlayDelay, dragX, goTo]);

  const handleDragEnd = () => {
    const x = dragX.get();
    setUserTookOver(true);
    // Clamped rather than wrapping: a flung edge slide should not rush the
    // whole strip back the other way.
    if (x <= -DRAG_BUFFER && index < count - 1) goTo(index + 1);
    else if (x >= DRAG_BUFFER && index > 0) goTo(index - 1);
  };

  const handleKeyDown = (event) => {
    if (count < 2) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1); }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div
        dir="ltr"
        role="group"
        aria-roledescription="carousel"
        tabIndex={count > 1 ? 0 : -1}
        onKeyDown={handleKeyDown}
        onPointerDown={() => setUserTookOver(true)}
        className={`relative overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0e0f0c] group ${frameClassName}`}
      >
        {/* A listing with no usable photo still needs its frame: the overlay
            carries the share, favourite and report buttons. */}
        {count > 0 && (
          <motion.div
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            animate={{ translateX: `-${index * 100}%` }}
            transition={reduceMotion ? { duration: 0 } : SPRING_OPTIONS}
            onDragEnd={handleDragEnd}
            className={`flex h-full ${count > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {images.map((src, idx) => (
              <motion.div
                key={`${src}-${idx}`}
                animate={{ scale: idx === index ? 1 : INACTIVE_SCALE }}
                transition={reduceMotion ? { duration: 0 } : SPRING_OPTIONS}
                className="relative w-full h-full shrink-0"
                aria-hidden={idx !== index}
              >
                <img
                  src={src}
                  alt={count > 1 ? `${alt} — ${thumbnailLabel(idx + 1)}` : alt}
                  draggable={false}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className={`w-full h-full pointer-events-none ${imageClassName}`}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {overlay}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={prevLabel}
              className="hidden sm:flex absolute top-1/2 left-3 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#0e0f0c] shadow-sm transition-all hover:bg-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={nextLabel}
              className="hidden sm:flex absolute top-1/2 right-3 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#0e0f0c] shadow-sm transition-all hover:bg-white hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div dir="ltr" className="flex items-center gap-2.5 overflow-x-auto p-1 pb-2 no-scrollbar">
          {images.map((src, idx) => (
            <button
              key={`thumb-${src}-${idx}`}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={thumbnailLabel(idx + 1)}
              aria-current={idx === index}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 cursor-pointer ${
                idx === index
                  ? 'border-[#9fe870] ring-2 ring-[#0e0f0c] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={src} alt="" draggable={false} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
