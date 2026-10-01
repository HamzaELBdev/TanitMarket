"use client";
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { fetchUserListingsFromDb } from '@/lib/services/listingsService';
import { tradeErrorKey, CASH_MAX } from '@/lib/trade';

/** Pick one of your own live listings to offer, optionally with cash on top. */
export default function TradeComposer({ uid, targetListingId, onSubmit, onClose }) {
  const { t } = useLanguage();
  const [items, setItems] = useState(null);
  const [chosen, setChosen] = useState('');
  const [cash, setCash] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchUserListingsFromDb(uid).then((all) => {
      if (alive) setItems(all.filter((l) => l.status === 'approved' && String(l.id) !== String(targetListingId)));
    });
    return () => { alive = false; };
  }, [uid, targetListingId]);

  const submit = async (e) => {
    e.preventDefault();
    const offered = (items || []).find((l) => String(l.id) === chosen);
    setBusy(true);
    const res = await onSubmit({ offered, cash });
    setBusy(false);
    if (res.ok) onClose();
    else setError(t(tradeErrorKey(res.error)));
  };

  return (
    <form onSubmit={submit} className="shrink-0 p-3 bg-[#e2f6d5] border-b border-[#0e0f0c]/10 space-y-2">
      <p className="text-xs font-extrabold text-[#0e0f0c]">{t('tradeTitle')}</p>
      {items === null ? (
        <p className="text-xs text-[#5c6657]" role="status">{t('tradeLoading')}</p>
      ) : items.length === 0 ? (
        <p className="text-xs font-bold text-[#8a4d00]" role="status">{t('tradeNoListings')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <select
            value={chosen}
            onChange={(e) => { setChosen(e.target.value); setError(''); }}
            aria-label={t('tradePick')}
            required
            className="flex-[2] min-w-[200px] rounded-full border border-[#0e0f0c] bg-white px-3 py-2 text-xs font-bold text-[#0e0f0c]"
          >
            <option value="">{t('tradePick')}</option>
            {items.map((l) => <option key={l.id} value={String(l.id)}>{l.title}</option>)}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={CASH_MAX}
            value={cash}
            onChange={(e) => { setCash(e.target.value); setError(''); }}
            placeholder={t('tradeCashPh')}
            aria-label={t('tradeCashPh')}
            className="flex-1 min-w-[130px] rounded-full border border-[#0e0f0c] bg-white px-3 py-2 text-xs font-bold text-[#0e0f0c]"
          />
        </div>
      )}
      {error && <p role="alert" className="text-xs font-bold text-[#a72027]">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-full px-4 py-1.5 text-xs font-bold bg-white text-[#454745] cursor-pointer">{t('apptClose')}</button>
        <button type="submit" disabled={busy || !items?.length} className="rounded-full px-4 py-1.5 text-xs font-bold bg-[#163300] text-[#9fe870] cursor-pointer disabled:opacity-60">{t('tradeSend')}</button>
      </div>
    </form>
  );
}
