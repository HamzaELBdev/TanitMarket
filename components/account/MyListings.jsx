"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Info, Search, X, ArrowDownUp, ArrowLeft, PackageOpen, SearchX, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { normalizeStatus } from '@/lib/services/listingsService';
import Dropdown from '@/components/ui/Dropdown';
import ListingQuickViewModal from '@/components/ListingQuickViewModal';
import { ListingRow, ListingMobileCard, ListingRowSkeleton, ListingCardSkeleton } from '@/components/account/ListingItems';
import { cardCls } from '@/components/account/ui';
import { TAB_HREF } from '@/components/account/AccountLayout';
import { showConfirm, showToast } from '@/lib/swal';
import { DURATION, EASE_OUT, sectionIn, staggerContainer } from '@/lib/design';

const SORTS = ['newest', 'oldest', 'price-asc', 'price-desc'];
const STATUSES = ['all', 'approved', 'pending', 'rejected', 'reserved', 'sold', 'expired'];

// Filters live in the URL (?status=&q=&sort=) so they survive navigating to
// a listing and back. replaceState avoids a history entry per keystroke.
function useUrlState() {
  const read = () => {
    if (typeof window === 'undefined') return { status: 'all', q: '', sort: 'newest' };
    const sp = new URLSearchParams(window.location.search);
    return {
      status: STATUSES.includes(sp.get('status')) ? sp.get('status') : 'all',
      q: sp.get('q') || '',
      sort: SORTS.includes(sp.get('sort')) ? sp.get('sort') : 'newest',
    };
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const set = (k, v, def) => (v && v !== def ? sp.set(k, v) : sp.delete(k));
    set('status', state.status, 'all');
    set('q', state.q.trim(), '');
    set('sort', state.sort, 'newest');
    const next = `${window.location.pathname}?${sp.toString()}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next);
  }, [state]);
  return [state, (patch) => setState((s) => ({ ...s, ...patch }))];
}

function Empty({ icon: Icon, title, sub, children }) {
  return (
    <div className={`${cardCls} text-center px-6 py-12 space-y-3`}>
      <span className="mx-auto w-14 h-14 rounded-full bg-brand-mint text-[#163300] flex items-center justify-center"><Icon className="w-6 h-6" /></span>
      <p className="font-heading font-extrabold text-[#0e0f0c]">{title}</p>
      {sub && <p className="text-sm text-[#5c6657]">{sub}</p>}
      {children}
    </div>
  );
}

export default function MyListings({ acc }) {
  const { t, formatPrice } = useLanguage();
  const [{ status, q, sort }, setFilters] = useUrlState();
  const [preview, setPreview] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(() => {
    const c = { all: acc.listings.length, approved: 0, pending: 0, rejected: 0, reserved: 0, sold: 0, expired: 0 };
    acc.listings.forEach((i) => { c[normalizeStatus(i.status)] += 1; });
    return c;
  }, [acc.listings]);

  // Other statuses only appear when they actually occur.
  const pills = [
    { id: 'all', label: t('mlAll') },
    { id: 'approved', label: t('mlOnline'), dot: 'bg-[#2ead4b]' },
    { id: 'pending', label: t('mlPending'), dot: 'bg-[#e08a00]' },
    ...(counts.rejected ? [{ id: 'rejected', label: t('mlRejected'), dot: 'bg-[#a72027]' }] : []),
    ...(counts.reserved ? [{ id: 'reserved', label: t('mlReserved'), dot: 'bg-[#6b7566]' }] : []),
    ...(counts.sold ? [{ id: 'sold', label: t('mlSold'), dot: 'bg-[#4b3aa7]' }] : []),
    ...(counts.expired ? [{ id: 'expired', label: t('mlExpired'), dot: 'bg-[#9aa396]' }] : []),
  ];

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return acc.listings
      .filter((i) => status === 'all' || normalizeStatus(i.status) === status)
      .filter((i) => !query || (i.title || '').toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === 'price-asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        if (sort === 'price-desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return sort === 'oldest' ? ta - tb : tb - ta;
      });
  }, [acc.listings, status, q, sort]);

  const handleDelete = async (item) => {
    const ok = await showConfirm(t('mlDeleteTitle'), t('mlDeleteText'), t('mlDelete'), { danger: true });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await acc.deleteListing(item.id);
      showToast(t('mlDeleted'));
    } catch (err) {
      console.warn('Delete listing error:', err);
      showToast(t('mlDeleteError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkSold = async (item) => {
    const ok = await showConfirm(t('mlMarkSoldTitle'), t('mlMarkSoldText'), t('mlMarkSoldConfirm'));
    if (!ok) return;
    setBusyId(item.id);
    try {
      await acc.markListingSold(item.id);
      showToast(t('mlMarkedSold'));
    } catch (err) {
      console.warn('Mark sold error:', err);
      showToast(t('mlStatusError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Both "still available" on a live listing and "put back online" on a sold,
  // reserved or expired one: the same write, told apart only by the message.
  const handleRenew = async (item) => {
    const wasOnline = normalizeStatus(item.status) === 'approved';
    setBusyId(item.id);
    try {
      await acc.renewListing(item.id, item.status);
      showToast(t(wasOnline ? 'mlRenewed' : 'mlRestored'));
    } catch (err) {
      console.warn('Renew listing error:', err);
      showToast(t('mlStatusError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const resetFilters = () => setFilters({ status: 'all', q: '' });
  const loading = acc.listingsLoading;
  const hasListings = acc.listings.length > 0;

  let body;
  if (loading) {
    body = (
      <div role="status" aria-live="polite">
        <span className="sr-only">{t('accLoading')}</span>
        <div className={`hidden md:block ${cardCls}`}>{[0, 1, 2, 3].map((i) => <ListingRowSkeleton key={i} />)}</div>
        <div className="md:hidden space-y-3">{[0, 1, 2].map((i) => <ListingCardSkeleton key={i} />)}</div>
      </div>
    );
  } else if (acc.listingsError) {
    body = (
      <Empty icon={AlertTriangle} title={t('mlLoadError')}>
        <button type="button" onClick={acc.retryListings} className="min-h-11 px-5 rounded-full bg-brand-lime hover:bg-brand-lime-hover text-[#163300] font-bold text-sm transition-colors cursor-pointer">{t('mlRetry')}</button>
      </Empty>
    );
  } else if (!hasListings) {
    body = (
      <Empty icon={PackageOpen} title={t('mlEmpty')} sub={t('mlEmptySub')}>
        <Link href="/create-listing" className="inline-flex items-center gap-2 min-h-11 px-5 rounded-full bg-brand-lime hover:bg-brand-lime-hover text-[#163300] font-bold text-sm transition-colors">
          <PlusCircle className="w-4 h-4" /> {t('postListingCta')}
        </Link>
      </Empty>
    );
  } else if (visible.length === 0) {
    body = (
      <Empty icon={SearchX} title={t('mlNoResults')}>
        <button type="button" onClick={resetFilters} className="min-h-11 px-5 rounded-full border border-[#163300]/20 hover:bg-brand-mint text-[#163300] font-bold text-sm transition-colors cursor-pointer">{t('mlReset')}</button>
      </Empty>
    );
  } else {
    const rowProps = (item, i) => ({ item, index: i, busy: busyId === item.id, onPreview: setPreview, onDelete: handleDelete, onMarkSold: handleMarkSold, onRenew: handleRenew });
    body = (
      <>
        {/* md+: structured list */}
        <div role="table" aria-label={t('mlTitle')} className={`hidden md:block ${cardCls}`}>
          <div role="rowgroup">
            <div role="row" className="grid grid-cols-[minmax(0,1fr)_150px_120px_auto] xl:grid-cols-[minmax(0,1fr)_170px_140px_auto] gap-4 px-4 py-3 text-sm font-semibold text-[#5c6657] border-b border-[#163300]/[0.07] bg-[#fafcf8] rounded-t-card">
              <span role="columnheader">{t('mlColListing')}</span>
              <span role="columnheader">{t('mlColStatus')}</span>
              <span role="columnheader">{t('mlColPrice')}</span>
              <span role="columnheader" className="text-end pe-1 min-w-[150px] xl:min-w-[290px]">{t('mlColActions')}</span>
            </div>
          </div>
          <div role="rowgroup">
            <AnimatePresence initial={true} mode="popLayout">
              {visible.map((item, i) => <ListingRow key={item.id} {...rowProps(item, i)} />)}
            </AnimatePresence>
          </div>
        </div>
        {/* < md: cards */}
        <ul className="md:hidden space-y-3">
          <AnimatePresence initial={true} mode="popLayout">
            {visible.map((item, i) => <ListingMobileCard key={item.id} {...rowProps(item, i)} />)}
          </AnimatePresence>
        </ul>
      </>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer(0.05)} className="space-y-4 lg:space-y-5">
      <Link href={TAB_HREF.overview} aria-label={t('accBack')} className="lg:hidden w-11 h-11 rounded-full bg-[#eef1ec] hover:bg-brand-mint flex items-center justify-center text-[#163300] transition-colors">
        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
      </Link>

      <motion.header variants={sectionIn} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-[40px] text-[#0e0f0c] leading-tight">{t('mlTitle')}</h1>
          <p className="text-sm lg:text-lg text-[#5c6657] mt-0.5">{t('mlSub')}</p>
        </div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: DURATION.micro }}>
          <Link href="/create-listing" aria-label={t('mlNew')} className="inline-flex items-center justify-center gap-2 w-12 h-12 sm:w-auto sm:px-6 rounded-full bg-brand-lime hover:bg-brand-lime-hover text-[#163300] font-extrabold shadow-card transition-colors">
            <PlusCircle className="w-5 h-5" /> <span className="hidden sm:inline">{t('mlNew')}</span>
          </Link>
        </motion.div>
      </motion.header>

      {!loading && counts.pending > 0 && (
        <motion.p variants={sectionIn} role="status" className="flex items-center gap-3 rounded-2xl bg-brand-mint px-4 py-3 text-sm font-medium text-[#163300]">
          <Info className="w-5 h-5 shrink-0 fill-[#163300] text-brand-mint" />
          {t('mlModerationInfo', { n: counts.pending })}
        </motion.p>
      )}

      {hasListings && !loading && (
        <motion.div variants={sectionIn} className="flex flex-col gap-3">
          {/* status filters */}
          <div role="group" aria-label={t('mlColStatus')} className="order-2 md:order-1 flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
            {pills.map((p) => {
              const active = status === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilters({ status: p.id })}
                  aria-pressed={active}
                  className={`relative shrink-0 min-h-11 px-4 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors duration-200 ${active ? 'text-white' : 'text-[#2f3a28] bg-[#f1f4ee] hover:bg-brand-mint'}`}
                >
                  {active && <motion.span layoutId="ml-filter-pill" transition={{ duration: 0.25, ease: EASE_OUT }} className="absolute inset-0 rounded-full bg-brand-forest" />}
                  {p.dot && <span aria-hidden="true" className={`relative w-2 h-2 rounded-full ${p.dot}`} />}
                  <span className="relative">{p.label}</span>
                  <span className={`relative min-w-6 h-6 px-1.5 rounded-full text-xs flex items-center justify-center tabular-nums ${active ? 'bg-white/15 text-brand-lime' : 'bg-white text-[#5c6657]'}`}>{counts[p.id]}</span>
                </button>
              );
            })}
          </div>

          {/* search + sort */}
          <div className="order-1 md:order-2 flex items-center gap-2 sm:gap-3">
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">{t('mlSearch')}</span>
              <Search aria-hidden="true" className="w-[18px] h-[18px] text-[#5c6657] absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={q}
                onChange={(e) => setFilters({ q: e.target.value })}
                placeholder={t('mlSearch')}
                className="w-full min-h-12 ps-11 pe-11 rounded-full border border-[#dfe7d8] bg-white text-sm font-medium text-[#0e0f0c] placeholder-[#8a9384] focus:outline-none focus:border-brand-forest focus:ring-2 focus:ring-brand-lime/50 transition-colors [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button type="button" onClick={() => setFilters({ q: '' })} aria-label={t('mlClearSearch')} className="absolute end-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#5c6657] hover:bg-brand-mint cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
            <Dropdown
              label={t('mlSort')}
              icon={ArrowDownUp}
              value={sort}
              onChange={(v) => setFilters({ sort: v })}
              className="w-12 sm:w-48 shrink-0"
              size="lg"
              iconOnlyMobile
              align="end"
              options={[
                { value: 'newest', label: t('mlSortNewest') },
                { value: 'oldest', label: t('mlSortOldest') },
                { value: 'price-asc', label: t('mlSortPriceAsc') },
                { value: 'price-desc', label: t('mlSortPriceDesc') },
              ]}
            />
          </div>
        </motion.div>
      )}

      <p className="sr-only" role="status" aria-live="polite">{!loading && hasListings ? t('mlCount', { n: visible.length }) : ''}</p>

      <motion.div variants={sectionIn}>{body}</motion.div>

      <ListingQuickViewModal
        item={preview}
        formatPrice={formatPrice}
        onDelete={(id) => { const it = acc.listings.find((l) => l.id === id); if (it) handleDelete(it); }}
        onClose={() => setPreview(null)}
      />
    </motion.div>
  );
}
