"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

const SEARCH_THRESHOLD = 6;

/**
 * Accessible custom select: keyboard navigable (Arrow keys / Home / End /
 * Enter / Escape), animated open/close, auto-searchable once the option
 * list grows past SEARCH_THRESHOLD entries. Closes on outside click.
 */
export default function Dropdown({ label, value, onChange, options, placeholder = 'Sélectionner', className, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listId = useId();
  const prefersReducedMotion = useReducedMotion();
  const [isListMounted, setIsListMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setIsListMounted(true);
  }, [isOpen]);

  const searchable = options.length > SEARCH_THRESHOLD;
  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const selected = options.find(opt => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, searchable]);

  const openAndReset = () => {
    setIsOpen(true);
    setQuery('');
    setHighlighted(Math.max(0, filteredOptions.findIndex(o => o.value === value)));
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAndReset();
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      rootRef.current?.querySelector('[data-dropdown-trigger]')?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlighted(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlighted(filteredOptions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[highlighted];
      if (opt) {
        onChange(opt.value);
        setIsOpen(false);
        rootRef.current?.querySelector('[data-dropdown-trigger]')?.focus();
      }
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {label && <span className="sr-only" id={`${listId}-label`}>{label}</span>}
      <button
        type="button"
        data-dropdown-trigger
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${listId}-label` : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openAndReset())}
        onKeyDown={handleTriggerKeyDown}
        className="w-full h-11 min-h-11 flex items-center gap-2 px-3.5 rounded-xl border-2 border-[#e8ebe6] bg-white text-[#0e0f0c] text-xs font-bold hover:border-[#0e0f0c]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e0f0c] transition-colors cursor-pointer"
      >
        {Icon && <Icon className="w-4 h-4 text-[#868685] shrink-0" />}
        <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 text-[#868685] shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isListMounted && (
          <motion.div
            role="listbox"
            id={listId}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            initial="hidden"
            animate={isOpen ? 'visible' : 'hidden'}
            variants={
              prefersReducedMotion
                ? { visible: { opacity: 1 }, hidden: { opacity: 0 } }
                : { visible: { opacity: 1, y: 0, scale: 1 }, hidden: { opacity: 0, y: -6, scale: 0.98 } }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            onAnimationComplete={() => { if (!isOpen) setIsListMounted(false); }}
            style={{ transformOrigin: 'top', pointerEvents: isOpen ? 'auto' : 'none' }}
            className="absolute z-30 mt-1.5 w-full min-w-[180px] bg-white rounded-xl shadow-xl border border-[#e8ebe6] overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-[#e8ebe6]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#868685] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
                    placeholder="Rechercher..."
                    className="w-full h-9 pl-8 pr-2 text-xs font-semibold rounded-lg bg-[#e8ebe6] focus:outline-none focus:ring-2 focus:ring-[#0e0f0c] text-[#0e0f0c]"
                  />
                </div>
              </div>
            )}
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3.5 py-2.5 text-xs text-[#868685] font-semibold">Aucun résultat</li>
              ) : filteredOptions.map((opt, idx) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseEnter={() => setHighlighted(idx)}
                  onClick={() => { onChange(opt.value); setIsOpen(false); rootRef.current?.querySelector('[data-dropdown-trigger]')?.focus(); }}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-colors min-h-11',
                    idx === highlighted ? 'bg-[#e2f6d5] text-[#0e0f0c]' : 'text-[#454745] hover:bg-[#e8ebe6]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
    </div>
  );
}
