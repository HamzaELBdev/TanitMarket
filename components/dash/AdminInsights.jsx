"use client";
import React from 'react';
import { Megaphone, Star, Mail, ShieldCheck, Users, BarChart3, Eye } from 'lucide-react';
import {
  listingsByCategory,
  listingsByGovernorate,
  dailySeries,
  decisionRates,
  moderationQuality,
  userBreakdown,
  topSellers,
  promotionSummary,
  emailSummary,
  listingEngagement,
} from '@/lib/adminStats';
import { formatDateTime, tsSeconds } from '@/lib/adminFormat';

const formatTnd = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR')} TND`);

function Panel({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-[#e8ebe6] p-4 sm:p-5 space-y-3 ${className}`}>
      <h3 className="font-heading font-extrabold text-base text-[#0e0f0c] flex items-center gap-2">
        <Icon className="w-4.5 h-4.5 text-[#163300]" /> {title}
      </h3>
      {children}
    </section>
  );
}

function BarRows({ rows, labelOf, valueNote }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <p className="text-sm text-[#868685]">Pas encore de données.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="text-xs">
          <div className="flex justify-between gap-2 font-bold text-[#0e0f0c]">
            <span className="truncate">{labelOf(r.key)}</span>
            <span className="shrink-0">{r.count}{valueNote ? <span className="font-normal text-[#868685]"> · {valueNote(r)}</span> : null}</span>
          </div>
          <div className="h-2 rounded-full bg-[#f7f8f5] mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-[#9FE870]" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Sparkline({ series, label }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const total = series.reduce((a, s) => a + s.count, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-[#0e0f0c]">{label}</span>
        <span className="text-[#454745]"><b className="text-base text-[#0e0f0c]">{total}</b> sur 30 jours</span>
      </div>
      <div className="flex items-end gap-[2px] h-14 mt-2" role="img" aria-label={`${label} : ${total} sur 30 jours`}>
        {series.map((s) => (
          <span
            key={s.date.toISOString()}
            title={`${s.date.toLocaleDateString('fr-FR')} : ${s.count}`}
            className="flex-1 rounded-t bg-[#9FE870]"
            style={{ height: `${Math.max(s.count ? 12 : 3, (s.count / max) * 100)}%`, opacity: s.count ? 1 : 0.35 }}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = '' }) {
  return (
    <div className="rounded-xl bg-[#f7f8f5] p-3">
      <div className="text-[11px] text-[#454745]">{label}</div>
      <div className={`font-heading font-extrabold text-xl text-[#0e0f0c] ${tone}`}>{value}</div>
    </div>
  );
}

const pct = (v) => (v == null ? '—' : `${v} %`);

export default function AdminInsights({ listings, users, reviews, emailLogs, adStats = {}, categoryLabel, onManagePromos }) {
  const now = Date.now() / 1000;
  const rates = decisionRates(listings);
  const quality = moderationQuality(listings, now);
  const members = userBreakdown(users);
  const promos = promotionSummary(listings);
  const mails = emailSummary(emailLogs);
  const engagement = listingEngagement(listings, users, adStats);
  const lastFailure = emailLogs.find((l) => l.status === 'failed');

  return (
    <div className="space-y-4" aria-label="Statistiques détaillées">
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Annonces par catégorie" icon={BarChart3}>
          <BarRows
            rows={listingsByCategory(listings)}
            labelOf={categoryLabel}
            valueNote={(r) => `moy. ${formatTnd(r.avgPrice)}`}
          />
        </Panel>
        <Panel title="Annonces par gouvernorat" icon={BarChart3}>
          <BarRows
            rows={listingsByGovernorate(listings)}
            labelOf={(k) => k}
            valueNote={(r) => `moy. ${formatTnd(r.avgPrice)}`}
          />
        </Panel>
      </div>

      <Panel title="Évolution sur 30 jours" icon={BarChart3}>
        <div className="grid sm:grid-cols-2 gap-5">
          <Sparkline series={dailySeries(listings, now)} label="Nouvelles annonces" />
          <Sparkline series={dailySeries(users, now)} label="Nouveaux membres" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Stat label="Taux d'approbation" value={pct(rates.approvalPct)} />
          <Stat label="Taux de rejet" value={pct(rates.rejectionPct)} />
        </div>
      </Panel>

      <Panel title="Annonces les plus consultées" icon={Eye}>
        {engagement.length === 0 ? (
          <p className="text-sm text-[#868685]">Les vues sont comptées depuis cette mise à jour : les premiers chiffres apparaîtront bientôt.</p>
        ) : (
          <ol className="space-y-1.5">
            {engagement.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-bold text-[#0e0f0c]">{r.title || r.id}</span>
                <span className="shrink-0 text-[#454745]">{r.views} vues · {r.favorites} favoris · {r.messages} messages</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Qualité de la modération" icon={ShieldCheck}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Décidées par l'IA" value={quality.byAi} />
            <Stat label="Décidées par un admin" value={quality.byHuman} />
            <Stat label="Rejets de l'IA" value={quality.aiRejected} />
            <Stat
              label="Plus ancienne en attente"
              value={quality.oldestPendingDays == null ? 'Aucune' : `${quality.oldestPendingDays} j`}
              tone={quality.oldestPendingDays >= 2 ? 'text-[#b86700]' : ''}
            />
          </div>
        </Panel>

        <Panel title="Membres" icon={Users}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="E-mail vérifié" value={`${members.emailVerified} / ${members.total}`} />
            <Stat label="Téléphone vérifié" value={`${members.phoneVerified} / ${members.total}`} />
          </div>
          <p className="text-xs text-[#454745]">
            {members.roles.map((r) => `${r.role} : ${r.count}`).join(' · ') || 'Aucun membre.'}
          </p>
          <h4 className="text-xs font-extrabold text-[#0e0f0c] pt-1">Vendeurs les plus actifs</h4>
          <ol className="space-y-1.5">
            {topSellers(listings, users, reviews).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-bold text-[#0e0f0c]">{s.name}</span>
                <span className="shrink-0 text-[#454745]">
                  {s.listings} annonce{s.listings > 1 ? 's' : ''}
                  {s.rating != null && <> · <Star className="inline w-3 h-3 -mt-0.5 fill-[#ffc091] text-[#b86700]" /> {s.rating} ({s.reviews})</>}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Promotions" icon={Megaphone}>
          <p className="text-xs text-[#454745]">
            <b className="text-[#0e0f0c]">Vedette accueil :</b> {promos.hero?.title || 'aucune'}
          </p>
          <p className="text-xs text-[#454745]">
            <b className="text-[#0e0f0c]">Sponsorisées ({promos.sponsored.length}) :</b>{' '}
            {promos.sponsored.slice(0, 5).map((l) => l.title).join(', ') || 'aucune'}
          </p>
          <button
            type="button"
            onClick={onManagePromos}
            className="h-9 px-3 rounded-lg border border-[#e8ebe6] text-xs font-extrabold text-[#0e0f0c] hover:bg-[#f7f8f5]"
          >
            Gérer dans la liste des annonces
          </button>
        </Panel>

        <Panel title="E-mails envoyés" icon={Mail}>
          {mails.total === 0 ? (
            <p className="text-sm text-[#868685]">
              Aucun envoi enregistré. Le journal se remplit à partir du déploiement des Cloud Functions.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Envoyés" value={mails.sent} />
                <Stat label="Échecs" value={mails.failed} tone={mails.failed ? 'text-[#a72027]' : ''} />
                <Stat label="Réussite" value={pct(mails.successPct)} />
              </div>
              {lastFailure && (
                <p className="text-xs text-[#a72027] break-words">
                  Dernier échec ({formatDateTime(tsSeconds(lastFailure.createdAt)) || '—'}) : {lastFailure.subject} → {lastFailure.to}
                  {lastFailure.error ? ` — ${lastFailure.error}` : ''}
                </p>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
