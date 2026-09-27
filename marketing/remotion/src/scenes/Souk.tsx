import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, HEAD, TEXT, Pill, Words, rise, useIn, useVertical } from '../theme';

export const Souk: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useVertical();
  const zoom = interpolate(frame, [0, 195], [1.18, 1.02]);
  const pan = interpolate(frame, [0, 195], [-30, 30]);
  const badge = useIn(10);
  const sub = useIn(52);
  const line = useIn(40, { damping: 20 });

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
      <Img src={staticFile('images/tanitmarket-signage.jpg')}
        style={v
          ? { position: 'absolute', left: -100, top: -60, width: 1280, height: 1280, objectFit: 'cover',
              transform: `scale(${zoom}) translateX(${pan}px)` }
          : { position: 'absolute', left: 560, top: -150, width: 1380, height: 1380, objectFit: 'cover',
              transform: `scale(${zoom}) translateX(${pan}px)` }} />
      <AbsoluteFill style={{ background: v
        ? 'linear-gradient(180deg, rgba(14,15,12,0) 35%, rgba(14,15,12,.8) 55%, #0E0F0C 66%)'
        : 'linear-gradient(90deg, #0E0F0C 0%, #0E0F0C 30%, rgba(14,15,12,.7) 45%, rgba(14,15,12,0) 62%)' }} />
      <div style={{ position: 'absolute', left: v ? 90 : 130, top: v ? 1150 : 250, width: v ? 900 : 980, color: '#fff' }}>
        <div style={rise(badge, 30)}>
          <Pill bg={C.lime} color={C.inkDeep} style={{ fontSize: v ? 26 : 24 }}>LA MARKETPLACE QUI NOUS RAPPROCHE</Pill>
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 118 : 108, letterSpacing: '-0.04em',
          lineHeight: 0.98, marginTop: 40 }}>
          <Words text="Achetez." delay={18} />
          <br />
          <Words text="Vendez." delay={24} />
          <br />
          <Words text="Tout simplement." delay={32} highlight={['Tout', 'simplement.']} />
        </div>
        <div style={{ height: 8, width: v ? 520 : 560, background: C.lime, borderRadius: 8, marginTop: 18,
          transformOrigin: 'left', transform: `scaleX(${line})` }} />
        <div style={{ ...rise(sub, 30), fontFamily: TEXT, fontSize: v ? 42 : 38, color: '#d9dcd5', marginTop: 36,
          lineHeight: 1.4, maxWidth: 820 }}>
          Les petites annonces entre particuliers, partout en Tunisie.
        </div>
      </div>
    </AbsoluteFill>
  );
};
