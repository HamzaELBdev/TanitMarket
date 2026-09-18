"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, MessageSquare, PlusCircle, User, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWishlist } from '@/context/WishlistContext';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import { getUserProfileFromDb, checkIfUserIsAdminInDb } from '@/lib/firestoreService';

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfileFromDb(user.uid);
        const adminCheck = profile?.isAdmin === true ||
                           profile?.role === 'Admin' ||
                           profile?.role?.toLowerCase() === 'admin' ||
                           (await checkIfUserIsAdminInDb(user.uid, user.email));
        setIsAdmin(adminCheck);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#ffffff]/95 backdrop-blur-md border-t border-[#0e0f0c]/10 px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-between max-w-md mx-auto relative px-2">

        {/* Accueil */}
        <Link
          href="/"
          title={t('home')}
          className={`flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all active:scale-95 ${
            pathname === '/'
              ? 'text-[#0e0f0c] font-bold'
              : 'text-[#868685] hover:text-[#0e0f0c]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">{t('navHomeLabel')}</span>
        </Link>

        {/* Favoris */}
        <Link
          href="/favoris"
          title={t('wishlist')}
          className={`flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all relative active:scale-95 ${
            pathname === '/favoris'
              ? 'text-[#0e0f0c] font-bold'
              : 'text-[#868685] hover:text-[#0e0f0c]'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#9fe870] text-[#0e0f0c] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight">{t('wishlist')}</span>
        </Link>

        {/* CENTER FLOATING LIME ACTION BUTTON (Déposer / Vendre) */}
        <Link
          href="/create-listing"
          title={t('sellItem')}
          className="flex flex-col items-center -mt-7 group z-10"
        >
          <div className="w-14 h-14 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center shadow-lg border-4 border-white group-active:scale-90 group-hover:scale-105 transition-all duration-300 transform group-hover:-translate-y-0.5">
            <PlusCircle className="w-7 h-7 text-[#0e0f0c] stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
          </div>
          <span className="text-[10px] font-bold text-[#0e0f0c] mt-0.5 tracking-tight">{t('sellShort')}</span>
        </Link>

        {/* Admin Dashboard (Visible only if Admin) */}
        {isAdmin ? (
          <Link
            href="/dash"
            title={t('adminDashboardTitle')}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all active:scale-95 ${
              pathname === '/dash'
                ? 'text-[#0e0f0c] font-bold'
                : 'text-[#868685] hover:text-[#0e0f0c]'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-[#0e0f0c]" />
            <span className="text-[10px] font-semibold text-[#0e0f0c] tracking-tight">{t('adminShort')}</span>
          </Link>
        ) : (
          /* Messages */
          <Link
            href="/chat"
            title={t('messagingTitle')}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all relative active:scale-95 ${
              pathname === '/chat'
                ? 'text-[#0e0f0c] font-bold'
                : 'text-[#868685] hover:text-[#0e0f0c]'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-1 bg-[#9fe870] w-2 h-2 rounded-full"></span>
            </div>
            <span className="text-[10px] font-semibold tracking-tight">{t('messagesLabel')}</span>
          </Link>
        )}

        {/* Profil */}
        <Link
          href="/profile"
          title={t('account')}
          className={`flex flex-col items-center justify-center w-12 h-11 rounded-lg transition-all active:scale-95 ${
            pathname === '/profile'
              ? 'text-[#0e0f0c] font-bold'
              : 'text-[#868685] hover:text-[#0e0f0c]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">{t('profileShort')}</span>
        </Link>

      </div>
    </div>
  );
}
