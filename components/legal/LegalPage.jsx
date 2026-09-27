"use client";
import React from 'react';
import Link from 'next/link';
import { FileText, Mail, ShieldCheck, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CONTACT_EMAIL, LAST_UPDATED, LEGAL_ROUTES, PUBLISHER } from '@/lib/legal/config';
import { TERMS } from '@/lib/legal/terms';
import { PRIVACY } from '@/lib/legal/privacy';

const DOCS = { terms: TERMS, privacy: PRIVACY };

const UI = {
  fr: {
    badge: 'Informations légales',
    updated: 'Dernière mise à jour :',
    toc: 'Sommaire',
    contactTitle: 'Une question ?',
    contactBody: "Écrivez-nous, nous vous répondrons dans les meilleurs délais.",
    otherDocs: 'Documents',
  },
  ar: {
    badge: 'معلومات قانونية',
    updated: 'آخر تحديث:',
    toc: 'المحتويات',
    contactTitle: 'لديك سؤال؟',
    contactBody: 'راسلنا وسنجيبك في أقرب الآجال.',
    otherDocs: 'الوثائق',
  },
};

const linkCls = 'font-semibold text-brand-forest underline underline-offset-4 decoration-[#a9b6a0] hover:decoration-brand-forest';

/** Fills {email} {publisher} {terms} {privacy}, then renders **bold** and [label](href). */
function Rich({ text, lang }) {
  const filled = text
    .replaceAll('{email}', `[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`)
    .replaceAll('{publisher}', PUBLISHER[lang])
    .replaceAll('{terms}', LEGAL_ROUTES.terms)
    .replaceAll('{privacy}', LEGAL_ROUTES.privacy);

  const links = (s, keyBase) =>
    s.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!m) return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>;
      const [, label, href] = m;
      return href.startsWith('/') ? (
        <Link key={`${keyBase}-${i}`} href={href} className={linkCls}>{label}</Link>
      ) : (
        <a key={`${keyBase}-${i}`} href={href} className={linkCls} dir="ltr">{label}</a>
      );
    });

  return filled.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-[#0e0f0c]">{links(part.slice(2, -2), `b${i}`)}</strong>
    ) : (
      <React.Fragment key={i}>{links(part, `t${i}`)}</React.Fragment>
    )
  );
}

function formatDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(`${iso}T12:00:00`));
  } catch (e) {
    return iso;
  }
}

function Toc({ sections, label }) {
  return (
    <nav aria-label={label}>
      <ol className="space-y-0.5 text-sm">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`}
              className="flex gap-2.5 rounded-lg px-3 py-2 min-h-11 items-center text-[#454745] hover:bg-brand-mint hover:text-brand-forest transition-colors">
              <span className="w-5 shrink-0 text-xs font-bold text-brand-moss tabular-nums">{i + 1}.</span>
              <span className="leading-snug">{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Shared layout for the CGU and privacy pages. Content comes from
 * lib/legal/{terms,privacy}.js and follows the site language (FR / AR, RTL).
 */
export default function LegalPage({ doc }) {
  const { lang } = useLanguage();
  const l = lang === 'ar' ? 'ar' : 'fr';
  const content = DOCS[doc][l];
  const ui = UI[l];
  const other = doc === 'terms' ? 'privacy' : 'terms';

  return (
    <div className="font-body text-[#0e0f0c]">
      {/* Title band */}
      <section className="bg-brand-hero border-b border-brand-line">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-mint px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-forest">
            {doc === 'terms' ? <FileText className="w-4 h-4" aria-hidden="true" /> : <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
            {ui.badge}
          </span>
          <h1 className="mt-4 font-heading font-extrabold tracking-[-0.03em] leading-[1.05] text-[32px] sm:text-[44px] lg:text-[52px]">
            {content.title}
          </h1>
          <p className="mt-3 text-sm text-[#5b6157]">
            {ui.updated} <time dateTime={LAST_UPDATED}>{formatDate(LAST_UPDATED, l)}</time>
          </p>
          <p className="mt-5 max-w-[720px] text-base sm:text-lg leading-relaxed text-[#454745]">{content.intro}</p>

          <nav aria-label={ui.otherDocs} className="mt-7 inline-flex rounded-full bg-white border border-brand-line p-1">
            {['terms', 'privacy'].map((d) => (
              <Link key={d} href={LEGAL_ROUTES[d]} aria-current={d === doc ? 'page' : undefined}
                className={`min-h-11 inline-flex items-center px-5 rounded-full text-sm font-semibold transition-colors
                  ${d === doc ? 'bg-brand-forest text-white' : 'text-[#5d6559] hover:text-brand-forest'}`}>
                {DOCS[d][l].short}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        {/* Table of contents: collapsible on small screens, sticky column on desktop */}
        <aside className="mb-8 lg:mb-0">
          <details className="lg:hidden rounded-[12px] border border-brand-line bg-white group">
            <summary className="flex items-center justify-between min-h-12 px-4 font-semibold cursor-pointer list-none">
              {ui.toc}
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-1 pb-2"><Toc sections={content.sections} label={ui.toc} /></div>
          </details>
          <div className="hidden lg:block sticky top-28">
            <p className="px-3 mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7d8578]">{ui.toc}</p>
            <Toc sections={content.sections} label={ui.toc} />
          </div>
        </aside>

        <article className="max-w-[760px]">
          {content.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}
              className="scroll-mt-36 pb-8 mb-8 border-b border-brand-line last:border-0">
              <h2 id={`${s.id}-h`} className="flex items-baseline gap-3 font-heading font-extrabold text-xl sm:text-2xl tracking-[-0.02em]">
                <span className="text-brand-moss tabular-nums">{i + 1}.</span>
                <span>{s.title}</span>
              </h2>
              <div className="mt-4 space-y-4 text-[15px] sm:text-base leading-relaxed text-[#454745]">
                {s.blocks.map((b, j) =>
                  typeof b === 'string' ? (
                    <p key={j}><Rich text={b} lang={l} /></p>
                  ) : (
                    <ul key={j} className="space-y-2.5 ps-1">
                      {b.list.map((item, k) => (
                        <li key={k} className="flex gap-3">
                          <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-brand-moss shrink-0" aria-hidden="true" />
                          <span><Rich text={item} lang={l} /></span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}

          <div className="rounded-[20px] bg-brand-forest text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div>
              <p className="font-heading font-extrabold text-xl">{ui.contactTitle}</p>
              <p className="mt-1 text-white/80 text-sm">{ui.contactBody}</p>
            </div>
            <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr"
              className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full bg-brand-lime text-brand-forest font-bold hover:bg-brand-lime-hover transition-colors">
              <Mail className="w-5 h-5" aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <p className="mt-8 text-sm text-[#5b6157]">
            <Link href={LEGAL_ROUTES[other]} className={linkCls}>{DOCS[other][l].title}</Link>
          </p>
        </article>
      </div>
    </div>
  );
}
