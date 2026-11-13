// 录屏与设备类组件：给录屏、界面截图、对话、终端这类「操作画面」用。
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, Pop, useT } from '../kit/kit';

const typed = (s: string, t: number, at: number, cps = 16) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));
const Media: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => /\.(mp4|webm|mov)$/.test(src)
  ? <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  : <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', ...style }} />;

/** 录屏窗口：录屏或界面截图放进一个圆角窗口，带投影和极缓的推近。录屏当主角时用，不加别的装饰。 */
export const ScreenFrame: React.FC<{ src: string; at?: number; width?: number; title?: string; push?: number; children?: React.ReactNode }> = ({ src, at = 0, width = 1440, title, push = 0.04, children }) => {
  const t = useT(), p = prog(t, at, 0.6), h = (width * 9) / 16;
  return (
    <div style={{ width, borderRadius: 20, overflow: 'hidden', background: '#11151D', border: `1px solid ${C.line}`, boxShadow: '0 44px 100px rgba(0,0,0,.65)', opacity: p, transform: `translateY(${mix(40, 0, p)}px) scale(${mix(0.96, 1, p) * (1 + push * Math.min(1, Math.max(0, (t - at) / 6)))})`, fontFamily: FONT }}>
      {title && <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', color: C.muted, fontSize: 19 }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}<span style={{ marginLeft: 10 }}>{title}</span></div>}
      <div style={{ position: 'relative', width, height: h, overflow: 'hidden' }}><Media src={src} />{children}</div>
    </div>
  );
};
/** 光标：一个模拟光标按给定路径移动，到点点击并泛起一圈涟漪。叠在录屏窗口或截图上，坐标是所在容器的比例。 */
export const Cursor: React.FC<{ points: { x: number; y: number; at: number; click?: boolean }[]; size?: number }> = ({ points, size = 44 }) => {
  const t = useT(); let x = points[0].x, y = points[0].y;
  for (let i = 1; i < points.length; i++) { const p = inOut((t - points[i - 1].at) / Math.max(0.2, points[i].at - points[i - 1].at)); x = mix(x, points[i].x, p); y = mix(y, points[i].y, p); }
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {points.filter((p) => p.click).map((p, i) => { const r = prog(t, p.at, 0.6); return r > 0 && r < 1 ? <div key={i} style={{ position: 'absolute', left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 120 * r, height: 120 * r, marginLeft: -60 * r, marginTop: -60 * r, borderRadius: '50%', border: `5px solid ${C.accent}`, opacity: 1 - r }} /> : null; })}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))', transform: `scale(${1 - 0.18 * points.reduce((m, p) => Math.max(m, p.click ? Math.max(0, 1 - Math.abs(t - p.at) / 0.12) : 0), 0)})`, transformOrigin: 'top left' }}>
        <path d="M4 2l15 9-6.5 1.8L16 20l-3 1.4-3.4-7.3L5 18z" fill="#fff" stroke="#14171D" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
/** 录屏局部放大：录屏先完整出现，到点推近到一块区域（看清一个按钮、一行字），再退回。 */
export const ZoomRegion: React.FC<{ src: string; roi: { x: number; y: number; w: number; h: number }; at: number; backAt: number; width?: number; zoom?: number }> = ({ src, roi, at, backAt, width = 1440, zoom = 2.4 }) => {
  const t = useT(), h = (width * 9) / 16, p = inOut((t - at) / 0.9) - inOut((t - backAt) / 0.9), z = mix(1, zoom, p), cx = roi.x + roi.w / 2, cy = roi.y + roi.h / 2;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)), left = clamp(width / 2 - cx * width * z, width - width * z, 0), top = clamp(h / 2 - cy * h * z, h - h * z, 0);
  return (
    <div style={{ position: 'relative', width, height: h, borderRadius: 20, overflow: 'hidden', boxShadow: '0 44px 100px rgba(0,0,0,.65)', border: `1px solid ${C.line}` }}>
      <div style={{ position: 'absolute', left, top, width: width * z, height: h * z }}><Media src={src} />
        <div style={{ position: 'absolute', left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.w * 100}%`, height: `${roi.h * 100}%`, border: `${5 / z}px solid ${C.warm}`, borderRadius: 10 / z, opacity: p, boxShadow: `0 0 0 4000px rgba(8,11,17,${0.45 * p})` }} /></div>
    </div>
  );
};
/** 手机：竖屏录屏或截图放进手机外壳。 */
export const PhoneFrame: React.FC<{ src: string; at?: number; height?: number; children?: React.ReactNode }> = ({ src, at = 0, height = 780, children }) => {
  const p = prog(useT(), at, 0.6), w = height * 0.487;
  return (
    <div style={{ width: w, height, borderRadius: w * 0.14, background: '#0B0D12', padding: w * 0.035, boxSizing: 'border-box', boxShadow: '0 44px 100px rgba(0,0,0,.65), inset 0 0 0 3px #2B3140', opacity: p, transform: `translateY(${mix(60, 0, p)}px)` }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.11, overflow: 'hidden', background: '#000' }}><Media src={src} />{children}
        <div style={{ position: 'absolute', left: '50%', top: 12, width: w * 0.28, height: w * 0.075, marginLeft: -w * 0.14, borderRadius: w * 0.04, background: '#0B0D12' }} /></div>
    </div>
  );
};
/** 笔记本：横屏内容放进笔记本外壳。 */
export const LaptopFrame: React.FC<{ src: string; at?: number; width?: number; children?: React.ReactNode }> = ({ src, at = 0, width = 1200, children }) => {
  const p = prog(useT(), at, 0.6);
  return (
    <div style={{ width: width * 1.16, opacity: p, transform: `translateY(${mix(50, 0, p)}px)` }}>
      <div style={{ width, margin: '0 auto', borderRadius: '22px 22px 0 0', background: '#0B0D12', padding: '16px 16px 18px', boxSizing: 'border-box', boxShadow: 'inset 0 0 0 3px #2B3140' }}><div style={{ position: 'relative', width: '100%', height: ((width - 32) * 9) / 16, borderRadius: 8, overflow: 'hidden' }}><Media src={src} />{children}</div></div>
      <div style={{ height: 26, borderRadius: '4px 4px 26px 26px', background: 'linear-gradient(180deg,#3A4152,#1D2230)', boxShadow: '0 30px 60px rgba(0,0,0,.6)' }}><div style={{ width: 180, height: 9, margin: '0 auto', borderRadius: '0 0 10px 10px', background: '#141925' }} /></div>
    </div>
  );
};
/** 左右分屏：两段画面并排，各带标签，中间一条分割线划下来。适合前后对比、两种做法对比。 */
export const SplitCompare: React.FC<{ left: { src: string; label: string }; right: { src: string; label: string }; at: number; rightAt?: number; width?: number }> = ({ left, right, at, rightAt, width = 1560 }) => {
  const t = useT(), h = (width / 2) * 0.5625 * 1.25, a = prog(t, at, 0.6), b = prog(t, rightAt ?? at + 0.5, 0.6);
  const cell = (m: { src: string; label: string }, p: number, col: string, dx: number) => (
    <div style={{ position: 'relative', flex: 1, height: h, borderRadius: 18, overflow: 'hidden', opacity: p, transform: `translateX(${mix(dx, 0, p)}px)`, border: `2px solid ${col}` }}><Media src={m.src} /><div style={{ position: 'absolute', left: 20, top: 20, background: col, color: '#fff', fontSize: 34, fontWeight: 900, padding: '6px 20px', borderRadius: 10, fontFamily: FONT }}>{m.label}</div></div>);
  return <div style={{ display: 'flex', gap: 24, width, alignItems: 'center' }}>{cell(left, a, C.muted, -60)}<div style={{ width: 4, height: h * prog(t, at + 0.3, 0.5), background: C.text, borderRadius: 2 }} />{cell(right, b, C.accent, 60)}</div>;
};
/** 画中画：主画面铺开，角上叠一个小窗（讲解人、原片、另一路画面）。 */
export const PiP: React.FC<{ main: string; pip: string; at: number; pipAt: number; corner?: 'br' | 'bl' | 'tr' | 'tl'; width?: number; label?: string }> = ({ main, pip, at, pipAt, corner = 'br', width = 1440, label }) => {
  const t = useT(), h = (width * 9) / 16, p = prog(t, at, 0.6), q = prog(t, pipAt, 0.5), w2 = width * 0.28;
  const pos: React.CSSProperties = { [corner[0] === 'b' ? 'bottom' : 'top']: 26, [corner[1] === 'r' ? 'right' : 'left']: 26 };
  return (
    <div style={{ position: 'relative', width, height: h, borderRadius: 20, overflow: 'hidden', boxShadow: '0 44px 100px rgba(0,0,0,.65)', opacity: p }}><Media src={main} />
      <div style={{ position: 'absolute', ...pos, width: w2, height: (w2 * 9) / 16, borderRadius: 16, overflow: 'hidden', border: '4px solid #F3F1EA', boxShadow: '0 20px 50px rgba(0,0,0,.6)', opacity: q, transform: `scale(${mix(0.7, 1, q)})`, transformOrigin: `${corner[0] === 'b' ? 'bottom' : 'top'} ${corner[1] === 'r' ? 'right' : 'left'}` }}><Media src={pip} />
        {label && <div style={{ position: 'absolute', left: 10, bottom: 8, fontFamily: FONT, fontSize: 20, fontWeight: 600, color: '#fff', background: 'rgba(8,11,17,.7)', padding: '2px 10px', borderRadius: 6 }}>{label}</div>}</div>
    </div>
  );
};
/** 步骤标注：一张界面截图上依次钉上带编号的图钉，右侧同步列出每一步。做操作教程用。 */
export const StepCallouts: React.FC<{ src: string; steps: { x: number; y: number; label: string; at: number }[]; width?: number }> = ({ src, steps, width = 1000 }) => {
  const t = useT(), h = (width * 9) / 16;
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'center', fontFamily: FONT }}>
      <div style={{ position: 'relative', width, height: h, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}><Media src={src} />
        {steps.map((s, i) => { const p = prog(t, s.at, 0.35); return <div key={i} style={{ position: 'absolute', left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, background: C.down, color: '#fff', fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 ${10 * (1 - p)}px ${C.down}66, 0 8px 20px rgba(0,0,0,.5)`, transform: `scale(${p})` }}>{i + 1}</div>; })}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{steps.map((s, i) => { const on = t >= s.at && (i === steps.length - 1 || t < steps[i + 1].at);
        return <Pop key={i} at={s.at}><div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: on ? 1 : 0.45 }}><div style={{ width: 52, height: 52, borderRadius: 26, background: on ? C.down : C.line, color: '#fff', fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div><div style={{ fontSize: 38, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</div></div></Pop>; })}</div>
    </div>
  );
};
/** 终端：命令逐字打出，回车后输出一行行滚出来，可标记某一行为结果。 */
export const Terminal: React.FC<{ lines: { cmd?: string; out?: string; at: number; ok?: boolean }[]; at: number; width?: number; title?: string }> = ({ lines, at, width = 1100, title = 'Terminal' }) => {
  const t = useT();
  return (
    <Pop at={at} dy={30}><div style={{ width, borderRadius: 18, overflow: 'hidden', background: '#0C0F15', border: `1px solid ${C.line}`, boxShadow: '0 40px 90px rgba(0,0,0,.6)', fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
      <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', background: '#161B25', color: C.muted, fontSize: 18 }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}<span style={{ marginLeft: 10 }}>{title}</span></div>
      <div style={{ padding: '26px 30px 34px', minHeight: 330, fontSize: 30, lineHeight: 1.7 }}>
        {lines.map((l, i) => t < l.at ? null : l.cmd !== undefined
          ? <div key={i} style={{ color: C.text, whiteSpace: 'nowrap' }}><span style={{ color: '#28C840' }}>$ </span>{typed(l.cmd, t, l.at, 20)}{typed(l.cmd, t, l.at, 20).length < l.cmd.length && <span style={{ background: C.text, width: 14, height: 30, display: 'inline-block', verticalAlign: 'middle' }} />}</div>
          : <div key={i} style={{ color: l.ok ? '#28C840' : C.muted, whiteSpace: 'nowrap', opacity: prog(t, l.at, 0.15), fontWeight: l.ok ? 700 : 400 }}>{l.out}</div>)}
      </div>
    </div></Pop>
  );
};
/** 对话：一问一答的气泡依次出现，回答方先显示「正在输入」再出字。讲 AI 对话、客服、聊天记录用。 */
export const ChatThread: React.FC<{ messages: { who: 'me' | 'other'; text: string; at: number }[]; other?: string; width?: number }> = ({ messages, other = 'AI', width = 980 }) => {
  const t = useT();
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 22, fontFamily: FONT }}>
      {messages.map((m, i) => { if (t < m.at) return null; const me = m.who === 'me', typing = !me && t < m.at + 0.7, p = prog(t, m.at, 0.3);
        return <div key={i} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', gap: 14, opacity: p, transform: `translateY(${mix(24, 0, p)}px)` }}>
          {!me && <div style={{ width: 64, height: 64, borderRadius: 32, background: C.accent, color: '#fff', fontSize: 26, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{other}</div>}
          <div style={{ maxWidth: width * 0.72, background: me ? C.accent : '#F2F0EA', color: me ? '#fff' : '#14171D', borderRadius: me ? '26px 26px 6px 26px' : '26px 26px 26px 6px', padding: '18px 28px', fontSize: 36, fontWeight: 600, lineHeight: 1.5 }}>
            {typing ? <span style={{ letterSpacing: 6 }}>{'•'.repeat(1 + (Math.floor((t - m.at) * 6) % 3))}</span> : me ? m.text : typed(m.text, t, m.at + 0.7, 22)}</div>
        </div>; })}
    </div>
  );
};
/** 按键：几个键帽依次按下，用来讲快捷键或一个操作。 */
export const Keycaps: React.FC<{ keys: string[]; at: number; label?: string }> = ({ keys, at, label }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, fontFamily: FONT }}>
      <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>{keys.map((k, i) => { const a = at + i * 0.35, down = Math.max(0, 1 - Math.abs(t - a - 0.12) / 0.14), on = t > a;
        return <React.Fragment key={k + i}>{i > 0 && <span style={{ fontSize: 60, color: C.muted, fontWeight: 900 }}>+</span>}
          <div style={{ minWidth: 150, height: 150, padding: '0 30px', boxSizing: 'border-box', borderRadius: 26, background: on ? '#F2F0EA' : C.surface, color: on ? '#14171D' : C.muted, fontSize: 72, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 ${14 - 10 * down}px 0 ${on ? '#A9A598' : '#0A0D13'}, 0 30px 50px rgba(0,0,0,.5)`, transform: `translateY(${10 * down}px)`, opacity: prog(t, at - 0.3 + i * 0.1, 0.3) }}>{k}</div></React.Fragment>; })}</div>
      {label && <Pop at={at + keys.length * 0.35 + 0.2} style={{ fontSize: 40, fontWeight: 600, color: C.muted }}>{label}</Pop>}
    </div>
  );
};
/** 通知堆叠：系统通知一条条从上方滑进来叠在一起，用来表现「消息涌进来」。 */
export const Notifications: React.FC<{ items: { app: string; title: string; body: string }[]; ats: number[]; width?: number }> = ({ items, ats, width = 860 }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height: 520, fontFamily: FONT }}>
      {items.map((it, i) => { const p = prog(t, ats[i], 0.4), later = items.slice(i + 1).reduce((n, _, k) => n + prog(t, ats[i + 1 + k], 0.4), 0);
        return <div key={i} style={{ position: 'absolute', left: later * 14, right: later * 14, top: later * 128, background: 'rgba(242,240,234,.96)', color: '#14171D', borderRadius: 26, padding: '20px 26px', display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.5)', opacity: p * mix(1, 0.8, Math.min(1, later / 3)), transform: `translateY(${mix(-90, 0, p)}px)`, zIndex: 100 - i }}>
          <div style={{ width: 76, height: 76, borderRadius: 18, background: C.accent, color: '#fff', fontSize: 34, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{it.app.slice(0, 1)}</div>
          <div><div style={{ fontSize: 22, color: '#6B7280' }}>{it.app} · 现在</div><div style={{ fontSize: 32, fontWeight: 900, whiteSpace: 'nowrap' }}>{it.title}</div><div style={{ fontSize: 26, color: '#3C4350', whiteSpace: 'nowrap' }}>{it.body}</div></div>
        </div>; })}
    </div>
  );
};
/** 代码改动：几行代码，删掉的行变红划掉，新增的行变绿滑入。 */
export const CodeDiff: React.FC<{ lines: { kind: ' ' | '+' | '-'; text: string }[]; at: number; file?: string; width?: number }> = ({ lines, at, file = 'config.ts', width = 1100 }) => {
  const t = useT(); let k = 0;
  return (
    <Pop at={at} dy={30}><div style={{ width, borderRadius: 18, overflow: 'hidden', background: '#0C0F15', border: `1px solid ${C.line}`, boxShadow: '0 40px 90px rgba(0,0,0,.6)', fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
      <div style={{ height: 46, display: 'flex', alignItems: 'center', padding: '0 22px', background: '#161B25', color: C.muted, fontSize: 20 }}>{file}</div>
      <div style={{ padding: '18px 0 24px', fontSize: 30, lineHeight: 1.75 }}>{lines.map((l, i) => { const a = l.kind === ' ' ? at : at + 0.7 + (k++) * 0.45, p = prog(t, a, 0.35);
        return <div key={i} style={{ padding: '0 28px', whiteSpace: 'pre', background: l.kind === '+' ? `rgba(40,200,64,${0.16 * p})` : l.kind === '-' ? `rgba(255,93,93,${0.16 * p})` : 'transparent', color: l.kind === '+' ? '#7DE08A' : l.kind === '-' ? '#FF8A8A' : C.muted, opacity: l.kind === '+' ? p : 1, textDecoration: l.kind === '-' && p > 0.6 ? 'line-through' : 'none' }}><span style={{ display: 'inline-block', width: 34, opacity: p }}>{l.kind}</span>{l.text}</div>; })}</div>
    </div></Pop>
  );
};
/** 任务状态：一行行任务从「进行中」转圈变成打勾，表现自动化流程一步步跑完。 */
export const TaskRun: React.FC<{ tasks: { text: string; at: number; doneAt: number }[]; title?: string; width?: number }> = ({ tasks, title, width = 900 }) => {
  const t = useT();
  return (
    <div style={{ width, background: C.glass, border: `1.5px solid ${C.line}`, borderRadius: 26, padding: '34px 40px', fontFamily: FONT }}>
      {title && <div style={{ fontSize: 30, color: C.muted, marginBottom: 18 }}>{title}</div>}
      {tasks.map((k, i) => { if (t < k.at) return <div key={i} style={{ height: 78 }} />; const done = t >= k.doneAt, p = prog(t, k.doneAt, 0.3);
        return <div key={i} style={{ height: 78, display: 'flex', alignItems: 'center', gap: 22, opacity: prog(t, k.at, 0.25) }}>
          {done ? <div style={{ width: 46, height: 46, borderRadius: 23, background: '#28C840', color: '#fff', fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.4, 1, p)})` }}>✓</div>
            : <div style={{ width: 46, height: 46, borderRadius: 23, border: `5px solid ${C.line}`, borderTopColor: C.accent, boxSizing: 'border-box', transform: `rotate(${(t - k.at) * 420}deg)` }} />}
          <div style={{ fontSize: 40, fontWeight: 600, color: done ? C.text : C.muted, whiteSpace: 'nowrap' }}>{k.text}</div>
        </div>; })}
    </div>
  );
};
