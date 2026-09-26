"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, FileText, MessageSquareText, Heart, Settings, ShieldCheck, LogOut, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { Avatar } from '@/components/account/Avatar';
import { CountPill } from '@/components/account/ui';
import { DURATION, EASE_OUT } from '@/lib/design';

export const TAB_HREF = {
  overview: '/profile',
  listings: '/profile?tab=listings',
  settings: '/profile?tab=settings',
};

/** Navigation items shared by the desktop sidebar and the mobile menu. */
export function useAccountNav(acc) {
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  return [
    { id: 'overview', href: TAB_HREF.overview, label: t('accNavProfile'), icon: User },
    { id: 'listings', href: TAB_HREF.listings, label: t('accNavListings'), icon: FileText, count: acc.listingsLoading ? undefined : acc.listings.length },
    { id: 'messages', href: '/chat', label: t('accNavMessages'), icon: MessageSquareText, count: acc.chats.length },
    { id: 'favorites', href: '/favoris', label: t('accNavFavorites'), icon: Heart, count: wishlistCount },
    { id: 'settings', href: TAB_HREF.settings, label: t('accNavSettings'), icon: Settings },
  ];
}

export function AccountSidebar({ acc, active }) {
  const { t } = useLanguage();
  const items = useAccountNav(acc);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[100px] space-y-5">
        {/* identity */}
        <div className="flex items-center gap-3 px-2">
          <Avatar src={acc.avatarUrl} name={acc.displayName} size="sm" />
          <div className="min-w-0">
            <p className="font-heading font-extrabold text-[#0e0f0c] truncate">{acc.displayName}</p>
            {acc.accountVerified ? (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-mint px-2 py-0.5 text-[11px] font-bold text-[#1d5c0a]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#2ead4b] text-white flex items-center justify-center"><Check className="w-2.5 h-2.5" strokeWidth={3.5} /></span>
                {t('accVerified')}
              </span>
            ) : (
              <span className="mt-1 block text-xs text-[#5c6657] truncate">{acc.profile?.location || t('accAddLocation')}</span>
            )}
          </div>
        </div>

        <nav aria-label={t('accNavLabel')}>
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = item.id === active;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-3 min-h-12 px-3.5 rounded-2xl text-[15px] transition-colors duration-200 ${
                      isActive ? 'text-[#163300] font-extrabold' : 'text-[#2f3a28] font-semibold hover:bg-[#f3f7ef]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="account-nav-active"
                        transition={{ duration: DURATION.panel, ease: EASE_OUT }}
                        className="absolute inset-0 rounded-2xl bg-brand-mint"
                      />
                    )}
                    <Icon className="relative w-5 h-5 shrink-0" strokeWidth={isActive ? 2.3 : 1.9} />
                    <span className="relative flex-1">{item.label}</span>
                    {item.count !== undefined && <span className="relative"><CountPill n={item.count} active={isActive} /></span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#163300]/10 pt-4 space-y-1">
          {acc.isAdmin && (
            <Link href="/dash" className="flex items-center gap-3 min-h-12 px-3.5 rounded-2xl text-[15px] font-semibold text-[#2f3a28] hover:bg-[#f3f7ef] transition-colors">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.9} />
              <span className="flex-1">{t('accNavAdmin')}</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          )}
          <button
            type="button"
            onClick={acc.logout}
            className="w-full flex items-center gap-3 min-h-12 px-3.5 rounded-2xl text-[15px] font-semibold text-[#a72027] hover:bg-[#fdecea] transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 rtl:rotate-180" strokeWidth={1.9} />
            {t('accSignOut')}
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Account shell: sidebar (lg+) + main column. On mobile the sidebar is
 * replaced by the overview's menu and the fixed bottom nav, and the main
 * column reserves room for that nav (incl. safe area).
 */
export default function AccountLayout({ acc, active, children }) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-[calc(var(--tm-bottom-nav)+1.5rem)] lg:pb-12 font-body text-[#0e0f0c]">
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)] lg:gap-8 xl:gap-10">
        <AccountSidebar acc={acc} active={active} />
        <div id="account-main" className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
