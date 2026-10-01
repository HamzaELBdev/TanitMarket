"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, XCircle, Ban, Loader2, Save, Tag, Timer } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { normalizeStatus } from '@/lib/services/listingsService';
import { DURATION, EASE_OUT } from '@/lib/design';

const STATUS_STYLES = {
  approved: { cls: 'bg-[#e3f5d6] text-[#1d5c0a]', icon: null, dot: 'bg-[#2ead4b]', key: 'mlStatusOnline' },
  pending: { cls: 'bg-[#fff3dc] text-[#8a4d00]', icon: Clock, key: 'mlStatusPending', longKey: 'mlStatusPendingLong' },
  rejected: { cls: 'bg-[#fdecea] text-[#a72027]', icon: XCircle, key: 'mlStatusRejected' },
  reserved: { cls: 'bg-[#eef1ec] text-[#454745]', icon: Ban, key: 'mlStatusReserved' },
  sold: { cls: 'bg-[#ece8fb] text-[#4b3aa7]', icon: Tag, key: 'mlStatusSold' },
  expired: { cls: 'bg-[#eef1ec] text-[#5c6657]', icon: Timer, key: 'mlStatusExpired' },
};

/** Sober listing-status badge: colour + icon/dot + explicit text. */
export function StatusBadge({ status, long = false }) {
  const { t } = useLanguage();
  const s = STATUS_STYLES[normalizeStatus(status)] || STATUS_STYLES.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>
      {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> : <span aria-hidden="true" className={`w-2 h-2 rounded-full ${s.dot}`} />}
      {t(long && s.longKey ? s.longKey : s.key)}
    </span>
  );
}

/** Count pill used in the sidebar / mobile menu. */
export function CountPill({ n, active }) {
  if (n === undefined || n === null) return null;
  return (
    <span className={`min-w-6 h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center tabular-nums ${active ? 'bg-white text-[#163300]' : 'bg-[#eef1ec] text-[#163300]'}`}>
      {n}
    </span>
  );
}

/** Round mint icon bubble. */
export function IconBubble({ icon: Icon, size = 'md', className = '' }) {
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const icon = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <span aria-hidden="true" className={`${dims} rounded-full bg-brand-mint text-[#163300] flex items-center justify-center shrink-0 ${className}`}>
      <Icon className={icon} strokeWidth={1.9} />
    </span>
  );
}

/**
 * Submit button with idle → saving → saved states. The label change is
 * announced (aria-live) and the button is disabled while saving.
 * state: 'idle' | 'saving' | 'saved'
 */
export function SaveButton({ state = 'idle', label, className = '', icon: Icon = Save, ...rest }) {
  const { t } = useLanguage();
  const content = {
    idle: { icon: Icon, text: label || t('stSave') },
    saving: { icon: Loader2, text: t('stSaving'), spin: true },
    saved: { icon: Check, text: t('stSaved') },
  }[state];
  const C = content.icon;
  return (
    <motion.button
      type="submit"
      whileTap={state === 'idle' ? { scale: 0.98 } : undefined}
      transition={{ duration: DURATION.micro }}
      disabled={state === 'saving'}
      aria-busy={state === 'saving'}
      className={`relative w-full min-h-12 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer disabled:cursor-wait ${
        state === 'saved' ? 'bg-brand-forest text-brand-lime' : 'bg-brand-lime hover:bg-brand-lime-hover text-[#163300]'
      } ${className}`}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: DURATION.micro, ease: EASE_OUT }}
          className="flex items-center gap-2"
          aria-live="polite"
        >
          <C className={`w-[18px] h-[18px] ${content.spin ? 'animate-spin' : ''}`} strokeWidth={2.25} />
          {content.text}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/** Accessible on/off switch with a sliding knob. */
export function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-14 h-11 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-wait"
    >
      <span className={`w-12 h-7 rounded-full p-1 flex transition-colors duration-200 ${checked ? 'bg-brand-forest justify-end' : 'bg-[#dfe5da] justify-start'}`}>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
          className="w-5 h-5 rounded-full bg-white shadow"
        />
      </span>
    </button>
  );
}

/** Inline field error, linked to its input via id. */
export function FieldError({ id, children }) {
  return (
    <AnimatePresence initial={false}>
      {children && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.micro }}
          className="text-xs font-semibold text-[#a72027] mt-1.5"
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export const inputCls =
  'w-full min-h-12 px-4 rounded-xl border border-[#dfe7d8] bg-white text-sm font-medium text-[#0e0f0c] placeholder-[#8a9384] transition-colors duration-200 focus:outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-lime/50 aria-[invalid=true]:border-[#a72027]';

export const cardCls = 'bg-white rounded-card border border-[#163300]/[0.08] shadow-card';
