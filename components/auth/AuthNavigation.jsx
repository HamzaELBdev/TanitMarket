"use client";
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

const TABS = [
  { mode: 'login', key: 'authTabLogin' },
  { mode: 'signup', key: 'authTabSignup' },
];

/**
 * Connexion / Inscription switch. A tablist with a sliding forest-green
 * indicator (shared layoutId). Arrow keys move between tabs.
 */
export default function AuthNavigation({ mode, onChange }) {
  const { t } = useLanguage();
  const refs = useRef([]);
  const active = mode === 'signup' ? 'signup' : 'login';

  const onKeyDown = (e, i) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = (i + 1) % TABS.length; // two tabs: either arrow toggles
    onChange(TABS[next].mode);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={t('authModeLabel')}
      className="relative grid grid-cols-2 p-1 rounded-full bg-[#eef3ea] border border-[#e1e8da]">
      {TABS.map((tab, i) => {
        const selected = active === tab.mode;
        return (
          <button
            key={tab.mode}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            id={`auth-tab-${tab.mode}`}
            aria-selected={selected}
            aria-controls="auth-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.mode)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`relative h-11 sm:h-12 rounded-full text-[15px] sm:text-base font-semibold cursor-pointer
              transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss
              ${selected ? 'text-white' : 'text-[#5d6559] hover:text-brand-forest'}`}
          >
            {selected ? (
              <motion.span layoutId="auth-tab-indicator" aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-full bg-brand-forest shadow-[0_6px_16px_-8px_rgba(22,51,0,0.7)]" />
            ) : null}
            <span className="relative">{t(tab.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
