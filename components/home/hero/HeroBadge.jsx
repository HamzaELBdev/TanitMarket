import { ShoppingBag } from 'lucide-react';

export default function HeroBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 ring-1 ring-brand-line ps-1.5 pe-3 py-1 text-xs sm:text-[13px] font-bold text-brand-forest">
      <span className="grid place-items-center w-5 h-5 rounded-full bg-brand-lime text-brand-forest">
        <ShoppingBag className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
      </span>
      {children}
    </span>
  );
}
