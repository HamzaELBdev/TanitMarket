import React from 'react';
import { Composition } from 'remotion';
import timeline from './timeline.json';
import { Promo } from './Promo';

export const Root: React.FC = () => (
  <>
    <Composition id="TanitPromo" component={Promo} durationInFrames={timeline.totalFrames} fps={timeline.fps}
      width={1920} height={1080} />
    <Composition id="TanitPromoVertical" component={Promo} durationInFrames={timeline.totalFrames} fps={timeline.fps}
      width={1080} height={1920} />
  </>
);
