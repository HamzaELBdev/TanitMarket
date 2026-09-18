import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon = null,
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
        <input
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 text-xs sm:text-sm rounded-[10px] border ${
            error ? 'border-[#AD4D39] focus:ring-[#AD4D39]/20' : 'border-[#E6EAE3] focus:border-[#163300]'
          } focus:outline-none focus:ring-2 focus:ring-[#163300]/10 bg-white text-[#313B35] transition placeholder:text-[#788078]/60 ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] font-bold text-[#AD4D39]">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-[#788078]">{helperText}</p>}
    </div>
  );
}
