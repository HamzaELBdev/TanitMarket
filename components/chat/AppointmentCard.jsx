"use client";
import React from 'react';
import { CalendarDays, MapPin, CalendarPlus, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { appointmentStatus, appointmentActions, readAppointment, formatAppointment, buildIcs } from '@/lib/appointment';

const STATUS_STYLE = {
  proposed: 'bg-[#fff0df] text-[#8a4d00]',
  confirmed: 'bg-[#e2f6d5] text-[#054d28]',
  declined: 'bg-[#FFEDE8] text-[#a72027]',
  cancelled: 'bg-[#e8ebe6] text-[#5c6657]',
  expired: 'bg-[#e8ebe6] text-[#5c6657]',
  past: 'bg-[#e8ebe6] text-[#5c6657]',
};

function downloadIcs(appt, title) {
  const blob = new Blob([buildIcs(appt, title)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rendez-vous-tanitmarket.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * A meeting proposal in the thread. Its state is worked out from the messages
 * that follow it (lib/appointment.js), so it stays right on both phones
 * without anything being edited in place.
 */
export default function AppointmentCard({ message, messages, isMe, otherName, productTitle, onAnswer }) {
  const { t, lang } = useLanguage();
  const appt = readAppointment(message);
  if (!appt) return null;

  const status = appointmentStatus(message, messages);
  const actions = appointmentActions(status, { isProposer: isMe });

  return (
    <div className="flex flex-col items-center my-2 animate-chat-bubble">
      <div className="bg-white border border-[#0e0f0c]/15 rounded-2xl p-4 max-w-xs w-full shadow-md space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#868685] flex items-center gap-1">
          <CalendarDays className="w-3 h-3 text-[#0e0f0c]" aria-hidden="true" />
          {isMe ? t('apptYouProposed') : t('apptTheyProposed', { name: message.senderName || otherName })}
        </span>
        <div>
          <p className="font-heading font-extrabold text-lg text-[#0e0f0c]">{formatAppointment(appt.at, lang)}</p>
          <p className="flex items-start gap-1.5 text-sm text-[#454745] mt-1">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="break-words min-w-0">{appt.place}</span>
          </p>
        </div>
        <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>
          {t(`apptStatus_${status}`)}
        </span>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#0e0f0c]/10">
            {actions.includes('decline') && (
              <button type="button" onClick={() => onAnswer(message, 'decline')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#FFEDE8] text-[#a72027] hover:bg-[#a72027] hover:text-white transition cursor-pointer">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t('apptDecline')}
              </button>
            )}
            {actions.includes('confirm') && (
              <button type="button" onClick={() => onAnswer(message, 'confirm')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition cursor-pointer">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('apptConfirm')}
              </button>
            )}
            {actions.includes('cancel') && (
              <button type="button" onClick={() => onAnswer(message, 'cancel')} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-bold bg-[#e8ebe6] text-[#454745] hover:bg-[#d5d9d1] transition cursor-pointer">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {t('apptCancelMeeting')}
              </button>
            )}
          </div>
        )}

        {status === 'confirmed' && (
          <button type="button" onClick={() => downloadIcs(appt, productTitle ? `${t('apptCalendarTitle')} — ${productTitle}` : t('apptCalendarTitle'))} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold border border-[#0e0f0c]/20 text-[#0e0f0c] hover:bg-[#e8ebe6] transition cursor-pointer">
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" /> {t('apptAddCalendar')}
          </button>
        )}
      </div>
    </div>
  );
}
