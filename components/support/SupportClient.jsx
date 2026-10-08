"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Mail, ArrowLeft, Lock, LifeBuoy, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { CONTACT_EMAIL } from '@/lib/legal/config';
import { SUPPORT_TOPICS, SUPPORT_MESSAGE_MAX, supportErrorKey } from '@/lib/support';
import { createSupportTicket, subscribeToMyTickets } from '@/lib/services/supportService';
import SupportThread from '@/components/support/SupportThread';
import { showToast } from '@/lib/swal';

const CHANNELS = [
  { key: 'chat', icon: MessageCircle, title: 'supportChannelChat', desc: 'supportChannelChatDesc' },
  { key: 'form', icon: Mail, title: 'supportChannelForm', desc: 'supportChannelFormDesc' },
];

export default function SupportClient() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const locale = lang === 'ar' ? 'ar-TN' : 'fr-FR';

  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!user?.uid) { setTickets([]); return undefined; }
    return subscribeToMyTickets(user.uid, setTickets);
  }, [user?.uid]);

  const labels = { admin: t('supportAdmin'), member: '', replyPh: t('supportReplyPh'), send: t('supportReplySend') };
  const openTicket = tickets.find((x) => x.id === openId);

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setError('');
    setSending(true);
    const result = await createSupportTicket({ topic, channel, message });
    setSending(false);
    if (!result.ok) { setError(t(supportErrorKey(result.error))); return; }
    showToast(t(channel === 'chat' ? 'supportChatStarted' : 'supportSent'));
    setMessage('');
    setTopic('');
    setChannel('');
    setOpenId(result.id);
  };

  const heading = (
    <header className="mb-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-mint px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-forest">
        <LifeBuoy className="w-4 h-4" aria-hidden="true" />{t('supportTitle')}
      </span>
      <h1 className="mt-4 font-heading font-extrabold tracking-[-0.03em] leading-[1.05] text-[32px] sm:text-[44px]">{t('supportTitle')}</h1>
      <p className="mt-3 max-w-[620px] text-base text-[#454745]">{t('supportIntro')}</p>
    </header>
  );

  let body;
  if (authLoading) {
    body = null;
  } else if (!user) {
    body = (
      <div className="max-w-md rounded-2xl border border-[#e8ebe6] bg-white p-6 text-center space-y-4">
        <Lock className="w-8 h-8 mx-auto text-[#163300]" aria-hidden="true" />
        <p className="text-sm text-[#454745]">{t('supportLoginNeeded')}</p>
        <Link href="/auth" className="inline-flex items-center justify-center min-h-11 px-6 rounded-full bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-sm font-bold">{t('supportLoginBtn')}</Link>
        <p className="text-xs text-[#5d6559]">{t('supportOrMail')} <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="font-semibold underline">{CONTACT_EMAIL}</a></p>
      </div>
    );
  } else if (openTicket) {
    body = (
      <section className="max-w-2xl">
        <button type="button" onClick={() => setOpenId(null)} className="mb-3 inline-flex items-center gap-1.5 min-h-11 text-sm font-bold text-[#163300]">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />{t('supportCloseThread')}
        </button>
        <p className="mb-3 text-sm font-extrabold">
          {t(`supportTopic_${openTicket.topic}`)}
          <span className="ms-2 text-xs font-bold text-[#5d6559]">
            {t(openTicket.channel === 'chat' ? 'supportTypeChat' : 'supportTypeForm')} · {t(openTicket.status === 'resolved' ? 'supportResolved' : 'supportOpen')}
          </span>
        </p>
        <SupportThread
          ticketId={openTicket.id}
          role="user"
          senderName={user.displayName}
          locale={locale}
          labels={labels}
          onError={(code) => showToast(t(supportErrorKey(code)), 'error')}
        />
      </section>
    );
  } else {
    body = (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <form onSubmit={submit} className="space-y-8 max-w-2xl">
          <fieldset>
            <legend className="font-heading font-extrabold text-lg mb-3">{t('supportStep1')}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPORT_TOPICS.map((k) => (
                <label key={k} className={`flex items-center gap-3 min-h-12 px-4 rounded-xl border cursor-pointer text-sm font-semibold transition-colors ${
                  topic === k ? 'border-[#163300] bg-brand-mint text-[#163300]' : 'border-[#163300]/10 bg-white hover:bg-[#f7f8f5] text-[#313B35]'
                }`}>
                  <input type="radio" name="support-topic" value={k} checked={topic === k}
                    onChange={() => { setTopic(k); setError(''); }} className="accent-[#163300] w-4 h-4" />
                  {t(`supportTopic_${k}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={!topic} className={topic ? '' : 'opacity-50'}>
            <legend className="font-heading font-extrabold text-lg mb-3">{t('supportStep2')}</legend>
            {!topic && <p className="text-xs text-[#5d6559] mb-2">{t('supportPickTopicFirst')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHANNELS.map(({ key, icon: Icon, title, desc }) => (
                <label key={key} className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                  channel === key ? 'border-[#163300] bg-brand-mint' : 'border-[#163300]/10 bg-white hover:bg-[#f7f8f5]'
                }`}>
                  <input type="radio" name="support-channel" value={key} checked={channel === key}
                    onChange={() => { setChannel(key); setError(''); }} className="sr-only" />
                  <Icon className="w-6 h-6 shrink-0 text-[#163300]" aria-hidden="true" />
                  <span>
                    <span className="block font-extrabold text-sm text-[#0e0f0c]">{t(title)}</span>
                    <span className="block mt-0.5 text-xs text-[#5d6559]">{t(desc)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {topic && channel && (
            <div className="space-y-3">
              <label htmlFor="support-message" className="block text-sm font-extrabold">
                {t('supportMessageLabel')} <span className="font-semibold text-[#5d6559]">· {t(`supportTopic_${topic}`)}</span>
              </label>
              <textarea id="support-message" value={message} onChange={(e) => { setMessage(e.target.value); setError(''); }}
                maxLength={SUPPORT_MESSAGE_MAX} rows={channel === 'chat' ? 3 : 6} required
                placeholder={t('supportMessagePh')}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#163300]/15 focus:outline-none focus:border-[#163300] bg-white text-[#0e0f0c] resize-y" />
              <p role="alert" aria-live="polite" className={`text-xs font-bold text-[#a72027] ${error ? '' : 'sr-only'}`}>{error}</p>
              <button type="submit" disabled={sending}
                className="min-h-12 px-6 rounded-full bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-sm font-extrabold disabled:opacity-60 transition-colors">
                {t(channel === 'chat' ? 'supportStartChat' : 'supportSend')}
              </button>
            </div>
          )}
        </form>

        <aside aria-label={t('supportMine')}>
          <h2 className="font-heading font-extrabold text-lg mb-3">{t('supportMine')}</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-[#868685]">{t('supportNone')}</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setOpenId(x.id)}
                    className="w-full flex items-center gap-3 min-h-14 px-4 py-2 rounded-xl border border-[#e8ebe6] bg-white hover:bg-[#f7f8f5] text-start transition-colors">
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 text-sm font-extrabold">
                        {t(`supportTopic_${x.topic}`)}
                        {x.unreadUser && <span className="w-2 h-2 rounded-full bg-[#a72027]" aria-hidden="true" />}
                      </span>
                      <span className="block text-xs text-[#5d6559] truncate">{x.lastMessage}</span>
                      <span className="block text-[11px] text-[#868685]">
                        {t(x.channel === 'chat' ? 'supportTypeChat' : 'supportTypeForm')} · {t(x.status === 'resolved' ? 'supportResolved' : 'supportOpen')}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="font-body text-[#0e0f0c] max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {heading}
      {body}
    </div>
  );
}
