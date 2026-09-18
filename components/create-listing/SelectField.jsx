"use client";
import React, { useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Shared native <select> field with the same label/error/state language as
 * TextField. Kept as a real <select> (not the animated Dropdown) since this
 * form has a dozen short, category-specific lists where a native picker is
 * faster on mobile and never needs search.
 */
export default function SelectField({
  label,
  required = false,
  error,
  options = [], // [{ value, label }] or plain strings
  size = 'md',
  className,
  ...props
}) {
  const id = useId();

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className={cn('block font-bold text-[#0e0f0c] mb-1', size === 'lg' ? 'text-xs sm:text-sm' : 'text-[11px]')}>
          {label} {required && <span className="text-[#a72027]">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-xl border bg-white text-[#0e0f0c] font-bold transition-colors appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40',
            size === 'lg' ? 'px-4 py-3 pr-9 text-xs sm:text-sm min-h-11' : 'px-3 py-2.5 pr-8 text-xs min-h-11',
            error
              ? 'border-[#a72027] focus:border-[#a72027]'
              : 'border-[#e8ebe6] focus:border-[#0e0f0c] hover:border-[#0e0f0c]/30'
          )}
          {...props}
        >
          {options.map((opt) => {
            const value = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return <option key={value} value={value}>{text}</option>;
          })}
        </select>
        <ChevronDown className="w-4 h-4 text-[#868685] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 flex items-start gap-1 text-[11px] font-bold text-[#a72027]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {error}
        </p>
      )}
    </div>
  );
}
