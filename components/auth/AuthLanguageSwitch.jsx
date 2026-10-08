"use client";
import LanguageSwitcher from '@/components/LanguageSwitcher';

/** Flag toggle (France / Tunisia). Switching language only re-labels the page — typed values stay. */
export default function AuthLanguageSwitch({ tone = 'light' }) {
  return <LanguageSwitcher tone={tone === 'dark' ? 'dark' : 'light'} />;
}
