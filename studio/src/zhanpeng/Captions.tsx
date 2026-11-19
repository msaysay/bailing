import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import type {StoryProps} from "./types";
import {SONG, ramp} from "./util";

/** 字幕：白色宋体，一行，固定在画面三分之二高处。没有底条、没有描边，只有软阴影。 */
export const Captions: React.FC<{props: StoryProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  const u = width / 1080;
  const spec = props.theme.caption;
  const caption = props.captions.find((item) => t >= item.start && t < item.end);
  if (!caption) return null;
  const dim = caption.dimFrom !== undefined && t >= caption.dimFrom;
  const opacity = dim ? 1 - 0.58 * ramp(t, caption.dimFrom!, caption.dimFrom! + 0.12) : ramp(t, caption.start, caption.start + 0.06, 0.3, 1);
  return (
    <div
      style={{
        position: "absolute",
        left: 40 * u,
        right: 40 * u,
        top: spec.y * height - spec.size * u * 0.62,
        textAlign: "center",
        fontFamily: SONG,
        fontWeight: 600,
        fontSize: spec.size * u,
        lineHeight: 1.24,
        letterSpacing: `${spec.spacing}em`,
        color: props.theme.colors.white,
        whiteSpace: "nowrap",
        textShadow: `0 ${2 * u}px ${7 * u}px rgba(0,0,0,0.6), 0 0 ${3 * u}px rgba(0,0,0,0.55), 0 0 ${18 * u}px rgba(0,0,0,0.25)`,
        opacity,
      }}
    >
      {caption.text}
    </div>
  );
};
