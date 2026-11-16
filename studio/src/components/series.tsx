// 系列化叙事件：一个吉祥物员工、任务卡、打回循环、计数器、奖励和下集预告。
// 参考「AI 员工上岗」系列的结构（docs/对标拆解-AI员工上岗.md）。原片是三维渲染，这里是二维的近似实现；吉祥物是自己设计的形象。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';
import { noise, oscillate, spring } from '../kit/motion';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 77.7 + 3.3) * 43758.5453; return x - Math.floor(x); };
const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const NAVY = '#152442', ORANGE = '#FF7A3D', GOLD = '#F6C453', PANEL = 'rgba(16,24,44,.9)';
const sp = (t: number, at: number, k = 180, d = 14) => Math.max(0, spring(t - at, { from: 0, to: 1, stiffness: k, damping: d }));
const panel: React.CSSProperties = { background: PANEL, border: '2px solid rgba(120,160,255,.35)', borderRadius: 22, boxShadow: '0 20px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12)', fontFamily: FONT, color: C.text };

export type Expr = 'idle' | 'happy' | 'sad' | 'shock' | 'think' | 'work';
/** 吉祥物：一个圆滚滚的小员工，屏幕脸、天线、两只小手。会呼吸、眨眼，按时间表换表情。系列片里当「AI 员工」或主持搭档。 */
export const Mascot: React.FC<{ exprs?: { at: number; e: Expr }[]; at?: number; size?: number; body?: string; accent?: string; tag?: string; wave?: boolean }> = ({ exprs = [], at = 0, size = 360, body = '#EEF2F7', accent = ORANGE, tag, wave }) => {
  const t = useT(), e: Expr = exprs.reduce<Expr>((cur, x) => (t >= x.at ? x.e : cur), 'idle');
  const enter = sp(t, at, 160, 12), bob = oscillate(t, { amplitude: 4, frequency: 0.6 }), blink = (t % 3.3) < 0.12 && e !== 'happy', arm = wave || e === 'happy' ? oscillate(t, { amplitude: 22, frequency: 1.6 }) : e === 'shock' ? -30 : 0, tilt = e === 'think' ? -6 : e === 'sad' ? 4 : noise(t, { amplitude: 2, frequency: 0.4, seed: 3 });
  const eye = (x: number) => { const y = 92; if (e === 'happy') return <path d={`M${x - 13} ${y + 4} Q${x} ${y - 14} ${x + 13} ${y + 4}`} stroke="#E9FBFF" strokeWidth={8} fill="none" strokeLinecap="round" />; if (e === 'sad') return <path d={`M${x - 12} ${y - 2} Q${x} ${y + 10} ${x + 12} ${y - 2}`} stroke="#9FC3FF" strokeWidth={7} fill="none" strokeLinecap="round" />; if (blink || e === 'work') return <rect x={x - 13} y={y - 2} width={26} height={e === 'work' ? 8 : 5} rx={3} fill="#E9FBFF" />; const r = e === 'shock' ? 16 : 0; return <rect x={x - 11 - r / 2} y={y - 17 - r / 2 + (e === 'think' ? -6 : 0)} width={22 + r} height={34 + r} rx={11 + r / 2} fill="#E9FBFF" />; };
  return (
    <div style={{ width: size, height: size, transform: `translateY(${(1 - enter) * 60 + bob}px) scale(${mix(0.6, 1, enter)}) rotate(${tilt}deg)`, opacity: cl(enter * 3), transformOrigin: '50% 90%' }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs><radialGradient id="mbody" cx="40%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" /><stop offset=".55" stopColor={body} /><stop offset="1" stopColor="#B9C4D3" /></radialGradient></defs>
        <ellipse cx={100} cy={190} rx={62} ry={9} fill="rgba(0,0,0,.25)" />
        <line x1={100} y1={38} x2={100 + noise(t, { amplitude: 6, frequency: 0.8, seed: 9 })} y2={14} stroke={NAVY} strokeWidth={5} strokeLinecap="round" /><circle cx={100 + noise(t, { amplitude: 6, frequency: 0.8, seed: 9 })} cy={12} r={10} fill={accent} />
        <g transform={`rotate(${-arm} 38 122)`}><ellipse cx={26} cy={122} rx={18} ry={14} fill={accent} /></g><g transform={`rotate(${arm} 162 122)`}><ellipse cx={174} cy={122} rx={18} ry={14} fill={accent} /></g>
        <ellipse cx={58} cy={182} rx={20} ry={10} fill={NAVY} /><ellipse cx={142} cy={182} rx={20} ry={10} fill={NAVY} />
        <rect x={30} y={36} width={140} height={146} rx={66} fill="url(#mbody)" />
        <rect x={46} y={56} width={108} height={76} rx={36} fill={NAVY} /><rect x={52} y={60} width={50} height={10} rx={5} fill="rgba(255,255,255,.12)" />
        {eye(80)}{eye(120)}
        {e === 'shock' && <ellipse cx={100} cy={120} rx={8} ry={9} fill="#E9FBFF" />}
        <rect x={70} y={150} width={60} height={20} rx={6} fill="#fff" stroke={NAVY} strokeWidth={2.5} />{tag && <text x={100} y={165} textAnchor="middle" fontSize={12} fontWeight={900} fill={NAVY} fontFamily="MiSans, sans-serif">{tag}</text>}
      </svg>
    </div>
  );
};
const ICONS: Record<string, { g: string; bg: string }> = { '!': { g: '!', bg: '#FFB020' }, '?': { g: '?', bg: '#5B9BFF' }, fire: { g: '🔥', bg: 'transparent' }, sweat: { g: '💧', bg: 'transparent' }, idea: { g: '💡', bg: 'transparent' }, heart: { g: '❤', bg: 'transparent' }, check: { g: '✓', bg: '#2BB673' }, x: { g: '✕', bg: '#E5484D' } };
/** 小反应：一个符号在角色头顶弹出来，飘一下再消失（感叹号、问号、火苗、汗、灯泡、勾、叉）。给吉祥物或真人加情绪。 */
export const Reaction: React.FC<{ icon: keyof typeof ICONS; at: number; life?: number; size?: number; text?: string }> = ({ icon, at, life = 1.6, size = 90, text }) => {
  const t = useT(), e = t - at; if (e < 0 || e > life + 0.3) return null; const k = sp(t, at, 300, 12), out = cl((e - life) / 0.3), ic = ICONS[icon];
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, transform: `translateY(${-e * 14}px) scale(${k}) rotate(${oscillate(e, { amplitude: 6, frequency: 2 })}deg)`, opacity: 1 - out }}>
    <div style={{ width: size, height: size, borderRadius: size / 2, background: ic.bg, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: size * (ic.bg === 'transparent' ? 0.82 : 0.62), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: ic.bg === 'transparent' ? 'none' : '0 8px 20px rgba(0,0,0,.35)' }}>{ic.g}</div>
    {text && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.45, color: NAVY, background: '#fff', padding: `${size * 0.08}px ${size * 0.22}px`, borderRadius: size * 0.16, transform: 'rotate(-4deg)', whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(0,0,0,.3)' }}>{text}</div>}
  </div>;
};
/** 岗位说明书：角落一张常驻的信息卡，随剧情一行行加内容（岗位、职责、及格线、数据）。让观众一直知道「这一集在考什么」。 */
export const JobSpecCard: React.FC<{ title: string; badge?: string; meta?: string; rows: { k: string; v: string; at: number; hi?: boolean }[]; at: number; width?: number }> = ({ title, badge, meta, rows, at, width = 760 }) => {
  const t = useT(), p = sp(t, at, 170, 16);
  return <div style={{ ...panel, width, padding: '22px 30px', transform: `translateX(${(1 - p) * -80}px)`, opacity: cl(p * 2) }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}><div style={{ width: 40, height: 40, borderRadius: 20, background: '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 22, height: 14, borderRadius: 7, background: NAVY }} /></div><div style={{ fontWeight: 900, fontSize: 34 }}>{title}</div>{badge && <div style={{ fontSize: 18, background: 'rgba(120,160,255,.25)', padding: '2px 12px', borderRadius: 8 }}>{badge}</div>}<div style={{ flex: 1 }} />{meta && <div style={{ fontFamily: MONO, fontSize: 16, opacity: 0.6 }}>{meta}</div>}</div>
    {rows.map((r, i) => { const q = sp(t, r.at, 220, 18); if (t < r.at) return null; return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '10px 6px', borderTop: '1px solid rgba(255,255,255,.08)', background: r.hi ? 'rgba(255,212,121,.12)' : 'transparent', opacity: cl(q * 2), transform: `translateY(${(1 - q) * -16}px)`, maxHeight: q * 80, overflow: 'hidden' }}><div style={{ width: 26, height: 26, borderRadius: 7, background: r.hi ? GOLD : '#4A6FD8', flex: 'none' }} /><div style={{ width: 150, fontSize: 26, opacity: 0.75 }}>{r.k}</div><div style={{ fontSize: 30, fontWeight: 600, color: r.hi ? GOLD : C.text }}>{r.v}</div></div>; })}
  </div>;
};
/** 任务卡：编号加任务名的一张卡，下面一张小清单，到点一项项打勾。每一段「这件事要做什么」开头亮出来。 */
export const MissionCard: React.FC<{ no: string; title: string; sub?: string; checks?: { t: string; at: number; fail?: boolean }[]; at: number; width?: number }> = ({ no, title, sub, checks = [], at, width = 620 }) => {
  const t = useT(), p = sp(t, at, 150, 13);
  return <div style={{ ...panel, width, padding: '24px 32px', transform: `perspective(900px) rotateY(${(1 - p) * 40}deg) rotate(${mix(-8, -3, p)}deg) scale(${mix(0.7, 1, p)})`, opacity: cl(p * 2) }}>
    <div style={{ fontFamily: MONO, fontSize: 18, opacity: 0.6, letterSpacing: '0.12em' }}>任务 · MISSION</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}><span style={{ fontWeight: 900, fontSize: 96, color: GOLD, lineHeight: 1.05 }}>{no}</span><span style={{ fontWeight: 900, fontSize: 70 }}>{title}</span></div>{sub && <div style={{ fontSize: 24, opacity: 0.7, marginBottom: 6 }}>{sub}</div>}
    {checks.map((c, i) => { const done = t >= c.at, k = sp(t, c.at, 400, 14); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 32 }}><div style={{ width: 38, height: 38, borderRadius: 8, border: '3px solid rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? (c.fail ? '#E5484D' : '#2BB673') : 'transparent', fontWeight: 900, fontSize: 28, transform: `scale(${done ? mix(1.4, 1, cl(k)) : 1})` }}>{done ? (c.fail ? '✕' : '✓') : ''}</div><span style={{ opacity: done ? 1 : 0.75, textDecoration: done && c.fail ? 'line-through' : 'none' }}>{c.t}</span></div>; })}
  </div>;
};
/** 打回循环：一件事的几轮尝试排成一条——初版、被打回（红章）、想明白（灯泡）、二版通过（绿章）。讲「AI 是怎么被教会的」。 */
export const AttemptLoop: React.FC<{ steps: { label: string; note?: string; kind: 'try' | 'fail' | 'idea' | 'ok'; at: number }[]; width?: number }> = ({ steps, width = 1700 }) => {
  const t = useT(), n = steps.length, col = { try: '#5B9BFF', fail: '#E5484D', idea: GOLD, ok: '#2BB673' }, glyph = { try: '▶', fail: '打回', idea: '💡', ok: '通过' };
  return <div style={{ position: 'relative', width, height: 360, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: width / (2 * n), right: width / (2 * n), top: 108, height: 6, background: 'rgba(255,255,255,.15)', borderRadius: 3 }} />
    {steps.map((s, i) => { const x = ((i + 0.5) / n) * width, k = sp(t, s.at, 220, 13), stamp = s.kind === 'fail' || s.kind === 'ok'; return <React.Fragment key={i}>
      {i > 0 && <div style={{ position: 'absolute', left: ((i - 0.5) / n) * width, top: 108, height: 6, width: (width / n) * inOut((t - s.at + 0.3) / 0.3), background: col[s.kind], borderRadius: 3 }} />}
      <div style={{ position: 'absolute', left: x - 110, top: 0, width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cl(k * 2), transform: `scale(${t < s.at ? 0 : k}) rotate(${stamp ? (s.kind === 'fail' ? -10 : 6) : 0}deg)` }}>
        {stamp ? <div style={{ fontWeight: 900, fontSize: 64, color: col[s.kind], border: `8px solid ${col[s.kind]}`, borderRadius: 18, padding: '6px 22px', background: 'rgba(10,12,20,.85)', letterSpacing: '0.08em' }}>{glyph[s.kind]}</div> : <div style={{ width: 150, height: 150, borderRadius: 75, background: col[s.kind], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s.kind === 'idea' ? 80 : 60, color: '#fff', boxShadow: `0 0 50px ${col[s.kind]}88` }}>{glyph[s.kind]}</div>}
      </div>
      <div style={{ position: 'absolute', left: x - 170, width: 340, top: 236, textAlign: 'center', opacity: prog(t, s.at + 0.15, 0.3) }}><div style={{ fontWeight: 900, fontSize: 40, color: C.text }}>{s.label}</div>{s.note && <div style={{ fontSize: 24, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{s.note}</div>}</div>
    </React.Fragment>; })}
  </div>;
};
/** 出手次数：「出手 ≤ 3 次」加三个圆点，每用掉一次涂满一个。给「老板插手」「求助」「复活机会」这类有限次数计数。 */
export const InterventionBudget: React.FC<{ label?: string; max?: number; used: number[]; at: number; head?: string }> = ({ label = '出手', max = 3, used, at, head = '本期及格线' }) => {
  const t = useT(), p = sp(t, at, 200, 15), n = used.filter((u) => t >= u).length;
  return <div style={{ ...panel, display: 'inline-block', padding: '20px 40px 26px', textAlign: 'center', transform: `scale(${p})` }}><div style={{ fontSize: 18, opacity: 0.6, letterSpacing: '0.2em' }}>{head}</div><div style={{ fontWeight: 900, fontSize: 64, margin: '6px 0 14px' }}>{label} ≤ {max} 次</div><div style={{ display: 'flex', gap: 22, justifyContent: 'center' }}>{Array.from({ length: max }).map((_, i) => { const k = i < n ? sp(t, used[i], 320, 12) : 0; return <div key={i} style={{ width: 40, height: 40, borderRadius: 20, border: '4px solid #fff', boxSizing: 'border-box', background: i < n ? '#fff' : 'transparent', transform: `scale(${i < n ? mix(1.6, 1, cl(k)) : 1})` }} />; })}</div><div style={{ fontFamily: MONO, fontSize: 20, opacity: 0.7, marginTop: 12 }}>已用 {n} / {max}</div></div>;
};
/** 目标计数器：一块小屏幕上的数字从 0 往上跳，下面一根进度条对着目标；可以停在「?」留悬念。讲「这期的及格线能不能达到」。 */
export const GoalCounter: React.FC<{ value: number; target: number; label: string; unit?: string; at: number; dur?: number; mysteryAt?: number; width?: number }> = ({ value, target, label, unit = '', at, dur = 2.4, mysteryAt, width = 620 }) => {
  const t = useT(), p = sp(t, at, 180, 16), k = inOut((t - at - 0.3) / dur), v = Math.round(value * k), mys = mysteryAt !== undefined && t >= mysteryAt, glitch = mys && t < mysteryAt! + 0.3;
  return <div style={{ ...panel, width, padding: '26px 36px', transform: `scale(${p})`, textAlign: 'center' }}><div style={{ fontSize: 22, opacity: 0.65, letterSpacing: '0.12em' }}>{label}</div><div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, lineHeight: 1.15, color: mys ? GOLD : C.text, transform: glitch ? `translateX(${(rnd(Math.floor(t * 40)) - 0.5) * 30}px)` : 'none' }}>{mys ? '?' : v.toLocaleString('en-US')}{!mys && unit}</div><div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: `${mys ? 100 : cl(v / target) * 100}%`, background: mys ? `repeating-linear-gradient(90deg, ${GOLD} 0 14px, transparent 14px 24px)` : '#5B9BFF', borderRadius: 6 }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 20, opacity: 0.6, marginTop: 8 }}><span>0</span><span>目标 {target.toLocaleString('en-US')}</span></div></div>;
};
/** 播放器进度条：一条假的视频进度条，播放头往前走，在几个位置立起小标记（40%、80%）。讲「留人点放在哪」「这里要发生什么」。 */
export const PlayerScrubber: React.FC<{ marks: { p: number; label: string; at: number }[]; at: number; to?: number; total?: string; width?: number }> = ({ marks, at, to = 1, total = '6:21', width = 1500 }) => {
  const t = useT(), ph = mix(0, to, inOut((t - at) / 3.2)), mm = (f: number) => { const [a, b] = total.split(':').map(Number), s = Math.round((a * 60 + b) * f); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  return <div style={{ width, fontFamily: FONT, opacity: prog(t, at, 0.3) }}>
    <div style={{ position: 'relative', height: 140 }}>{marks.map((m, i) => { const k = sp(t, m.at, 260, 13); return <div key={i} style={{ position: 'absolute', left: m.p * width, bottom: 0, transform: `translateX(-50%) scale(${k})`, transformOrigin: '50% 100%', textAlign: 'center' }}><div style={{ fontWeight: 900, fontSize: 30, color: '#14171D', background: GOLD, padding: '6px 16px', borderRadius: 10, whiteSpace: 'nowrap' }}>{m.label}</div><div style={{ width: 4, height: 40, background: GOLD, margin: '0 auto' }} /></div>; })}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}><div style={{ fontSize: 40, color: '#fff' }}>▶</div><div style={{ position: 'relative', flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.25)' }}><div style={{ width: `${ph * 100}%`, height: '100%', background: '#fff', borderRadius: 6 }} />{marks.map((m, i) => <div key={i} style={{ position: 'absolute', left: `${m.p * 100}%`, top: -6, width: 6, height: 24, background: GOLD, transform: 'translateX(-50%)' }} />)}<div style={{ position: 'absolute', left: `${ph * 100}%`, top: -10, width: 32, height: 32, borderRadius: 16, background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 2px 10px rgba(0,0,0,.5)' }} /></div><div style={{ fontFamily: MONO, fontSize: 28, color: '#fff' }}>{mm(ph)} / {total}</div></div>
  </div>;
};
/** 钩子四格：「开头一句话的机会」，四个格子（谁、要干嘛、赌什么、接下来怎样）一格格点亮。讲开头该交代什么，或任何「必须答的四个问题」。 */
export const HookGrid: React.FC<{ title: string; cells: { t: string; at: number }[]; at: number; width?: number }> = ({ title, cells, at, width = 900 }) => {
  const t = useT(), p = sp(t, at, 170, 14);
  return <div style={{ width, background: '#1B1E26', border: `6px solid ${GOLD}`, borderRadius: 20, padding: 26, boxSizing: 'border-box', transform: `scale(${p})`, fontFamily: FONT, boxShadow: `0 0 60px ${GOLD}33` }}><div style={{ textAlign: 'center', fontWeight: 900, fontSize: 52, color: GOLD, marginBottom: 20 }}>{title}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{cells.map((c, i) => { const on = t >= c.at, k = sp(t, c.at, 300, 14); return <div key={i} style={{ height: 120, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 56, background: on ? GOLD : '#2A2F3A', color: on ? '#14171D' : '#6B7385', transform: `scale(${on ? mix(1.15, 1, cl(k)) : 1})` }}>{c.t}</div>; })}</div></div>;
};
/** 卡片扇：几张编号卡片从一叠里扇开成一道弧，挂在角色头顶。讲「这个岗位要干这么多活」「这几个环节」。 */
export const CardFan: React.FC<{ cards: string[]; at: number; radius?: number; spread?: number; card?: [number, number] }> = ({ cards, at, radius = 520, spread = 70, card = [150, 210] }) => {
  const t = useT(), n = cards.length, k = sp(t, at, 120, 12), W = radius * 2.2, H = radius * 0.9;
  return <div style={{ position: 'relative', width: W, height: H, fontFamily: FONT }}>{cards.map((c, i) => { const a = (-spread / 2 + (spread * i) / Math.max(1, n - 1)) * k, q = sp(t, at + i * 0.06, 200, 13); return <div key={i} style={{ position: 'absolute', left: W / 2 - card[0] / 2, top: H - card[1] - 10, width: card[0], height: card[1], transformOrigin: `50% ${radius}px`, transform: `rotate(${a}deg) translateY(${(1 - q) * 80}px)`, background: 'linear-gradient(160deg, #233663, #101A33)', border: '3px solid rgba(160,190,255,.6)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,.4)' }}><div style={{ fontFamily: MONO, fontSize: 20, opacity: 0.6 }}>{String(i + 1).padStart(2, '0')}</div><div style={{ fontWeight: 900, fontSize: 40, writingMode: c.length > 2 ? 'horizontal-tb' : 'horizontal-tb' }}>{c}</div></div>; })}</div>;
};
/** 工牌：一张员工证，头像、姓名、岗位、工号、二维码，到点盖一个「入职」章。介绍一个新角色登场。 */
export const IdBadge: React.FC<{ avatar: React.ReactNode; name: string; role: string; no: string; org?: string; stamp?: string; at: number; stampAt?: number; width?: number }> = ({ avatar, name, role, no, org = '示例公司 · 员工证', stamp = '入职', at, stampAt, width = 640 }) => {
  const t = useT(), p = sp(t, at, 160, 12), s = stampAt === undefined ? 0 : cl((t - stampAt) / 0.16), qr = Array.from({ length: 49 }).map((_, i) => rnd(i + 11) > 0.5 || [0, 6, 42, 48, 1, 7, 43, 5, 13].includes(i));
  return <div style={{ position: 'relative', width, background: 'linear-gradient(150deg, #20345F, #0F1A33)', border: '3px solid rgba(160,190,255,.6)', borderRadius: 26, padding: 28, boxSizing: 'border-box', fontFamily: FONT, color: '#fff', transform: `rotate(${mix(-14, -4, p)}deg) translateY(${(1 - p) * -200}px)`, opacity: cl(p * 2), boxShadow: '0 30px 70px rgba(0,0,0,.5)' }}>
    <div style={{ position: 'absolute', left: width / 2 - 40, top: -18, width: 80, height: 26, borderRadius: 13, background: '#0B0E14', border: '3px solid rgba(160,190,255,.6)' }} />
    <div style={{ fontFamily: MONO, fontSize: 18, opacity: 0.65, marginBottom: 16 }}>{org}</div>
    <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}><div style={{ width: 180, height: 180, borderRadius: 20, overflow: 'hidden', background: '#E7ECF3', flex: 'none' }}>{avatar}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 900, fontSize: 70, lineHeight: 1.1 }}>{name}</div><div style={{ fontSize: 30, opacity: 0.85, marginTop: 6 }}>{role}</div><div style={{ fontFamily: MONO, fontSize: 24, opacity: 0.6, marginTop: 10 }}>工号 {no}</div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 12px)', gap: 2, background: '#fff', padding: 8, borderRadius: 8, alignSelf: 'flex-end' }}>{qr.map((on, i) => <div key={i} style={{ width: 12, height: 12, background: on ? '#0B0E14' : '#fff' }} />)}</div></div>
    {stampAt !== undefined && <div style={{ position: 'absolute', right: 150, bottom: 30, fontWeight: 900, fontSize: 60, color: '#3BE07A', border: '7px solid #3BE07A', borderRadius: 14, padding: '0 22px', transform: `rotate(-14deg) scale(${s < 1 ? mix(3, 0.95, s) : 1})`, opacity: t < stampAt ? 0 : 0.95, letterSpacing: '0.1em' }}>{stamp}</div>}
  </div>;
};
/** 胶囊盲盒：一排白色胶囊舱，底座上写着岗位名；到点其中一个打开，里面露出角色或内容。讲「一个个岗位等着被替换」「这期轮到谁」。 */
export const CapsulePods: React.FC<{ labels: string[]; open?: number; openAt?: number; inside?: React.ReactNode; at: number; pod?: number }> = ({ labels, open, openAt = 0, inside, at, pod = 260 }) => {
  const t = useT(), H = pod * 1.35;
  return <div style={{ display: 'flex', gap: pod * 0.16, alignItems: 'flex-end' }}>{labels.map((l, i) => { const k = sp(t, at + i * 0.12, 200, 14), me = i === open, o = me ? sp(t, openAt, 120, 11) : 0, glow = me && t >= openAt; return <div key={i} style={{ position: 'relative', width: pod, height: H + 60, transform: `translateY(${(1 - k) * 60}px)`, opacity: cl(k * 2) }}>
    <div style={{ position: 'absolute', left: pod * 0.06, right: pod * 0.06, bottom: 70, height: H - 40, borderRadius: `${pod * 0.44}px ${pod * 0.44}px 18px 18px`, background: 'radial-gradient(circle at 38% 30%, #FFFFFF, #E7E3DA 55%, #BDB7AB)', boxShadow: glow ? `0 0 80px ${GOLD}aa` : '0 20px 40px rgba(0,0,0,.35)' }}>
      <div style={{ position: 'absolute', left: '14%', right: '14%', top: '12%', bottom: '12%', borderRadius: `${pod * 0.36}px ${pod * 0.36}px 14px 14px`, background: glow ? '#141A2A' : 'linear-gradient(160deg, rgba(150,160,175,.55), rgba(70,78,92,.55))', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>{me && inside && <div style={{ width: '90%', transform: `translateY(${(1 - o) * 60}%)` }}>{inside}</div>}{!glow && <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(6px)', background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,.35), transparent 60%)' }} />}</div>
      {me && <div style={{ position: 'absolute', left: '10%', right: '10%', top: '6%', height: '52%', borderRadius: `${pod * 0.38}px ${pod * 0.38}px 0 0`, border: '6px solid #CFC9BC', borderBottom: 'none', transformOrigin: '100% 100%', transform: `perspective(600px) rotateY(${-o * 70}deg)`, opacity: 1 - o * 0.4 }} />}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, borderRadius: 22, background: 'linear-gradient(180deg, #3A3F4A, #1D2028)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: pod * 0.15, color: '#fff', border: '2px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '2px 18px' }}>{l}</div></div>
  </div>; })}</div>;
};
/** 金币雨：一把金币从上面掉下来，按重力落地、弹两下、堆成一堆，旁边金额跟着往上跳。讲「钱」「估值」「奖励」。 */
export const CoinRain: React.FC<{ count?: number; at: number; amount?: { to: number; prefix?: string }; width?: number; height?: number }> = ({ count = 90, at, amount, width = 1100, height = 620 }) => {
  const t = useT(), g = 2600, floor = height - 40, cx = width * 0.42, coins = [] as React.ReactNode[];
  for (let i = 0; i < count; i++) {
    const t0 = at + i * 0.025 + rnd(i) * 0.15, e = t - t0; if (e < 0) continue;
    const tx = cx + (rnd(i + 3) - 0.5) * (width * 0.55) * (0.4 + rnd(i + 9) * 0.6), layer = Math.floor((1 - Math.abs(tx - cx) / (width * 0.3)) * 6 * Math.min(1, i / count + 0.2)), fy = floor - Math.max(0, layer) * 12 - rnd(i + 5) * 6, h = fy + 200, tf = Math.sqrt((2 * h) / g);
    let y: number; if (e < tf) y = -200 + 0.5 * g * e * e; else { let r = e - tf, v = g * tf * 0.35, yy = fy; for (let b = 0; b < 3; b++) { const tb = (2 * v) / g; if (r < tb) { yy = fy - (v * r - 0.5 * g * r * r); break; } r -= tb; v *= 0.35; } y = yy; }
    const settled = e > tf + 0.4, rot = settled ? rnd(i + 7) * 40 - 20 : e * 900 * (rnd(i) > 0.5 ? 1 : -1), sq = settled ? 0.32 : Math.abs(Math.cos(e * 9 + i));
    coins.push(<div key={i} style={{ position: 'absolute', left: tx - 26, top: y - 26, width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFF4C0, #F6C453 40%, #B9821D 85%)', border: '3px solid #8E6113', boxSizing: 'border-box', transform: `rotate(${rot}deg) scaleY(${Math.max(0.18, sq)})`, boxShadow: settled ? '0 3px 0 #7A5410' : '0 0 14px rgba(255,210,90,.5)', zIndex: Math.round(y) }} />);
  }
  const v = amount ? Math.round(amount.to * inOut((t - at - 0.3) / 2)) : 0;
  return <div style={{ position: 'relative', width, height }}>{coins}{amount && <div style={{ position: 'absolute', right: 0, top: 30, fontFamily: MONO, fontWeight: 700, fontSize: 110, color: GOLD, textShadow: `0 0 30px ${GOLD}88, 0 4px 0 #7A5410`, opacity: prog(t, at, 0.3) }}>{amount.prefix ?? '¥'}{v.toLocaleString('en-US')}</div>}</div>;
};
/** 奖励宝箱：一个宝箱弹出来、盖子打开、里面冒光，几枚标签从箱子里飘出来排开。讲「片尾送什么」「这期你能拿走什么」。 */
export const RewardChest: React.FC<{ tags: string[]; at: number; openAt: number; size?: number }> = ({ tags, at, openAt, size = 360 }) => {
  const t = useT(), p = sp(t, at, 200, 11), o = sp(t, openAt, 140, 10), W = size * 3;
  return <div style={{ position: 'relative', width: W, height: size * 1.7, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: W / 2 - size * 0.7, bottom: size * 0.55, width: size * 1.4, height: size * 1.1, background: `radial-gradient(ellipse at 50% 100%, ${GOLD}cc, transparent 65%)`, opacity: cl(o) }} />
    {tags.map((g, i) => { const n = tags.length, a = (-50 + (100 * i) / Math.max(1, n - 1)) * (Math.PI / 180), k = sp(t, openAt + 0.3 + i * 0.15, 160, 12), x = W / 2 + Math.sin(a) * size * 1.15 * k, y = size * 1.05 - Math.cos(a) * size * 0.85 * k; return <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${k}) rotate(${(i - (n - 1) / 2) * 6}deg)`, background: '#1A2440', border: '2px solid rgba(160,190,255,.6)', color: '#fff', fontWeight: 900, fontSize: size * 0.11, padding: `${size * 0.03}px ${size * 0.07}px`, borderRadius: 12, whiteSpace: 'nowrap', boxShadow: '0 10px 24px rgba(0,0,0,.4)' }}>{g}</div>; })}
    <div style={{ position: 'absolute', left: W / 2 - size / 2, bottom: 0, width: size, height: size * 0.7, transform: `scale(${p})`, transformOrigin: '50% 100%' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size * 0.48, background: 'linear-gradient(180deg, #2A47A8, #172A6A)', border: `${size * 0.03}px solid ${GOLD}`, borderRadius: size * 0.04 }}><div style={{ position: 'absolute', left: size * 0.42, top: -size * 0.02, width: size * 0.16, height: size * 0.14, background: GOLD, borderRadius: 6 }} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: size * 0.46, height: size * 0.24, background: 'linear-gradient(180deg, #3A5BC8, #213A8E)', border: `${size * 0.03}px solid ${GOLD}`, borderRadius: `${size * 0.12}px ${size * 0.12}px ${size * 0.02}px ${size * 0.02}px`, transformOrigin: '50% 100%', transform: `perspective(${size * 3}px) rotateX(${o * 110}deg)` }} />
    </div>
  </div>;
};
/** 立体牌子：一块有厚度的字牌，随镜头微微转动，侧面看得见厚度。片名、口号、品牌名。 */
export const ThickSign: React.FC<{ text: string; at: number; size?: number; face?: string; side?: string; depth?: number }> = ({ text, at, size = 180, face = '#F3E3C2', side = '#9C7A45', depth = 18 }) => {
  const t = useT(), p = sp(t, at, 150, 12), ry = noise(t, { amplitude: 14, frequency: 0.25, seed: 4 }) + (1 - p) * 60, rx = noise(t, { amplitude: 5, frequency: 0.2, seed: 8 }), dx = Math.sin((ry * Math.PI) / 180) * depth, sh = Array.from({ length: depth }).map((_, i) => `${(-dx * (i + 1)) / depth}px ${i + 1}px 0 ${side}`).join(', ');
  return <div style={{ perspective: 1400 }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.1, color: face, textShadow: `${sh}, ${-dx}px ${depth + 18}px 30px rgba(0,0,0,.5)`, transform: `rotateY(${ry}deg) rotateX(${rx}deg) scale(${p})`, padding: `${size * 0.12}px ${size * 0.3}px`, background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,.15))', borderRadius: size * 0.08, border: `${size * 0.03}px solid ${side}`, whiteSpace: 'nowrap' }}>{text}</div></div>;
};
/** 情绪曲线：一条起伏的曲线画过时间轴，几个点上标着「得意」「被打回」「该笑」；下面一排音乐波形，对得上的段落亮起来。讲「按情绪选配乐」或任何「情绪走向」。 */
export const EmotionCurve: React.FC<{ points: { x: number; y: number; label?: string }[]; at: number; wave?: boolean; matchAt?: number; width?: number; height?: number }> = ({ points, at, wave = true, matchAt, width = 1600, height = 520 }) => {
  const t = useT(), d = inOut((t - at) / 1.8), ch = wave ? height * 0.62 : height, X = (x: number) => 40 + x * (width - 80), Y = (y: number) => 40 + (1 - y) * (ch - 80);
  let path = `M${X(points[0].x)} ${Y(points[0].y)}`; for (let i = 1; i < points.length; i++) { const a = points[i - 1], b = points[i], mx = (X(a.x) + X(b.x)) / 2; path += ` C${mx} ${Y(a.y)} ${mx} ${Y(b.y)} ${X(b.x)} ${Y(b.y)}`; }
  const m = matchAt === undefined ? 0 : prog(t, matchAt, 0.5), bars = 90;
  return <div style={{ position: 'relative', width, height, fontFamily: FONT }}>
    <svg width={width} height={ch} style={{ position: 'absolute', left: 0, top: 0 }}><line x1={40} x2={width - 40} y1={Y(0.5)} y2={Y(0.5)} stroke="rgba(255,255,255,.15)" strokeDasharray="6 8" /><path d={path} fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} />{points.map((p, i) => p.label && d >= p.x - 0.01 ? <g key={i}><circle cx={X(p.x)} cy={Y(p.y)} r={12} fill="#fff" /></g> : null)}</svg>
    {points.map((p, i) => p.label ? <div key={i} style={{ position: 'absolute', left: X(p.x), top: Y(p.y) + (p.y > 0.5 ? -74 : 24), transform: 'translateX(-50%)', fontWeight: 900, fontSize: 32, color: '#14171D', background: p.y > 0.5 ? GOLD : '#FF8A7A', padding: '4px 16px', borderRadius: 10, whiteSpace: 'nowrap', opacity: prog(t, at + p.x * 1.8, 0.3) }}>{p.label}</div> : null)}
    {wave && <div style={{ position: 'absolute', left: 40, right: 40, top: ch + 20, height: height - ch - 20, display: 'flex', alignItems: 'center', gap: 3 }}>{Array.from({ length: bars }).map((_, i) => { const x = i / (bars - 1), ey = (() => { let k = 0; while (k < points.length - 2 && points[k + 1].x < x) k++; const a = points[k], b = points[k + 1]; return mix(a.y, b.y, cl((x - a.x) / (b.x - a.x || 1))); })(), hgt = (0.2 + 0.8 * ey) * (0.55 + 0.45 * rnd(i)) * 100; return <div key={i} style={{ flex: 1, height: `${hgt * prog(t, at + 0.4 + x * 0.6, 0.3)}%`, background: m > 0 ? `rgba(91,155,255,${mix(0.35, 1, m)})` : 'rgba(255,255,255,.3)', borderRadius: 2 }} />; })}</div>}
  </div>;
};
/** 拖影：一个物体沿弧线飞过，身后留下一串越来越淡的残影。讲「动态模糊」「速度」「一帧里叠了很多瞬间」。 */
export const GhostTrail: React.FC<{ children: React.ReactNode; from: [number, number]; to: [number, number]; lift?: number; at: number; dur?: number; ghosts?: number; gap?: number; width?: number; height?: number }> = ({ children, from, to, lift = 260, at, dur = 1.6, ghosts = 12, gap = 0.035, width = 1500, height = 700 }) => {
  const t = useT(), pos = (q: number) => { const p = cl(q), x = mix(from[0], to[0], p), y = mix(from[1], to[1], p) - Math.sin(p * Math.PI) * lift; return [x, y]; };
  return <div style={{ position: 'relative', width, height }}>{Array.from({ length: ghosts + 1 }).map((_, k) => { const q = (t - at - k * gap) / dur; if (q < 0) return null; const [x, y] = pos(q); return <div key={k} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${q * 540}deg)`, opacity: k === 0 ? 1 : (1 - k / (ghosts + 1)) * 0.5, filter: k ? `blur(${k * 0.4}px)` : 'none', zIndex: ghosts - k }}>{children}</div>; })}</div>;
};
/** 手册摊开：一本手册从合上到翻开，右页是一条带编号的步骤链。讲「这些做法沉淀成了一本手册」「整期按手册走一遍」。 */
export const ManualSpread: React.FC<{ title: string; no?: string; steps: string[]; at: number; openAt: number; width?: number }> = ({ title, no = '04', steps, at, openAt, width = 1400 }) => {
  const t = useT(), p = sp(t, at, 160, 14), o = inOut((t - openAt) / 0.8), h = width * 0.58, half = width / 2;
  return <div style={{ position: 'relative', width, height: h, perspective: 2400, transform: `rotateX(28deg) scale(${p})`, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: half, top: 0, width: half, height: h, background: '#F3F0E8', borderRadius: '0 10px 10px 0', boxShadow: '0 30px 60px rgba(0,0,0,.45)', padding: 44, boxSizing: 'border-box', color: '#1A1D24' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, opacity: o }}><span style={{ fontWeight: 900, fontSize: 56, color: '#2B5BD7' }}>{no}</span><span style={{ fontWeight: 900, fontSize: 40 }}>{title}</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 }}>{steps.map((s, i) => { const k = sp(t, openAt + 0.6 + i * 0.18, 260, 14); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, transform: `scale(${k})` }}><div style={{ fontWeight: 900, fontSize: 34, background: '#1A1D24', color: '#fff', borderRadius: 8, padding: '10px 20px' }}>{s}</div>{i < steps.length - 1 && <span style={{ fontSize: 26, color: '#8A8F9A' }}>→</span>}</div>; })}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 0, width: half, height: h, background: '#ECE8DE', borderRadius: '10px 0 0 10px', boxShadow: 'inset -30px 0 40px rgba(0,0,0,.12)', opacity: o }} />
    <div style={{ position: 'absolute', left: half, top: 0, width: half, height: h, transformOrigin: '0 50%', transform: `rotateY(${-o * 178}deg)`, background: 'linear-gradient(135deg, #283C78, #182650)', borderRadius: '0 10px 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,.4)' }}><div style={{ fontWeight: 900, fontSize: 52, color: '#E8D9A8', border: '3px solid #E8D9A8', padding: '16px 40px' }}>《{title}》</div></div>
  </div>;
};
/** 卡住的弹窗：电脑屏幕上弹出一个「请登录账号」之类的框，光标在上面绕圈不敢点。讲「AI 在这一步卡住了，只能人来」。 */
export const StuckDialog: React.FC<{ title: string; body?: string; button?: string; at: number; width?: number }> = ({ title, body, button = '登录', at, width = 1000 }) => {
  const t = useT(), p = sp(t, at, 220, 13), e = Math.max(0, t - at - 0.6), a = e * 2.4, cx = width / 2 + Math.cos(a) * 120 + 40, cy = 330 + Math.sin(a) * 50;
  return <div style={{ position: 'relative', width, height: width * 0.6, background: 'linear-gradient(160deg, #1C2840, #0D1424)', borderRadius: 24, border: '10px solid #2A2E36', boxSizing: 'border-box', overflow: 'hidden', fontFamily: FONT }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', opacity: p }} />
    <div style={{ position: 'absolute', left: width / 2 - 260, top: 120, width: 520, background: '#F4F6FA', borderRadius: 20, padding: 34, boxSizing: 'border-box', textAlign: 'center', transform: `scale(${p})`, boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}><div style={{ fontWeight: 900, fontSize: 44, color: '#1A1D24' }}>{title}</div>{body && <div style={{ fontSize: 24, color: '#6B7280', margin: '10px 0' }}>{body}</div>}<div style={{ display: 'inline-block', marginTop: 16, fontWeight: 900, fontSize: 30, background: '#2B5BD7', color: '#fff', borderRadius: 12, padding: '10px 60px' }}>{button}</div></div>
    {t > at + 0.6 && <svg width={56} height={56} viewBox="0 0 24 24" style={{ position: 'absolute', left: cx, top: cy }}><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L18 14 Z" fill="#fff" stroke="#000" strokeWidth={1.2} strokeLinejoin="round" /></svg>}
    {t > at + 2.2 && <div style={{ position: 'absolute', right: 40, top: 30 }}><Reaction icon="sweat" at={at + 2.2} life={3} size={80} /></div>}
  </div>;
};
/** 工具清单：片尾一张深色卡片，一行一个工具，右边一行灰字写它干了什么。「本期用到的工具」。 */
export const ToolCredits: React.FC<{ title?: string; items: { name: string; note: string }[]; at: number; width?: number }> = ({ title = '本期工具', items, at, width = 1000 }) => { const t = useT(), p = sp(t, at, 180, 16); return <div style={{ ...panel, width, padding: '30px 44px', transform: `translateY(${(1 - p) * 40}px)`, opacity: cl(p * 2) }}><div style={{ fontSize: 22, opacity: 0.6, letterSpacing: '0.2em', marginBottom: 16 }}>{title}</div>{items.map((it, i) => { const k = prog(t, at + 0.3 + i * 0.12, 0.3); return <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '9px 0', opacity: k, transform: `translateX(${(1 - k) * -20}px)` }}><span style={{ fontWeight: 900, fontSize: 38 }}>{it.name}</span><span style={{ fontSize: 24, opacity: 0.55 }}>{it.note}</span></div>; })}</div>; };
/** 下集预告：一个暗场里打着暖光的神秘盲盒，上面一个「?」，顶上一句提问加「评论区留言」。片尾引导互动。 */
export const NextTeaser: React.FC<{ q: string; sub?: string; at: number; side?: React.ReactNode }> = ({ q, sub = '评论区留言', at, side }) => { const t = useT(), p = sp(t, at, 140, 12); return <div style={{ position: 'relative', width: 1300, height: 820, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT }}><div style={{ position: 'absolute', left: 250, right: 250, bottom: 0, height: 220, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,190,110,.45), transparent 70%)' }} /><div style={{ fontWeight: 900, fontSize: 72, color: '#fff', opacity: prog(t, at + 0.4, 0.4) }}>{q}</div><div style={{ fontWeight: 900, fontSize: 34, color: GOLD, marginTop: 10, opacity: prog(t, at + 0.7, 0.4) }}>{sub}</div><div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, marginTop: 40 }}><div style={{ transform: `scale(${p})` }}><CapsulePods labels={['?']} at={at} pod={300} /></div>{side}</div></div>; };
/** 弧形立体标题：一行大字沿一道弧排开，带厚度和描边，像贴在画面上方的招牌。开场抛问题。 */
export const ArcTitle: React.FC<{ text: string; at: number; width?: number; bend?: number; size?: number; fill?: string; stroke?: string }> = ({ text, at, width = 1500, bend = 120, size = 130, fill = '#FFD9A8', stroke = '#C2412B' }) => {
  const t = useT(), id = React.useId().replace(/[^a-z0-9]/gi, ''), k = sp(t, at, 180, 11), h = size * 2 + bend, d = `M40 ${h - 30} Q${width / 2} ${h - 30 - bend * 2} ${width - 40} ${h - 30}`;
  return <svg width={width} height={h} style={{ overflow: 'visible', transform: `scale(${k}) rotate(${(1 - k) * -8}deg)`, opacity: cl(k * 2) }}><defs><path id={id} d={d} /></defs>{Array.from({ length: 10 }).map((_, i) => <text key={i} fontFamily="MiSans, sans-serif" fontWeight={900} fontSize={size} fill={i === 9 ? fill : stroke} stroke={i === 9 ? stroke : 'none'} strokeWidth={i === 9 ? size * 0.05 : 0} transform={`translate(0 ${(9 - i) * 1.2})`} textAnchor="middle"><textPath href={`#${id}`} startOffset="50%">{text}</textPath></text>)}</svg>;
};
