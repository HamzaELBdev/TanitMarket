"use client";
import React from 'react';
import { cn } from '@/lib/cn';

/**
 * A checkbox whose entire card is the touch target (min 44px tall) — used
 * for the "Meublé / Ascenseur / Vacciné / Importé / Échange" style toggles.
 */
export default function ToggleCard({ checked, onChange, icon: Icon, label, description, className }) {
  return (
    <label
      className={cn(
        'min-h-11 p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors select-none',
        checked ? 'bg-[#e2f6d5] border-[#0e0f0c]' : 'bg-[#e8ebe6] border-[#e8ebe6] hover:border-[#0e0f0c]/20',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#0e0f0c] shrink-0"
      />
      <div className="text-xs min-w-0">
        <span className="font-extrabold text-[#0e0f0c] flex items-center gap-1">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#0e0f0c] shrink-0" />} {label}
        </span>
        {description && <span className="text-[10px] text-[#868685]">{description}</span>}
      </div>
    </label>
  );
}
