"use client";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/hooks/useAccount';
import AccountLayout from '@/components/account/AccountLayout';
import ProfileOverview from '@/components/account/ProfileOverview';
import MyListings from '@/components/account/MyListings';
import AccountSettings from '@/components/account/AccountSettings';
import { DURATION, EASE_OUT } from '@/lib/design';

const TABS = ['overview', 'listings', 'settings'];

function AccountSkeleton() {
  const { t } = useLanguage();
  return (
    <div role="status" aria-live="polite" className="space-y-4 lg:space-y-6">
      <span className="sr-only">{t('accLoading')}</span>
      <div className="h-9 w-48 rounded-full skeleton" />
      <div className="h-[180px] lg:h-[184px] rounded-panel skeleton" />
      <div className="grid grid-cols-3 gap-3 lg:gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-card skeleton" />)}</div>
      <div className="h-28 rounded-card skeleton" />
    </div>
  );
}

export default function AccountPage() {
  const searchParams = useSearchParams();
  const acc = useAccount();
  const raw = searchParams.get('tab');
  const tab = TABS.includes(raw) ? raw : 'overview';
  const section = searchParams.get('section');

  if (acc.checking || !acc.user) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-[calc(var(--tm-bottom-nav)+1.5rem)]">
        <div className="lg:ms-[280px] xl:ms-[304px]"><AccountSkeleton /></div>
      </div>
    );
  }

  return (
    <AccountLayout acc={acc} active={tab}>
      {!acc.profileLoaded ? (
        <AccountSkeleton />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DURATION.micro, ease: EASE_OUT }}
          >
            {tab === 'overview' && <ProfileOverview acc={acc} />}
            {tab === 'listings' && <MyListings acc={acc} />}
            {tab === 'settings' && <AccountSettings acc={acc} initialSection={section} />}
          </motion.div>
        </AnimatePresence>
      )}
    </AccountLayout>
  );
}
