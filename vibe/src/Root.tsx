import React from 'react';
import { Composition, Still } from 'remotion';
import { Video } from './Video';
import { Cover } from './Cover';
import { EPISODES } from './episodes/all';
import { FPS, W, H, frames } from './timeline';

export const Root: React.FC = () => (
  <>
    {EPISODES.map((ep) => (
      <React.Fragment key={ep.id}>
        <Composition id={ep.id} component={Video} durationInFrames={frames(ep)} fps={FPS} width={W} height={H} defaultProps={{ ep }} />
        <Still id={`${ep.id}-COVER`} component={Cover} width={W} height={H} defaultProps={{ ep, v: false }} />
        <Still id={`${ep.id}-COVER-V`} component={Cover} width={1080} height={1440} defaultProps={{ ep, v: true }} />
      </React.Fragment>
    ))}
  </>
);
