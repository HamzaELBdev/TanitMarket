"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  MessageSquare,
  PlusCircle,
  Sparkles,
  MapPin,
  User,
  Bell,
  CheckCheck,
  ExternalLink,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/hooks/useAuth';
import { TUNISIAN_GOVERNORATES } from '@/lib/mockData';
import TunisiaFlag from '@/components/TunisiaFlag';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  subscribeToNotifications,
  markNotificationAsReadInDb,
  subscribeToUserChats
} from '@/lib/firestoreService';

const QUICK_CATEGORIES = [
  { id: 'All', emoji: '🔥', key: 'qcAll', cat: 'All' },
  { id: 'electronics', emoji: '📱', key: 'qcElectronics', cat: 'electronics' },
  { id: 'vehicles', emoji: '🚗', key: 'qcVehicles', cat: 'vehicles' },
  { id: 'home', emoji: '🏠', key: 'qcHome', cat: 'home' },
  { id: 'fashion', emoji: '👗', key: 'qcFashion', cat: 'fashion' },
  { id: 'sports', emoji: '⚽', key: 'catSports', cat: 'sports' },
  { id: 'realestate', emoji: '🏢', key: 'catRealestateFull', cat: 'realestate' },
  { id: 'jobs', emoji: '💼', key: 'catJobsFull', cat: 'jobs' },
];

export default function Header() {
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { user, userProfile, isAdmin } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedGov, setSelectedGov] = useState('Toute la Tunisie');

  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const userAvatar = userProfile?.avatarUrl || user?.photoURL || null;

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
    if (selectedCat !== 'All') params.set('cat', selectedCat);
    if (selectedGov !== 'Toute la Tunisie') params.set('gov', selectedGov);

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

  return (
    <header className="w-full font-body bg-[#ffffff] border-b border-[#0e0f0c]/10 sticky top-0 z-50 backdrop-blur-md bg-[#ffffff]/95 transition-all overflow-x-clip pt-safe">

      {/* 1. Top Announcement Bar */}
      <div className="hidden sm:flex bg-[#0e0f0c] text-[#e8ebe6] py-1.5 px-4 text-xs font-semibold items-center justify-between">
        <div className="max-w-[1380px] mx-auto w-full flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#9fe870] flex-shrink-0" />
            <span className="flex items-center gap-1.5">
              <span>TanitMarket</span>
              <TunisiaFlag className="w-4 h-2.5 rounded-[1.5px] inline-block align-middle" />
              <span>— {t('topBarTagline')}</span>
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-[11px] text-[#9fe870]">
            <span>⚡ {t('topBarFreeBadge')}</span>
            <span>|</span>
            <Link href={user ? "/profile" : "/auth"} className="hover:underline font-semibold text-[#ffffff]">
              {user ? `${t('myAccountLink')} →` : `${t('loginRegisterLink')} →`}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Bar */}
      <div className="w-full max-w-[1380px] mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4 border-b border-[#0e0f0c]/10">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden group-hover:scale-105 transition-all duration-300 flex items-center justify-center shrink-0">
            <img src="/logoBg.png" alt="TanitMarket Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <span className="text-base sm:text-2xl font-heading text-[#0e0f0c] tracking-tight leading-none flex items-center gap-1.5">
              <span className="font-black">Tanit</span>
              <span className="font-black text-[#0e0f0c]">Market</span>
              <TunisiaFlag className="w-5 h-3.5 rounded-[2px] inline-block align-middle" />
            </span>
            <span className="text-[7.5px] sm:text-[9.5px] text-[#868685] font-semibold tracking-wider uppercase hidden sm:block mt-0.5">
              {t('logoSubtitle')}
            </span>
          </div>
        </Link>

        {/* Action Badges & Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          <LanguageSwitcher />

          {/* Favoris */}
          <Link
            href="/favoris"
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition group"
            title={t('myFavoritesTitle')}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${wishlistCount > 0 ? 'fill-[#0e0f0c] text-[#0e0f0c]' : 'text-[#0e0f0c]'}`} />
            <span className="hidden md:inline text-xs font-semibold text-[#0e0f0c]">{t('wishlist')}</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#0e0f0c] text-[#9fe870] text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/chat"
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition group"
            title={t('messagingTitle')}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#0e0f0c] group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline text-xs font-semibold text-[#0e0f0c]">{t('messagesLabel')}</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#9fe870] text-[#0e0f0c] text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white">
                {unreadChatCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(prev => !prev)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c] transition cursor-pointer group"
              title={t('notificationsTitle')}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#0e0f0c] group-hover:scale-110 transition-transform" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#d03238] text-white text-[9.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-[#ffffff] rounded-xl border border-[#0e0f0c]/10 shadow-2xl z-50 overflow-hidden font-body animate-in fade-in duration-150">
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
                        className={`p-3 text-xs transition cursor-pointer hover:bg-[#e8ebe6] flex items-start gap-2.5 ${!n.read ? 'bg-[#e2f6d5]/60 font-semibold' : 'bg-[#ffffff] text-[#868685]'}`}
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
              </div>
            )}
          </div>

          {/* Admin Dashboard */}
          {isAdmin && (
            <Link
              href="/dash"
              className="inline-flex bg-[#0e0f0c] hover:bg-[#252622] text-[#9fe870] text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-full font-semibold items-center gap-1.5 shrink-0 transition-all active:scale-95"
              title={t('adminDashboardTitle')}
            >
              <ShieldAlert className="w-4 h-4 text-[#9fe870]" />
              <span>{t('dashboardLabel')}</span>
            </Link>
          )}

          {/* Create Listing CTA */}
          <Link
            href="/create-listing"
            className="hidden sm:inline-flex bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-xs sm:text-sm py-1.5 px-2.5 sm:py-2.5 sm:px-4 rounded-full font-semibold items-center gap-1.5 shrink-0 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-[#0e0f0c]" />
            <span>{t('postListingCta')}</span>
          </Link>

          {/* Profile Avatar */}
          <Link
            href={user ? "/profile" : "/auth"}
            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#e2f6d5] text-[#0e0f0c] border border-[#0e0f0c]/15 flex items-center justify-center font-bold text-xs hover:border-[#0e0f0c] hover:bg-[#9fe870] transition overflow-hidden shrink-0 group"
            title={user ? t('myProfileTitle') : t('login')}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profil" className="w-full h-full object-cover group-hover:scale-105 transition" />
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#0e0f0c]" />
            )}
            {user && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#9fe870] border border-white rounded-full"></span>
            )}
          </Link>

        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-[#e8ebe6] py-2 px-2.5 sm:px-6 border-b border-[#0e0f0c]/10">
        <form onSubmit={handleSearchSubmit} className="max-w-[1380px] mx-auto w-full flex items-center">
          <div className="flex-1 flex items-center w-full h-10 sm:h-12 rounded-xl border border-[#0e0f0c] bg-[#ffffff] overflow-hidden focus-within:ring-2 focus-within:ring-[#9fe870] transition-all">

            {/* Category */}
            <div className="hidden lg:flex items-center bg-[#e2f6d5] h-full px-3 border-r border-[#0e0f0c]/15 text-xs font-semibold text-[#0e0f0c] shrink-0">
              <Tag className="w-3.5 h-3.5 text-[#0e0f0c] mr-1.5 shrink-0" />
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs text-[#0e0f0c] font-semibold pr-1"
              >
                <option value="All">{t('allCategoriesOption')}</option>
                <option value="fashion">{t('catFashion')}</option>
                <option value="electronics">{t('catElectronicsFull')}</option>
                <option value="home">{t('catHomeGarden')}</option>
                <option value="vehicles">{t('catVehiclesFull')}</option>
                <option value="sports">{t('catSports')}</option>
                <option value="realestate">{t('catRealestateFull')}</option>
                <option value="jobs">{t('catJobsFull')}</option>
              </select>
            </div>

            {/* Input */}
            <div className="flex-1 min-w-0 flex items-center px-2.5 sm:px-4">
              <Search className="w-4 h-4 text-[#0e0f0c] mr-1.5 sm:mr-2 shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholderTunisia')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm text-[#0e0f0c] placeholder-[#868685] bg-transparent focus:outline-none font-medium truncate"
              />
            </div>

            {/* Governorate */}
            <div className="flex items-center bg-[#e2f6d5] h-full px-2 sm:px-3 border-l border-[#0e0f0c]/15 text-xs font-semibold text-[#0e0f0c] shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#0e0f0c] mr-1 shrink-0" />
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-semibold text-[#0e0f0c] focus:outline-none cursor-pointer pr-1 w-24 sm:w-36 truncate"
              >
                {TUNISIAN_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] h-full px-3 sm:px-6 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
              aria-label={t('searchBtn')}
            >
              <Search className="w-4 h-4 text-[#0e0f0c]" />
              <span className="hidden sm:inline">{t('searchBtn')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Horizontal Categories */}
      <div className="bg-[#ffffff] px-2.5 sm:px-6 py-2 border-b border-[#0e0f0c]/10 overflow-x-auto no-scrollbar touch-pan-x">
        <div className="max-w-[1380px] mx-auto flex items-center gap-2 w-max">
          {QUICK_CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.cat;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCat(cat.cat);
                  router.push(`/?cat=${cat.cat}#explore`);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e0f0c] text-[#9fe870]'
                    : 'bg-[#e8ebe6] hover:bg-[#e2f6d5] text-[#0e0f0c]'
                }`}
              >
                <span>{cat.emoji} {t(cat.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

    </header>
  );
}
