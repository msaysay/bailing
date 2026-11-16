// 频道宠物 HUD：右下角常驻的小海豹，带名字、等级、经验条；到点弹「+经验」、升级时闪一下、换成下一个形态。
// 形态是 Blender 渲出的透明底 PNG 序列（pet/seal.py → studio/public/pet/<形态>/0001.png…，48 帧循环）。成长数据来自 scripts/pet.py export。
import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';
import { spring } from '../kit/motion';

export type PetForm = 'egg1' | 'egg2' | 'egg3' | 'hatch' | 'young' | 'young-happy' | 'young-shock' | 'adult-tech' | 'adult-gold' | 'adult-flame' | 'adult-star';
const FRAMES = 48;
/** 一个形态的循环动画（按视频帧号取 PNG 序列）。 */
export const PetSprite: React.FC<{ form: PetForm; size?: number; speed?: number }> = ({ form, size = 240, speed = 1 }) => { const f = useCurrentFrame(), { fps } = useVideoConfig(), i = (Math.floor((f * 24 * speed) / fps) % FRAMES) + 1; return <Img src={staticFile(`pet/${form}/${String(i).padStart(4, '0')}.png`)} style={{ width: size, height: size, display: 'block' }} />; };
const STAGE_NAME: Record<string, string> = { egg: '冰蛋', hatch: '破冰', young: '幼崽', adult: '成体' };
const ROUTE: Record<string, { name: string; col: string }> = { tech: { name: '机芯', col: '#5BC8FF' }, gold: { name: '金羽', col: '#FFC94D' }, flame: { name: '焰心', col: '#FF7A45' }, star: { name: '星语', col: '#B9A2FF' } };
export type PetEvent = { at: number; kind: 'xp' | 'level' | 'evolve' | 'react'; text?: string; form?: PetForm };
/** 右下角宠物 HUD（全系列统一放右下角）。name 宠物名 · level、cur、next 等级和本级经验 · gain 本期涨了多少（at 时弹出并把经验条推上去）· events 升级、换形态、换表情的时间点。 */
export const PetHud: React.FC<{ name: string; form: PetForm; level: number; cur: number; next: number; gain?: { at: number; amount: number; toLevel?: number; toCur?: number; toNext?: number }; events?: PetEvent[]; stage?: string; route?: keyof typeof ROUTE | null; at?: number; size?: number }> = ({ name, form, level, cur, next, gain, events = [], stage, route, at = 0, size = 220 }) => {
  const t = useT(), enter = Math.max(0, spring(t - at, { from: 0, to: 1, stiffness: 140, damping: 13 }));
  let f: PetForm = form; events.forEach((e) => { if (e.form && t >= e.at) f = e.form; });
  const g = gain ? inOut((t - gain.at - .4) / 1.4) : 0, lvUp = gain?.toLevel !== undefined && gain.toLevel > level;
  const lv = lvUp && g >= .5 ? gain!.toLevel! : level, fill = !gain ? cur / next : lvUp ? (g < .5 ? mix(cur / next, 1, g * 2) : mix(0, (gain.toCur ?? 0) / (gain.toNext ?? next), (g - .5) * 2)) : mix(cur / next, ((gain.toCur ?? cur + gain.amount)) / next, g);
  const flash = events.filter((e) => e.kind === 'level' || e.kind === 'evolve').map((e) => Math.max(0, 1 - Math.abs(t - e.at) / .35)).reduce((a, b) => Math.max(a, b), 0);
  const hop = events.filter((e) => e.kind !== 'xp').map((e) => (t > e.at && t < e.at + .6 ? Math.sin(((t - e.at) / .6) * Math.PI) : 0)).reduce((a, b) => Math.max(a, b), 0), rc = route ? ROUTE[route] : null;
  return (
    <div style={{ position: 'relative', width: size * 2.1, height: size * 1.05, fontFamily: FONT, transform: `translateY(${(1 - enter) * 120}px)`, opacity: Math.min(1, enter * 2) }}>
      <div style={{ position: 'absolute', right: size * .18, bottom: size * .02, width: size * .8, height: size * .16, borderRadius: '50%', background: `radial-gradient(ellipse, ${rc?.col ?? '#9FE38A'}${Math.round(40 + 120 * flash).toString(16).padStart(2, '0')}, transparent 70%)` }} />
      <div style={{ position: 'absolute', right: 0, bottom: 0, transform: `translateY(${-hop * size * .18}px) scale(${1 + flash * .12})`, transformOrigin: '50% 90%', filter: flash > 0 ? `brightness(${1 + flash * .8})` : undefined }}><PetSprite form={f} size={size} /></div>
      <div style={{ position: 'absolute', right: size * .92, bottom: size * .22, width: size * 1.12, background: 'rgba(12,15,22,.78)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.14)', borderRadius: size * .09, padding: `${size * .06}px ${size * .08}px` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: size * .05 }}><span style={{ fontWeight: 900, fontSize: size * .13, color: C.text }}>{name}</span><span style={{ fontWeight: 900, fontSize: size * .1, color: rc?.col ?? '#9FE38A', transform: `scale(${1 + flash * .5})`, display: 'inline-block' }}>Lv {lv}</span>{(stage || rc) && <span style={{ fontSize: size * .075, color: C.muted, marginLeft: 'auto' }}>{rc ? rc.name : STAGE_NAME[stage!] ?? stage}</span>}</div>
        <div style={{ height: size * .055, borderRadius: size * .03, background: 'rgba(255,255,255,.12)', marginTop: size * .045, overflow: 'hidden' }}><div style={{ width: `${Math.min(1, fill) * 100}%`, height: '100%', borderRadius: size * .03, background: `linear-gradient(90deg, ${rc?.col ?? '#7ED36A'}, #E9FFD6)`, boxShadow: g > 0 && g < 1 ? '0 0 12px #CFFFB0' : 'none' }} /></div>
      </div>
      {gain && t >= gain.at && t < gain.at + 2.4 && <div style={{ position: 'absolute', right: size * .95, bottom: size * .62 + (t - gain.at) * size * .12, fontWeight: 900, fontSize: size * .15, color: '#E9FFD6', textShadow: '0 2px 8px rgba(0,0,0,.6)', opacity: Math.min(1, (gain.at + 2.4 - t) * 2) * prog(t, gain.at, .2) }}>+{gain.amount.toLocaleString('en-US')} 经验</div>}
      {events.filter((e) => (e.kind === 'level' || e.kind === 'evolve' || e.kind === 'react') && e.text && t >= e.at && t < e.at + 2).map((e, i) => <div key={i} style={{ position: 'absolute', right: size * .15, bottom: size * 1.02, fontWeight: 900, fontSize: size * .12, color: '#14171D', background: e.kind === 'react' ? '#fff' : (rc?.col ?? '#9FE38A'), padding: `${size * .02}px ${size * .07}px`, borderRadius: size * .06, whiteSpace: 'nowrap', transform: `scale(${Math.max(0, spring(t - e.at, { from: 0, to: 1, stiffness: 300, damping: 12 }))})`, transformOrigin: '80% 100%', opacity: Math.min(1, (e.at + 2 - t) * 3) }}>{e.text}</div>)}
    </div>
  );
};
/** 路线分数条：进化前几期在片尾亮出四条路线的分数，吊胃口。 */
export const RouteRace: React.FC<{ scores: Partial<Record<keyof typeof ROUTE, number>>; at: number; title?: string; width?: number }> = ({ scores, at, title = '它会长成什么？', width = 760 }) => {
  const t = useT(), max = Math.max(1, ...Object.values(scores).map((v) => v ?? 0)), keys = Object.keys(ROUTE) as (keyof typeof ROUTE)[];
  return <div style={{ width, background: 'rgba(12,15,22,.82)', borderRadius: 24, padding: '26px 32px', fontFamily: FONT, color: C.text, opacity: prog(t, at, .4) }}><div style={{ fontWeight: 900, fontSize: 40, marginBottom: 16 }}>{title}</div>{keys.map((k, i) => { const v = scores[k] ?? 0, p = inOut((t - at - .3 - i * .15) / .9); return <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0' }}><div style={{ width: 90, fontWeight: 900, fontSize: 30, color: ROUTE[k].col }}>{ROUTE[k].name}</div><div style={{ flex: 1, height: 22, borderRadius: 11, background: 'rgba(255,255,255,.1)' }}><div style={{ width: `${(v / max) * 100 * p}%`, height: '100%', borderRadius: 11, background: ROUTE[k].col }} /></div><div style={{ width: 70, textAlign: 'right', fontFamily: 'monospace', fontSize: 26 }}>{Math.round(v * p)}</div></div>; })}</div>;
};
