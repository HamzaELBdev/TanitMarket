"use client";
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { messageVariants } from '@/lib/authMotion';

const TONES = {
  error: { icon: AlertCircle, cls: 'bg-[#fdeeee] text-[#a72027] border-[#f3c9cb]' },
  success: { icon: CheckCircle2, cls: 'bg-brand-mint text-brand-forest border-[#cfe8bf]' },
  info: { icon: Info, cls: 'bg-[#f3f6f0] text-[#454745] border-brand-line' },
};

/** Field-level error, rendered under its input and referenced by aria-describedby. */
export function FieldError({ id, message }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p key="err" id={id} variants={messageVariants} initial="hidden" animate="show" exit="exit"
          className="overflow-hidden text-[13px] font-medium text-[#a72027] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-[3px] shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Form-level banner (server error, notice, success). role=alert for errors so
 * screen readers announce it; status otherwise.
 */
export function FormBanner({ tone = 'error', message, id }) {
  const T = TONES[tone] || TONES.error;
  const Icon = T.icon;
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {message ? (
        <motion.div key={`${tone}:${message}`} id={id} variants={messageVariants} initial="hidden" animate="show" exit="exit"
          role={tone === 'error' ? 'alert' : 'status'} className="overflow-hidden">
          <div className={`flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-sm leading-snug ${T.cls}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
