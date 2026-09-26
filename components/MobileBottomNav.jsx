"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Heart, MessageSquare, Plus, User, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToUserChats } from '@/lib/firestoreService';
import { DURATION, EASE_OUT, SPRING_TAP } from '@/lib/design';

function NavItem({ href, label, icon: Icon, active, badge, dot }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] min-w-11 rounded-xl transition-colors duration-200 active:scale-95 ${
        active ? 'text-[#163300]' : 'text-[#6b7566] hover:text-[#163300]'
      }`}
    >
      <span className="relative">
        {active && (
          <motion.span
            layoutId="bottom-nav-active"
            transition={{ duration: DURATION.micro, ease: EASE_OUT }}
            className="absolute -inset-x-3 -inset-y-1 rounded-full bg-brand-mint"
          />
        )}
        <Icon className="relative w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 2} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -end-2.5 bg-brand-forest text-brand-lime text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {dot && <span className="absolute -top-0.5 -end-1 bg-[#d03238] w-2.5 h-2.5 rounded-full border-2 border-white" />}
      </span>
      <span className={`text-[11px] tracking-tight ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
    </Link>
  );
}

// Fixed bottom navigation (< lg). Pages reserve room for it with
// `pb-[var(--tm-bottom-nav)]` (see globals.css), incl. the phone safe area.
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [hasUnreadChats, setHasUnreadChats] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setHasUnreadChats(false);
      return;
    }
    const unsub = subscribeToUserChats(user.uid, (chats) => {
      setHasUnreadChats((chats || []).some(c => c.unreadCount > 0 || c.lastMessage?.unread));
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [user]);

  return (
    <nav
      aria-label={t('mainNavLabel')}
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#163300]/10 shadow-[0_-4px_16px_rgba(22,51,0,0.06)] px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-end justify-between max-w-md mx-auto">
        <NavItem href="/" label={t('navHomeLabel')} icon={Home} active={pathname === '/'} />
        <NavItem href="/favoris" label={t('wishlist')} icon={Heart} active={pathname === '/favoris'} badge={wishlistCount} />

        {/* Centre action — Déposer une annonce */}
        <Link href="/create-listing" className="flex-1 flex flex-col items-center -mt-6 group" aria-label={t('postListingCta')}>
          <motion.span
            whileTap={{ scale: 0.9 }}
            transition={SPRING_TAP}
            className="w-14 h-14 rounded-full bg-brand-forest text-brand-lime flex items-center justify-center shadow-float border-4 border-white group-hover:-translate-y-0.5 transition-transform duration-200"
          >
            <Plus className="w-7 h-7" strokeWidth={2.75} />
          </motion.span>
          <span className="text-[11px] font-bold text-[#163300] mt-0.5 tracking-tight">{t('sellShort')}</span>
        </Link>

        {isAdmin ? (
          <NavItem href="/dash" label={t('adminShort')} icon={ShieldAlert} active={pathname === '/dash'} />
        ) : (
          <NavItem href="/chat" label={t('messagesLabel')} icon={MessageSquare} active={pathname === '/chat'} dot={hasUnreadChats} />
        )}
        <NavItem href="/profile" label={t('profileShort')} icon={User} active={pathname === '/profile'} />
      </div>
    </nav>
  );
}
