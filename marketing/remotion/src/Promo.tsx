import React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';
import timeline from './timeline.json';
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
      <Html5Audio src={staticFile('audio/music.wav')} volume={0.8} />
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
    </AbsoluteFill>
  );
};
