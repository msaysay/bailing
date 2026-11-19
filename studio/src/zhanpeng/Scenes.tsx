import React from "react";
import {AbsoluteFill, Img, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Pip} from "./Pip";
import type {Scene, Shot, StoryProps} from "./types";
import {KAI, ramp} from "./util";

const CROSS = 0.3;

const ShotView: React.FC<{shot: Shot; t: number; fps: number}> = ({shot, t, fps}) => {
  const length = Math.max(0.2, shot.end - shot.start);
  const p = Math.min(1, Math.max(0, (t - shot.start) / length));
  let transform = "scale(1.02)";
  if (shot.motion === "zoom-in") transform = `scale(${1.03 + 0.11 * p})`;
  if (shot.motion === "zoom-out") transform = `scale(${1.15 - 0.11 * p})`;
  if (shot.motion === "pan-up") transform = `scale(1.12) translateY(${3.5 - 7 * p}%)`;
  if (shot.motion === "pan-down") transform = `scale(1.12) translateY(${-3.5 + 7 * p}%)`;
  if (shot.motion === "pan-left") transform = `scale(1.12) translateX(${3.5 - 7 * p}%)`;
  if (shot.motion === "pan-right") transform = `scale(1.12) translateX(${-3.5 + 7 * p}%)`;
  const fill: React.CSSProperties = {width: "100%", height: "100%", objectFit: "cover"};
  let media: React.ReactNode;
  if (shot.kind === "video") {
    const frames = Math.max(1, Math.round(length * fps));
    const have = shot.duration && shot.duration > 0 ? shot.duration : length;
    const rate = Math.min(1, Math.max(0.5, have / length));
    const loop = Math.max(1, Math.floor((have / rate) * fps) - 1);
    const video = <OffthreadVideo src={staticFile(shot.file)} muted playbackRate={rate} style={fill} />;
    media = (
      <div style={{position: "absolute", inset: 0}}>
        {loop < frames ? (
          <Loop durationInFrames={loop} layout="none">
            {video}
          </Loop>
        ) : (
          video
        )}
      </div>
    );
  } else {
    media = <Img src={staticFile(shot.file)} style={fill} />;
  }
  return (
    <AbsoluteFill style={{transform, transformOrigin: "50% 45%"}}>
      {media}
      {(shot.marks ?? []).map((mark, index) => {
        const born = shot.start + 0.25 + index * 0.18;
        const pulse = 0.55 + 0.45 * Math.sin((t - born) * 5.2 + index);
        const size = (mark.r ?? 0.07) * 100;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${mark.x * 100 - size}%`,
              top: `${mark.y * 100 - size * 0.5625}%`,
              width: `${size * 2}%`,
              aspectRatio: "1",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mark.color ?? "rgba(230,40,40,0.85)"} 0%, rgba(230,40,40,0.35) 45%, transparent 70%)`,
              opacity: ramp(t, born, born + 0.25) * pulse,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** 一个场景里的几张图（或视频）依次叠化。视频包在 Sequence 里，从自己的第 0 帧播。 */
const Shots: React.FC<{scene: Scene; t: number; fps: number}> = ({scene, t, fps}) => {
  return (
    <>
      {scene.shots.map((shot, index) => {
        const last = index === scene.shots.length - 1;
        const visible = t >= shot.start - 0.02 && t < (last ? scene.end + scene.hold + 0.1 : shot.end + CROSS);
        if (!visible) return null;
        const opacity = index === 0 ? 1 : ramp(t, shot.start, shot.start + CROSS);
        const offset = Math.round(shot.start * fps);
        return (
          <AbsoluteFill key={index} style={{opacity}}>
            {shot.kind === "video" ? (
              <Sequence from={offset} layout="none">
                <ShotView shot={shot} t={t} fps={fps} />
              </Sequence>
            ) : (
              <ShotView shot={shot} t={t} fps={fps} />
            )}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/** 墨迹转场：黑幕上几个毛边的洞越来越大，露出下面的插画。 */
const InkCover: React.FC<{progress: number; id: string}> = ({progress, id}) => {
  const {width, height} = useVideoConfig();
  if (progress >= 1) return null;
  const blobs = [
    {x: 0.16, y: 0.42, d: 0.0, s: 1.0},
    {x: 0.3, y: 0.24, d: 0.08, s: 0.8},
    {x: 0.26, y: 0.66, d: 0.12, s: 0.9},
    {x: 0.55, y: 0.45, d: 0.22, s: 1.1},
    {x: 0.5, y: 0.8, d: 0.3, s: 0.9},
    {x: 0.72, y: 0.2, d: 0.34, s: 0.9},
    {x: 0.85, y: 0.6, d: 0.4, s: 1.1},
    {x: 0.8, y: 0.9, d: 0.46, s: 0.9},
  ];
  const holes = blobs
    .map((blob) => {
      const p = Math.max(0, (progress - blob.d) / (1 - blob.d));
      const grow = p;
      const rx = grow * width * 0.95 * blob.s;
      const ry = grow * height * 0.7 * blob.s;
      return `radial-gradient(ellipse ${rx.toFixed(1)}px ${ry.toFixed(1)}px at ${blob.x * 100}% ${blob.y * 100}%, transparent 97%, #000 100%)`;
    })
    .join(", ");
  const filterId = `ink-${id}`;
  return (
    <AbsoluteFill style={{filter: `url(#${filterId})`}}>
      <svg width="0" height="0" style={{position: "absolute"}}>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="150" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          inset: "-12%",
          width: "124%",
          height: "124%",
          backgroundColor: "#000",
          WebkitMaskImage: holes,
          maskImage: holes,
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      />
    </AbsoluteFill>
  );
};

const Framed: React.FC<{scene: Scene; color: string; children: React.ReactNode}> = ({scene, color, children}) => {
  const {width} = useVideoConfig();
  const u = width / 1080;
  if (scene.frame === "full") return <AbsoluteFill>{children}</AbsoluteFill>;
  const broll = scene.type === "broll";
  const side = (broll ? 14 : 52) * u;
  const top = (broll ? 10 : 44) * u;
  return (
    <AbsoluteFill style={{backgroundColor: scene.frameColor ?? color}}>
      <div style={{position: "absolute", left: side, right: side, top, bottom: top, borderRadius: (broll ? 34 : 30) * u, overflow: "hidden"}}>
        {children}
        <div style={{position: "absolute", inset: 0, borderRadius: (broll ? 34 : 30) * u, boxShadow: `inset 0 0 ${(broll ? 26 : 46) * u}px ${(broll ? 6 : 16) * u}px ${scene.frameColor ?? color}`}} />
      </div>
    </AbsoluteFill>
  );
};

const Paper: React.FC<{scene: Scene; props: StoryProps; t: number}> = ({scene, props, t}) => {
  const {width, height, fps} = useVideoConfig();
  const u = width / 1080;
  const local = t - scene.start;
  const open = ramp(local, 0.05, 0.5);
  const shot = scene.shots[0];
  const fx = (props.face.x + props.face.w / 2) * 100;
  const border = 9 * u;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: "scale(1.32)", transformOrigin: `${fx + 22}% 38%`, filter: `blur(${14 * u}px)`}}>
        <OffthreadVideo src={staticFile(props.videoFile)} muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </AbsoluteFill>
      {shot ? (
        <div
          style={{
            position: "absolute",
            left: "7.5%",
            right: "7.5%",
            top: "5.5%",
            height: "41.5%",
            transform: `scale(${0.55 + 0.45 * open}) rotate(${(1 - open) * -5}deg)`,
            transformOrigin: "30% 100%",
            opacity: ramp(local, 0.03, 0.16),
            filter: "url(#zs-rough)",
          }}
        >
          <svg width="0" height="0" style={{position: "absolute"}}>
            <filter id="zs-rough" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={3 + Math.floor(t * 6)} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={7 * u} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <div style={{position: "absolute", inset: 0, borderRadius: 30 * u, border: `${border}px solid #fff`, boxShadow: `0 ${8 * u}px ${30 * u}px rgba(0,0,0,0.25)`}} />
          <div
            style={{
              position: "absolute",
              inset: border + 14 * u,
              background: "#fff",
              overflow: "hidden",
              clipPath: `polygon(0 0, ${40 + 60 * open}% 0, ${100 * open + (1 - open) * 30}% 100%, 0 100%)`,
            }}
          >
            {shot.kind === "video" ? (
              <OffthreadVideo src={staticFile(shot.file)} muted style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "top"}} />
            ) : (
              <Img src={staticFile(shot.file)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "top"}} />
            )}
          </div>
        </div>
      ) : null}
      {scene.personFile ? (
        <Sequence from={Math.round(scene.start * fps)} layout="none">
          <AbsoluteFill style={{transform: `translateY(${height * 0.045}px) scale(0.9)`, transformOrigin: "50% 100%"}}>
            <OffthreadVideo src={staticFile(scene.personFile)} transparent muted style={{width: "100%", height: "100%", objectFit: "cover"}} />
          </AbsoluteFill>
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const CardWord: React.FC<{scene: Scene; props: StoryProps; t: number}> = ({scene, props, t}) => {
  const {width} = useVideoConfig();
  const u = width / 1080;
  const local = t - scene.start;
  const text = scene.text ?? "";
  const bracketed = /^[「『“"]/.test(text) ? text : `「${text}」`;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "38.6%",
          textAlign: "center",
          fontFamily: KAI,
          fontWeight: 700,
          fontSize: 128 * u,
          letterSpacing: "0.06em",
          color: "#F6E58A",
          WebkitTextStroke: `${1.6 * u}px #F6E58A`,
          textShadow: `0 0 ${18 * u}px rgba(246,229,138,0.45), 0 ${3 * u}px ${10 * u}px rgba(0,0,0,0.8)`,
          opacity: ramp(local, 0, 0.18),
          transform: `scale(${0.92 + 0.08 * ramp(local, 0, 0.3) + 0.03 * Math.min(1, local / 2)})`,
        }}
      >
        {bracketed}
      </div>
    </AbsoluteFill>
  );
};

export const SceneLayer: React.FC<{props: StoryProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <>
      {props.scenes.map((scene) => {
        if (t < scene.start || t >= scene.end + scene.hold) return null;
        const local = t - scene.start;
        if (scene.type === "card") return <CardWord key={scene.id} scene={scene} props={props} t={t} />;
        let opacity = 1;
        let filter: string | undefined;
        if (scene.transition === "fade") opacity = ramp(local, 0, 0.3);
        if (scene.transition === "blur") {
          opacity = ramp(local, 0, 0.2);
          filter = local < 0.3 ? `blur(${20 * (1 - ramp(local, 0, 0.3))}px)` : undefined;
        }
        if (scene.out === "fade") opacity *= 1 - ramp(t, scene.end - 0.25, scene.end);
        const ink = scene.transition === "ink";
        const cover = ink ? ramp(local, 0, 0.1) : 0;
        const reveal = ink ? ramp(local, 0.08, 0.5, 0, 1, (x) => x) : 1;
        const body =
          scene.type === "paper" ? (
            <Paper scene={scene} props={props} t={t} />
          ) : (
            <Framed scene={scene} color={props.theme.colors.frame}>
              <Shots scene={scene} t={t} fps={fps} />
            </Framed>
          );
        return (
          <AbsoluteFill key={scene.id} style={{opacity: ink ? 1 : opacity, filter}}>
            {ink && local < 0.1 ? <AbsoluteFill style={{backgroundColor: "#000", opacity: cover}} /> : null}
            {!ink || local >= 0.1 ? body : null}
            {scene.pip !== "none" && scene.type !== "paper" && (!ink || local >= 0.1) ? (
              <Pip props={props} side={scene.pip} opacity={ink ? ramp(local, 0.35, 0.65) : 1} />
            ) : null}
            {ink && local >= 0.1 ? <InkCover progress={reveal} id={scene.id} /> : null}
          </AbsoluteFill>
        );
      })}
    </>
  );
};
