"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Car, Sofa, Shirt, Building2, Gamepad2, Wrench, Briefcase, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { fadeUp, staggerContainer, REVEAL_VIEWPORT, DURATION, EASE_OUT } from '@/lib/design';

// ids match the category ids stored by create-listing (see hooks/useListings matchesCategory)
export const HOME_CATEGORIES = [
  { id: 'electronics', key: 'catNavMultimedia', icon: Headphones },
  { id: 'vehicles', key: 'catNavVehicles', icon: Car },
  { id: 'home', key: 'catNavHome', icon: Sofa },
  { id: 'fashion', key: 'catNavFashion', icon: Shirt },
  { id: 'realestate', key: 'catNavRealEstate', icon: Building2 },
  { id: 'sports', key: 'catNavLeisure', icon: Gamepad2 },
  { id: 'services', key: 'catNavServices', icon: Wrench },
  { id: 'jobs', key: 'catNavJobs', icon: Briefcase },
];

export default function CategoryGrid({ selected, onSelect, onShowAll }) {
  const { t } = useLanguage();

  return (
    <motion.section
      aria-labelledby="categories-title"
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      variants={staggerContainer(0.035)}
      className="space-y-3 sm:space-y-4"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-2">
        <h2 id="categories-title" className="text-[17px] min-[380px]:text-lg sm:text-2xl font-heading font-black text-[#0e0f0c] whitespace-nowrap">
          {t('exploreCategories')}
        </h2>
        <button
          type="button"
          onClick={onShowAll}
          className="min-h-11 -me-2 px-2 rounded-full text-xs sm:text-sm font-bold text-[#163300] hover:bg-brand-mint flex items-center gap-0.5 shrink-0 cursor-pointer transition-colors"
        >
          <span className="sm:hidden">{t('seeAllShort')}</span>
          <span className="hidden sm:inline">{t('seeAllCategories')}</span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </motion.div>

      <ul className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
        {HOME_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected === cat.id;
          return (
            <motion.li key={cat.id} variants={fadeUp}>
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: DURATION.micro, ease: EASE_OUT }}
                onClick={() => onSelect(isSelected ? 'All' : cat.id)}
                aria-pressed={isSelected}
                className={`w-full h-full min-h-[76px] sm:min-h-[92px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl px-1 py-2.5 sm:py-3 cursor-pointer border transition-colors duration-200 ${
                  isSelected
                    ? 'bg-brand-forest border-brand-forest text-brand-lime shadow-card'
                    : 'bg-brand-mint border-transparent text-[#163300] hover:border-brand-lime hover:shadow-card'
                }`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.8} />
                <span className={`text-[11px] sm:text-sm font-bold text-center leading-tight ${isSelected ? 'text-white' : 'text-[#0e0f0c]'}`}>
                  {t(cat.key)}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
