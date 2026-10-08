"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { SUPPORT_MESSAGE_MAX } from '@/lib/support';
import { subscribeToTicketMessages, sendSupportMessage, markTicketRead } from '@/lib/services/supportService';

function timeLabel(ts, locale) {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Live messages of one support ticket plus the reply box. Shared by the
 * member's /support page (role "user") and the admin inbox (role "admin").
 */
export default function SupportThread({ ticketId, role, senderName, locale = 'fr-FR', labels, onError, className = '' }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToTicketMessages(ticketId, setMessages);
    markTicketRead(ticketId, role);
    return () => unsub();
  }, [ticketId, role]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // A reply that lands while the thread is open should not stay "unread".
    if (messages.length) markTicketRead(ticketId, role);
  }, [messages.length, ticketId, role]);

  const submit = async (e) => {
    e.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    const result = await sendSupportMessage(ticketId, { text, role, senderName });
    setSending(false);
    if (result.ok) setText('');
    else onError?.(result.error);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 min-h-[240px] max-h-[55vh] overflow-y-auto space-y-3 p-3 sm:p-4 bg-[#f7f8f5] rounded-xl border border-[#e8ebe6]" aria-live="polite">
        {messages.length === 0 && <p className="text-sm text-[#868685] text-center py-6">…</p>}
        {messages.map((m) => {
          const mine = m.senderRole === role;
          const fromAdmin = m.senderRole === 'admin';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                mine ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-white border border-[#e8ebe6] text-[#0e0f0c]'
              }`}>
                {!mine && (
                  <p className="text-[11px] font-extrabold text-[#163300] mb-0.5">
                    {fromAdmin ? labels.admin : (m.senderName || labels.member)}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className="mt-1 text-[10px] text-[#5d6559] tabular-nums text-end">{timeLabel(m.createdAt, locale)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex items-end gap-2">
        <label htmlFor={`support-reply-${ticketId}`} className="sr-only">{labels.replyPh}</label>
        <textarea
          id={`support-reply-${ticketId}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form.requestSubmit(); }
          }}
          maxLength={SUPPORT_MESSAGE_MAX}
          rows={1}
          placeholder={labels.replyPh}
          className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-[#163300]/15 focus:outline-none focus:border-[#163300] bg-white text-[#0e0f0c] resize-none max-h-32"
        />
        <button type="submit" disabled={sending || !text.trim()} aria-label={labels.send}
          className="h-11 w-11 shrink-0 rounded-xl bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] flex items-center justify-center disabled:opacity-50 transition-colors">
          <Send className="w-5 h-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
