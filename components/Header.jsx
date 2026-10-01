"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { resolveUserAvatar } from '@/lib/avatar';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  Plus,
  User,
  Bell,
  CheckCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SearchBar from '@/components/SearchBar';
import { DURATION, EASE_OUT } from '@/lib/design';
import {
  subscribeToNotifications,
  markNotificationAsReadInDb,
  subscribeToUserChats
} from '@/lib/firestoreService';

const iconBtn =
  'relative flex items-center justify-center w-11 h-11 rounded-full text-[#163300] hover:bg-brand-mint active:scale-95 transition duration-200 cursor-pointer';

function CountBadge({ count, tone = 'dark' }) {
  if (!count) return null;
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0.5 end-0.5 text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white ${
        tone === 'alert' ? 'bg-[#d03238] text-white' : 'bg-brand-forest text-brand-lime'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// Hides the mobile search rows while scrolling down (so the sticky header
// stays one row tall and never covers listings) and brings them back on the
// way up. Desktop keeps a single-row header, so this only matters < lg.
//
// The row is inside the sticky header and still takes part in layout, so
// collapsing it shortens the header and pulls the whole page up under the
// viewport: window.scrollY drops by the row's height without the finger
// having moved. Read naively, that looks exactly like scrolling up, which
// expands the row, which pushes the page back down, which looks like
// scrolling down… and the header vibrates. Two things stop that loop:
//
//  - a settle window after each toggle, during which scroll events are used
//    only to re-anchor the baseline, never to decide a new state. The CSS
//    transition is 450ms, so the shift arrives spread over that long, not as
//    one jump.
//  - a threshold larger than the shift the toggle itself produces, and an
//    anchor that only moves when a decision is taken — so a slow deliberate
//    scroll still accumulates past the threshold instead of being reset to
//    the current position on every frame.
const COLLAPSE_SETTLE_MS = 550; // > --tm-dur-enter (450ms)
const COLLAPSE_THRESHOLD = 28; // > the ~16px the collapse itself shifts by
const COLLAPSE_ALWAYS_OPEN_ABOVE = 96;

function useCollapseOnScroll(containerRef) {
  const [collapsed, setCollapsed] = useState(false);
  // The current value has to be readable from the scroll handler without
  // re-subscribing on every change, and it is also written from outside the
  // hook (the row expands itself when it takes focus), so both paths go
  // through this ref — otherwise the handler would believe a state the DOM
  // no longer has and stop toggling.
  const collapsedRef = useRef(false);
  const settleUntilRef = useRef(0);

  const setCollapsedSynced = useCallback((next) => {
    if (collapsedRef.current === next) return;
    collapsedRef.current = next;
    setCollapsed(next);
    // Toggling changes the header's height, which moves the page under the
    // viewport and emits scroll events that are not the user's doing.
    settleUntilRef.current = performance.now() + COLLAPSE_SETTLE_MS;
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const apply = setCollapsedSynced;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;

        // Still absorbing the shift from the last toggle: follow the page,
        // decide nothing.
        if (performance.now() < settleUntilRef.current) {
          lastY = y;
          return;
        }

        const typing = containerRef.current?.contains(document.activeElement);
        if (typing || y < COLLAPSE_ALWAYS_OPEN_ABOVE) {
          apply(false);
          lastY = y;
          return;
        }

        if (y > lastY + COLLAPSE_THRESHOLD) {
          apply(true);
          lastY = y;
        } else if (y < lastY - COLLAPSE_THRESHOLD) {
          apply(false);
          lastY = y;
        }
        // Below the threshold: keep the anchor where it is, so a slow scroll
        // accumulates towards it rather than resetting every frame.
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [containerRef, setCollapsedSynced]);

  return [collapsed, setCollapsedSynced];
}

export default function Header() {
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { user, userProfile, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Account pages use a compact mobile header (no search rows), as in the mockups.
  const compactMobile = pathname === '/profile';

  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const [collapsed, setCollapsed] = useCollapseOnScroll(mobileSearchRef);

  const userAvatar = resolveUserAvatar(userProfile, user);

  // Real-time notifications and chats listeners
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setChats([]);
      return;
    }

    const notifUnsub = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data || []);
    }, isAdmin);

    const chatsUnsub = subscribeToUserChats(user.uid, (chatData) => {
      setChats(chatData || []);
    });

    return () => {
      if (typeof notifUnsub === 'function') notifUnsub();
      if (typeof chatsUnsub === 'function') chatsUnsub();
    };
  }, [user, isAdmin]);

  // Click outside / Escape closes the notification panel
  useEffect(() => {
    if (!showNotifDropdown) return;
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setShowNotifDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showNotifDropdown]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const unreadChatCount = chats.length > 0
    ? chats.filter(c => c.unreadCount > 0 || c.lastMessage?.unread).length
    : 0;

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    for (const notif of notifications) {
      if (!notif.read && notif.id && !notif.id.startsWith('demo-')) {
        await markNotificationAsReadInDb(notif.id);
      }
    }
  };

  const handleNotifClick = async (notif) => {
    setShowNotifDropdown(false);
    if (!notif.read && notif.id && !notif.id.startsWith('demo-')) {
      await markNotificationAsReadInDb(notif.id);
    }
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.link) router.push(notif.link);
  };

  return (
    <header className="w-full font-body sticky top-0 z-50 border-b border-[#163300]/8 backdrop-blur-md bg-white/95 pt-safe">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 lg:gap-4 h-16 lg:h-[76px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group rounded-lg" aria-label="TanitMarket — Accueil">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Image src="/logoBg.png" alt="" width={36} height={36} className="w-full h-full object-contain" preload />
            </span>
            <span className="text-[19px] sm:text-[22px] font-heading font-black text-[#163300] tracking-tight">
              TanitMarket
            </span>
          </Link>

          {/* Desktop search + governorate */}
          <SearchBar layout="inline" className="hidden lg:flex flex-1 max-w-[600px] mx-auto" />

          {/* Actions — one instance of each control, visibility per breakpoint */}
          <div className="flex items-center gap-0.5 shrink-0 ms-auto lg:ms-0">
            <LanguageSwitcher className="me-0.5" />

            {isAdmin && (
              <Link href="/dash" className={`${iconBtn} hidden lg:flex`} title={t('adminDashboardTitle')} aria-label={t('adminDashboardTitle')}>
                <ShieldAlert className="w-5 h-5" />
              </Link>
            )}

            <Link
              href="/favoris"
              className={`${iconBtn} hidden lg:flex`}
              aria-label={`${t('myFavoritesTitle')}${wishlistCount ? ` (${wishlistCount})` : ''}`}
              title={t('myFavoritesTitle')}
            >
              <Heart className="w-5 h-5" />
              <CountBadge count={wishlistCount} />
            </Link>

            <Link
              href="/chat"
              className={`${iconBtn} hidden lg:flex`}
              aria-label={`${t('messagingTitle')}${unreadChatCount ? ` (${unreadChatCount})` : ''}`}
              title={t('messagingTitle')}
            >
              <MessageSquare className="w-5 h-5" />
              <CountBadge count={unreadChatCount} tone="alert" />
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifDropdown(prev => !prev)}
                className={iconBtn}
                aria-label={`${t('openNotifications')}${unreadNotifCount ? ` (${unreadNotifCount})` : ''}`}
                aria-expanded={showNotifDropdown}
                aria-haspopup="true"
                title={t('notificationsTitle')}
              >
                <Bell className="w-5 h-5" />
                <CountBadge count={unreadNotifCount} tone="alert" />
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: DURATION.micro, ease: EASE_OUT }}
                    style={{ transformOrigin: 'top right' }}
                    className="fixed inset-x-4 top-[calc(4.25rem+env(safe-area-inset-top,0px))] lg:absolute lg:inset-x-auto lg:top-full lg:end-0 lg:mt-2 lg:w-96 bg-white rounded-2xl border border-[#163300]/10 shadow-float z-50 overflow-hidden"
                  >
                    <div className="p-3 ps-4 bg-brand-forest text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-lime" />
                        <span className="font-heading font-extrabold text-sm">{t('notificationsTitle')}</span>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="focus-ring-light text-xs font-semibold text-brand-lime hover:underline flex items-center gap-1 cursor-pointer min-h-9 px-2 rounded-full"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> {t('markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#163300]/10">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[#5c6657] font-medium">
                          {t('noNotificationsYet')}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`w-full text-start p-3 ps-4 text-xs transition-colors cursor-pointer hover:bg-brand-mint flex items-start gap-2.5 ${!n.read ? 'bg-brand-mint/60' : 'bg-white'}`}
                          >
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-brand-forest' : 'bg-transparent'}`} />
                            <span className="flex-1 space-y-1 min-w-0">
                              <span className={`block text-[13px] truncate ${!n.read ? 'font-bold text-[#0e0f0c]' : 'font-semibold text-[#454745]'}`}>{n.title}</span>
                              <span className="block text-xs text-[#5c6657] line-clamp-2">{n.body}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-[#7b8576] shrink-0 mt-1 rtl:rotate-180" />
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <Link
              href={user ? '/profile' : '/auth'}
              className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 group"
              aria-label={user ? t('myProfileTitle') : t('login')}
              title={user ? t('myProfileTitle') : t('login')}
            >
              {user ? (
                <UserAvatar
                  src={userAvatar}
                  name={userProfile?.name || user.displayName}
                  email={user.email}
                  size="lg"
                  tone="mint"
                  className="ring-2 ring-white shadow-card group-hover:ring-brand-lime transition"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-brand-mint text-[#163300] flex items-center justify-center ring-2 ring-white shadow-card group-hover:ring-brand-lime transition">
                  <User className="w-5 h-5" />
                </span>
              )}
            </Link>

            {/* Primary CTA */}
            <motion.div
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: DURATION.micro }}
              className="hidden lg:block ms-2"
            >
              <Link
                href="/create-listing"
                className="inline-flex items-center gap-2 h-11 bg-brand-lime hover:bg-brand-lime-hover text-[#163300] text-sm px-4 xl:px-5 rounded-full font-extrabold shadow-card transition-colors whitespace-nowrap"
              >
                <Plus className="w-[18px] h-[18px]" strokeWidth={2.75} />
                <span className="xl:hidden">{t('sellShort')}</span>
                <span className="hidden xl:inline">{t('postListingCta')}</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Mobile/tablet: search + governorate (collapses while scrolling down) */}
        {!compactMobile && (
        <div ref={mobileSearchRef} className="collapse-row lg:hidden" data-collapsed={collapsed} onFocusCapture={() => setCollapsed(false)}>
          <div>
            <SearchBar layout="stacked" className="pb-3" />
          </div>
        </div>
        )}
      </div>
    </header>
  );
}
