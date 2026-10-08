import Image from 'next/image';
import { Heart } from 'lucide-react';

// A small listing preview tile (photo + save heart + label). Presentational for
// now — pass `className` to position/rotate it and `onClick` later to make it
// interactive. It has no position of its own: pass `relative` or `absolute`
// via className. Reusable anywhere a compact listing teaser is needed.
export default function ProductPreviewCard({
  src,
  label,
  sizes = '160px',
  aspect = 'aspect-[5/4]',
  className = '',
}) {
  return (
    <figure
      className={`m-0 rounded-[18px] md:rounded-[22px] border-[3px] md:border-4 border-white bg-white shadow-card overflow-hidden ${className}`}
    >
      <div className={`relative w-full ${aspect} bg-brand-mint`}>
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      </div>
      <span
        aria-hidden="true"
        className="absolute top-1.5 end-1.5 md:top-2 md:end-2 grid place-items-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/95 text-brand-forest shadow-card"
      >
        <Heart className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2.25} />
      </span>
      <figcaption className="hidden xl:block absolute bottom-2 end-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-brand-forest shadow-card">
        {label}
      </figcaption>
    </figure>
  );
}
