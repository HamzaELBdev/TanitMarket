import React, { useEffect, useState } from 'react';
import {
  continueRender,
  delayRender,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import faces from './fonts.json';

// Tokens from docs/DESIGN_BRIEF.md (tailwind.config.js / globals.css).
export const C = {
  lime: '#9FE870',
  limePale: '#E2F6D5',
  ink: '#0E0F0C',
  inkDeep: '#163300',
  body: '#454745',
  mute: '#868685',
  soft: '#E8EBE6',
  line: '#DDE1D9',
  positive: '#2EAD4B',
  negative: '#D03238',
  flag: '#E70013',
};

export const HEAD = 'Manrope, Inter, sans-serif';
export const TEXT = 'Inter, system-ui, sans-serif';
export const ARABIC = "'Noto Kufi Arabic', Inter, sans-serif";

// Music is 120 BPM: one beat = 15 frames at 30 fps.
export const BEAT = 15;

const css = faces
  .map(
    (f) => `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:block;` +
      `src:url(${staticFile(`fonts/${f.file}`)}) format('woff2');unicode-range:${f.range};}`,
  )
  .join('\n');

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    const loads = [
      "800 40px Manrope",
      "400 40px Inter",
      "600 40px Inter",
      "700 40px Inter",
      "700 40px 'Noto Kufi Arabic'",
    ].map((f) => document.fonts.load(f, f.includes('Kufi') ? 'العربية' : 'Aé'));
    Promise.all(loads).then(() => continueRender(handle), () => continueRender(handle));
  }, [handle]);
  return <style>{css}</style>;
};

export const useVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

/** Spring that starts at `delay` frames (scene-local). */
export const useIn = (delay: number, config: Parameters<typeof spring>[0]['config'] = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.7, stiffness: 120, ...config } });
};

/** Linear 0→1 progress between two scene-local frames, eased. */
export const useProgress = (from: number, to: number, easing = Easing.bezier(0.33, 1, 0.68, 1)) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
};

/** Fade + rise-in style for a spring value. */
export const rise = (p: number, dist = 60, blur = 0): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateY(${(1 - p) * dist}px)`,
  filter: blur ? `blur(${Math.max(0, (1 - p) * blur)}px)` : undefined,
});

/** Pulse on the music beat (0→1→0), for subtle bouncing. */
export const useBeatPulse = (offset = 0) => {
  const frame = useCurrentFrame();
  const phase = ((frame + offset) % BEAT) / BEAT;
  return Math.exp(-phase * 6);
};

/** Word-by-word animated heading. */
export const Words: React.FC<{
  text: string;
  delay: number;
  stagger?: number;
  style?: React.CSSProperties;
  highlight?: string[];
  color?: string;
}> = ({ text, delay, stagger = 4, style, highlight = [], color = C.lime }) => {
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((w, i) => (
        <Word key={i} w={w} delay={delay + i * stagger} hl={highlight.includes(w)} color={color} />
      ))}
    </span>
  );
};

const Word: React.FC<{ w: string; delay: number; hl: boolean; color: string }> = ({ w, delay, hl, color }) => {
  const p = useIn(delay, { damping: 16 });
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'pre', color: hl ? color : undefined, ...rise(p, 70, 10) }}>
      {w + ' '}
    </span>
  );
};

/** The Tanit symbol as strokes so it can draw itself on. progress 0→1. */
export const TanitMark: React.FC<{ size: number; color: string; progress: number; stroke?: number }> = ({
  size,
  color,
  progress,
  stroke = 5,
}) => {
  const seg = (a: number, b: number) => Math.min(1, Math.max(0, (progress - a) / (b - a)));
  const circle = 2 * Math.PI * 12;
  const bar = 76;
  const tri = 2 * Math.hypot(30, 54) + 60;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="17" r="12" strokeDasharray={circle} strokeDashoffset={circle * (1 - seg(0, 0.4))}
        transform="rotate(-90 50 17)" />
      <path d="M12 38 H88" strokeDasharray={bar} strokeDashoffset={bar * (1 - seg(0.3, 0.6))} />
      <path d="M50 40 L20 94 H80 Z" strokeDasharray={tri} strokeDashoffset={tri * (1 - seg(0.5, 1))} />
    </svg>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; bg: string; color: string; style?: React.CSSProperties }> = ({
  children,
  bg,
  color,
  style,
}) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, borderRadius: 9999, padding: '14px 28px',
    background: bg, color, fontFamily: TEXT, fontWeight: 700, fontSize: 26, letterSpacing: '0.06em', ...style }}>
    {children}
  </div>
);

/** One-shot sound effect at a scene-local frame. */
export const Sfx: React.FC<{ name: 'pop' | 'click' | 'ding' | 'whoosh'; at: number; volume?: number }> = ({
  name,
  at,
  volume = 0.6,
}) => (
  <Sequence from={at} durationInFrames={60} layout="none">
    <Html5Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
  </Sequence>
);
