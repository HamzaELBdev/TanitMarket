"use client";
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

// Crisp SVG Flag for Tunisia 🇹🇳
function TunisiaFlag() {
  return (
    <svg className="w-6 h-4 rounded-xs shadow-xs object-cover flex-shrink-0" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#E70013"/>
      <circle cx="600" cy="400" r="200" fill="#FFFFFF"/>
      <circle cx="600" cy="400" r="150" fill="#E70013"/>
      <circle cx="640" cy="400" r="120" fill="#FFFFFF"/>
      <polygon points="610,335 625,380 670,380 633,405 647,450 610,422 573,450 587,405 550,380 595,380" fill="#E70013"/>
    </svg>
  );
}

// Crisp SVG Flag for France 🇫🇷
function FranceFlag() {
  return (
    <svg className="w-6 h-4 rounded-xs shadow-xs object-cover flex-shrink-0" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="600" fill="#002395"/>
      <rect width="300" height="600" x="300" fill="#FFFFFF"/>
      <rect width="300" height="600" x="600" fill="#ED2939"/>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const handleToggle = () => {
    setLang(lang === 'fr' ? 'ar' : 'fr');
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center p-1.5 rounded-full bg-gray-100 hover:bg-gray-200/80 active:scale-95 transition-all duration-200 border border-gray-200/80 shadow-xs cursor-pointer select-none"
      title={lang === 'fr' ? 'Passer en العربية (تونس)' : 'Passer en Français'}
    >
      {lang === 'fr' ? <FranceFlag /> : <TunisiaFlag />}
    </button>
  );
}
