"use client";
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/context/LanguageContext';
import { showToast } from '@/lib/swal';
import { REPORT_REASONS, REPORT_DETAILS_MAX, reportErrorKey } from '@/lib/report';
import { submitListingReport } from '@/lib/services/reportsService';

/**
 * "Signaler cette annonce". The report goes to the admins only: the seller is
 * never told who sent it, and nothing is taken down automatically.
 */
export default function ReportListingModal({ isOpen, onClose, listing, reporterName }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const detailsRequired = reason === 'other';

  const close = () => {
    if (sending) return;
    setError('');
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setError('');
    setSending(true);
    const result = await submitListingReport({ listing, reason, details, reporterName });
    setSending(false);

    if (result.ok) {
      showToast(t('reportSent'));
      setDetails('');
      setReason('scam');
      onClose();
      return;
    }
    setError(t(reportErrorKey(result.error)));
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('reportTitle')} size="sm">
      <form onSubmit={submit} className="space-y-4 font-body">
        <p className="text-sm text-[#5c6657]">{t('reportIntro')}</p>

        <fieldset className="space-y-1.5">
          <legend className="sr-only">{t('reportTitle')}</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 min-h-11 px-3 rounded-xl border cursor-pointer text-sm font-semibold transition-colors ${
                reason === r ? 'border-[#163300] bg-brand-mint text-[#163300]' : 'border-[#163300]/10 hover:bg-[#f7f8f5] text-[#313B35]'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => { setReason(r); setError(''); }}
                className="accent-[#163300] w-4 h-4"
              />
              {t(`reportReason_${r}`)}
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="report-details" className="block text-xs font-extrabold text-[#0e0f0c] mb-1">
            {t(detailsRequired ? 'reportDetailsLabelRequired' : 'reportDetailsLabel')}
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => { setDetails(e.target.value); setError(''); }}
            maxLength={REPORT_DETAILS_MAX}
            rows={3}
            required={detailsRequired}
            placeholder={t('reportDetailsPh')}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#163300]/15 focus:outline-none focus:border-[#163300] bg-white text-[#0e0f0c] resize-none"
          />
          <p className="text-[11px] text-[#868685] text-end mt-0.5 tabular-nums">{details.length}/{REPORT_DETAILS_MAX}</p>
        </div>

        <p role="alert" aria-live="polite" className={`text-xs font-bold text-[#a72027] ${error ? '' : 'sr-only'}`}>{error}</p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            disabled={sending}
            className="min-h-11 px-4 rounded-xl text-sm font-bold text-[#454745] hover:bg-[#f7f8f5] transition-colors"
          >
            {t('reportCancel')}
          </button>
          <button
            type="submit"
            disabled={sending}
            className="min-h-11 px-5 rounded-xl bg-[#a72027] hover:bg-[#8b1a20] text-white text-sm font-extrabold disabled:opacity-60 transition-colors"
          >
            {t('reportSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
