"use client";
import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const DISMISS_KEY = 'tanit_install_prompt_dismissed_at';
const DISMISS_DAYS = 14;

export default function InstallPwaPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (dismissedAt && daysSinceDismiss < DISMISS_DAYS) return;

    const ua = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    if (iosDevice && isSafari) {
      setIsIos(true);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[72px] md:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-40 bg-white rounded-2xl border border-[#E6EAE3] shadow-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={dismiss}
        aria-label={t('pwaClose')}
        className="absolute top-2.5 right-2.5 p-1 rounded-full text-[#788078] hover:text-[#163300] hover:bg-[#F7F8F5] transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#163300] flex items-center justify-center shrink-0">
          <img src="/logoBg.png" alt="TanitMarket" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-extrabold text-[#163300]">{t('pwaInstallTitle')}</p>
          {isIos ? (
            <p className="text-[11px] text-[#788078] mt-1 leading-relaxed">
              {t('pwaIosInstallPre')} <Share className="w-3 h-3 inline -mt-0.5" /> {t('pwaIosInstallPost')}
            </p>
          ) : (
            <p className="text-[11px] text-[#788078] mt-1 leading-relaxed">
              {t('pwaAndroidInstall')}
            </p>
          )}
        </div>
      </div>

      {!isIos && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#163300] hover:bg-[#1e4400] text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          {t('pwaInstallBtn')}
        </button>
      )}
    </div>
  );
}
