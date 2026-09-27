import Image from 'next/image';
import Link from 'next/link';
import TunisiaFlag from '@/components/TunisiaFlag';

/**
 * Official logo (lime disc + Tanit sign) with the wordmark and tagline.
 * size="lg" on the dark brand panel, "sm" in the compact mobile header.
 */
export default function AuthLogo({ size = 'lg', tone = 'dark', tagline, showTagline = true }) {
  const lg = size === 'lg';
  return (
    <Link href="/" className="inline-flex items-center gap-3 min-h-11 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime group">
      <span className={`${lg ? 'w-14 h-14' : 'w-10 h-10'} rounded-full overflow-hidden shrink-0 bg-brand-lime
        transition-transform duration-200 group-hover:scale-105`}>
        <Image src="/logoBg.png" alt="" width={lg ? 56 : 40} height={lg ? 56 : 40} className="w-full h-full object-contain" preload={lg} />
      </span>
      <span className="flex flex-col">
        <span className={`flex items-center gap-2 font-heading font-extrabold tracking-tight leading-none
          ${lg ? 'text-[30px]' : 'text-xl'} ${tone === 'dark' ? 'text-white' : 'text-[#0e0f0c]'}`}>
          TanitMarket
          <TunisiaFlag className={`${lg ? 'w-6 h-4' : 'w-5 h-3.5'} rounded-[2px] shrink-0`} />
        </span>
        {showTagline && tagline ? (
          <span className={`mt-1.5 font-semibold uppercase ${lg ? 'text-[13px] tracking-[0.14em]' : 'text-[10px] tracking-[0.16em]'}
            ${tone === 'dark' ? 'text-brand-lime' : 'text-brand-moss'}`}>
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
