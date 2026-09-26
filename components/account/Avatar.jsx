"use client";
import React, { useState, useId } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { showToast } from '@/lib/swal';

const SIZES = {
  sm: { box: 'w-14 h-14', text: 'text-xl', px: 56 },
  md: { box: 'w-20 h-20', text: 'text-3xl', px: 80 },
  lg: { box: 'w-24 h-24 lg:w-[104px] lg:h-[104px]', text: 'text-4xl lg:text-5xl', px: 104 },
};

/** Round avatar: photo or initial on the brand violet. */
export function Avatar({ src, name, size = 'md', ring = false }) {
  const s = SIZES[size];
  return (
    <span className={`relative ${s.box} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#5b3fc4] text-white font-heading font-black ${s.text} ${ring ? 'ring-4 ring-brand-lime ring-offset-2 ring-offset-transparent' : ''}`}>
      {src ? (
        <Image src={src} alt="" width={s.px} height={s.px} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{(name || '?').charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

/**
 * Avatar with a camera button that uploads a new photo. Shows real upload
 * progress as a ring around the avatar, then a confirmation toast. On failure
 * the current photo is kept.
 * onUpload(file, onProgress) must resolve with the new URL.
 */
export function AvatarUploader({ src, name, size = 'md', onUpload, dark = false, showLabel = false }) {
  const { t } = useLanguage();
  const inputId = useId();
  const [progress, setProgress] = useState(null); // null | 0..100
  const [preview, setPreview] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(t('accPhotoInvalid'), 'error');
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    setProgress(0);
    try {
      await onUpload(file, setProgress);
      showToast(t('accPhotoUpdated'));
    } catch (err) {
      console.warn('Avatar upload error:', err);
      showToast(t('accPhotoError'), 'error');
    } finally {
      setProgress(null);
      setPreview(null);
      URL.revokeObjectURL(local);
    }
  };

  const uploading = progress !== null;
  const r = 47;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative">
        <span className={`block rounded-full p-1 ${dark ? 'bg-brand-lime/90' : 'bg-transparent'}`}>
          <span className={`block rounded-full ${dark ? 'p-[3px] bg-brand-forest' : ''}`}>
            <Avatar src={preview || src} name={name} size={size} />
          </span>
        </span>

        {/* progress ring */}
        <AnimatePresence>
          {uploading && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
              <motion.circle
                cx="50" cy="50" r={r} fill="none" stroke="#9FE870" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: circ * (1 - (progress || 0) / 100) }}
                transition={{ duration: 0.2 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        <label
          htmlFor={inputId}
          title={t('accChangePhoto')}
          className={`absolute bottom-0 end-0 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus-within:outline focus-within:outline-2 focus-within:outline-brand-lime ${
            dark ? 'bg-[#0e1a06] text-white border-2 border-white/20' : 'bg-white text-[#163300] border border-[#163300]/15 shadow-card'
          }`}
        >
          {uploading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Camera className="w-[18px] h-[18px]" />}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            aria-label={t('accChangePhoto')}
            className="sr-only"
          />
        </label>

        <p role="status" aria-live="polite" className={`absolute top-full mt-1.5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap text-xs font-bold ${dark ? 'text-brand-lime' : 'text-[#163300]'}`}>
          {uploading ? t('accUploading', { n: progress }) : ''}
        </p>

      </div>

      {showLabel && (
        <label
          htmlFor={inputId}
          className={`mt-1 min-h-10 px-4 whitespace-nowrap inline-flex ${uploading ? 'invisible' : ''} items-center rounded-full bg-brand-mint text-[#163300] text-sm font-bold cursor-pointer hover:bg-[#dff2d3] transition-colors`}
        >
          {t('accChangePhoto')}
        </label>
      )}
    </div>
  );
}
