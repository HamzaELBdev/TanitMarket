"use client";
import React from 'react';
import Link from 'next/link';
import { Repeat, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { tradeStatus, tradeActions, readTrade } from '@/lib/trade';

const STATUS_STYLE = {
  proposed: 'bg-[#fff0df] text-[#8a4d00]',
  accepted: 'bg-[#e2f6d5] text-[#054d28]',
  declined: 'bg-[#FFEDE8] text-[#a72027]',
  withdrawn: 'bg-[#e8ebe6] text-[#5c6657]',
};

/**
 * A trade proposal in the thread: the item offered, the cash added, and what
 * each side can do. State comes from the messages that follow
 * (lib/trade.js), so both phones agree without anything being edited.
 */
export default function TradeCard({ message, messages, isMe, otherName, onAnswer }) {
  const { t, formatPrice } = useLanguage();
  const trade = readTrade(message);
  if (!trade) return null;

  const status = tradeStatus(message, messages);
  const actions = tradeActions(status, { isProposer: isMe });

  return (
    <div className="flex flex-col items-center my-2 animate-chat-bubble">
      <div className="bg-white border border-[#0e0f0c]/15 rounded-2xl p-4 max-w-xs w-full shadow-md space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#868685] flex items-center gap-1">
          <Repeat className="w-3 h-3 text-[#0e0f0c]" aria-hidden="true" />
          {isMe ? t('tradeYouProposed') : t('tradeTheyProposed', { name: message.senderName || otherName })}
        </span>

        <Link href={`/product/${encodeURIComponent(trade.offeredListingId)}`} className="flex items-center gap-3 rounded-xl border border-[#e8ebe6] p-2 hover:bg-[#f7f8f5] transition">
          {trade.offeredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trade.offeredImage} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
          ) : (
            <span className="w-14 h-14 rounded-lg bg-[#e8ebe6] flex items-center justify-center shrink-0"><Repeat className="w-5 h-5 text-[#868685]" aria-hidden="true" /></span>
          )}
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#868685]">{t('tradeOffered')}</span>
            <span className="block font-heading font-extrabold text-sm text-[#0e0f0c] break-words">{trade.offeredTitle}</span>
          </span>
        </Link>

        {trade.cash > 0 && (
          <p className="text-sm font-bold text-[#0e0f0c]">{t('tradePlusCash', { amount: formatPrice(trade.cash) })}</p>
        )}

        <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>
          {t(`tradeStatus_${status}`)}
        </span>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#0e0f0c]/10">
            {actions.includes('decline') && (
              <button type="button" onClick={() => onAnswer(message, 'decline')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#FFEDE8] text-[#a72027] hover:bg-[#a72027] hover:text-white transition cursor-pointer">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t('tradeDecline')}
              </button>
            )}
            {actions.includes('accept') && (
              <button type="button" onClick={() => onAnswer(message, 'accept')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition cursor-pointer">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('tradeAccept')}
              </button>
            )}
            {actions.includes('withdraw') && (
              <button type="button" onClick={() => onAnswer(message, 'withdraw')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#e8ebe6] text-[#454745] hover:bg-[#d5d9d1] transition cursor-pointer">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t('tradeWithdraw')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
