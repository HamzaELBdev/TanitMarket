import React from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';
import timeline from './timeline.json';
import voice from './voice.json';
import { Fonts } from './theme';
import { Intro } from './scenes/Intro';
import { Souk } from './scenes/Souk';
import { Annonces } from './scenes/Annonces';
import { Nego } from './scenes/Nego';
import { Gouv } from './scenes/Gouv';
import { Promesses } from './scenes/Promesses';
import { Outro } from './scenes/Outro';

const SCENES: Record<string, React.FC> = {
  intro: Intro, souk: Souk, annonces: Annonces, nego: Nego, gouv: Gouv, promesses: Promesses, outro: Outro,
};

// Voice-over (Tunisian darija): one recording per scene, listed in
// voice.json, each starting `offset` frames after its scene's cut. Add a line
// there when a new recording (e.g. 01 / 02) lands in public/audio/voice/.
const sceneStart = Object.fromEntries(timeline.scenes.map((s) => [s.id, s.from]));
const VOICE = voice.lines.map((l) => ({ ...l, from: sceneStart[l.scene] + voice.offset }));

// Music volume: 0.8, ducked to 0.28 under the voice with short ramps.
const MUSIC = 0.8;
const DUCKED = 0.28;
const RAMP = 8;
function musicVolume(f: number) {
  let v = MUSIC;
  for (const l of VOICE) {
    const end = l.from + l.durationInFrames;
    const duck = interpolate(f, [l.from - RAMP, l.from, end, end + RAMP * 2], [MUSIC, DUCKED, DUCKED, MUSIC], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    v = Math.min(v, duck);
  }
  return v;
}

export const Promo: React.FC = () => {
  const { width, height } = useVideoConfig();
  const T = timeline.transition;
  // One transition per cut, in order; each lands on a bar of the soundtrack.
  const transitions = [
    wipe({ direction: 'from-left' }),
    slide({ direction: 'from-right' }),
    slide({ direction: 'from-bottom' }),
    wipe({ direction: 'from-top-right' }),
    clockWipe({ width, height }),
    iris({ width, height }),
  ];
  return (
    <AbsoluteFill style={{ background: '#0E0F0C' }}>
      <Fonts />
      <Html5Audio src={staticFile('audio/music.wav')} volume={musicVolume} />
      <TransitionSeries>
        {timeline.scenes.map((s, i) => {
          const Scene = SCENES[s.id];
          return (
            <React.Fragment key={s.id}>
              {i > 0 ? (
                <TransitionSeries.Transition presentation={transitions[i - 1] as never}
                  timing={linearTiming({ durationInFrames: T })} />
              ) : null}
              <TransitionSeries.Sequence durationInFrames={s.duration}>
                <Scene />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {timeline.scenes.slice(1).map((s) => (
        <Sequence key={s.id} from={s.from - 10} durationInFrames={30} layout="none">
          <Html5Audio src={staticFile('audio/whoosh.wav')} volume={0.45} />
        </Sequence>
      ))}
      {VOICE.map((l) => (
        <Sequence key={l.file} from={l.from} durationInFrames={l.durationInFrames + 15} layout="none">
          <Html5Audio src={staticFile(l.file)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
