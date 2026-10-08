import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Tag, ArrowRight } from 'lucide-react';
import { DURATION } from '@/lib/design';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-12 sm:min-h-[52px] w-full sm:w-auto md:w-full lg:w-auto rounded-full px-6 text-[15px] sm:text-base font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

const hover = { whileHover: { y: -2 }, transition: { duration: DURATION.micro } };

export default function HeroActions({ exploreLabel, sellLabel }) {
  return (
    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-3">
      <motion.a
        href="#explore"
        {...hover}
        className={`${BASE} bg-brand-forest text-white hover:bg-brand-forest-hover shadow-card`}
      >
        <Search className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        {exploreLabel}
        <ArrowRight className="w-4 h-4 shrink-0 rtl:rotate-180" strokeWidth={2.5} aria-hidden="true" />
      </motion.a>
      <motion.div {...hover} className="sm:w-auto md:w-full lg:w-auto">
        <Link
          href="/create-listing"
          className={`${BASE} border-[1.5px] border-brand-forest text-brand-forest bg-white/40 hover:bg-white`}
        >
          <Tag className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {sellLabel}
        </Link>
      </motion.div>
    </div>
  );
}
