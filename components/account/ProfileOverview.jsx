"use client";
import React from 'react';
import VerifiedBadge from '@/components/VerifiedBadge';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, MapPin, PenLine, FileText, MessageCircle, Heart, ChevronRight,
  User, PlusCircle, Settings, MessageSquareText, Megaphone
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { AvatarUploader } from '@/components/account/Avatar';
import { IconBubble, CountPill, cardCls } from '@/components/account/ui';
import { TAB_HREF, useAccountNav } from '@/components/account/AccountLayout';
import { getProfileCompletion } from '@/hooks/useAccount';
import { sectionIn, staggerContainer, DURATION, EASE_OUT } from '@/lib/design';

const liftCard = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.98 },
  transition: { duration: DURATION.micro, ease: EASE_OUT },
};

function Leaves() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 200" className="pointer-events-none absolute inset-y-0 end-0 h-full w-[70%] text-white/[0.06] rtl:-scale-x-100">
      <path fill="currentColor" d="M300 -20c60 30 90 90 70 150-40-10-90-60-70-150z" />
      <path fill="currentColor" d="M220 40c50 10 80 50 80 100-45 0-85-40-80-100z" />
      <path fill="currentColor" d="M370 120c30 20 40 60 20 90-30-15-40-55-20-90z" />
      <circle cx="250" cy="170" r="18" fill="currentColor" />
    </svg>
  );
}

export function ProfileCard({ acc }) {
  const { t } = useLanguage();
  const location = acc.profile?.location;
  return (
    <motion.section
      variants={sectionIn}
      aria-label={acc.displayName}
      className="relative overflow-hidden rounded-panel bg-brand-forest text-white p-4 sm:p-6 lg:p-8 shadow-float"
    >
      <Leaves />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
          <AvatarUploader src={acc.avatarUrl} name={acc.displayName} size="lg" dark onUpload={acc.uploadAvatar} />
          <div className="min-w-0 space-y-2">
            <h2 className="font-heading font-black text-xl sm:text-2xl lg:text-[30px] leading-tight truncate">{acc.displayName}</h2>
            {acc.accountVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm font-bold text-brand-lime">
                <VerifiedBadge size={20} className="-ms-1" /> {t('accVerified')}
              </span>
            ) : (
              <Link href={`${TAB_HREF.settings}&section=contact`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1 text-xs sm:text-sm font-bold text-[#ffd9a8] transition-colors focus-visible:outline-brand-lime">
                <ShieldAlert className="w-4 h-4" /> {t('accNotVerified')}
              </Link>
            )}
            <Link
              href={`${TAB_HREF.settings}&section=location`}
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors w-fit max-w-full focus-visible:outline-brand-lime rounded"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{location || t('accAddLocation')}</span>
            </Link>
          </div>
        </div>
        <motion.div {...liftCard} className="sm:shrink-0">
          <Link
            href={`${TAB_HREF.settings}&section=profile`}
            className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full border-[1.5px] border-white/70 text-white font-extrabold text-sm hover:bg-white/10 transition-colors focus-visible:outline-brand-lime"
          >
            <PenLine className="w-4 h-4" /> {t('accEditProfile')}
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function AccountStats({ acc }) {
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const stats = [
    { icon: FileText, value: acc.listingsLoading ? '–' : acc.listings.length, label: t('accStatListings'), href: TAB_HREF.listings },
    { icon: MessageCircle, value: acc.chats.length, label: t('accStatChats'), href: '/chat' },
    { icon: Heart, value: wishlistCount, label: wishlistCount > 1 ? t('accStatFavorites') : t('accStatFavorite'), href: '/favoris' },
  ];
  return (
    <motion.ul variants={sectionIn} className="grid grid-cols-3 lg:gap-4 max-lg:bg-white max-lg:rounded-card max-lg:border max-lg:border-[#163300]/[0.08] max-lg:shadow-card max-lg:divide-x max-lg:rtl:divide-x-reverse max-lg:divide-[#163300]/10 max-lg:overflow-hidden">
      {stats.map((s) => (
        <li key={s.label} className="min-w-0">
          <motion.div {...liftCard} className="h-full">
            <Link
              href={s.href}
              className={`h-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-4 p-3 lg:p-5 text-center lg:text-start hover:bg-[#f7faf4] lg:hover:bg-white transition-[background-color,box-shadow] lg:bg-white lg:rounded-card lg:border lg:border-[#163300]/[0.08] lg:shadow-card lg:hover:shadow-card-hover`}
            >
              <span className="lg:hidden"><s.icon className="w-6 h-6 text-[#163300]" strokeWidth={1.9} /></span>
              <IconBubble icon={s.icon} size="lg" className="hidden lg:flex" />
              <span className="flex-1 min-w-0">
                <span className="block font-heading font-black text-xl lg:text-3xl text-[#0e0f0c] tabular-nums leading-none">{s.value}</span>
                <span className="block text-xs lg:text-base text-[#5c6657] mt-1 truncate">{s.label}</span>
              </span>
              <ChevronRight className="hidden lg:block w-5 h-5 text-[#5c6657] rtl:rotate-180" />
            </Link>
          </motion.div>
        </li>
      ))}
    </motion.ul>
  );
}

export function ProfileCompletion({ acc }) {
  const { t } = useLanguage();
  const { percent, missing } = getProfileCompletion(acc);
  const hint = missing.length
    ? t('accMissing', { items: missing.slice(0, 2).map((m) => t(m.key)).join(', ') })
    : t('accProfileComplete');
  const firstSection = missing[0] && ['accChkEmail', 'accChkPhone'].includes(missing[0].key) ? 'contact'
    : missing[0]?.key === 'accChkLocation' ? 'location' : 'profile';

  return (
    <motion.section variants={sectionIn} aria-labelledby="completion-title" className={`${cardCls} p-4 lg:p-6`}>
      <div className="flex items-start gap-4">
        <IconBubble icon={User} size="lg" className="hidden sm:flex" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="completion-title" className="font-heading font-extrabold text-[15px] lg:text-lg text-[#0e0f0c] flex items-center gap-2">
              <User className="w-5 h-5 sm:hidden" /> {t('accYourProfile')}
            </h2>
            <span className="font-heading font-black text-[15px] lg:text-lg tabular-nums">{percent} %</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-labelledby="completion-title"
            className="h-2.5 rounded-full bg-[#e6ece1] overflow-hidden"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: percent / 100 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
              className="h-full w-full rounded-full bg-brand-forest origin-left rtl:origin-right"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs lg:text-sm text-[#5c6657]">{hint}</p>
            {missing.length > 0 && (
              <Link
                href={`${TAB_HREF.settings}&section=${firstSection}`}
                className="shrink-0 min-h-11 -me-2 px-2 inline-flex items-center gap-0.5 text-xs lg:text-sm font-extrabold text-[#163300] underline underline-offset-4 decoration-2 rounded-full hover:bg-brand-mint transition-colors"
              >
                {t('accComplete')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function QuickCard({ href, icon, title, sub }) {
  return (
    <motion.div {...liftCard}>
      <Link href={href} className={`${cardCls} h-full flex items-center gap-4 p-5 lg:p-6 hover:shadow-card-hover transition-shadow`}>
        <IconBubble icon={icon} size="lg" />
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-extrabold text-[#0e0f0c]">{title}</span>
          <span className="block text-sm text-[#5c6657] mt-1">{sub}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#163300] shrink-0 rtl:rotate-180" />
      </Link>
    </motion.div>
  );
}

function SellCta() {
  const { t } = useLanguage();
  return (
    <motion.section variants={sectionIn} className="hidden lg:flex items-center gap-8 rounded-panel bg-brand-mint px-8 py-7">
      <Megaphone aria-hidden="true" className="w-16 h-16 text-[#163300] -rotate-12 shrink-0" strokeWidth={1.6} />
      <div className="flex-1 min-w-0">
        <h2 className="font-heading font-black text-2xl text-[#163300]">{t('accNextBuyer')}</h2>
        <p className="text-[#4b5745] mt-1 max-w-md">{t('accNextBuyerSub')}</p>
      </div>
      <motion.div {...liftCard}>
        <Link href="/create-listing" className="inline-flex items-center gap-2 min-h-[52px] px-7 rounded-full bg-brand-forest hover:bg-brand-forest-hover text-white font-extrabold transition-colors">
          <PlusCircle className="w-5 h-5 text-brand-lime" /> {t('postListingCta')}
        </Link>
      </motion.div>
    </motion.section>
  );
}

function MobileMenu({ acc }) {
  const { t } = useLanguage();
  const items = useAccountNav(acc).filter((i) => i.id !== 'overview');
  const labels = { favorites: t('accNavMyFavorites') };
  const icons = { messages: MessageSquareText };
  return (
    <motion.nav variants={sectionIn} aria-label={t('accNavLabel')} className="lg:hidden">
      <ul className={`${cardCls} divide-y divide-[#163300]/[0.07] overflow-hidden`}>
        {items.map((item) => {
          const Icon = icons[item.id] || item.icon;
          return (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center gap-3.5 min-h-[56px] px-4 active:bg-brand-mint hover:bg-[#f7faf4] transition-colors">
                <Icon className="w-5 h-5 text-[#163300]" strokeWidth={1.9} />
                <span className="flex-1 text-[15px] font-bold text-[#0e0f0c]">{labels[item.id] || item.label}</span>
                {item.count !== undefined && <CountPill n={item.count} />}
                <ChevronRight className="w-4 h-4 text-[#5c6657] rtl:rotate-180" />
              </Link>
            </li>
          );
        })}
        {acc.isAdmin && (
          <li>
            <Link href="/dash" className="flex items-center gap-3.5 min-h-[56px] px-4 hover:bg-[#f7faf4] transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#163300]" strokeWidth={1.9} />
              <span className="flex-1 text-[15px] font-bold text-[#0e0f0c]">{t('accNavAdmin')}</span>
              <ChevronRight className="w-4 h-4 text-[#5c6657] rtl:rotate-180" />
            </Link>
          </li>
        )}
      </ul>
    </motion.nav>
  );
}

export default function ProfileOverview({ acc }) {
  const { t } = useLanguage();
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.05)} className="space-y-4 lg:space-y-6">
      <motion.header variants={sectionIn} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-[40px] text-[#0e0f0c] leading-tight">{t('accMySpace')}</h1>
          <p className="text-sm lg:text-lg text-[#5c6657] mt-0.5">{t('accMySpaceSub')}</p>
        </div>
        <Link
          href={TAB_HREF.settings}
          aria-label={t('accNavSettings')}
          className="lg:hidden w-11 h-11 rounded-full border border-[#163300]/15 bg-white flex items-center justify-center text-[#163300] hover:bg-brand-mint transition-colors shrink-0"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </motion.header>

      <ProfileCard acc={acc} />
      <AccountStats acc={acc} />
      <ProfileCompletion acc={acc} />

      <motion.div variants={sectionIn} className="lg:hidden">
        <Link href="/create-listing" className="w-full min-h-[52px] rounded-full bg-brand-lime hover:bg-brand-lime-hover text-[#163300] font-extrabold flex items-center justify-center gap-2 shadow-card transition-colors active:scale-[0.98]">
          <PlusCircle className="w-5 h-5" /> {t('postListingCta')}
        </Link>
      </motion.div>

      <MobileMenu acc={acc} />

      <motion.div variants={sectionIn} className="hidden lg:grid grid-cols-2 gap-5">
        <QuickCard href={TAB_HREF.listings} icon={FileText} title={t('accManageListings')} sub={t('accManageListingsSub')} />
        <QuickCard href="/chat" icon={MessageCircle} title={t('accOpenMessages')} sub={t('accOpenMessagesSub')} />
      </motion.div>

      <SellCta />
    </motion.div>
  );
}
