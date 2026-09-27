import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, HEAD, TEXT, Sfx, rise, useIn, useProgress, useVertical } from '../theme';

const GOV = ['Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 'Béja', 'Jendouba', 'Le Kef',
  'Siliana', 'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
  'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'];
const HIGHLIGHT = [0, 11, 14, 4, 6, 18]; // Tunis, Sousse, Sfax, Nabeul, Bizerte, Gabès
const HL_START = 84;
const HL_GAP = 9;

const Gov: React.FC<{ name: string; i: number; v: boolean }> = ({ name, i, v }) => {
  const frame = useCurrentFrame();
  const p = useIn(14 + i * 2.5, { damping: 12 });
  const k = HIGHLIGHT.indexOf(i);
  const on = k >= 0 && frame >= HL_START + k * HL_GAP;
  const bump = useIn(HL_START + Math.max(0, k) * HL_GAP, { damping: 8, stiffness: 200 });
  const scale = on ? 1 + 0.12 * Math.sin(Math.min(1, bump) * Math.PI) : 1;
  return (
    <div style={{ padding: v ? '16px 28px' : '14px 28px', borderRadius: 9999, fontFamily: TEXT, fontWeight: 600,
      fontSize: v ? 32 : 28, background: on ? C.lime : '#1c1e1a', border: `2px solid ${on ? C.lime : '#2d302a'}`,
      color: on ? C.inkDeep : '#e8ebe6', opacity: Math.min(1, p * 1.5),
      transform: `translateY(${(1 - p) * 40}px) scale(${(0.8 + 0.2 * p) * scale})` }}>
      {on ? '📍 ' : ''}{name}
    </div>
  );
};

export const Gouv: React.FC = () => {
  const v = useVertical();
  const count = useProgress(4, 44);
  const n = useIn(2, { damping: 14 });
  const lbl = useIn(22);
  const sub = useIn(34);
  return (
    <AbsoluteFill style={{ background: C.ink, color: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: v ? 90 : 130, top: v ? 270 : 170 }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: v ? 300 : 340, color: C.lime, letterSpacing: '-0.05em',
          lineHeight: 1, transform: `scale(${0.6 + 0.4 * n})`, transformOrigin: 'left bottom', opacity: n }}>
          {Math.round(24 * count)}
        </div>
        <div style={{ ...rise(lbl, 30), fontFamily: HEAD, fontWeight: 800, fontSize: v ? 72 : 66, letterSpacing: '-0.03em',
          marginTop: 10 }}>gouvernorats couverts</div>
        <div style={{ ...rise(sub, 30), fontFamily: TEXT, fontSize: 36, color: '#bfc3bb', width: v ? 880 : 700,
          lineHeight: 1.4, marginTop: 24 }}>
          Trouvez les bonnes affaires près de chez vous, du Nord au Sud.
        </div>
      </div>
      <div style={{ position: 'absolute', left: v ? 90 : 1000, top: v ? 1000 : 250, width: v ? 900 : 800,
        display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        {GOV.map((g, i) => <Gov key={g} name={g} i={i} v={v} />)}
      </div>
      {HIGHLIGHT.map((_, k) => <Sfx key={k} name="click" at={HL_START + k * HL_GAP} volume={0.4} />)}
    </AbsoluteFill>
  );
};
