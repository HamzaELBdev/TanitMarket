"use client";
import React, { useEffect, useRef, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal primitive shared across the app: backdrop blur/dim,
 * focus trap + restore, Escape-to-close, click-outside-to-close, body
 * scroll lock, and responsive sizing — a bottom sheet on mobile, a
 * centered dialog from `sm:` up. Honors prefers-reduced-motion.
 *
 * Deliberately does NOT use <AnimatePresence> to control unmounting: in
 * practice its exit-tracking through a createPortal boundary could reach
 * opacity 0 and then never actually remove the node, leaving an invisible
 * `fixed inset-0` backdrop that blocks every click on the page. Instead we
 * track mount state ourselves and only unmount once the exit animation's
 * own onAnimationComplete fires — same visual result, no silent hangs.
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const titleId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setIsMounted(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Refs are already attached by the time this effect runs (React commits
    // the DOM before effects fire), so focus synchronously — no rAF needed,
    // and rAF can be throttled/skipped on backgrounded tabs anyway.
    const focusable = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    (focusable?.[0] || panelRef.current)?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown, true);
      lastFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;
  if (typeof document === 'undefined') return null;

  const sizeClass = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';
  const panelVariants = prefersReducedMotion
    ? { visible: { opacity: 1 }, hidden: { opacity: 0 } }
    : { visible: { opacity: 1, y: 0, scale: 1 }, hidden: { opacity: 0, y: 40, scale: 0.98 } };

  return createPortal(
    <>
      {(
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
          style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          initial="hidden"
          animate={isOpen ? 'visible' : 'hidden'}
          variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#0e0f0c]/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — its completion callback is what actually unmounts the
              modal once the close transition finishes (see comment above). */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={cn(
              'relative w-full bg-white shadow-2xl outline-none flex flex-col',
              'rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh]',
              sizeClass
            )}
            initial="hidden"
            animate={isOpen ? 'visible' : 'hidden'}
            variants={panelVariants}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => { if (!isOpen) setIsMounted(false); }}
          >
            {/* Mobile pull indicator */}
            <div className="w-10 h-1 bg-[#0e0f0c]/15 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 sm:pt-5 border-b border-[#e8ebe6] shrink-0">
              {title ? (
                <h2 id={titleId} className="font-heading font-black text-lg text-[#0e0f0c] truncate">
                  {title}
                </h2>
              ) : <span />}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-11 h-11 min-w-11 min-h-11 -mr-2 flex items-center justify-center rounded-full text-[#868685] hover:bg-[#e8ebe6] hover:text-[#0e0f0c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto flex-1">
              {children}
            </div>

            {footer && (
              <div className="px-5 py-4 border-t border-[#e8ebe6] shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </>,
    document.body
  );
}
