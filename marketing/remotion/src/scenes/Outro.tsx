import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, HEAD, TEXT, Sfx, TanitMark, Words, rise, useBeatPulse, useIn, useProgress, useVertical } from '../theme';

// Local frame 180 = 50 s in the soundtrack: the final chord hit.
const HIT = 180;

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const draw = useProgress(4, 44);
  const tag = useIn(58);
  const cta = useIn(76, { damping: 11 });
  const url = useIn(96);
  const beat = useBeatPulse();
  const pulse = frame >= 76 && frame < HIT ? beat : 0;
  const press = interpolate(frame, [HIT - 3, HIT, HIT + 8], [1, 0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hit = useIn(HIT, { damping: 8, stiffness: 180 });
  const ring = interpolate(frame, [HIT, HIT + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [275, 300], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const markBounce = frame >= HIT ? Math.sin(Math.min(1, hit) * Math.PI) * 0.12 : 0;

  return (
    <AbsoluteFill style={{ background: C.lime, color: C.inkDeep, overflow: 'hidden' }}>
      {ring > 0 && ring < 1 ? (
        <div style={{ position: 'absolute', left: '50%', top: v ? '58%' : '68%', width: 400, height: 400, marginLeft: -200,
          marginTop: -200, borderRadius: '50%', border: `10px solid ${C.ink}`, opacity: 0.35 * (1 - ring),
          transform: `scale(${0.5 + ring * 5})` }} />
      ) : null}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ transform: `scale(${1 + markBounce})` }}>
          <TanitMark size={v ? 280 : 230} color={C.ink} progress={draw} stroke={5} />
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 140 : 160, letterSpacing: '-0.04em', color: C.ink,
          lineHeight: 1, marginTop: 30 }}>
          <Words text="TanitMarket" delay={30} />
        </div>
        <div style={{ ...rise(tag, 30), fontFamily: TEXT, fontWeight: 600, fontSize: v ? 50 : 52, marginTop: 34,
          maxWidth: v ? 860 : 1400, lineHeight: 1.3 }}>
          Ce qui dort chez vous peut faire un heureux.
        </div>
        <div style={{ marginTop: 60, opacity: Math.min(1, cta * 1.5),
          transform: `scale(${(0.7 + 0.3 * cta) * press * (1 + pulse * 0.025)})` }}>
          <div style={{ background: C.ink, color: C.lime, borderRadius: 9999, padding: '30px 64px', fontFamily: HEAD,
            fontWeight: 800, fontSize: v ? 50 : 46, whiteSpace: 'nowrap' }}>Déposez votre annonce →</div>
        </div>
        <div style={{ ...rise(url, 20), fontFamily: TEXT, fontWeight: 700, fontSize: v ? 44 : 40, marginTop: 50,
          letterSpacing: '0.02em' }}>tanitmarket.com 🇹🇳</div>
        <div style={{ ...rise(url, 20), fontFamily: TEXT, fontWeight: 500, fontSize: v ? 30 : 28, marginTop: 14,
          color: C.inkDeep, opacity: 0.75 * Math.min(1, url) }}>Simple. Local. Gratuit.</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.ink, opacity: fadeOut }} />
      <Sfx name="pop" at={78} volume={0.45} />
      <Sfx name="click" at={HIT - 1} volume={0.7} />
    </AbsoluteFill>
  );
};

