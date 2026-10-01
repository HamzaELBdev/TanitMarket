"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Flag, ExternalLink, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { updateListingStatusInDb } from '@/lib/services/listingsService';
import { resolveReport } from '@/lib/services/reportsService';
import { showConfirm, showToast } from '@/lib/swal';

const REASON_LABELS = {
  scam: 'Arnaque ou fraude',
  prohibited: 'Article interdit',
  wrong_category: 'Mauvaise catégorie',
  duplicate: 'Annonce en double',
  sold_already: 'Déjà vendu ou indisponible',
  other: 'Autre',
};

function when(ts) {
  const ms = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : null);
  if (!ms) return '';
  return new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Reports filed by members. Nothing here acts on its own: an admin reads the
 * report, opens the listing, and either sends it back to moderation (hidden
 * until re-approved) or marks the report dealt with. Reports never remove a
 * listing automatically, because a handful of throwaway accounts could
 * otherwise take a competitor's listing down.
 */
export default function ReportsPanel({ reports, loading, error }) {
  const [showResolved, setShowResolved] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const open = reports.filter((r) => r.status !== 'resolved');
  const visible = showResolved ? reports : open;

  const handleResolve = async (report) => {
    setBusyId(report.id);
    try {
      await resolveReport(report.id);
      showToast('Signalement marqué comme traité');
    } catch (err) {
      console.warn('Resolve report error:', err);
      showToast("Impossible de mettre à jour le signalement", 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (report) => {
    const ok = await showConfirm(
      "Remettre l'annonce en modération ?",
      "Elle sera retirée de la plateforme jusqu'à ce que vous l'approuviez de nouveau depuis la file de modération.",
      'Remettre en modération',
      { danger: true }
    );
    if (!ok) return;
    setBusyId(report.id);
    try {
      await updateListingStatusInDb(report.listingId, 'pending');
      await resolveReport(report.id);
      showToast('Annonce remise en modération');
    } catch (err) {
      console.warn('Review listing error:', err);
      showToast("Impossible de modifier l'annonce", 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#e8ebe6] p-4 sm:p-5" aria-label="Signalements">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm font-bold text-[#454745]">
          {open.length} signalement{open.length > 1 ? 's' : ''} à traiter
        </p>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#454745] cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-[#163300]" />
          Afficher les traités
        </label>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#868685]"><Loader2 className="inline w-4 h-4 animate-spin mr-2" />Chargement…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-[#a72027]">Impossible de charger les signalements.</p>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#868685]">Aucun signalement {showResolved ? '' : 'à traiter'}.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const resolved = r.status === 'resolved';
            return (
              <li key={r.id} className={`border rounded-2xl p-3.5 ${resolved ? 'border-[#e8ebe6] opacity-70' : 'border-[#f3c7c3] bg-[#fffafa]'}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${resolved ? 'bg-[#e2f6d5] text-[#163300]' : 'bg-[#fdecea] text-[#a72027]'}`}>
                    {resolved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Flag className="w-4.5 h-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-sm text-[#0e0f0c] truncate">{r.listingTitle || 'Annonce'}</p>
                    <p className="text-xs text-[#454745] mt-0.5">
                      <strong>{REASON_LABELS[r.reason] || 'Autre'}</strong> · par {r.reporterName || 'un membre'} · {when(r.createdAt)}
                    </p>
                    {r.details && <p className="text-xs text-[#5c6657] italic mt-1.5 break-words">« {r.details} »</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Link href={`/product/${r.listingId}`} className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-[#eef1ec] hover:bg-[#e2f6d5] text-[#163300] text-xs font-bold">
                        <ExternalLink className="w-3.5 h-3.5" /> Voir l'annonce
                      </Link>
                      {!resolved && (
                        <>
                          <button type="button" disabled={busyId === r.id} onClick={() => handleReview(r)} className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-[#fff0df] hover:bg-[#ffe3c2] text-[#8a4d00] text-xs font-bold disabled:opacity-50">
                            <ShieldAlert className="w-3.5 h-3.5" /> Remettre en modération
                          </button>
                          <button type="button" disabled={busyId === r.id} onClick={() => handleResolve(r)} className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full bg-[#163300] hover:bg-[#0e2200] text-brand-lime text-xs font-bold disabled:opacity-50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marquer traité
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
