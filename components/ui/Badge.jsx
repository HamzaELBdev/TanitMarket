import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'pending' | 'danger' | 'lime'
  size = 'sm', // 'xs' | 'sm' | 'md'
  className = '',
  icon: Icon = null
}) {
  const baseStyles = "inline-flex items-center font-semibold rounded-full select-none";

  const sizeStyles = {
    xs: "text-[10px] px-2 py-0.5 gap-1",
    sm: "text-[11px] px-2.5 py-1 gap-1.5",
    md: "text-xs px-3.5 py-1.5 gap-1.5"
  };

  const variantStyles = {
    default: "bg-[#e8ebe6] text-[#868685]",
    success: "bg-[#e2f6d5] text-[#054d28]",
    pending: "bg-[#ffd11a] text-[#4a3b1c]",
    danger: "bg-[#320707] text-white",
    lime: "bg-[#9fe870] text-[#0e0f0c]"
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
