import React from 'react';
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { C, HEAD, TEXT, Pill, Sfx, Words, rise, useIn, useProgress, useVertical } from '../theme';

// scene-local frames
const T = { item: 22, chip: 52, send: 82, b1: 86, gauge: 96, typing: 126, b2: 166, b3: 206, deal: 236 };

const Bubble: React.FC<{ me?: boolean; at: number; children: React.ReactNode }> = ({ me, at, children }) => {
  const p = useIn(at, { damping: 12, stiffness: 160 });
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: 430, padding: '20px 24px', borderRadius: 26,
      fontSize: 24, lineHeight: 1.35, fontFamily: TEXT,
      background: me ? C.ink : C.soft, color: me ? '#fff' : C.ink,
      [me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 8,
      opacity: Math.min(1, p * 1.6), transformOrigin: me ? '100% 100%' : '0% 100%',
      transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)` }}>
      {children}
    </div>
  );
};

const Offer: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <span style={{ display: 'block', fontFamily: HEAD, fontWeight: 800, fontSize: 36, color, marginTop: 6,
    whiteSpace: 'nowrap' }}>{children}</span>
);

const Typing: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.typing || frame >= T.b2) return null;
  return (
    <div style={{ alignSelf: 'flex-start', background: C.soft, borderRadius: 26, borderBottomLeftRadius: 8,
      padding: '22px 26px', display: 'flex', gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: C.mute,
          transform: `translateY(${Math.sin((frame - i * 4) / 3) * -5}px)` }} />
      ))}
    </div>
  );
};

const Composer: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = useProgress(T.chip, T.chip + 20);
  const price = Math.round(150 - 30 * typed);
  const sent = frame >= T.send;
  const btn = interpolate(frame, [T.send - 3, T.send, T.send + 6], [1, 0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const chips = ['-5 %', '-10 %', '-20 %'];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 24px 34px', background: '#fff',
      borderTop: `2px solid ${C.line}`, fontFamily: TEXT }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {chips.map((c, i) => {
          const on = i === 2 && frame >= T.chip && !sent;
          return (
            <div key={c} style={{ padding: '8px 16px', borderRadius: 9999, fontSize: 20, fontWeight: 700,
              background: on ? C.ink : C.soft, color: on ? C.lime : C.body }}>{c}</div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, background: C.soft, borderRadius: 9999, padding: '16px 22px', fontSize: 22,
          color: sent ? C.mute : C.ink, fontWeight: sent ? 400 : 700 }}>
          {sent ? 'Votre message…' : frame >= T.chip ? `Votre prix : ${price} TND` : 'Votre prix proposé (TND)'}
        </div>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.lime, display: 'flex',
          alignItems: 'center', justifyContent: 'center', transform: `scale(${btn})` }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.inkDeep} strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </div>
      </div>
    </div>
  );
};

const Confetti: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 80) return null;
  return (
    <>
      {new Array(46).fill(0).map((_, i) => {
        const ang = random(`a${i}`) * Math.PI * 2;
        const sp = 9 + random(`v${i}`) * 16;
        const x = Math.cos(ang) * sp * t;
        const y = Math.sin(ang) * sp * t * 0.8 + 0.5 * 0.9 * t * t;
        const colors = [C.lime, C.ink, C.positive, '#FFC091', '#38C8FF'];
        return (
          <div key={i} style={{ position: 'absolute', left: 280 + x, top: 790 + y, width: 14, height: 22,
            background: colors[i % colors.length], borderRadius: 3, opacity: 1 - t / 80,
            transform: `rotate(${t * (random(`r${i}`) * 20 - 10)}deg)` }} />
        );
      })}
    </>
  );
};

export const Nego: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const k = useIn(4);
  const sub = useIn(34);
  const phone = useIn(2, { damping: 16, mass: 1 });
  const item = useIn(T.item);
  const gauge = useProgress(T.gauge, T.gauge + 26);
  const deal = useIn(T.deal, { damping: 10, stiffness: 150 });

  return (
    <AbsoluteFill style={{ background: C.soft, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: v ? 90 : 130, top: v ? 150 : 230, width: v ? 900 : 780 }}>
        <div style={rise(k, 30)}><Pill bg={C.lime} color={C.inkDeep} style={{ fontSize: 24 }}>💬 NÉGOCIATION DIRECTE</Pill></div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 104 : 108, letterSpacing: '-0.04em',
          lineHeight: 1, marginTop: 34, color: C.ink }}>
          <Words text="Proposez votre prix." delay={8} highlight={['prix.']} color={C.positive} />
        </div>
        <div style={{ ...rise(sub, 30), fontFamily: TEXT, fontSize: v ? 36 : 36, color: C.body, marginTop: 30, lineHeight: 1.4 }}>
          Offres et contre-offres en Dinars, directement dans la messagerie. Sans intermédiaire.
        </div>
      </div>

      <div style={{ position: 'absolute', left: v ? 260 : 1100, top: v ? 700 : 70, width: 560, height: 1080,
        background: C.ink, borderRadius: 72, padding: 18,
        transform: `translateY(${(1 - phone) * 900}px) rotate(${(1 - phone) * 8 - 2 + (frame > T.deal ? 2 * deal : 0)}deg)` }}>
        <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 56, overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: 150, borderBottom: `2px solid ${C.line}`, display: 'flex', alignItems: 'flex-end',
            gap: 18, padding: '0 30px 22px', fontFamily: TEXT }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.lime, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 28, color: C.inkDeep }}>Y</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 26 }}>Yassine</div>
              <div style={{ fontSize: 19, color: C.positive }}>● En ligne · Sousse</div>
            </div>
          </div>
          <div style={{ ...rise(item, 20), margin: '20px 26px', display: 'flex', gap: 18, alignItems: 'center',
            background: C.soft, borderRadius: 18, padding: 14, fontFamily: TEXT }}>
            <Img src={staticFile('images/hero-collage-2.webp')} style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 22 }}>Baskets running T.42</div>
              <div style={{ fontSize: 20, color: C.body, marginTop: 4 }}>Prix demandé : <b>150 TND</b></div>
            </div>
          </div>
          <div style={{ padding: '0 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Bubble me at={T.b1}>Salut ! Toujours dispo ?<Offer color={C.lime}>Offre : 120 TND</Offer></Bubble>
            {frame >= T.gauge ? (
              <div style={{ opacity: Math.min(1, gauge * 3) }}>
                <div style={{ height: 12, borderRadius: 9999, background: C.line, overflow: 'hidden' }}>
                  <div style={{ width: `${80 * gauge}%`, height: '100%', background: C.positive, borderRadius: 9999 }} />
                </div>
                <div style={{ fontFamily: TEXT, fontSize: 19, color: C.positive, fontWeight: 600, marginTop: 8,
                  textAlign: 'right' }}>● Offre raisonnable · -20 %</div>
              </div>
            ) : null}
            <Typing />
            <Bubble at={T.b2}>Je peux faire un petit geste 🙂<Offer color={C.ink}>Contre-offre : 135 TND</Offer></Bubble>
            <Bubble me at={T.b3}>Marché conclu 🤝</Bubble>
            {frame >= T.deal ? (
              <div style={{ background: C.lime, color: C.inkDeep, borderRadius: 24, padding: 22, textAlign: 'center',
                fontFamily: HEAD, fontWeight: 800, fontSize: 32, opacity: Math.min(1, deal * 2),
                transform: `scale(${0.6 + 0.4 * deal})` }}>✓ Offre acceptée · 135 TND</div>
            ) : null}
          </div>
          {frame < T.b3 ? <Composer /> : null}
        </div>
        <Confetti at={T.deal} />
      </div>

      <Sfx name="click" at={T.chip} volume={0.5} />
      <Sfx name="click" at={T.send - 1} volume={0.6} />
      <Sfx name="pop" at={T.b1} volume={0.55} />
      <Sfx name="pop" at={T.b2} volume={0.55} />
      <Sfx name="pop" at={T.b3} volume={0.55} />
      <Sfx name="ding" at={T.deal} volume={0.7} />
    </AbsoluteFill>
  );
};
