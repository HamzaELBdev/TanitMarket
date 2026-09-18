"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('fr'); // 'fr' (default) or 'ar'

  useEffect(() => {
    const savedLang = localStorage.getItem('tanit_market_lang');
    if (savedLang && (savedLang === 'fr' || savedLang === 'ar')) {
      setLangState(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'fr';
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('tanit_market_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const t = (key, vars) => {
    const raw = translations[lang]?.[key] || translations['fr']?.[key] || key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, varName) => (
      vars[varName] !== undefined ? vars[varName] : match
    ));
  };

  const formatPrice = (amount) => {
    if (amount === 0 || amount === '0' || amount === null || amount === undefined) {
      return lang === 'ar' ? 'مجاني 🎁' : 'Gratuit 🎁';
    }
    const symbol = lang === 'ar' ? 'د.ت' : 'TND';
    return `${amount} ${symbol}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
