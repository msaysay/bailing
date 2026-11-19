// 常驻层：章节条、AI 标注、字幕。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useClock } from './clock';
import { C, FONT, useT } from './kit';
export type Chapter = { no: string; title: string; from: string };          // from：这一章从哪一段开始
/** hero：这些行由画面上的强调字幕承担，底部字幕隐藏。hot：底部字幕里要变色的词。 */
export const Chrome: React.FC<{ chapters: Chapter[]; hideBarBefore?: number; hero?: number[]; hot?: string[] }> = ({ chapters, hideBarBefore = 0, hero = [], hot = [] }) => {
  const t = useT(), ck = useClock();
  const idx = chapters.map((c) => ck.seg(c.from).start).filter((s) => t >= s).length - 1;
  const l0 = ck.lines.find((x) => t >= x.start && t < x.end), l = l0 && !hero.includes(l0.n) ? l0 : undefined;
  const paint = (txt: string) => { if (!hot.length) return txt; const re = new RegExp('(' + hot.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')'); return txt.split(re).map((x, i) => hot.includes(x) ? <span key={i} style={{ color: C.warm }}>{x}</span> : x); };
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.text }}>
      {idx >= 0 && t >= hideBarBefore && (
        <div style={{ position: 'absolute', left: 72, top: 52, display: 'flex', alignItems: 'center', gap: 18, fontSize: 26, fontWeight: 600, background: 'rgba(8,11,17,.7)', borderRadius: 999, padding: '8px 22px 8px 14px' }}>
          <span style={{ display: 'flex', gap: 8 }}>{chapters.map((c, i) => <span key={c.no} style={{ width: i === idx ? 34 : 12, height: 12, borderRadius: 6, background: i <= idx ? C.accent : C.line }} />)}</span>
          <span style={{ color: C.accent }}>{chapters[idx].no}</span><span>{chapters[idx].title}</span>
        </div>
      )}
      <div style={{ position: 'absolute', right: 72, top: 56, fontSize: 22, background: 'rgba(8,11,17,.7)', border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 18px' }}>本视频由 AI 自动生成</div>
      {l && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center' }}><span style={{ fontSize: 40, fontWeight: 600, background: 'rgba(8,11,17,.82)', borderRadius: 14, padding: '8px 26px', whiteSpace: 'nowrap' }}>{paint(l.text)}</span></div>}
    </AbsoluteFill>
  );
};
