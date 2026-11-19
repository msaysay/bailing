import React from "react";
import {AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig} from "remotion";
import type {StoryProps} from "./types";

/** 插画场景里的头像：同一条人物视频，按人脸位置缩放平移，四周羽化进画面。 */
export const Pip: React.FC<{props: StoryProps; side: "left" | "right"; opacity?: number}> = ({props, side, opacity = 1}) => {
  const {width, height} = useVideoConfig();
  const spec = props.theme.pip[side];
  const face = props.face;
  const scale = spec.face / Math.max(0.05, face.w);
  const faceCx = face.x + face.w / 2;
  const faceCy = face.y + face.h / 2;
  const tx = (spec.cx - scale * faceCx) * width;
  const ty = (spec.cy - scale * faceCy) * height;
  const k = spec.face / props.theme.pip.left.face;
  const cx = spec.cx * width;
  const cy = (spec.cy + 0.022 * k) * height;
  // 原片里人拍得近时，缩小后的画面比羽化圈还小：把圈收到画面边以内，不露出硬边。
  const roomX = Math.min(cx - tx, tx + scale * width - cx) * 0.94;
  const roomY = Math.min(cy - ty, ty + scale * height - cy) * 0.94;
  const rx = Math.min(props.theme.pip.rx * width * k, roomX);
  const ry = Math.min(props.theme.pip.ry * height * k, roomY);
  const mask = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, #000 46%, rgba(0,0,0,0.75) 62%, rgba(0,0,0,0.3) 80%, transparent 100%)`;
  return (
    <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask, opacity}}>
      <div style={{position: "absolute", left: 0, top: 0, width, height, transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "0 0"}}>
        <OffthreadVideo src={staticFile(props.videoFile)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>
    </AbsoluteFill>
  );
};
