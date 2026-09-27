import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { C, HEAD, TEXT, Sfx, Words, rise, useIn, useProgress, useVertical } from '../theme';

const ITEMS = [
  { img: 'hero-collage-1.webp', title: 'Smartphone 128 Go', price: 890, where: 'Tunis · Il y a 2 h' },
  { img: 'hero-collage-2.webp', title: 'Baskets running T.42', price: 150, where: 'Sousse · Il y a 5 min' },
  { img: 'hero-collage-3.webp', title: 'Lampe design', price: 75, where: 'Sfax · Hier' },
];

const CARD_IN = [30, 38, 46];
const HEART_CLICK = 128;
const OPEN_CLICK = 180;

const Heart: React.FC<{ filled: boolean; pop: number }> = ({ filled, pop }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? C.negative : 'none'}
    stroke={filled ? C.negative : C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: `scale(${1 + pop * 0.5})` }}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const Card: React.FC<{ i: number; v: boolean }> = ({ i, v }) => {
  const frame = useCurrentFrame();
  const item = ITEMS[i];
  const p = useIn(CARD_IN[i], { damping: 12 });
  const count = useProgress(CARD_IN[i] + 6, CARD_IN[i] + 34);
  const liked = i === 1 && frame >= HEART_CLICK;
  const heartPop = i === 1 ? interpolate(frame, [HEART_CLICK, HEART_CLICK + 5, HEART_CLICK + 14], [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const openSpring = useIn(OPEN_CLICK, { damping: 12 });
  const open = i === 1 ? openSpring : 0;
  const float = Math.sin((frame + i * 20) / 22) * 6;

  const W = v ? 900 : 500;
  const left = v ? 90 : 130 + i * 580;
  const top = v ? 560 + i * 430 : 350;
  const photo = v ? { width: 380, height: 390 } : { width: '100%', height: 370 };

  return (
    <div style={{ position: 'absolute', left, top, width: W, background: '#fff', borderRadius: 24, overflow: 'hidden',
      border: `3px solid ${open > 0.05 ? C.lime : C.line}`, display: v ? 'flex' : 'block',
      opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 260 + float}px) rotate(${(1 - p) * 5}deg) scale(${1 + open * 0.05})`,
      boxShadow: open > 0.05 ? `0 30px 60px rgba(22,51,0,${0.18 * open})` : 'none' }}>
      <div style={{ position: 'relative', background: C.soft, flexShrink: 0, ...photo }}>
        <Img src={staticFile(`images/${item.img}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', right: 20, top: 20, width: 64, height: 64, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart filled={liked} pop={heartPop} />
        </div>
      </div>
      <div style={{ padding: v ? '34px 34px' : '24px 28px 28px', fontFamily: TEXT, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: v ? 36 : 30, fontWeight: 600, color: C.ink }}>{item.title}</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 60 : 48, marginTop: 10, color: C.ink }}>
          {Math.round(item.price * count)} <span style={{ fontSize: v ? 30 : 26, color: C.body }}>TND</span>
        </div>
        <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', justifyContent: 'space-between',
          alignItems: v ? 'flex-start' : 'center', gap: v ? 14 : 0, marginTop: 16, fontSize: v ? 26 : 22, color: C.mute }}>
          <span style={{ background: C.limePale, color: C.inkDeep, fontWeight: 700, fontSize: v ? 24 : 20,
            padding: '8px 16px', borderRadius: 9999 }}>Prix négociable</span>
          <span>📍 {item.where}</span>
        </div>
      </div>
    </div>
  );
};

const Cursor: React.FC<{ v: boolean }> = ({ v }) => {
  const frame = useCurrentFrame();
  // targets: off-screen → heart of card 2 → middle of card 2
  const heart = v ? { x: 408, y: 1040 } : { x: 1152, y: 400 };
  const middle = v ? { x: 700, y: 1180 } : { x: 960, y: 560 };
  const start = v ? { x: 1100, y: 2000 } : { x: 1900, y: 1150 };
  const ease = Easing.bezier(0.65, 0, 0.35, 1);
  const k1 = interpolate(frame, [90, 122], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const k2 = interpolate(frame, [145, 175], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const x = start.x + (heart.x - start.x) * k1 + (middle.x - heart.x) * k2;
  const y = start.y + (heart.y - start.y) * k1 + (middle.y - heart.y) * k2;
  const press = (at: number) => interpolate(frame, [at - 3, at, at + 6], [1, 0.8, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const s = Math.min(press(HEART_CLICK), press(OPEN_CLICK));
  const ring = (at: number) => {
    const r = interpolate(frame, [at, at + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return r > 0 && r < 1 ? (
      <div style={{ position: 'absolute', left: -40, top: -40, width: 80, height: 80, borderRadius: '50%',
        border: `4px solid ${C.lime}`, opacity: 1 - r, transform: `scale(${0.3 + r * 1.2})` }} />
    ) : null;
  };
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 10 }}>
      {ring(HEART_CLICK)}
      {ring(OPEN_CLICK)}
      <svg width="64" height="64" viewBox="0 0 24 24" style={{ transform: `scale(${s})`, transformOrigin: '0 0' }}>
        <path d="M4 2l16 10-7 1.5L9.5 21z" fill={C.ink} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const Annonces: React.FC = () => {
  const v = useVertical();
  const k = useIn(4);
  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: v ? 90 : 130, top: v ? 170 : 110, width: v ? 900 : 1700 }}>
        <div style={{ ...rise(k, 20), color: C.positive, fontFamily: TEXT, fontWeight: 700, fontSize: v ? 32 : 28,
          letterSpacing: '0.06em', textTransform: 'uppercase' }}>Fraîchement mis en ligne</div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 104 : 100, letterSpacing: '-0.04em',
          lineHeight: 1, marginTop: 18, color: C.ink }}>
          <Words text="Tout se vend." delay={8} />
          {v ? <br /> : null}
          <Words text="Tout s'achète." delay={18} highlight={["s'achète."]} color={C.positive} />
        </div>
      </div>
      {[0, 1, 2].map((i) => <Card key={i} i={i} v={v} />)}
      <Cursor v={v} />
      {CARD_IN.map((f, i) => <Sfx key={i} name="pop" at={f} volume={0.45} />)}
      <Sfx name="click" at={HEART_CLICK - 1} volume={0.6} />
      <Sfx name="pop" at={HEART_CLICK + 2} volume={0.5} />
      <Sfx name="click" at={OPEN_CLICK - 1} volume={0.6} />
    </AbsoluteFill>
  );
};
