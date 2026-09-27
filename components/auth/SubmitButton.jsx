"use client";
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { labelVariants, microTransition, PRESS_SCALE } from '@/lib/authMotion';

/**
 * Primary lime submit button. status: 'idle' | 'pending' | 'success'.
 * While pending/success it is aria-disabled (not `disabled`, so focus stays
 * on it and Enter can't re-submit — the form handler also guards).
 */
export default function SubmitButton({ status = 'idle', children, pendingLabel, successLabel }) {
  const busy = status !== 'idle';
  const label =
    status === 'pending' ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span>{pendingLabel}</span>
      </>
    ) : status === 'success' ? (
      <>
        <Check className="w-5 h-5" strokeWidth={2.6} aria-hidden="true" />
        <span>{successLabel}</span>
      </>
    ) : (
      <>
        <span>{children}</span>
        <ArrowRight className="w-5 h-5 rtl:-scale-x-100" aria-hidden="true" />
      </>
    );

  return (
    <motion.button
      type="submit"
      aria-disabled={busy || undefined}
      aria-live="polite"
      whileHover={busy ? undefined : { y: -1 }}
      whileTap={busy ? undefined : { scale: PRESS_SCALE }}
      transition={microTransition}
      className={`relative w-full h-[52px] rounded-full font-heading font-extrabold text-[17px] text-brand-forest
        overflow-hidden cursor-pointer transition-[background-color,box-shadow] duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2
        ${status === 'success' ? 'bg-[#8fdc5f]' : 'bg-brand-lime hover:bg-brand-lime-hover hover:shadow-[0_10px_24px_-12px_rgba(22,51,0,0.55)]'}
        ${status === 'pending' ? 'cursor-progress' : ''}`}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span key={status} variants={labelVariants} initial="hidden" animate="show" exit="exit"
          className="flex items-center justify-center gap-2.5">
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
