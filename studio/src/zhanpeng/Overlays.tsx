import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import type {Overlay, StoryProps} from "./types";
import {KAI, SONG, SONG_BLACK, pop, ramp, rand} from "./util";

type P = {o: Overlay; props: StoryProps; t: number; u: number; w: number; h: number};

const yellowText = (u: number, color: string): React.CSSProperties => ({
  fontFamily: KAI,
  fontWeight: 700,
  color,
  WebkitTextStroke: `${1.4 * u}px ${color}`,
  textShadow: `0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.55), 0 0 ${4 * u}px rgba(0,0,0,0.45)`,
});

/** 钩子：字幕下面一行红色黑宋大字，模糊着冲进来，然后慢慢推。 */
const Hook: React.FC<P> = ({o, props, t, u, h}) => {
  const local = t - o.start;
  const arrive = ramp(local, 0, 0.22);
  const size = props.theme.hook.size * u * Math.min(1, 7.2 / Math.max(1, (o.text ?? "").length));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: props.theme.hook.y * h - size * 0.62,
        textAlign: "center",
        fontFamily: SONG_BLACK,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        color: props.theme.colors.red,
        textShadow: `0 0 ${2 * u}px rgba(255,235,230,0.85), 0 0 ${10 * u}px rgba(255,220,210,0.35), 0 ${4 * u}px ${12 * u}px rgba(60,0,0,0.45)`,
        opacity: ramp(local, 0, 0.12),
        filter: arrive < 1 ? `blur(${(1 - arrive) * 16 * u}px)` : undefined,
        transform: `scale(${1.28 - 0.28 * arrive + 0.05 * Math.min(1, local / 1.5)})`,
      }}
    >
      {o.text}
    </div>
  );
};

/** 顶部黄色横条，问题一个字一个字打出来。 */
const Question: React.FC<P> = ({o, props, t, u, h}) => {
  const local = t - o.start;
  const text = `Q: ${o.text ?? ""}`;
  const bar = ramp(local, 0, 0.14);
  const typed = Math.floor(Math.max(0, local - 0.1) * 22);
  const shown = text.slice(0, Math.min(text.length, typed + 2));
  const typing = shown.length < text.length;
  const size = Math.min(52, (1080 * 0.8) / Math.max(8, text.length)) * u;
  const out = 1 - ramp(t, o.end - 0.2, o.end);
  return (
    <div
      style={{
        position: "absolute",
        left: "7.6%",
        right: "7.6%",
        top: 0.092 * h,
        height: 86 * u,
        background: props.theme.colors.yellowBox,
        clipPath: `inset(0 ${(1 - bar) * 100}% 0 0)`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 14 * u,
        opacity: out,
        boxShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.12)`,
      }}
    >
      <span style={{fontFamily: KAI, fontWeight: 700, fontSize: size, letterSpacing: "0.06em", color: props.theme.colors.ink, WebkitTextStroke: `${1.1 * u}px ${props.theme.colors.ink}`, whiteSpace: "nowrap"}}>
        {shown}
      </span>
      {typing ? <span style={{display: "inline-block", width: 16 * u, height: 50 * u, marginLeft: 4 * u, background: "#fff"}} /> : null}
    </div>
  );
};

/** 头旁边飘出来的一两个黄字（「气味」）。 */
const Float: React.FC<P> = ({o, props, t, u, w, h}) => {
  const chars = Array.from(o.text ?? "");
  const left = o.side !== "right";
  const face = props.face;
  return (
    <>
      {chars.map((ch, index) => {
        const born = o.start + index * 0.16;
        const local = t - born;
        if (local <= 0) return null;
        const size = (128 + index * 22) * u;
        const edge = left ? face.x - 0.15 - index * 0.1 : face.x + face.w + 0.03 + index * 0.1;
        const x = Math.min(w - size - 30 * u, Math.max(30 * u, edge * w));
        const y = (face.y + face.h * 0.55 + index * 0.115) * h - local * 14 * u;
        const out = 1 - ramp(t, o.end - 0.15, o.end);
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: size,
              ...yellowText(u, props.theme.colors.yellow),
              transform: `scale(${pop(local)}) rotate(${(left ? -1 : 1) * (8 - index * 14)}deg)`,
              opacity: out,
            }}
          >
            {ch}
          </div>
        );
      })}
    </>
  );
};

const SCATTER = [
  {x: 0.7, y: 0.71, s: 1.0},
  {x: 0.2, y: 0.795, s: 0.78},
  {x: 0.19, y: 0.6, s: 1.0},
  {x: 0.74, y: 0.56, s: 0.82},
  {x: 0.5, y: 0.86, s: 0.8},
];

/** 说到哪个词，哪个黄字在身体周围弹出来（「饮食 作息 情绪压力」）。 */
const Scatter: React.FC<P> = ({o, props, t, u, w, h}) => (
  <>
    {(o.items ?? []).map((item, index) => {
      const slot = SCATTER[index % SCATTER.length];
      const local = t - item.at;
      if (local <= 0) return null;
      const size = 114 * slot.s * u * Math.min(1, 4.4 / Math.max(2, item.text.length) + 0.25);
      const half = (item.text.length * size * 1.06) / 2 + 30 * u;
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left: Math.min(w - half, Math.max(half, slot.x * w)),
            top: slot.y * h,
            transform: `translate(-50%, -50%) scale(${pop(local, 0.32)})`,
            fontSize: size,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            ...yellowText(u, props.theme.colors.yellow),
            opacity: 1 - ramp(t, o.end - 0.12, o.end),
          }}
        >
          {item.text}
        </div>
      );
    })}
  </>
);

const Chevrons: React.FC<{u: number; glow: number}> = ({u, glow}) => (
  <svg width={74 * u} height={46 * u} viewBox="0 0 74 46" style={{margin: `0 ${14 * u}px`, opacity: 0.55 + 0.45 * glow}}>
    <defs>
      <linearGradient id="zs-chev" x1="0" x2="1">
        <stop offset="0" stopColor="#e9e9e9" />
        <stop offset="1" stopColor="#6d6d6d" />
      </linearGradient>
    </defs>
    <path d="M2 4 L26 23 L2 42 L12 23 Z" fill="url(#zs-chev)" />
    <path d="M34 4 L62 23 L34 42 L46 23 Z" fill="url(#zs-chev)" />
  </svg>
);

/** 字幕位置上的「甲 ▸▸ 乙」。 */
const Flow: React.FC<P> = ({o, props, t, u, h}) => {
  const items = o.items ?? [];
  const size = 72 * u;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: props.theme.caption.y * h + 14 * u,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: 1 - ramp(t, o.end - 0.12, o.end),
      }}
    >
      {items.map((item, index) => {
        const local = t - item.at;
        const seen = ramp(local, 0, 0.18);
        return (
          <React.Fragment key={index}>
            {index > 0 ? (
              <div style={{opacity: ramp(t - items[index - 1].at, 0.25, 0.45), display: "flex"}}>
                <Chevrons u={u} glow={0.5 + 0.5 * Math.sin(t * 9)} />
              </div>
            ) : null}
            <div
              style={{
                fontFamily: SONG,
                fontWeight: 600,
                fontSize: size,
                letterSpacing: "0.1em",
                color: "#fff",
                padding: `${6 * u}px ${12 * u}px`,
                background: "linear-gradient(90deg, rgba(20,24,32,0.55), rgba(20,24,32,0.12))",
                textShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.6)`,
                opacity: seen,
                transform: `translateX(${(1 - seen) * -18 * u}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {item.text}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** 变暗的字幕右下方，黄色圆角标签从左往右刷出来（「身体总指挥官」）。 */
const Label: React.FC<P> = ({o, props, t, u, w, h}) => {
  const local = t - o.start;
  const wipe = ramp(local, 0, 0.32);
  const text = o.text ?? "";
  const size = 66 * u;
  const boxW = (text.length * 1.09 + 0.9) * size;
  const left = Math.min(w - boxW - 40 * u, Math.max(40 * u, 0.69 * w - boxW / 2));
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: props.theme.caption.y * h + 62 * u,
        width: boxW,
        height: size * 1.72,
        borderRadius: 16 * u,
        background: props.theme.colors.yellowBox,
        boxShadow: `0 0 ${14 * u}px rgba(251,238,126,0.55)`,
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round ${16 * u}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - ramp(t, o.end - 0.1, o.end),
      }}
    >
      <span style={{fontFamily: KAI, fontWeight: 700, fontSize: size, letterSpacing: "0.09em", color: props.theme.colors.ink, WebkitTextStroke: `${1.5 * u}px ${props.theme.colors.ink}`, whiteSpace: "nowrap"}}>{text}</span>
    </div>
  );
};

/** 字幕位置上一排带圆点的黄字，说到一个落一个。 */
const Bullets: React.FC<P> = ({o, props, t, u, w, h}) => {
  const items = o.items ?? [];
  const total = items.reduce((sum, item) => sum + item.text.length + 1.6, 0);
  const size = Math.min(78, (1080 * 0.92) / total) * u;
  return (
    <div
      style={{
        position: "absolute",
        left: 0.04 * w,
        right: 0.04 * w,
        top: props.theme.caption.y * h + 40 * u,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        opacity: 1 - ramp(t, o.end - 0.12, o.end),
      }}
    >
      {items.map((item, index) => {
        const local = t - item.at;
        const land = ramp(local, 0, 0.3);
        return (
          <div
            key={index}
            style={{
              fontSize: size,
              ...yellowText(u, props.theme.colors.yellow),
              letterSpacing: `${0.08 + (1 - land) * 0.5}em`,
              opacity: ramp(local, 0, 0.1),
              transform: `scale(${0.55 + 0.45 * land})`,
              whiteSpace: "nowrap",
            }}
          >
            {"·" + item.text}
          </div>
        );
      })}
    </div>
  );
};

/** 压在胸口的白色大字，第一个字最大，后面的字小一号往右下排；下面跟一行小字（「圈子 / 就是无形的环境」）。 */
const BigWord: React.FC<P> = ({o, props, t, u, w, h}) => {
  const chars = Array.from(o.text ?? "");
  const first = 400 * u * Math.min(1, 2.2 / Math.max(2, chars.length));
  const rest = first * 0.54;
  const out = 1 - ramp(t, o.end - 0.12, o.end);
  const top = 0.415 * h;
  const total = first + (chars.length - 1) * rest * 1.02;
  const x0 = 0.5 * w - total / 2;
  const subAt = o.items?.[0]?.at ?? o.start + 0.5;
  const glyph = (size: number): React.CSSProperties => ({
    position: "absolute",
    fontFamily: KAI,
    fontWeight: 700,
    fontSize: size,
    lineHeight: 1,
    color: "#fff",
    WebkitTextStroke: `${size * 0.022}px #fff`,
    textShadow: `0 ${4 * u}px ${14 * u}px rgba(0,0,0,0.5)`,
    opacity: out,
  });
  return (
    <>
      <div style={{...glyph(first * 0.6), left: x0 - first * 0.36, top: top - first * 0.06, transform: `scale(${pop(t - o.start, 0.3)})`}}>“</div>
      {chars.map((ch, index) => {
        const local = t - (o.start + index * 0.2);
        if (local <= 0) return null;
        const size = index === 0 ? first : rest;
        const left = index === 0 ? x0 : x0 + first + (index - 1) * rest * 1.02;
        const y = index === 0 ? top : top + first * 0.6;
        return (
          <div key={index} style={{...glyph(size), left, top: y, transform: `scale(${pop(local, 0.3)})`, transformOrigin: "50% 60%"}}>
            {ch}
          </div>
        );
      })}
      {t - o.start > (chars.length - 1) * 0.2 ? (
        <div style={{...glyph(first * 0.6), left: x0 + total + first * 0.02, top: top + first * 0.52, transform: `scale(${pop(t - o.start - (chars.length - 1) * 0.2, 0.3)})`}}>”</div>
      ) : null}
      {o.sub && t >= subAt ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: top + first * 1.22,
            textAlign: "center",
            fontFamily: SONG,
            fontWeight: 600,
            fontSize: props.theme.caption.size * u,
            letterSpacing: `${props.theme.caption.spacing}em`,
            color: "#fff",
            textShadow: `0 ${2 * u}px ${7 * u}px rgba(0,0,0,0.6)`,
            opacity: ramp(t, subAt, subAt + 0.12) * out,
          }}
        >
          {o.sub}
        </div>
      ) : null}
    </>
  );
};

/** 结尾提问：字幕变黄加粗，后面垫一个灰色大问号。 */
const Ask: React.FC<P> = ({o, props, t, u, w, h}) => {
  const local = t - o.start;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0.62 * w,
          top: props.theme.caption.y * h,
          transform: `translate(-50%, -50%) scale(${pop(local, 0.4)}) rotate(4deg)`,
          fontFamily: KAI,
          fontWeight: 700,
          fontSize: 330 * u,
          color: "rgba(205,205,205,0.72)",
          textShadow: `0 ${4 * u}px ${12 * u}px rgba(0,0,0,0.25)`,
          lineHeight: 1,
        }}
      >
        ?
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: props.theme.caption.y * h - 64 * u * 0.62,
          textAlign: "center",
          fontFamily: SONG,
          fontWeight: 900,
          fontSize: 64 * u * Math.min(1, 14 / Math.max(1, (o.text ?? "").length)),
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          color: props.theme.colors.yellow,
          WebkitTextStroke: `${5 * u}px rgba(45,32,0,0.85)`,
          paintOrder: "stroke fill",
          textShadow: `0 ${3 * u}px ${10 * u}px rgba(0,0,0,0.6)`,
          transform: `scale(${1.12 - 0.12 * ramp(local, 0, 0.2)})`,
          opacity: ramp(local, 0, 0.08),
        }}
      >
        {o.text}
      </div>
    </>
  );
};

/** 字幕下面三个抖动的红色感叹号。 */
const Alert: React.FC<P> = ({o, props, t, u, w, h}) => (
  <>
    {[0.3, 0.5, 0.7].map((x, index) => {
      const local = t - o.start - index * 0.1;
      if (local <= 0) return null;
      const shake = Math.sin(t * 40 + index * 2) * 3 * u;
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            left: x * w + shake,
            top: props.theme.caption.y * h - 30 * u,
            transform: `translate(-50%, 0) scale(${pop(local, 0.22)})`,
            fontFamily: SONG_BLACK,
            fontWeight: 900,
            fontSize: 120 * u,
            lineHeight: 1,
            color: props.theme.colors.red,
            opacity: (0.75 + 0.25 * rand(Math.floor(t * 12) + index)) * (1 - ramp(t, o.end - 0.1, o.end)),
          }}
        >
          !
        </div>
      );
    })}
  </>
);

const MAP = {hook: Hook, question: Question, float: Float, scatter: Scatter, flow: Flow, label: Label, bullets: Bullets, bigword: BigWord, ask: Ask, alert: Alert};

export const OverlayLayer: React.FC<{props: StoryProps; under?: boolean}> = ({props, under = false}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const t = frame / fps;
  return (
    <>
      {props.overlays.map((o, index) => {
        if (t < o.start || t >= o.end) return null;
        if ((o.type === "alert") !== under) return null;
        const View = MAP[o.type];
        return View ? <View key={index} o={o} props={props} t={t} u={width / 1080} w={width} h={height} /> : null;
      })}
    </>
  );
};
