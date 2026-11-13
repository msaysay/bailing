import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  BEAT,
  BIRTH_IDX,
  C,
  DROP,
  ENDS,
  FAREWELL_IDX,
  FPS,
  INTERLUDE_START,
  LAST_IDX,
  Lane,
  NAMES,
  NODES,
  STARTS,
  TOTAL,
  ageAt,
} from './data';

const SERIF = 'NotoSerifSC, serif';
const BODY = 'DouyinSans, sans-serif';
const NUM = 'Playfair, serif';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

// ───────── 字体：显式加载并等待 ─────────
let fontPromise: Promise<unknown> | null = null;
const loadFonts = () => {
  if (!fontPromise) {
    const defs: [string, string, string][] = [
      ['DouyinSans', 'fonts/DouyinSansBold.ttf', '700'],
      ['NotoSerifSC', 'fonts/NotoSerifSC-sub.ttf', '200 900'],
      ['Playfair', 'fonts/Playfair.ttf', '400 900'],
    ];
    fontPromise = Promise.all(
      defs.map(async ([name, file, weight]) => {
        const face = new FontFace(name, `url(${staticFile(file)}) format('truetype')`, {weight});
        document.fonts.add(await face.load());
      }),
    );
  }
  return fontPromise;
};

// ───────── 时间函数 ─────────
// 上一节点最后一拍内滚到下一年份；单段插值 + 双端钳位
const rollIndex = (frame: number) => {
  let i = 0;
  for (let k = 1; k < NODES.length; k++) if (frame >= STARTS[k] - BEAT) i = k;
  return i;
};
const rollP = (frame: number, i: number) =>
  i === 0 ? 1 : interpolate(frame, [STARTS[i] - BEAT, STARTS[i]], [0, 1], {...clamp, easing: io});

const yearAt = (frame: number) => {
  const i = rollIndex(frame);
  if (i === 0) return NODES[0].year;
  return NODES[i - 1].year + (NODES[i].year - NODES[i - 1].year) * rollP(frame, i);
};
const ageValue = (lane: Lane, frame: number) => {
  const i = rollIndex(frame);
  if (i === 0) return ageAt(lane, 0);
  const a = ageAt(lane, i - 1);
  return Math.round(a + (ageAt(lane, i) - a) * rollP(frame, i));
};

// ───────── 布局 ─────────
const LANES_TOP = 640;
const LANES_H = 900;
const GAP = 16;
const THIN = 92;
const LANE_X = 40;
const LANE_W = 1000;
const SIDE_W = 222;

const laneWeights = (frame: number) => {
  const m = spring({frame: frame - DROP, fps: FPS, config: {damping: 15, stiffness: 150, mass: 0.7}});
  const j = interpolate(frame, [INTERLUDE_START + 3 * BEAT, INTERLUDE_START + 4 * BEAT], [1, 0], {
    ...clamp,
    easing: io,
  });
  return {h: 1, j, m};
};
const laneGeometry = (frame: number) => {
  const w = laneWeights(frame);
  const sum = w.h + w.j + w.m;
  const extra = LANES_H - 2 * GAP - 3 * THIN;
  const hh = THIN + (extra * w.h) / sum;
  const hj = THIN + (extra * w.j) / sum;
  const hm = THIN + (extra * w.m) / sum;
  return {
    h: {top: LANES_TOP, height: hh},
    j: {top: LANES_TOP + hh + GAP, height: hj},
    m: {top: LANES_TOP + hh + hj + 2 * GAP, height: hm},
  };
};

// ───────── 年份里程表 ─────────
const DIGIT_H = 290;
const DIGIT_W = 172;
const Digit: React.FC<{pos: number}> = ({pos}) => {
  const base = Math.floor(pos);
  const frac = pos - base;
  const cell: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: DIGIT_W,
    height: DIGIT_H,
    lineHeight: `${DIGIT_H}px`,
    textAlign: 'center',
  };
  return (
    <div style={{position: 'relative', width: DIGIT_W, height: DIGIT_H, overflow: 'hidden'}}>
      <div style={{...cell, top: -frac * DIGIT_H}}>{((base % 10) + 10) % 10}</div>
      {frac > 0.001 ? <div style={{...cell, top: (1 - frac) * DIGIT_H}}>{(base + 1) % 10}</div> : null}
    </div>
  );
};
const YearBlock: React.FC<{frame: number}> = ({frame}) => {
  const v = yearAt(frame);
  const pos = [3, 2, 1, 0].map((p) => {
    const x = v / 10 ** p;
    const fl = Math.floor(x + 1e-9);
    const fr = Math.max(0, x - fl);
    const thr = 1 - 10 ** -p;
    return fl + (p === 0 ? fr : fr > thr ? (fr - thr) / (1 - thr) : 0);
  });
  const i = rollIndex(frame);
  const land = spring({frame: frame - STARTS[i], fps: FPS, config: {damping: 12, stiffness: 220, mass: 0.5}});
  const scale = interpolate(land, [0, 1], [1.06, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 222,
        left: 0,
        width: 1080,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        transform: `scale(${scale})`,
        transformOrigin: '50% 60%',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: NUM,
          fontWeight: 900,
          fontSize: 300,
          color: C.ink,
          fontFeatureSettings: '"lnum", "tnum"',
          letterSpacing: 0,
        }}
      >
        {pos.map((p, k) => (
          <Digit key={k} pos={p} />
        ))}
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: C.m, marginLeft: 10, marginBottom: 34}}>
        年
      </div>
    </div>
  );
};

// ───────── 标尺 ─────────
const PX = 44;
const Y0 = 1950;
const Y1 = 2030;
const Ruler: React.FC<{frame: number}> = ({frame}) => {
  const v = yearAt(frame);
  const tx = 540 - (v - Y0) * PX;
  const nodeYears = new Set(NODES.map((n) => n.year));
  const ticks: React.ReactNode[] = [];
  for (let y = Y0; y <= Y1; y++) {
    const x = (y - Y0) * PX;
    if (Math.abs(x + tx - 540) > 620) continue;
    const dec = y % 10 === 0;
    const five = y % 5 === 0;
    const hgt = dec ? 40 : five ? 26 : 14;
    ticks.push(
      <div key={y} style={{position: 'absolute', left: x - 1.5, top: 0, width: 3, height: hgt, background: C.ink, opacity: dec ? 1 : 0.55}} />,
    );
    if (dec)
      ticks.push(
        <div
          key={'l' + y}
          style={{position: 'absolute', left: x - 50, width: 100, top: 46, textAlign: 'center', fontFamily: NUM, fontWeight: 700, fontSize: 24, color: C.dim}}
        >
          {y}
        </div>,
      );
    if (nodeYears.has(y) && y >= 1955 && y <= 2026) {
      const passed = y <= v + 0.01;
      ticks.push(
        <div
          key={'n' + y}
          style={{
            position: 'absolute',
            left: x - 8,
            top: -24,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: passed ? C.ink : 'transparent',
            border: `3px solid ${C.ink}`,
            boxSizing: 'border-box',
          }}
        />,
      );
    }
  }
  const beatPhase = (frame % BEAT) / BEAT;
  const pulse = frame >= DROP ? 1 + 0.25 * Math.exp(-beatPhase * 5) : 1;
  return (
    <div style={{position: 'absolute', top: 548, left: 0, width: 1080, height: 80, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 26, left: 0, transform: `translateX(${tx}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: (Y1 - Y0) * PX, height: 3, background: C.ink}} />
        {ticks}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 540 - 13,
          top: 0,
          width: 0,
          height: 0,
          borderLeft: '13px solid transparent',
          borderRight: '13px solid transparent',
          borderTop: `22px solid ${C.m}`,
          transform: `scale(${pulse})`,
          transformOrigin: '50% 0%',
        }}
      />
      <div style={{position: 'absolute', left: 538.5, top: 20, width: 3, height: 50, background: C.m}} />
    </div>
  );
};

// ───────── 文案 ─────────
const renderLine = (line: string) => {
  const parts: React.ReactNode[] = [];
  const re = /\{([bg]):([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const col = m[1] === 'b' ? C.j : C.h;
    parts.push(
      <span key={m.index} style={{color: col, borderBottom: `6px solid ${col}`}}>
        {m[2]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
};

const LaneText: React.FC<{frame: number; idx: number; lane: Lane}> = ({frame, idx, lane}) => {
  const node = NODES[idx];
  const text = node[lane];
  if (!text) return null;
  const enter = STARTS[idx] + (node.enter[lane] ?? 0) * BEAT;
  let exit = ENDS[idx] - 27;
  if (idx === LAST_IDX) exit = 1e7;
  if (idx === FAREWELL_IDX && lane === 'j') exit = INTERLUDE_START + 4;
  if (frame < enter - 1 || frame > exit + 9) return null;
  const out = interpolate(frame, [exit, exit + 8], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const lines = text.split('/');
  const two = !node.j; // 双栏节点：字更大
  const big = idx === BIRTH_IDX && lane === 'm';
  const base = big ? 80 : two ? 66 : lines.length === 3 ? 50 : 56;
  const em = (t: string) =>
    [...t.replace(/\{[bg]:([^}]+)\}/g, '$1')].reduce((a, ch) => a + (ch === ' ' ? 0.3 : ch.charCodeAt(0) < 0x2000 ? 0.6 : 1), 0);
  const size = Math.min(base, Math.floor(716 / Math.max(...lines.map(em))));
  const punch = lane === 'm' ? spring({frame: frame - enter, fps: FPS, config: {damping: 9, stiffness: 200, mass: 0.6}}) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: SIDE_W + 34,
        right: 16,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: 1 - out,
        transform: `translateY(${-18 * out}px) scale(${interpolate(punch, [0, 1], [1.12, 1])})`,
        transformOrigin: '0% 50%',
      }}
    >
      {lines.map((ln, k) => {
        const s = spring({frame: frame - enter - k * 3, fps: FPS, config: {damping: 20, stiffness: 190, mass: 0.6}});
        return (
          <div key={k} style={{overflow: 'hidden', height: size * 1.34}}>
            <div
              style={{
                fontFamily: BODY,
                fontWeight: 700,
                fontSize: size,
                lineHeight: `${size * 1.34}px`,
                color: big ? C.m : C.ink,
                whiteSpace: 'nowrap',
                transform: `translateY(${(1 - s) * 110}%)`,
              }}
            >
              {renderLine(ln)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ───────── 一条人生线 ─────────
const LaneRow: React.FC<{frame: number; lane: Lane; top: number; height: number}> = ({frame, lane, top, height}) => {
  const open = interpolate(height, [THIN + 30, THIN + 120], [0, 1], clamp);
  const IS = INTERLUDE_START;
  const grayP = lane === 'j' ? interpolate(frame, [IS, IS + 18], [0, 1], clamp) : 0;
  const color = lane === 'j' ? interpolateColors(grayP, [0, 1], [C.j, C.gray]) : C[lane];
  // 谢幕时其余两条线压暗
  const dim =
    lane === 'j'
      ? 1
      : interpolate(frame, [IS, IS + 12, IS + 62, IS + 80], [1, 0.28, 0.28, 1], clamp);
  const unborn = lane === 'm' && frame < DROP;
  const age = ageValue(lane, frame);
  const ageSize = interpolate(height, [289, 388], [112, 132], clamp);
  // “我”线每次落字时色块闪一下
  let flash = 0;
  let shake = 0;
  if (lane === 'm') {
    let i = 0;
    for (let k = 1; k < NODES.length; k++) if (frame >= STARTS[k]) i = k;
    const e = i >= BIRTH_IDX ? STARTS[i] + (NODES[i].enter.m ?? 0) * BEAT : -999;
    const d = frame - e;
    if (d >= 0 && d < 14) {
      flash = Math.exp(-d / 3.5);
      shake = Math.sin(d * 1.9) * 7 * Math.exp(-d / 3);
    }
  }
  const memorial =
    lane === 'j' ? interpolate(frame, [IS + 8, IS + 18, IS + 56, IS + 64], [0, 1, 1, 0], clamp) : 0;
  const memorialIn = spring({frame: frame - IS - 8, fps: FPS, config: {damping: 20, stiffness: 120}});
  const thinText = 1 - open;
  return (
    <div
      style={{
        position: 'absolute',
        left: LANE_X,
        top,
        width: LANE_W,
        height,
        boxSizing: 'border-box',
        border: `4px solid ${C.ink}`,
        borderRadius: 8,
        background: C.card,
        boxShadow: `8px 8px 0 ${C.ink}`,
        overflow: 'hidden',
        opacity: dim * (unborn ? 0.62 : 1),
        transform: `translateX(${shake}px)`,
      }}
    >
      {/* 左侧色块：名字 + 岁数 */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDE_W, background: color, borderRight: `4px solid ${C.ink}`}}>
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.55}} />
        <div style={{position: 'absolute', left: 22, top: 17, fontFamily: SERIF, fontWeight: 900, fontSize: 40, lineHeight: '50px', color: '#fff', letterSpacing: 2}}>
          {NAMES[lane]}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 18,
            bottom: 2,
            display: 'flex',
            alignItems: 'baseline',
            color: '#fff',
            opacity: open,
            transform: `scale(${0.6 + 0.4 * open})`,
            transformOrigin: '0% 100%',
          }}
        >
          {age < 0 ? (
            <div style={{fontFamily: NUM, fontWeight: 900, fontSize: ageSize, lineHeight: 1.05}}>—</div>
          ) : (
            <>
              <div style={{fontFamily: NUM, fontWeight: 900, fontSize: ageSize, lineHeight: 1.05, fontFeatureSettings: '"lnum"', letterSpacing: -3}}>
                {age}
              </div>
              <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 30, marginLeft: 6}}>岁</div>
            </>
          )}
        </div>
      </div>

      {/* 正文 */}
      {NODES.map((_, i) => (
        <LaneText key={i} frame={frame} idx={i} lane={lane} />
      ))}

      {/* 收起态文字 */}
      {lane === 'm' && frame < DROP + 12 ? (
        <div style={{position: 'absolute', left: SIDE_W + 34, top: 0, height: THIN - 8, display: 'flex', alignItems: 'center', fontFamily: BODY, fontSize: 38, color: C.dim, opacity: thinText}}>
          还要等&nbsp;
          <span style={{fontFamily: NUM, fontWeight: 900, fontSize: 48, color: C.m, minWidth: 56, textAlign: 'center'}}>
            {Math.max(0, Math.round(1986 - yearAt(frame)))}
          </span>
          &nbsp;年才出生
        </div>
      ) : null}
      {lane === 'j' && frame > IS ? (
        <div style={{position: 'absolute', left: SIDE_W + 34, top: 0, height: THIN - 8, display: 'flex', alignItems: 'center', opacity: thinText, color: C.dim}}>
          <span style={{fontFamily: NUM, fontWeight: 900, fontSize: 46, letterSpacing: 1}}>1955 — 2011</span>
          <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 36, marginLeft: 26, letterSpacing: 8}}>谢幕</span>
        </div>
      ) : null}

      {/* 谢幕大字 */}
      {memorial > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: SIDE_W + 34,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: memorial,
            transform: `translateY(${(1 - memorialIn) * 24}px)`,
          }}
        >
          <div style={{fontFamily: NUM, fontWeight: 900, fontSize: 104, lineHeight: 1.1, color: C.ink, letterSpacing: 1}}>1955 — 2011</div>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.dim, letterSpacing: 14, marginTop: 6}}>乔布斯 · 谢幕</div>
        </div>
      ) : null}
    </div>
  );
};

// ───────── 进度条 ─────────
const Progress: React.FC<{frame: number}> = ({frame}) => {
  const gap = 8;
  const w = (LANE_W - gap * (NODES.length - 1)) / NODES.length;
  return (
    <div style={{position: 'absolute', left: LANE_X, top: 1568, width: LANE_W, height: 8}}>
      {NODES.map((n, i) => {
        const p = interpolate(frame, [STARTS[i], i === LAST_IDX ? STARTS[i] + 8 * BEAT : STARTS[i + 1]], [0, 1], clamp);
        return (
          <div key={i} style={{position: 'absolute', left: i * (w + gap), width: w, height: 8, background: 'rgba(23,20,15,.16)', borderRadius: 4, overflow: 'hidden'}}>
            <div style={{width: `${p * 100}%`, height: '100%', background: n.m ? C.m : C.ink}} />
          </div>
        );
      })}
    </div>
  );
};

// ───────── 片头钩子 ─────────
const Intro: React.FC<{frame: number}> = ({frame}) => {
  if (frame > 4 * BEAT + 2) return null;
  const out = interpolate(frame, [60, 80], [0, 1], {...clamp, easing: Easing.inOut(Easing.poly(4))});
  const stamp = spring({frame: frame - 24, fps: FPS, config: {damping: 11, stiffness: 210, mass: 0.7}});
  const stampOn = frame >= 24;
  const shake = stampOn ? Math.sin((frame - 24) * 2.2) * 10 * Math.exp(-(frame - 24) / 3) : 0;
  const chip = (lane: Lane, d: number) => {
    const s = spring({frame: frame - d + 30, fps: FPS, config: {damping: 14, stiffness: 180}});
    return (
      <div
        style={{
          background: C[lane],
          color: '#fff',
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          padding: '8px 30px 12px',
          border: `4px solid ${C.paper}`,
          borderRadius: 8,
          transform: `scale(${s})`,
        }}
      >
        {NAMES[lane]}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{background: C.ink, transform: `translateY(${-out * 100}%)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 70, top: 400 + shake, color: C.paper, fontFamily: SERIF, fontWeight: 900}}>
        <div style={{fontSize: 150, lineHeight: '190px', letterSpacing: 4}}>改变世界的</div>
        <div style={{fontSize: 236, lineHeight: '270px', letterSpacing: 6}}>两个人</div>
        <div style={{display: 'flex', gap: 22, marginTop: 26}}>
          {chip('h', 0)}
          {chip('j', 4)}
        </div>
      </div>
      {stampOn ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            top: 1010,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: '340px',
            color: C.m,
            transform: `rotate(-5deg) scale(${interpolate(stamp, [0, 1], [2.3, 1])})`,
            transformOrigin: '30% 50%',
            opacity: interpolate(frame, [24, 27], [0, 1], clamp),
          }}
        >
          和我。
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 76, top: 1400, color: C.dim, fontFamily: NUM, fontWeight: 700, fontSize: 44, letterSpacing: 4, opacity: interpolate(frame, [34, 44], [0, 1], clamp)}}>
        1955 — 2026
      </div>
    </AbsoluteFill>
  );
};

// ───────── 终章点赞 ─────────
const Heart: React.FC<{frame: number; top: number; height: number}> = ({frame, top, height}) => {
  const t0 = STARTS[LAST_IDX] + 5 * BEAT;
  if (frame < t0) return null;
  const s = spring({frame: frame - t0, fps: FPS, config: {damping: 8, stiffness: 180, mass: 0.7}});
  const ph = ((frame - t0) % (2 * BEAT)) / (2 * BEAT);
  const pulse = 1 + 0.16 * Math.exp(-ph * 6);
  const d = frame - t0;
  return (
    <div style={{position: 'absolute', left: 846, top: top + height - 178, width: 170, height: 170, transform: 'scale(0.78)', transformOrigin: '50% 50%'}}>
      <svg viewBox="0 0 100 100" width={170} height={170} style={{transform: `scale(${s * pulse}) rotate(${interpolate(s, [0, 1], [-30, 8])}deg)`, overflow: 'visible'}}>
        <path
          d="M50 88 C18 62 6 46 6 30 C6 16 17 7 29 7 C38 7 46 12 50 20 C54 12 62 7 71 7 C83 7 94 16 94 30 C94 46 82 62 50 88Z"
          fill={C.m}
          stroke={C.ink}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      </svg>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
        const a = (k / 8) * Math.PI * 2 + 0.3;
        const r = interpolate(d, [0, 14], [50, 150], clamp);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 85 + Math.cos(a) * r - 5,
              top: 85 + Math.sin(a) * r - 12,
              width: 10,
              height: 24,
              borderRadius: 5,
              background: k % 2 ? C.m : C.ink,
              transform: `rotate(${(a * 180) / Math.PI + 90}deg)`,
              opacity: interpolate(d, [0, 4, 16], [0, 1, 0], clamp),
            }}
          />
        );
      })}
    </div>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    loadFonts().finally(() => continueRender(handle));
  }, [handle]);

  const g = laneGeometry(frame);
  const dropFlash = frame >= DROP ? Math.exp(-(frame - DROP) / 4) : 0;
  const vol = interpolate(frame, [TOTAL - 36, TOTAL], [1, 0], clamp);

  return (
    <AbsoluteFill style={{background: C.paper, fontFeatureSettings: '"lnum"'}}>
      <Audio src={staticFile('audio.wav')} volume={vol} />

      {/* 抬头 */}
      <div style={{position: 'absolute', left: LANE_X, top: 160, width: LANE_W, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: C.ink, letterSpacing: 3}}>
          改变世界的两个人，<span style={{color: C.m}}>和我</span>
        </div>
        <div style={{fontFamily: NUM, fontWeight: 700, fontSize: 28, color: C.dim, letterSpacing: 2}}>1955 — 2026</div>
      </div>
      <div style={{position: 'absolute', left: LANE_X, top: 216, width: LANE_W, height: 4, background: C.ink}} />

      <YearBlock frame={frame} />
      <Ruler frame={frame} />

      <LaneRow frame={frame} lane="h" {...g.h} />
      <LaneRow frame={frame} lane="j" {...g.j} />
      <LaneRow frame={frame} lane="m" {...g.m} />
      <Heart frame={frame} {...g.m} />

      <Progress frame={frame} />

      {/* 纸纹 */}
      <Img src={staticFile('grain.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: 0.1, mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: C.m, opacity: dropFlash * 0.22, mixBlendMode: 'multiply'}} />

      <Intro frame={frame} />
    </AbsoluteFill>
  );
};
