// Three reassurance points. Compact 3-column grid (icon over title) on phones,
// icon + title + subtitle in a row from md.
export default function TrustPoints({ items }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-4 lg:flex lg:flex-wrap lg:gap-x-10 lg:gap-y-3">
      {items.map(({ icon: Icon, title, sub }) => (
        <li
          key={title}
          className="flex flex-col items-center text-center md:flex-row md:items-center md:text-start gap-1.5 md:gap-3 min-w-0"
        >
          <span className="grid place-items-center w-9 h-9 md:w-11 md:h-11 shrink-0 rounded-full bg-white ring-1 ring-brand-line text-brand-forest">
            <Icon className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] sm:text-xs md:text-sm font-bold text-brand-forest leading-tight">{title}</span>
            <span className="block text-[10px] sm:text-[11px] md:text-xs text-[#4b5745] leading-snug mt-0.5">{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
