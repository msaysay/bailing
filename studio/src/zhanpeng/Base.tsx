import React from "react";
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {StoryProps} from "./types";
import {ramp} from "./util";

/** 口播人物：景别硬切，每段里极慢地推一点；场景结束回到人时带一下模糊回弹；黑卡出现时沉到黑里。 */
export const Base: React.FC<{props: StoryProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cams = props.camera;
  let index = 0;
  for (let i = 0; i < cams.length; i++) if (t >= cams[i].start) index = i;
  const cam = cams[index] ?? {start: 0, zoom: 1, ease: false};
  const next = cams[index + 1];
  const length = (next ? next.start : props.durationInFrames / fps) - cam.start;
  const local = t - cam.start;
  let zoom = cam.zoom + props.theme.camera.drift * Math.min(1, local / Math.max(1.5, length));
  if (cam.ease && index > 0) {
    const before = cams[index - 1].zoom + props.theme.camera.drift;
    zoom = before + (zoom - before) * ramp(local, 0, 0.2);
  }
  let blur = 0;
  let snap = 1;
  for (const scene of props.scenes) {
    if (scene.out !== "blur") continue;
    const since = t - scene.end;
    if (since >= 0 && since < 0.3) {
      blur = 22 * (1 - ramp(since, 0, 0.3));
      snap = 1.14 - 0.14 * ramp(since, 0, 0.3);
    }
  }
  let dark = 0;
  for (const scene of props.scenes) {
    if (scene.type !== "card") continue;
    if (t >= scene.start - 0.05 && t < scene.end) dark = Math.max(dark, ramp(t, scene.start, scene.start + 0.45));
  }
  const fx = (props.face.x + props.face.w / 2) * 100;
  const fy = Math.min(60, (props.face.y + props.face.h * 1.3) * 100);
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      <AbsoluteFill
        style={{
          transform: `scale(${zoom * snap})`,
          transformOrigin: `${fx}% ${fy}%`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }}
      >
        <OffthreadVideo src={staticFile(props.videoFile)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </AbsoluteFill>
      {dark > 0 ? <AbsoluteFill style={{backgroundColor: "#000", opacity: dark}} /> : null}
    </AbsoluteFill>
  );
};
