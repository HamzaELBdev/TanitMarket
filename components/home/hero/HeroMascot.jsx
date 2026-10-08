import Image from 'next/image';
import ProductPreviewCard from '@/components/home/ProductPreviewCard';

// Mascot + floating listing cards. The mascot is a transparent cut-out sized by
// the container height (never stretched); the cards are real UI placed around
// it. Phones/tablets show two cards, desktop three. Floating is pure CSS
// (`.hero-float`) and is neutralised by prefers-reduced-motion.
export default function HeroMascot({ alt, cards }) {
  const [shoes, lamp, phone] = cards;
  return (
    <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[460px] md:max-w-none h-[270px] min-[430px]:h-[300px] sm:h-[340px] md:h-[320px] lg:h-[400px] xl:h-[450px]">
      {/* soft lime disc behind the mascot */}
      <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[2%] top-[14%] rounded-full bg-brand-lime/30 blur-2xl" />

      <ProductPreviewCard
        {...lamp}
        sizes="(min-width: 1024px) 160px, 1px"
        aspect="aspect-square"
        className="hero-float hidden lg:block absolute z-[1] top-[40%] end-[14%] w-[30%] rotate-[-4deg]"
      />
      <ProductPreviewCard
        {...shoes}
        sizes="(min-width: 1024px) 190px, (min-width: 768px) 120px, 120px"
        aspect="aspect-[5/4]"
        className="hero-float absolute z-[1] top-[2%] end-0 lg:top-0 lg:end-[6%] w-[38%] md:w-[40%] rotate-[4deg]"
      />
      <ProductPreviewCard
        {...phone}
        sizes="(min-width: 1024px) 140px, 100px"
        aspect="aspect-[4/5]"
        className="hero-float hero-float-late absolute z-[1] bottom-[8%] end-[2%] lg:bottom-[4%] lg:end-0 w-[30%] lg:w-[27%] rotate-[-4deg]"
      />

      <Image
        src="/images/mascot.webp"
        alt={alt}
        width={640}
        height={833}
        preload
        sizes="(min-width: 1280px) 346px, (min-width: 1024px) 307px, 260px"
        className="hero-float-slow absolute z-[2] bottom-0 start-[2%] md:start-0 h-full lg:h-[90%] w-auto max-w-none object-contain rtl:-scale-x-100 pointer-events-none select-none"
      />
    </div>
  );
}
