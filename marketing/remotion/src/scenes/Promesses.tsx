import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ARABIC, C, HEAD, TEXT, Sfx, rise, useIn, useVertical } from '../theme';

const PILLARS = [
  { bg: C.lime, fg: C.inkDeep, icBg: C.ink, icFg: C.lime, title: '100 % gratuit',
    d: "Publication gratuite, zéro commission sur vos ventes.",
    icon: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></> },
  { bg: C.ink, fg: '#fff', icBg: C.lime, icFg: C.inkDeep, title: 'Paiement à la livraison',
    d: 'Ou remise en main propre. Aucun paiement en ligne.',
    icon: <><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></> },
  { bg: C.soft, fg: C.ink, icBg: '#fff', icFg: C.ink, title: 'Pensé mobile',
    d: 'Installable en un clic, notifications en temps réel.',
    icon: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></> },
];
const PILLAR_IN = [30, 40, 50];

// Headline cycles through the three app languages, in sync with the pills.
const LANGS = [
  { pill: '🇫🇷 Français', words: ['Simple.', 'Local.', 'Gratuit.'], dir: 'ltr' as const, font: HEAD, from: 0 },
  { pill: 'العربية 🇹🇳', words: ['بسيط.', 'محلي.', 'مجاني.'], dir: 'rtl' as const, font: ARABIC, from: 150 },
  { pill: '🇬🇧 English', words: ['Simple.', 'Local.', 'Free.'], dir: 'ltr' as const, font: HEAD, from: 195 },
];
const LANG_IN = [100, 108, 116];

const Pillar: React.FC<{ i: number; v: boolean }> = ({ i, v }) => {
  const p = useIn(PILLAR_IN[i], { damping: 12 });
  const P = PILLARS[i];
  return (
    <div style={{ position: 'absolute', left: v ? 90 : 130 + i * 580, top: v ? 480 + i * 330 : 330,
      width: v ? 900 : 500, height: v ? 300 : 430, borderRadius: 32, padding: v ? 44 : 48, background: P.bg, color: P.fg,
      display: 'flex', flexDirection: v ? 'row' : 'column', gap: v ? 36 : 0, alignItems: v ? 'center' : 'flex-start',
      opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 200}px) rotate(${(1 - p) * -4}deg)` }}>
      <div style={{ width: 110, height: 110, flexShrink: 0, borderRadius: 28, background: P.icBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', transform: `rotate(${(1 - p) * 40}deg)` }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={P.icFg} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">{P.icon}</svg>
      </div>
      <div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 56 : 58, letterSpacing: '-0.03em', lineHeight: 1.02,
          marginTop: v ? 0 : 40 }}>{P.title}</div>
        <div style={{ fontFamily: TEXT, fontSize: v ? 30 : 28, marginTop: 16, lineHeight: 1.4, opacity: 0.85 }}>{P.d}</div>
      </div>
    </div>
  );
};

export const Promesses: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const langIdx = frame >= LANGS[2].from ? 2 : frame >= LANGS[1].from ? 1 : 0;
  const L = LANGS[langIdx];
  const local = frame - L.from;
  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div dir={L.dir} style={{ position: 'absolute', left: 0, right: 0, top: v ? 170 : 110, textAlign: 'center',
        fontFamily: L.font, fontWeight: 800, fontSize: v ? 110 : 104, letterSpacing: L.dir === 'rtl' ? 0 : '-0.04em',
        color: C.ink, lineHeight: 1.1 }}>
        {L.words.map((w, i) => {
          const p = Math.min(1, Math.max(0, (local - 4 - i * 4) / 10));
          const e = 1 - Math.pow(1 - p, 3);
          const last = i === 2;
          return (
            <span key={`${langIdx}-${i}`} style={{ display: 'inline-block', margin: '0 14px', opacity: e,
              transform: `translateY(${(1 - e) * 50}px)`,
              background: last ? C.lime : undefined, borderRadius: 24, padding: last ? '0 20px' : 0 }}>{w}</span>
          );
        })}
      </div>
      {[0, 1, 2].map((i) => <Pillar key={i} i={i} v={v} />)}
      <div style={{ position: 'absolute', left: 0, right: 0, top: v ? 1540 : 850, display: 'flex', justifyContent: 'center',
        gap: 20 }}>
        {LANGS.map((l, i) => {
          const p = interpolate(frame, [LANG_IN[i], LANG_IN[i] + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const active = i === langIdx && frame >= LANG_IN[2];
          return (
            <div key={l.pill} style={{ ...rise(p, 30), padding: '16px 30px', borderRadius: 9999, fontSize: v ? 34 : 30,
              fontWeight: 600, fontFamily: i === 1 ? ARABIC : TEXT, background: active ? C.ink : C.soft,
              color: active ? C.lime : C.ink }}>{l.pill}</div>
          );
        })}
      </div>
      {PILLAR_IN.map((f, i) => <Sfx key={i} name="pop" at={f} volume={0.45} />)}
      <Sfx name="click" at={LANGS[1].from} volume={0.5} />
      <Sfx name="click" at={LANGS[2].from} volume={0.5} />
    </AbsoluteFill>
  );
};
