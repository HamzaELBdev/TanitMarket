"use client";
import React, { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Eye, PenLine, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { DURATION, EASE_OUT } from '@/lib/design';

/**
 * "•••" menu for an owned listing: Aperçu / Modifier / Supprimer.
 * Keyboard: Enter/Space/ArrowDown opens and focuses the first item,
 * Arrow keys move, Escape closes and returns focus to the trigger.
 */
export default function ListingActionsMenu({ item, onPreview, onDelete, busy }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  const items = () => Array.from(rootRef.current?.querySelectorAll('[role="menuitem"]') || []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    requestAnimationFrame(() => items()[0]?.focus());
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const onKeyDown = (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  const itemCls = 'w-full flex items-center gap-2.5 min-h-11 px-3 rounded-xl text-sm font-semibold text-start transition-colors focus:outline-none focus-visible:bg-brand-mint hover:bg-brand-mint cursor-pointer';

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t('mlMore')} — ${item.title}`}
        className="w-11 h-11 rounded-full bg-[#eef1ec] hover:bg-brand-mint text-[#163300] flex items-center justify-center transition-colors duration-200 active:scale-95 cursor-pointer disabled:cursor-wait"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreHorizontal className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={t('mlMore')}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: DURATION.panel, ease: EASE_OUT }}
            className="absolute end-0 top-full mt-2 z-30 w-52 p-1.5 bg-white rounded-2xl border border-[#163300]/10 shadow-float origin-top-right rtl:origin-top-left"
          >
            <button type="button" role="menuitem" className={`${itemCls} text-[#163300]`} onClick={() => { close(false); onPreview(item); }}>
              <Eye className="w-4 h-4" /> {t('mlPreview')}
            </button>
            <Link role="menuitem" href={`/create-listing?editId=${item.id}`} className={`${itemCls} text-[#163300]`} onClick={() => setOpen(false)}>
              <PenLine className="w-4 h-4" /> {t('mlEdit')}
            </Link>
            <div className="my-1 h-px bg-[#163300]/10" role="separator" />
            <button type="button" role="menuitem" className={`${itemCls} text-[#a72027] hover:bg-[#fdecea] focus-visible:bg-[#fdecea]`} onClick={() => { close(); onDelete(item); }}>
              <Trash2 className="w-4 h-4" /> {t('mlDelete')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
