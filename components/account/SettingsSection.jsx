"use client";
import React, { useId, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { IconBubble, cardCls } from '@/components/account/ui';
import { DURATION, EASE_OUT } from '@/lib/design';

const DESKTOP_MQ = '(min-width: 1024px)';
const subscribeMq = (cb) => {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

// Server snapshot = mobile, so hydration never mismatches; the real value is
// used right after.
export function useIsDesktop() {
  return useSyncExternalStore(subscribeMq, () => window.matchMedia(DESKTOP_MQ).matches, () => false);
}

/**
 * Settings card. Desktop: always open. Mobile: accessible accordion
 * (button + aria-expanded/aria-controls, animated height on this small panel).
 */
export default function SettingsSection({ id, icon, title, sub, subShort, open, onToggle, desktop, children, className = '' }) {
  const panelId = useId();
  const headingId = `${id}-title`;
  const collapsible = !desktop;
  const expanded = desktop || open;

  const header = (
    <>
      <IconBubble icon={icon} />
      <span className="flex-1 min-w-0 text-start">
        <span id={headingId} className="block font-heading font-extrabold text-[17px] lg:text-lg text-[#0e0f0c]">{title}</span>
        <span className="block text-xs lg:text-sm font-normal text-[#5c6657] mt-0.5">{collapsible && !expanded ? (subShort || sub) : sub}</span>
      </span>
    </>
  );

  return (
    <section id={`section-${id}`} aria-labelledby={headingId} className={`${cardCls} scroll-mt-24 ${className}`}>
      {collapsible ? (
        <h2 className="m-0 font-body font-normal">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="w-full flex items-center gap-3 p-4 min-h-[64px] rounded-card cursor-pointer"
          >
            {header}
            <ChevronRight className={`w-5 h-5 text-[#5c6657] shrink-0 transition-transform duration-200 rtl:rotate-180 ${expanded ? 'rotate-90 rtl:rotate-90' : ''}`} />
          </button>
        </h2>
      ) : (
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-[#163300]/[0.07]">{header}</div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            key="panel"
            initial={desktop ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.panel, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className={desktop ? 'p-5' : 'px-4 pb-4 pt-1'}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
