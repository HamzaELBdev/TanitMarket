"use client";
import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Shared text/number/tel/textarea field: label, helper text, inline error,
 * and consistent default/focus/error/disabled states across the listing form.
 */
export default function TextField({
  label,
  required = false,
  helper,
  error,
  multiline = false,
  rows = 4,
  className,
  inputClassName,
  size = 'md', // 'md' (compact, used inside category grids) | 'lg' (title/description)
  ...props
}) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className={cn('block font-bold text-[#0e0f0c] mb-1', size === 'lg' ? 'text-xs sm:text-sm' : 'text-[11px]')}>
          {label} {required && <span className="text-[#a72027]">*</span>}
        </label>
      )}
      <Tag
        id={id}
        rows={multiline ? rows : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        className={cn(
          'w-full rounded-xl border bg-white text-[#0e0f0c] font-bold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#e8ebe6]',
          'placeholder:font-medium placeholder:text-[#868685]/70',
          size === 'lg' ? 'px-4 py-3 text-xs sm:text-sm min-h-11' : 'px-3 py-2.5 text-xs min-h-11',
          error
            ? 'border-[#a72027] focus:border-[#a72027]'
            : 'border-[#e8ebe6] focus:border-[#0e0f0c] hover:border-[#0e0f0c]/30',
          inputClassName
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 flex items-start gap-1 text-[11px] font-bold text-[#a72027]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="mt-1 text-[10px] text-[#868685]">{helper}</p>
      ) : null}
    </div>
  );
}
