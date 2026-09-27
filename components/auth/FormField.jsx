"use client";
import { forwardRef } from 'react';
import { FieldError } from './FormMessage';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Labelled input with a leading icon, optional trailing slot (e.g. the
 * password toggle), hint and animated error. `ltr` keeps e-mail/password
 * typing left-to-right in the Arabic UI.
 */
const FormField = forwardRef(function FormField(
  { id, label, required, icon: Icon, error, hint, trailing, labelAside, ltr = false, className = '', ...inputProps },
  ref
) {
  const { t } = useLanguage();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="block text-[15px] font-semibold text-[#0e0f0c]">
          {label}
          {required ? (
            <>
              <span className="text-[#d03238] ms-1" aria-hidden="true">*</span>
              <span className="sr-only"> ({t('authRequired')})</span>
            </>
          ) : null}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {Icon ? (
          <Icon className="w-5 h-5 text-[#6f7a67] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true" strokeWidth={1.75} />
        ) : null}
        <input
          ref={ref}
          id={id}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required ? 'true' : undefined}
          className={`auth-input w-full h-12 rounded-[10px] border border-[#d6ddd0] bg-[#fbfcfa] text-base text-[#0e0f0c]
            placeholder:text-[#8d948a] scroll-mt-28 ${ltr ? 'px-12 rtl:text-right' : 'ps-11 pe-4'}`}
          {...inputProps}
        />
        {trailing ? <div className="absolute end-1 top-1/2 -translate-y-1/2">{trailing}</div> : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-[13px] text-[#6d7169]">{hint}</p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
});

export default FormField;
