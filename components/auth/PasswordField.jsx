"use client";
import { forwardRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import FormField from './FormField';
import { useLanguage } from '@/context/LanguageContext';
import { microTransition } from '@/lib/authMotion';

/**
 * Password input with an accessible show/hide toggle (type="button" so it
 * never submits; aria-pressed + label so screen readers know its state).
 * `autoComplete` must be "current-password" (login) or "new-password"
 * (signup) so password managers fill / generate correctly.
 */
const PasswordField = forwardRef(function PasswordField({ id, autoComplete, ...props }, ref) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FormField
      ref={ref}
      id={id}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      ltr
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('authHidePassword') : t('authShowPassword')}
          aria-pressed={visible}
          aria-controls={id}
          className="w-11 h-11 rounded-full flex items-center justify-center text-[#5d6559] hover:text-brand-forest
            hover:bg-[#eef3ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss transition-colors cursor-pointer"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.span key={visible ? 'hide' : 'show'} initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={microTransition}
              className="flex">
              <Icon className="w-5 h-5" aria-hidden="true" strokeWidth={1.75} />
            </motion.span>
          </AnimatePresence>
        </button>
      }
      {...props}
    />
  );
});

export default PasswordField;
