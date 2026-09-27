"use client";
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { microTransition, PRESS_SCALE } from '@/lib/authMotion';

function GoogleG() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default function GoogleAuthButton({ onClick, pending, disabled }) {
  const { t } = useLanguage();
  const inactive = pending || disabled;
  return (
    <motion.button
      type="button"
      onClick={inactive ? undefined : onClick}
      aria-disabled={inactive || undefined}
      aria-busy={pending || undefined}
      whileHover={inactive ? undefined : { y: -1 }}
      whileTap={inactive ? undefined : { scale: PRESS_SCALE }}
      transition={microTransition}
      className={`w-full h-[52px] rounded-full border border-[#1d2419] bg-white text-[#0e0f0c] text-[16px] font-semibold
        flex items-center justify-center gap-3 transition-[background-color,box-shadow] duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss focus-visible:ring-offset-2
        ${inactive ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-[#f6f9f3] hover:shadow-[0_8px_20px_-14px_rgba(22,51,0,0.5)]'}`}
    >
      {pending ? <Loader2 className="w-5 h-5 animate-spin text-brand-moss" aria-hidden="true" /> : <GoogleG />}
      <span>{t('continueWithGoogle')}</span>
    </motion.button>
  );
}
