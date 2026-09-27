import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion';
import { C, HEAD, TEXT, Sfx, TanitMark, rise, useBeatPulse, useIn, useProgress, useVertical } from '../theme';

const Letters: React.FC<{ text: string; delay: number; color: string }> = ({ text, delay, color }) => (
  <>
    {text.split('').map((ch, i) => (
      <Letter key={i} ch={ch} delay={delay + i * 2} color={color} />
    ))}
  </>
);

const Letter: React.FC<{ ch: string; delay: number; color: string }> = ({ ch, delay, color }) => {
  const p = useIn(delay, { damping: 11 });
  return (
    <span style={{ display: 'inline-block', color, opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 90}px) rotate(${(1 - p) * 12}deg)` }}>
      {ch}
    </span>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const draw = useProgress(4, 50);
  const glow = useIn(0, { damping: 30 });
  const pulse = useBeatPulse();
  const tag1 = useIn(88);
  const tag2 = useIn(100);
  const outZoom = interpolate(frame, [150, 195], [1, 1.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const markLift = useIn(40, { damping: 18 });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${outZoom})` }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1600, height: 1600, marginLeft: -800,
          marginTop: -800, borderRadius: '50%', opacity: glow,
          transform: `scale(${0.7 + glow * 0.3 + pulse * 0.02})`,
          background: 'radial-gradient(circle, rgba(159,232,112,.34) 0%, rgba(159,232,112,.08) 35%, transparent 65%)' }} />
        {/* drifting lime particles */}
        {new Array(40).fill(0).map((_, i) => {
          const x = random(`x${i}`) * 100;
          const speed = 0.4 + random(`s${i}`) * 1.2;
          const y = 110 - ((frame * speed * 0.35 + random(`y${i}`) * 120) % 120);
          const size = 3 + random(`z${i}`) * 7;
          return (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size,
              borderRadius: '50%', background: C.lime, opacity: 0.15 + random(`o${i}`) * 0.35 }} />
          );
        })}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ transform: `translateY(${(1 - markLift) * 60}px) scale(${1 + pulse * 0.015})` }}>
            <TanitMark size={v ? 360 : 300} color="#fff" progress={draw} stroke={4.6} />
          </div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 150 : 170, letterSpacing: '-0.04em',
            lineHeight: 1, marginTop: 40, color: '#fff' }}>
            <Letters text="Tanit" delay={42} color="#fff" />
            <Letters text="Market" delay={52} color={C.lime} />
          </div>
          <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: v ? 48 : 50, marginTop: 44, color: '#cfd3cb',
            textAlign: 'center', display: 'flex', flexDirection: v ? 'column' : 'row', gap: v ? 6 : 16 }}>
            <span style={rise(tag1, 30)}>Les bonnes affaires.</span>
            <span style={{ ...rise(tag2, 30), color: C.lime }}>Juste à côté.</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <Sfx name="pop" at={44} volume={0.35} />
      <Sfx name="pop" at={54} volume={0.35} />
    </AbsoluteFill>
  );
};
