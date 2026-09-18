"use client";
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { requestFcmToken } from '@/lib/firebase';
import { saveFcmTokenToDb } from '@/lib/services/authService';

const DISMISS_KEY = 'tanit_notif_prompt_dismissed_at';
const DISMISS_DAYS = 7;

export default function NotificationPermissionPrompt() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || !('Notification' in window)) {
      setVisible(false);
      return;
    }

    // Permission already decided (granted or denied) — nothing left to ask;
    // AuthContext silently refreshes the token when it's already granted.
    if (Notification.permission !== 'default') return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (dismissedAt && daysSinceDismiss < DISMISS_DAYS) return;

    setVisible(true);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const token = await requestFcmToken();
      if (token && user?.uid) {
        await saveFcmTokenToDb(user.uid, token);
      }
    } finally {
      setRequesting(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-44 sm:top-48 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-40 bg-white rounded-2xl border border-[#E6EAE3] shadow-xl p-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <button
        onClick={dismiss}
        aria-label={t('pwaClose')}
        className="absolute top-2.5 right-2.5 p-1 rounded-full text-[#788078] hover:text-[#163300] hover:bg-[#F7F8F5] transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#163300] flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-[#9fe870]" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-extrabold text-[#163300]">{t('notifPromptTitle')}</p>
          <p className="text-[11px] text-[#788078] mt-1 leading-relaxed">
            {t('notifPromptDesc')}
          </p>
        </div>
      </div>

      <button
        onClick={handleEnable}
        disabled={requesting}
        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#163300] hover:bg-[#1e4400] text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60"
      >
        <Bell className="w-3.5 h-3.5" />
        {requesting ? t('notifEnabling') : t('notifEnableBtn')}
      </button>
    </div>
  );
}
