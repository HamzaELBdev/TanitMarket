"use client";
import { useEffect } from 'react';

const SW_URL = '/firebase-messaging-sw.js';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Clean up any stale service worker from an earlier version of the site
    // (a previous PWA attempt registered one, then a later fix force-unregistered
    // it on every load) so returning users aren't stuck serving old cached files
    // from an orphaned worker instead of the current one.
    // A registration whose scriptURL hasn't resolved yet (active/installing/waiting
    // all null, e.g. it's still being fetched) is NOT stale — it may be the
    // registration this same effect just created below. Only unregister when we
    // can actually see a different script.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
        if (scriptURL && !scriptURL.endsWith(SW_URL)) {
          registration.unregister();
        }
      }
    }).catch(() => {});

    navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  }, []);

  return null;
}
