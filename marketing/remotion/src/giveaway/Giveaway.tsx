import React from 'react';
import { AbsoluteFill, Html5Audio, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { iris } from '@remotion/transitions/iris';
import { ARABIC, C, Fonts, HEAD, Pill, Sfx, TanitMark, TEXT, Words, rise, useBeatPulse, useIn, useProgress, useVertical } from '../theme';
import G from './config.json';

// "Crée ton compte, gagne 100 DT" — ~23 s promo for the monthly draw.
// Every wording/date lives in ./config.json.
export const GIVEAWAY_SCENES = [
  { id: 'hook', duration: 105 },
  { id: 'steps', duration: 180 },
  { id: 'signup', duration: 165 },
  { id: 'date', duration: 135 },
  { id: 'cta', duration: 165 },
];
const T = 12;
export const GIVEAWAY_FRAMES = GIVEAWAY_SCENES.reduce((s, x) => s + x.duration, 0) - T * (GIVEAWAY_SCENES.length - 1);
// Start the soundtrack 4.5 s in, so its first drop (6 s) lands on the "100 DT" reveal.
const MUSIC_OFFSET = 135;

/* ---------- shared bits ---------- */

const Coins: React.FC<{ from: number; count?: number; originY?: number }> = ({ from, count = 34, originY = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame - from;
  if (t < 0 || t > 90) return null;
  return (
    <>
      {new Array(count).fill(0).map((_, i) => {
        const ang = -Math.PI / 2 + (random(`ca${i}`) - 0.5) * Math.PI * 1.3;
        const sp = 14 + random(`cs${i}`) * 22;
        const x = width / 2 + Math.cos(ang) * sp * t;
        const y = height * originY + Math.sin(ang) * sp * t + 0.75 * t * t;
        const size = 46 + random(`cz${i}`) * 40;
        const spin = Math.cos(t / 4 + i);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
            background: i % 3 ? C.lime : '#FFD11A', border: `4px solid ${i % 3 ? '#7cc653' : '#d9a800'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800,
            fontSize: size * 0.32, color: C.inkDeep, opacity: 1 - Math.max(0, t - 60) / 30,
            transform: `scaleX(${0.25 + 0.75 * Math.abs(spin)})` }}>DT</div>
        );
      })}
    </>
  );
};

const Gift: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.inkDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="4" rx="1" fill={C.lime} />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" fill="#fff" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

/* ---------- 1. Hook: 100 DT à gagner ---------- */

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const pill = useIn(4);
  const n = useIn(40, { damping: 10, stiffness: 140 });
  const count = useProgress(40, 70);
  const sub = useIn(62);
  const win = useIn(14);
  const pulse = useBeatPulse();
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1700, height: 1700, marginLeft: -850, marginTop: -850,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(159,232,112,.4) 0%, rgba(159,232,112,.08) 38%, transparent 65%)',
        transform: `scale(${0.8 + n * 0.2 + pulse * 0.03})` }} />
      {/* light rays */}
      <div style={{ position: 'absolute', inset: -400, opacity: 0.12 * n,
        background: 'repeating-conic-gradient(from 0deg, #9FE870 0deg 6deg, transparent 6deg 24deg)',
        transform: `rotate(${frame * 0.4}deg)` }} />
      <div style={{ position: 'relative', textAlign: 'center', color: '#fff' }}>
        <div style={rise(pill, 30)}>
          <Pill bg={C.lime} color={C.inkDeep} style={{ fontSize: v ? 34 : 30, padding: '16px 32px' }}>
            🎁 TIRAGE AU SORT · {G.month.toUpperCase()}
          </Pill>
        </div>
        <div style={{ marginTop: 20, fontFamily: HEAD, fontWeight: 800, fontSize: v ? 96 : 92, letterSpacing: '-0.03em',
          ...rise(win, 40, 8) }}>Gagne</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.06em', color: C.lime,
          fontSize: v ? 340 : 300, opacity: Math.min(1, n * 1.6), transform: `scale(${0.4 + 0.6 * n + pulse * 0.02})` }}>
          {Math.round(Number(G.amount) * count)}
          <span style={{ fontSize: v ? 150 : 130, marginInlineStart: 18 }}>{G.currency}</span>
        </div>
        <div style={{ ...rise(sub, 30), marginTop: 26, fontFamily: TEXT, fontWeight: 600, fontSize: v ? 44 : 40, color: '#e2e6dc' }}>
          juste en créant ton compte !
        </div>
      </div>
      <Coins from={44} />
      <Sfx name="whoosh" at={30} volume={0.4} />
      <Sfx name="ding" at={44} volume={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 2. Comment participer ---------- */

const STEPS = [
  { n: '1', title: 'Crée ton compte gratuit', desc: `sur ${G.url}`, icon: '👤' },
  { n: '2', title: 'Tu participes automatiquement', desc: 'aucun achat, aucune annonce obligatoire', icon: '🎟️' },
  { n: '3', title: `Tirage au sort ${G.drawLabel}`, desc: `${G.amount} ${G.currency} pour le gagnant`, icon: '🏆' },
];

const Step: React.FC<{ i: number; v: boolean }> = ({ i, v }) => {
  const p = useIn(28 + i * 22, { damping: 13 });
  const s = STEPS[i];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, background: i === 2 ? C.lime : '#fff',
      border: `3px solid ${i === 2 ? C.lime : C.line}`, borderRadius: 32, padding: v ? '34px 36px' : '30px 34px',
      width: v ? 900 : 540, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 120}px) scale(${0.9 + 0.1 * p})` }}>
      <div style={{ width: v ? 104 : 92, height: v ? 104 : 92, borderRadius: '50%', flexShrink: 0, background: i === 2 ? C.ink : C.limePale,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: v ? 50 : 44 }}>{s.icon}</div>
      <div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 24 : 22, color: i === 2 ? C.inkDeep : C.mute, letterSpacing: '0.1em' }}>
          ÉTAPE {s.n}
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 46 : 38, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 6 }}>
          {s.title}
        </div>
        <div style={{ fontFamily: TEXT, fontSize: v ? 28 : 24, color: i === 2 ? C.inkDeep : C.body, marginTop: 8 }}>{s.desc}</div>
      </div>
    </div>
  );
};

const Steps: React.FC = () => {
  const v = useVertical();
  return (
    <AbsoluteFill style={{ background: C.soft, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: v ? 34 : 50 }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 96 : 84, letterSpacing: '-0.04em', color: C.ink, textAlign: 'center' }}>
        <Words text="Comment participer ?" delay={4} highlight={['participer']} color={C.positive} />
      </div>
      <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 26 : 30 }}>
        {[0, 1, 2].map((i) => <Step key={i} i={i} v={v} />)}
      </div>
      {[0, 1, 2].map((i) => <Sfx key={i} name="pop" at={28 + i * 22} volume={0.45} />)}
    </AbsoluteFill>
  );
};

/* ---------- 3. Signup in 30 seconds (phone) ---------- */

const NAME = 'Sana Ben Ali';
const MAIL = 'sana@exemple.tn';
const CLICK = 104;
const DONE = 112;

const Field: React.FC<{ label: string; value: string; active: boolean; pwd?: boolean }> = ({ label, value, active, pwd }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 21, marginBottom: 8, color: C.ink }}>{label}</div>
    <div style={{ height: 58, borderRadius: 12, border: `2px solid ${active ? '#5A7C44' : '#d6ddd0'}`, background: '#fbfcfa',
      boxShadow: active ? '0 0 0 5px rgba(159,232,112,.35)' : 'none', display: 'flex', alignItems: 'center', padding: '0 18px',
      fontFamily: TEXT, fontSize: 22, color: C.ink }}>
      {pwd ? '•'.repeat(value.length) : value}
      {active ? <span style={{ width: 2, height: 26, background: C.ink, marginLeft: 2 }} /> : null}
    </div>
  </div>
);

const Signup: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const phone = useIn(0, { damping: 16, mass: 1 });
  const typed = (s: string, a: number, b: number) => s.slice(0, Math.round(interpolate(frame, [a, b], [0, s.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const name = typed(NAME, 18, 42);
  const mail = typed(MAIL, 46, 70);
  const pwd = typed('motdepasse', 74, 92);
  const press = interpolate(frame, [CLICK - 3, CLICK, CLICK + 8], [1, 0.94, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const done = useIn(DONE, { damping: 11 });
  const left = useIn(6);
  const cur = interpolate(frame, [86, 102], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: v ? 90 : 140, top: v ? 150 : 300, width: v ? 900 : 760, ...rise(left, 40) }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 92 : 96, letterSpacing: '-0.04em', lineHeight: 1, color: C.ink }}>
          30 secondes,<br /><span style={{ color: C.positive }}>c'est tout.</span>
        </div>
        <div style={{ fontFamily: TEXT, fontSize: v ? 36 : 34, color: C.body, marginTop: 26, lineHeight: 1.4 }}>
          Nom, e-mail, mot de passe… et tu es dans le tirage.
        </div>
      </div>

      <div style={{ position: 'absolute', left: v ? 230 : 1140, top: v ? 640 : 90, width: 620, height: v ? 1200 : 1000,
        background: C.ink, borderRadius: 76, padding: 18,
        transform: `translateY(${(1 - phone) * 900}px) rotate(${(1 - phone) * 6 - 2}deg)` }}>
        <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 60, padding: '70px 40px 40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TanitMark size={40} color={C.inkDeep} progress={1} stroke={6} />
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 30 }}>TanitMarket</div>
          </div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 38, letterSpacing: '-0.02em', marginBottom: 24 }}>Bienvenue chez TanitMarket</div>
          <Field label="Nom complet" value={name} active={frame < 44} />
          <Field label="Adresse e-mail" value={mail} active={frame >= 44 && frame < 72} />
          <Field label="Mot de passe" value={pwd} active={frame >= 72 && frame < 96} pwd />
          <div style={{ marginTop: 10, height: 66, borderRadius: 999, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: C.inkDeep, transform: `scale(${press})` }}>
            {frame >= DONE ? '✓ Compte créé' : 'Créer mon compte →'}
          </div>
          {frame >= DONE ? (
            <div style={{ position: 'absolute', left: 30, right: 30, bottom: 40, borderRadius: 28, background: C.ink, color: '#fff',
              padding: '28px 30px', opacity: Math.min(1, done * 1.5), transform: `translateY(${(1 - done) * 120}px)` }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 34, color: C.lime }}>🎉 Tu participes !</div>
              <div style={{ fontFamily: TEXT, fontSize: 22, marginTop: 8, color: '#dfe3da' }}>
                Tirage au sort {G.drawLabel} · {G.amount} {G.currency} à gagner
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* cursor */}
      {frame >= 84 && frame < DONE + 20 ? (
        <svg width="70" height="70" viewBox="0 0 24 24" style={{ position: 'absolute',
          left: (v ? 540 : 1450) + (1 - cur) * 260, top: (v ? 1420 : 760) + (1 - cur) * 300,
          transform: `scale(${press})`, transformOrigin: '0 0' }}>
          <path d="M4 2l16 10-7 1.5L9.5 21z" fill={C.ink} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ) : null}
      <Coins from={DONE} count={26} originY={v ? 0.62 : 0.5} />
      <Sfx name="click" at={CLICK - 1} volume={0.6} />
      <Sfx name="ding" at={DONE} volume={0.7} />
    </AbsoluteFill>
  );
};

/* ---------- 4. Draw date ---------- */

const DrawDate: React.FC = () => {
  const v = useVertical();
  const cal = useIn(6, { damping: 10, stiffness: 120 });
  const t1 = useIn(26);
  const t2 = useIn(40);
  const pulse = useBeatPulse();
  return (
    <AbsoluteFill style={{ background: C.lime, alignItems: 'center', justifyContent: 'center', flexDirection: v ? 'column' : 'row', gap: v ? 70 : 110 }}>
      <div style={{ width: v ? 540 : 420, borderRadius: 48, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 80px -30px rgba(22,51,0,.55)',
        transform: `perspective(1200px) rotateX(${(1 - cal) * 70}deg) scale(${1 + pulse * 0.015})`, opacity: Math.min(1, cal * 1.5) }}>
        <div style={{ background: C.ink, color: C.lime, textAlign: 'center', padding: '22px 0', fontFamily: HEAD, fontWeight: 800,
          fontSize: v ? 68 : 54, letterSpacing: '0.12em' }}>{G.drawMonthShort}</div>
        <div style={{ textAlign: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: v ? 320 : 250, lineHeight: 1.15, color: C.ink, letterSpacing: '-0.05em' }}>
          {G.drawDay}
        </div>
      </div>
      <div style={{ color: C.inkDeep, textAlign: v ? 'center' : 'left', maxWidth: v ? 900 : 760 }}>
        <div style={{ ...rise(t1, 40), fontFamily: HEAD, fontWeight: 800, fontSize: v ? 90 : 88, letterSpacing: '-0.04em', lineHeight: 1 }}>
          Tirage au sort<br />{G.drawLabel}
        </div>
        <div style={{ ...rise(t2, 30), fontFamily: TEXT, fontWeight: 600, fontSize: v ? 38 : 36, marginTop: 28, lineHeight: 1.35 }}>
          Le gagnant sera annoncé sur nos pages Facebook &amp; Instagram 📣
        </div>
      </div>
      <Sfx name="pop" at={8} volume={0.5} />
    </AbsoluteFill>
  );
};

/* ---------- 5. CTA ---------- */

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const draw = useProgress(2, 36);
  const btn = useIn(40, { damping: 11 });
  const url = useIn(56);
  const ar = useIn(68);
  const legal = useIn(80);
  const pulse = frame > 50 ? beatPulse(frame) : 0;
  const fade = interpolate(frame, [140, 165], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.ink, color: '#fff', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 60 }}>
      <div style={{ width: v ? 170 : 150, height: v ? 170 : 150, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TanitMark size={v ? 120 : 104} color={C.inkDeep} progress={draw} stroke={5.5} />
      </div>
      <div style={{ marginTop: 34, fontFamily: HEAD, fontWeight: 800, fontSize: v ? 84 : 80, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
        <Words text={`Tes ${G.amount} ${G.currency} t'attendent !`} delay={10} highlight={[G.amount, G.currency]} />
      </div>
      <div style={{ marginTop: 44, opacity: Math.min(1, btn * 1.5), transform: `scale(${(0.7 + 0.3 * btn) * (1 + pulse * 0.03)})` }}>
        <div style={{ background: C.lime, color: C.inkDeep, borderRadius: 999, padding: v ? '34px 64px' : '30px 60px', fontFamily: HEAD,
          fontWeight: 800, fontSize: v ? 52 : 46, display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Gift size={v ? 56 : 50} /> Crée ton compte
        </div>
      </div>
      <div style={{ ...rise(url, 20), marginTop: 36, fontFamily: TEXT, fontWeight: 700, fontSize: v ? 50 : 44, color: C.lime }}>{G.url}</div>
      <div dir="rtl" style={{ ...rise(ar, 20), marginTop: 22, fontFamily: ARABIC, fontWeight: 700, fontSize: v ? 40 : 36, color: '#e2e6dc' }}>
        {G.arabicLine}
      </div>
      <div style={{ ...rise(legal, 10), position: 'absolute', bottom: v ? 110 : 60, left: 60, right: 60, fontFamily: TEXT,
        fontSize: v ? 24 : 22, color: '#9aa394' }}>{G.legal}</div>
      <AbsoluteFill style={{ background: C.ink, opacity: fade, pointerEvents: 'none' }} />
      <Sfx name="pop" at={42} volume={0.5} />
    </AbsoluteFill>
  );
};

// Plain function (not a hook): beat envelope on the 120 BPM grid.
function beatPulse(frame: number) {
  return Math.exp(-((frame % 15) / 15) * 6);
}

const SCENES: Record<string, React.FC> = { hook: Hook, steps: Steps, signup: Signup, date: DrawDate, cta: Cta };

export const Giveaway: React.FC = () => {
  const { width, height } = useVideoConfig();
  const transitions = [
    wipe({ direction: 'from-left' }),
    slide({ direction: 'from-bottom' }),
    slide({ direction: 'from-right' }),
    iris({ width, height }),
  ];
  const music = (f: number) =>
    0.75 * interpolate(f, [GIVEAWAY_FRAMES - 30, GIVEAWAY_FRAMES], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Fonts />
      <Html5Audio src={staticFile('audio/music.wav')} trimBefore={MUSIC_OFFSET} volume={music} />
      <TransitionSeries>
        {GIVEAWAY_SCENES.map((s, i) => {
          const Scene = SCENES[s.id];
          return (
            <React.Fragment key={s.id}>
              {i > 0 ? (
                <TransitionSeries.Transition presentation={transitions[i - 1] as never} timing={linearTiming({ durationInFrames: T })} />
              ) : null}
              <TransitionSeries.Sequence durationInFrames={s.duration}>
                <Scene />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
