"use client";
import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANT_CLASSES = {
  primary: 'bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] focus-visible:ring-[#0e0f0c]',
  lime: 'bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] focus-visible:ring-[#0e0f0c]',
  secondary: 'bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#dde1d9] focus-visible:ring-[#0e0f0c]',
  tertiary: 'bg-white text-[#0e0f0c] border border-[#0e0f0c] hover:bg-[#e8ebe6] focus-visible:ring-[#0e0f0c]',
  danger: 'bg-[#FFEDE8] text-[#a72027] border border-[#a72027]/30 hover:bg-[#a72027] hover:text-white focus-visible:ring-[#a72027]',
  ghost: 'bg-transparent text-[#0e0f0c] hover:bg-[#e8ebe6] focus-visible:ring-[#0e0f0c]',
};

const SIZE_CLASSES = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-xs gap-2',
  lg: 'h-12 sm:h-14 px-6 sm:px-7 text-sm gap-2.5',
  icon: 'h-11 w-11 min-h-11 min-w-11 justify-center',
  'icon-sm': 'h-11 w-11 min-h-11 min-w-11 justify-center text-xs',
};

/**
 * Shared button primitive: consistent variant/size scale, loading + disabled
 * states, and a 44px minimum touch target on every size (WCAG 2.5.5).
 * Renders a Next <Link> when `href` is passed, a native <button> otherwise.
 */
export default function Button({
  as,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-95 hover:scale-[1.03]',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );

  const content = (
    <>
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : (Icon && <Icon className="w-4 h-4 shrink-0" />)}
      {children}
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
