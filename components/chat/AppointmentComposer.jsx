"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { PLACE_MAX, appointmentErrorKey, toLocalInputValue, fromLocalInputValue } from '@/lib/appointment';

/** Small form above the message bar: when and where, then send as a card. */
export default function AppointmentComposer({ onSubmit, onClose }) {
  const { t } = useLanguage();
  const [when, setWhen] = useState('');
  const [place, setPlace] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Earliest pick: the next full hour, so the picker cannot open on the past.
  const min = toLocalInputValue(Date.now());

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await onSubmit({ at: fromLocalInputValue(when), place });
    setBusy(false);
    if (res.ok) onClose();
    else setError(t(appointmentErrorKey(res.error)));
  };

  return (
    <form onSubmit={submit} className="shrink-0 p-3 bg-[#e2f6d5] border-b border-[#0e0f0c]/10 space-y-2">
      <p className="text-xs font-extrabold text-[#0e0f0c]">{t('apptTitle')}</p>
      <div className="flex flex-wrap gap-2">
        <input
          type="datetime-local"
          value={when}
          min={min}
          onChange={(e) => { setWhen(e.target.value); setError(''); }}
          aria-label={t('apptWhen')}
          required
          className="flex-1 min-w-[180px] rounded-full border border-[#0e0f0c] bg-white px-3 py-2 text-xs font-bold text-[#0e0f0c]"
        />
        <input
          type="text"
          value={place}
          maxLength={PLACE_MAX}
          onChange={(e) => { setPlace(e.target.value); setError(''); }}
          placeholder={t('apptPlacePh')}
          aria-label={t('apptPlace')}
          required
          className="flex-[2] min-w-[200px] rounded-full border border-[#0e0f0c] bg-white px-3 py-2 text-xs font-bold text-[#0e0f0c]"
        />
      </div>
      {error && <p role="alert" className="text-xs font-bold text-[#a72027]">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="rounded-full px-4 py-1.5 text-xs font-bold bg-white text-[#454745] cursor-pointer">{t('apptClose')}</button>
        <button type="submit" disabled={busy} className="rounded-full px-4 py-1.5 text-xs font-bold bg-[#163300] text-[#9fe870] cursor-pointer disabled:opacity-60">{t('apptSend')}</button>
      </div>
    </form>
  );
}
