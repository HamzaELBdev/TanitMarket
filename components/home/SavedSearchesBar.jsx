"use client";
import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/swal';
import { ALL_TUNISIA, savedSearchErrorKey } from '@/lib/savedSearch';
import { subscribeSavedSearches, addSavedSearch, removeSavedSearch } from '@/lib/services/savedSearchesService';

/**
 * "Tell me when something like this is posted". Shown while a search is typed,
 * and — once the member has any — as a row of their saved searches they can
 * remove. The alerts themselves are sent by a Cloud Function when a matching
 * listing goes live.
 */
export default function SavedSearchesBar({ searchQuery, governorate }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const uid = user?.uid;
  const [items, setItems] = useState([]);
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) { setItems([]); return undefined; }
    return subscribeSavedSearches(uid, setItems);
  }, [uid]);

  const typed = String(searchQuery || '').trim();
  if (!typed && items.length === 0) return null;

  const save = async () => {
    if (!uid) { showToast(t('savedSearchLogin'), 'info'); return; }
    setBusy(true);
    const res = await addSavedSearch({ uid, query: typed, governorate, maxPrice: budget, existing: items });
    setBusy(false);
    if (res.ok) { showToast(t('savedSearchSaved')); setBudget(''); } else showToast(t(savedSearchErrorKey(res.error)), 'error');
  };

  const remove = async (id) => {
    try { await removeSavedSearch(id); showToast(t('savedSearchRemoved')); }
    catch { showToast(t('savedSearchFailed'), 'error'); }
  };

  return (
    <div className="rounded-card border border-[#e8ebe6] bg-white p-3 sm:p-4 space-y-3">
      {typed && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-sm font-bold text-[#0e0f0c] min-w-0">
            <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t('savedSearchPrompt', { q: typed })}</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder={t('savedSearchBudget')}
            aria-label={t('savedSearchBudget')}
            className="w-32 rounded-full border border-[#d5d9d1] px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-full bg-[#163300] text-[#9fe870] font-bold text-sm px-4 py-1.5 cursor-pointer disabled:opacity-60"
          >
            {t('savedSearchSave')}
          </button>
        </div>
      )}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#5c6657] mb-1.5">{t('savedSearchTitle')}</p>
          <ul className="flex flex-wrap gap-2">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5 rounded-full bg-[#EDF8E7] text-[#163300] text-xs font-bold ps-3 pe-1.5 py-1">
                <span>
                  {s.query}
                  {s.governorate && s.governorate !== ALL_TUNISIA ? ` · ${s.governorate}` : ''}
                  {s.maxPrice ? ` · ≤ ${s.maxPrice}` : ''}
                </span>
                <button type="button" onClick={() => remove(s.id)} aria-label={t('savedSearchRemove')} className="p-1 rounded-full hover:bg-white/70 cursor-pointer">
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
