"use client";
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, MessageCircle, Mail } from 'lucide-react';
import SupportThread from '@/components/support/SupportThread';
import { setTicketStatus } from '@/lib/services/supportService';
import { SUPPORT_TOPICS } from '@/lib/support';
import { formatDateTime, tsSeconds } from '@/lib/adminFormat';

const TOPIC_LABELS = {
  help: 'Aide', technical: 'Problème technique', account: 'Compte', sponsoring: 'Sponsoring',
  listing: 'Annonce', report: 'Abus', other: 'Autre',
};
const LABELS = { admin: 'Équipe TanitMarket', member: 'Membre', replyPh: 'Répondre…', send: 'Envoyer' };

/** Admin side of /support: every request, filterable by topic, answered in place. */
export default function SupportInbox({ tickets, adminName }) {
  const [openId, setOpenId] = useState(null);
  const [topic, setTopic] = useState('all');
  const [status, setStatus] = useState('open');

  const open = tickets.find((x) => x.id === openId);
  const visible = tickets.filter((x) => (topic === 'all' || x.topic === topic) && (status === 'all' || x.status === status));

  if (open) {
    const resolved = open.status === 'resolved';
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setOpenId(null)} className="h-9 px-3 rounded-lg border border-[#e8ebe6] bg-white text-xs font-extrabold inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={() => setTicketStatus(open.id, resolved ? 'open' : 'resolved')}
            className="h-9 px-3 rounded-lg bg-[#e2f6d5] text-[#163300] hover:bg-[#9FE870] text-xs font-extrabold inline-flex items-center gap-1.5">
            {resolved ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {resolved ? 'Rouvrir' : 'Marquer comme résolu'}
          </button>
        </div>
        <p className="text-sm font-extrabold text-[#0e0f0c]">
          {TOPIC_LABELS[open.topic] || open.topic} — {open.userName || 'Membre'}
          {open.userEmail && <span className="ms-2 text-xs font-semibold text-[#454745]" dir="ltr">{open.userEmail}</span>}
        </p>
        <SupportThread ticketId={open.id} role="admin" senderName={adminName} labels={LABELS} locale="fr-FR" />
      </div>
    );
  }

  const pill = (active) => `shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition ${active ? 'bg-[#0e0f0c] text-[#9FE870]' : 'bg-white border border-[#e8ebe6] text-[#454745]'}`;

  return (
    <div className="space-y-4">
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filtrer par sujet">
        {['all', ...SUPPORT_TOPICS].map((k) => (
          <button key={k} onClick={() => setTopic(k)} aria-pressed={topic === k} className={pill(topic === k)}>
            {k === 'all' ? 'Tous les sujets' : TOPIC_LABELS[k]}
          </button>
        ))}
      </div>
      <div className="flex gap-2" role="group" aria-label="Filtrer par statut">
        {[['open', 'En cours'], ['resolved', 'Résolus'], ['all', 'Tous']].map(([k, label]) => (
          <button key={k} onClick={() => setStatus(k)} aria-pressed={status === k} className={pill(status === k)}>{label}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#868685]">Aucune demande.</p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((x) => (
            <li key={x.id}>
              <button onClick={() => setOpenId(x.id)}
                className={`w-full text-start rounded-xl border p-3.5 flex items-start gap-3 ${x.unreadAdmin ? 'border-[#ffe6cc] bg-[#fff6ea]' : 'border-[#e8ebe6] bg-white'}`}>
                {x.channel === 'chat' ? <MessageCircle className="w-5 h-5 mt-0.5 shrink-0 text-[#163300]" /> : <Mail className="w-5 h-5 mt-0.5 shrink-0 text-[#163300]" />}
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold text-sm text-[#0e0f0c] truncate">
                    {TOPIC_LABELS[x.topic] || x.topic} — {x.userName || x.userEmail || 'Membre'}
                  </span>
                  <span className="block text-xs text-[#454745] truncate">{x.lastMessage}</span>
                  <span className="block text-[11px] text-[#868685]">
                    {x.channel === 'chat' ? 'Chat' : 'Formulaire'} · {formatDateTime(tsSeconds(x.lastMessageTime)) || ''}
                    {x.status === 'resolved' ? ' · Résolu' : x.lastSenderRole === 'user' ? ' · À répondre' : ''}
                  </span>
                </span>
                {x.unreadAdmin && <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#b86700] shrink-0" aria-label="Non lu" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
