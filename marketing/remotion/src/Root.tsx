import React from 'react';
import { Composition } from 'remotion';
import timeline from './timeline.json';
import { Promo } from './Promo';
import { Giveaway, GIVEAWAY_FRAMES } from './giveaway/Giveaway';

export const Root: React.FC = () => (
  <>
    <Composition id="TanitPromo" component={Promo} durationInFrames={timeline.totalFrames} fps={timeline.fps}
      width={1920} height={1080} />
    <Composition id="TanitPromoVertical" component={Promo} durationInFrames={timeline.totalFrames} fps={timeline.fps}
      width={1080} height={1920} />
    <Composition id="TirageVertical" component={Giveaway} durationInFrames={GIVEAWAY_FRAMES} fps={30}
      width={1080} height={1920} />
    <Composition id="Tirage" component={Giveaway} durationInFrames={GIVEAWAY_FRAMES} fps={30}
      width={1920} height={1080} />
    <Composition id="TirageArVertical" component={Giveaway} durationInFrames={GIVEAWAY_FRAMES} fps={30}
      width={1080} height={1920} defaultProps={{ lang: 'ar' as const }} />
    <Composition id="TirageAr" component={Giveaway} durationInFrames={GIVEAWAY_FRAMES} fps={30}
      width={1920} height={1080} defaultProps={{ lang: 'ar' as const }} />
  </>
);
