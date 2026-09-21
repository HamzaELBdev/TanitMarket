"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Heart,
  MessageSquare,
  PlusCircle,
  MapPin,
  User,
  Bell,
  CheckCheck,
  ExternalLink,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { TUNISIAN_GOVERNORATES } from '@/lib/mockData';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  subscribeToNotifications,
  markNotificationAsReadInDb,
  subscribeToUserChats
} from '@/lib/firestoreService';

export default function Header() {
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { user, userProfile, isAdmin } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGov, setSelectedGov] = useState('Toute la Tunisie');

  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const userAvatar = userProfile?.avatarUrl || user?.photoURL || null;
  const userInitial = (userProfile?.name || user?.displayName || user?.email || '?').charAt(0).toUpperCase();

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

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const unreadChatCount = chats.length > 0
    ? chats.filter(c => c.unreadCount > 0 || c.lastMessage?.unread).length
    : 0;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedGov !== 'Toute la Tunisie') params.set('gov', selectedGov);

    router.push(`/?${params.toString()}#explore`);
  };

  const handleGovChange = (gov) => {
    setSelectedGov(gov);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (gov !== 'Toute la Tunisie') params.set('gov', gov);
    router.push(`/?${params.toString()}#explore`);
  };

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

  const BellButton = ({ className = '' }) => (
    <div className="relative" ref={notifRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowNotifDropdown(prev => !prev)}
        className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition cursor-pointer ${className}`}
        title={t('notificationsTitle')}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadNotifCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#d03238] text-white text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
            {unreadNotifCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-2xl border border-[#0e0f0c]/10 shadow-2xl z-50 overflow-hidden font-body"
          >
            <div className="p-3 bg-[#0e0f0c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#9fe870]" />
                <span className="font-heading font-extrabold text-xs">{t('notificationsTitle')}</span>
              </div>
              {unreadNotifCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-semibold text-[#9fe870] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3" /> {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#0e0f0c]/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#868685] font-semibold">
                  {t('noNotificationsYet')}
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`p-3 text-xs transition cursor-pointer hover:bg-[#e8ebe6] flex items-start gap-2.5 ${!n.read ? 'bg-[#e2f6d5]/60 font-semibold' : 'bg-white text-[#868685]'}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-[#0e0f0c]' : 'bg-transparent'}`}></div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-semibold text-[#0e0f0c] text-xs truncate">{n.title}</p>
                      <p className="text-[11px] text-[#454745] line-clamp-2">{n.body}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#868685] shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const AvatarLink = ({ className = '' }) => (
    <Link
      href={user ? "/profile" : "/auth"}
      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#7f77dd] text-white flex items-center justify-center font-extrabold text-xs sm:text-sm overflow-hidden shrink-0 hover:brightness-95 transition ${className}`}
      title={user ? t('myProfileTitle') : t('login')}
    >
      {userAvatar ? (
        <img src={userAvatar} alt="Profil" className="w-full h-full object-cover" />
      ) : user ? (
        userInitial
      ) : (
        <User className="w-4.5 h-4.5" />
      )}
    </Link>
  );

  return (
    <header className="w-full font-body bg-white sticky top-0 z-50 border-b border-[#0e0f0c]/8 backdrop-blur-md bg-white/95 pt-safe">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-3 space-y-3">

        {/* Row 1: logo + (desktop: search/gov/actions) / (mobile: bell + avatar) */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logoBg.png" alt="TanitMarket" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg sm:text-xl font-heading font-black text-[#0e0f0c] tracking-tight">
              Tanit<span className="text-[#163300]">Market</span>
            </span>
          </Link>

          {/* Desktop: search + governorate */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center gap-2 flex-1 max-w-xl mx-2">
            <div className="flex-1 flex items-center h-11 rounded-full border border-[#e8ebe6] bg-[#f4f6f2] px-4 focus-within:border-[#0e0f0c] focus-within:bg-white transition-colors">
              <Search className="w-4 h-4 text-[#868685] mr-2 shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholderTunisia')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm text-[#0e0f0c] placeholder-[#868685] bg-transparent focus:outline-none font-medium truncate"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={selectedGov}
                onChange={(e) => handleGovChange(e.target.value)}
                className="h-11 pl-9 pr-8 rounded-full border border-[#e8ebe6] bg-[#f4f6f2] text-sm font-semibold text-[#0e0f0c] appearance-none cursor-pointer focus:outline-none focus:border-[#0e0f0c] max-w-[160px] truncate"
              >
                {TUNISIAN_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-[#868685] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-[#868685] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </form>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="/create-listing"
              className="inline-flex items-center gap-1.5 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-sm py-2.5 px-4 rounded-full font-bold transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('postListingCta')}</span>
            </Link>

            {isAdmin && (
              <Link
                href="/dash"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0e0f0c] hover:bg-[#252622] text-[#9fe870] transition-all active:scale-95 shrink-0"
                title={t('adminDashboardTitle')}
              >
                <ShieldAlert className="w-4.5 h-4.5" />
              </Link>
            )}

            <LanguageSwitcher />

            <Link
              href="/favoris"
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition"
              title={t('myFavoritesTitle')}
            >
              <Heart className={`w-4.5 h-4.5 ${wishlistCount > 0 ? 'fill-[#0e0f0c]' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0e0f0c] text-[#9fe870] text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/chat"
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition"
              title={t('messagingTitle')}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#9fe870] text-[#0e0f0c] text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadChatCount}
                </span>
              )}
            </Link>

            <BellButton />
            <AvatarLink />
          </div>

          {/* Mobile: language + bell + avatar */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <BellButton />
            <AvatarLink />
          </div>
        </div>

        {/* Mobile/tablet: search row */}
        <form onSubmit={handleSearchSubmit} className="lg:hidden flex items-center gap-2">
          <div className="flex-1 flex items-center h-11 rounded-full border border-[#e8ebe6] bg-[#f4f6f2] px-4">
            <Search className="w-4 h-4 text-[#868685] mr-2 shrink-0" />
            <input
              type="text"
              placeholder={t('searchPlaceholderTunisia')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-[#0e0f0c] placeholder-[#868685] bg-transparent focus:outline-none font-medium truncate"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            className="w-11 h-11 rounded-full bg-[#163300] text-white flex items-center justify-center shrink-0"
            aria-label={t('searchBtn')}
          >
            <Search className="w-4.5 h-4.5" />
          </motion.button>
        </form>

        {/* Mobile/tablet: governorate row */}
        <div className="lg:hidden relative">
          <select
            value={selectedGov}
            onChange={(e) => handleGovChange(e.target.value)}
            className="w-full flex items-center gap-1.5 text-sm font-semibold text-[#454745] bg-transparent appearance-none cursor-pointer focus:outline-none pl-6 pr-6"
          >
            {TUNISIAN_GOVERNORATES.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-[#454745] absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-[#868685] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </header>
  );
}
