"use client";
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Store, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { microTransition, PRESS_SCALE } from '@/lib/authMotion';

const OPTIONS = [
  { value: 'Particulier', labelKey: 'authRoleIndividual', icon: User },
  { value: 'Boutique Pro', labelKey: 'authRoleShop', icon: Store },
];

/**
 * Radio group rendered as two cards. Native radio semantics (arrow keys move
 * the selection, one tab stop) via role="radiogroup" + roving tabindex.
 */
export default function AccountTypeSelector({ value, onChange, name = 'role', disabled }) {
  const { t } = useLanguage();
  const refs = useRef([]);
  const labelId = 'account-type-label';

  const onKeyDown = (e, i) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === 'rtl';
    const step = (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && rtl ? -keys[e.key] : keys[e.key];
    const next = (i + step + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="space-y-1.5">
      <p id={labelId} className="text-[15px] font-semibold text-[#0e0f0c]">{t('authAccountType')}</p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt, i) => {
          const selected = value === opt.value;
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.value}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              name={name}
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              whileTap={{ scale: PRESS_SCALE }}
              transition={microTransition}
              className={`relative min-h-[60px] rounded-[12px] border px-3 sm:px-4 flex items-center gap-2.5 sm:gap-3 text-start
                cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-brand-moss focus-visible:ring-offset-2 disabled:opacity-60
                ${selected ? 'border-brand-moss text-brand-forest' : 'border-[#d6ddd0] text-[#3c4238] hover:border-[#b9c4b0] hover:bg-[#f7faf4]'}`}
            >
              {selected ? (
                <motion.span layoutId="account-type-bg" transition={microTransition}
                  className="absolute inset-0 rounded-[11px] bg-brand-mint" aria-hidden="true" />
              ) : null}
              <Icon className="relative w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="relative flex-1 text-[15px] font-semibold leading-tight">{t(opt.labelKey)}</span>
              {/* Below sm the tick is a corner badge so long labels keep their width. */}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: selected ? 1 : 0.4, opacity: selected ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                className="absolute -top-2 -end-2 sm:static w-6 h-6 rounded-full bg-brand-forest text-white flex items-center justify-center shrink-0 ring-2 ring-white sm:ring-0"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
