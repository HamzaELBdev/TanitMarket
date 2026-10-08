"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Mail, ArrowLeft, Lock, LifeBuoy, ChevronRight, Check, ShieldCheck, Wrench, UserRound, Megaphone, FileText, Flag, CircleHelp, Home, Heart, Plus, ShieldAlert, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { CONTACT_EMAIL } from '@/lib/legal/config';
import { SUPPORT_TOPICS, SUPPORT_MESSAGE_MAX, supportErrorKey } from '@/lib/support';
import { createSupportTicket, subscribeToMyTickets } from '@/lib/services/supportService';
import SupportThread from '@/components/support/SupportThread';
import { showToast } from '@/lib/swal';

const TOPIC_ICONS = {
  help: MessageCircle, technical: Wrench, account: UserRound, sponsoring: Megaphone,
  listing: FileText, report: Flag, other: CircleHelp,
};

const CHANNELS = [
  { key: 'chat', icon: MessageCircle, title: 'supportChannelChat', desc: 'supportChannelChatDesc' },
  { key: 'form', icon: Mail, title: 'supportChannelForm', desc: 'supportChannelFormDesc' },
];

export default function SupportClient() {
  const { t, lang } = useLanguage();
  const { user, loading: authLoading, isAdmin } = useAuth();
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
    <header className="relative overflow-hidden rounded-3xl border border-[#163300]/8 bg-brand-mint">
      <div className="flex items-center gap-4 p-5 sm:p-8 lg:p-10">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-forest">
            <LifeBuoy className="w-4 h-4" aria-hidden="true" />{t('supportTitle')}
          </span>
          <h1 className="mt-3 font-heading font-extrabold tracking-[-0.03em] leading-[1.05] text-[28px] sm:text-[40px] lg:text-[44px]">{t('supportHeroTitle')}</h1>
          <p className="mt-1 font-heading font-bold text-base sm:text-xl text-[#163300]">{t('supportHeroSub')}</p>
          <p className="mt-2 max-w-[460px] text-sm sm:text-base text-[#454745]">{t('supportHeroDesc')}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/support-mascot.webp" alt="" width="280" height="280" loading="eager"
          className="shrink-0 w-24 sm:w-44 lg:w-52 h-auto mix-blend-multiply" />
      </div>
    </header>
  );

  const navItems = [
    { href: '/', label: t('navHomeLabel'), icon: Home },
    { href: '/favoris', label: t('wishlist'), icon: Heart },
    { href: '/create-listing', label: t('sellShort'), icon: Plus },
    ...(isAdmin ? [{ href: '/dash', label: t('adminShort'), icon: ShieldAlert }] : []),
    { href: '/profile', label: t('profileShort'), icon: User },
    { href: '/support', label: t('supportTitle'), icon: LifeBuoy, active: true },
  ];

  const sidebar = (
    <nav aria-label={t('supportNavLabel')} className="hidden lg:block sticky top-24 self-start rounded-3xl border border-[#e8ebe6] bg-white p-3">
      <ul className="space-y-1">
        {navItems.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link href={href} aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 min-h-11 px-3 rounded-xl text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#163300] ${
                active ? 'bg-brand-mint text-[#163300]' : 'text-[#454745] hover:bg-[#f7f8f5]'
              }`}>
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />{label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const statusBadge = (x) => (x.status === 'resolved'
    ? <span className="inline-flex items-center gap-1 rounded-full bg-[#eceeea] px-2.5 py-1 text-xs font-bold text-[#454745]"><Check className="w-3 h-3" aria-hidden="true" />{t('supportResolved')}</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f7d3] px-2.5 py-1 text-xs font-bold text-[#163300]"><span className="w-1.5 h-1.5 rounded-full bg-[#2f7d00]" aria-hidden="true" />{t('supportOpen')}</span>);

  const stepTitle = (n, text) => (
    <legend className="flex items-center gap-3 mb-3 font-heading font-extrabold text-lg">
      <span className="flex w-7 h-7 items-center justify-center rounded-full bg-brand-forest text-brand-lime text-sm" aria-hidden="true">{n}</span>
      {text}
    </legend>
  );

  const cardBase = 'relative flex items-center gap-3 rounded-2xl border bg-white p-4 cursor-pointer transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#163300]';

  let body;
  if (authLoading) {
    body = null;
  } else if (!user) {
    body = (
      <div className="max-w-md mx-auto rounded-3xl border border-[#e8ebe6] bg-white p-6 text-center space-y-4">
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
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <form onSubmit={submit} className="space-y-8 min-w-0">
          <fieldset>
            {stepTitle(1, t('supportStep1'))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORT_TOPICS.map((k) => {
                const Icon = TOPIC_ICONS[k] || CircleHelp;
                const on = topic === k;
                return (
                  <label key={k} className={`${cardBase} ${on ? 'border-[#163300] bg-brand-mint shadow-[0_0_0_1px_#163300]' : 'border-[#163300]/10 hover:border-[#163300]/30 hover:bg-[#f7f8f5]'}`}>
                    <input type="radio" name="support-topic" value={k} checked={on}
                      onChange={() => { setTopic(k); setError(''); }} className="sr-only" />
                    <span className={`flex w-11 h-11 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-brand-forest text-brand-lime' : 'bg-brand-mint text-[#163300]'}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-[#0e0f0c]">{t(`supportTopic_${k}`)}</span>
                      <span className="block mt-0.5 text-xs text-[#5d6559]">{t(`supportTopicDesc_${k}`)}</span>
                    </span>
                    {on
                      ? <Check className="w-5 h-5 shrink-0 text-[#163300]" aria-label={t('supportSelected')} />
                      : <ChevronRight className="w-4 h-4 shrink-0 text-[#868685] rtl:rotate-180" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset disabled={!topic} className={`transition-opacity ${topic ? '' : 'opacity-50'}`}>
            {stepTitle(2, t('supportStep2'))}
            {!topic && <p className="text-xs text-[#5d6559] mb-2">{t('supportPickTopicFirst')}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHANNELS.map(({ key, icon: Icon, title, desc }) => {
                const on = channel === key;
                const primary = key === 'chat';
                return (
                  <label key={key} className={`${cardBase} min-h-[88px] ${
                    on ? 'border-[#163300] bg-brand-mint shadow-[0_0_0_1px_#163300]'
                      : primary ? 'border-[#163300]/25 bg-[#f4fbef] hover:bg-brand-mint' : 'border-[#163300]/10 hover:bg-[#f7f8f5]'
                  }`}>
                    <input type="radio" name="support-channel" value={key} checked={on}
                      onChange={() => { setChannel(key); setError(''); }} className="sr-only" />
                    <span className={`flex w-12 h-12 shrink-0 items-center justify-center rounded-full ${primary ? 'bg-brand-forest text-brand-lime' : 'bg-brand-mint text-[#163300]'}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-sm text-[#0e0f0c]">{t(title)}</span>
                      <span className="block mt-0.5 text-xs text-[#5d6559]">{t(desc)}</span>
                    </span>
                    {on
                      ? <Check className="w-5 h-5 shrink-0 text-[#163300]" aria-label={t('supportSelected')} />
                      : <ChevronRight className="w-4 h-4 shrink-0 text-[#868685] rtl:rotate-180" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {topic && channel && (
            <div className="space-y-3 rounded-2xl border border-[#e8ebe6] bg-white p-4 sm:p-5">
              <label htmlFor="support-message" className="block text-sm font-extrabold">
                {t('supportMessageLabel')} <span className="font-semibold text-[#5d6559]">· {t(`supportTopic_${topic}`)}</span>
              </label>
              <textarea id="support-message" value={message} onChange={(e) => { setMessage(e.target.value); setError(''); }}
                maxLength={SUPPORT_MESSAGE_MAX} rows={channel === 'chat' ? 3 : 6} required
                placeholder={t('supportMessagePh')}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-[#163300]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#163300] bg-white text-[#0e0f0c] resize-y" />
              <p role="alert" aria-live="polite" className={`text-xs font-bold text-[#a72027] ${error ? '' : 'sr-only'}`}>{error}</p>
              <button type="submit" disabled={sending}
                className="w-full sm:w-auto min-h-12 px-8 rounded-full bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-sm font-extrabold disabled:opacity-60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300]">
                {t(channel === 'chat' ? 'supportStartChat' : 'supportSend')}
              </button>
            </div>
          )}
        </form>

        <aside aria-label={t('supportMine')} className="space-y-4 min-w-0">
          <section className="rounded-3xl border border-[#e8ebe6] bg-white p-4 sm:p-5">
            <h2 className="font-heading font-extrabold text-lg mb-3">{t('supportMine')}</h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-[#5d6559]">{t('supportNone')}</p>
            ) : (
              <ul className="space-y-2">
                {tickets.map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => setOpenId(x.id)}
                      className="w-full flex items-center gap-3 min-h-14 px-4 py-3 rounded-2xl border border-[#e8ebe6] bg-white hover:bg-[#f7f8f5] text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#163300]">
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 text-sm font-extrabold">
                          {t(`supportTopic_${x.topic}`)}
                          {x.unreadUser && <span className="w-2 h-2 rounded-full bg-[#a72027]" aria-hidden="true" />}
                        </span>
                        <span className="block text-xs text-[#5d6559] truncate">{x.lastMessage}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#5d6559]">
                          {t(x.channel === 'chat' ? 'supportTypeChat' : 'supportTypeForm')}
                          {statusBadge(x)}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="flex items-start gap-3 rounded-2xl bg-brand-mint p-4">
            <ShieldCheck className="w-6 h-6 shrink-0 text-[#163300]" aria-hidden="true" />
            <p className="text-xs text-[#454745]"><span className="block text-sm font-extrabold text-[#163300]">{t('supportPrivate')}</span>{t('supportPrivateDesc')}</p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="font-body text-[#0e0f0c] max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-[calc(var(--tm-bottom-nav)+1.5rem)] lg:pb-12">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {sidebar}
        <div className="min-w-0 max-w-[1000px] xl:max-w-none mx-auto w-full space-y-6 lg:space-y-8">
          {heading}
          {body}
        </div>
      </div>
    </div>
  );
}
