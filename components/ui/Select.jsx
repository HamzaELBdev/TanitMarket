import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  icon: Icon = null,
  error,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-bold text-[#163300]">
          {label} {required && <span className="text-[#AD4D39]">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 text-[#788078] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-10 py-2.5 text-xs sm:text-sm rounded-[10px] border ${
            error ? 'border-[#AD4D39]' : 'border-[#E6EAE3] focus:border-[#163300]'
          } focus:outline-none bg-white text-[#313B35] appearance-none transition cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown className="w-4 h-4 text-[#788078] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <p className="text-[11px] font-bold text-[#AD4D39]">{error}</p>}
    </div>
  );
}
