// S1–S4：开场、公告、时间线、接任。动作为本期自写，底层值全部来自 kit。
import React from 'react';
import { at, prog, mix, inOut } from '../lib';
import { C, Chip, Count, Note, Pop, Scene, Stage, useT } from '../kit';

const Big: React.FC<{ n: number; unit: string; label: string; t0: number; color: string }> = ({ n, unit, label, t0, color }) => (
  <Pop at={t0} dy={40} style={{ textAlign: 'center', width: 620 }}>
    <div style={{ fontSize: 300, fontWeight: 900, lineHeight: 1, color }}><Count to={n} at={t0} dur={0.7} /><span style={{ fontSize: 96, marginLeft: 12 }}>{unit}</span></div>
    <div style={{ fontSize: 44, color: C.muted, marginTop: 28 }}>{label}</div>
  </Pop>
);
export const S1: React.FC = () => {
  const t = useT(), p = prog(t, at(2, '五天') - 0.25, 0.5);
  return (
    <Scene id={1}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <Big n={33} unit="年" label="黄仁勋执掌英伟达" t0={at(1, '三十三')} color={C.text} />
      <div style={{ width: mix(0, 180, p), height: 4, background: C.accent, opacity: p }} />
      <Big n={5} unit="天" label="离开" t0={at(2, '五天')} color={C.accent} />
    </Stage></Scene>
  );
};

export const S2: React.FC = () => {
  const t = useT(), roles: [string, string][] = [['总裁', '总裁'], ['首席执行官', '首席'], ['董事', '董事']];
  const strike = prog(t, at(5), 0.5);
  const Row: React.FC<{ k: string; v: string; t0: number }> = ({ k, v, t0 }) => (
    <Pop at={t0} style={{ display: 'flex', alignItems: 'baseline', gap: 36, fontSize: 48 }}>
      <span style={{ color: C.muted, width: 240 }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
    </Pop>
  );
  return (
    <Scene id={2}><Stage>
      <Pop at={at(3)} style={{ fontSize: 40, color: C.muted }}>11 月 12 日 · 英伟达公告</Pop>
      <Pop at={at(4)} style={{ fontSize: 76, fontWeight: 900, marginTop: 18 }}>黄仁勋辞去</Pop>
      <div style={{ display: 'flex', gap: 28, marginTop: 44, alignItems: 'center' }}>
        {roles.map(([r, k]) => (
          <Pop key={r} at={at(4, k)}><Chip style={{ fontSize: 56, padding: '22px 40px', position: 'relative', color: mix(1, 0.45, strike) < 0.9 ? C.muted : C.text }}>
            {r}<span style={{ position: 'absolute', left: 24, top: '52%', height: 4, width: `calc(${strike * 100}% - ${48 * strike}px)`, background: C.down }} />
          </Chip></Pop>
        ))}
        <Pop at={at(5)} dy={0} style={{ marginLeft: 24, fontSize: 56, fontWeight: 900, color: C.down, border: `4px solid ${C.down}`, borderRadius: 12, padding: '14px 28px', transform: `rotate(-4deg) scale(${mix(1.5, 1, prog(t, at(5), 0.35))})` }}>即刻生效</Pop>
      </div>
      <div style={{ marginTop: 84, display: 'flex', flexDirection: 'column', gap: 26, borderTop: `1px solid ${C.line}`, paddingTop: 44 }}>
        <Row k="离职原因" v="公告未说明" t0={at(6, '没有写')} />
        <Row k="本人声明" v="无" t0={at(7, '没有')} />
      </div>
      <Note>来源：英伟达提交美国证监会的 8-K 文件（2026-11-11）</Note>
    </Stage></Scene>
  );
};

export const S3: React.FC = () => {
  const t = useT(), days = [8, 9, 10, 11, 12], X = (d: number) => 230 + (d - 8) * 300;
  const tA = at(9), tB = at(11), head = mix(8, 11, inOut((t - tA) / (tB - tA))) + prog(t, tB + 1.0, 0.6);
  const Node: React.FC<{ d: number; t0: number; title: string; sub?: string; subAt?: number; color?: string }> = ({ d, t0, title, sub, subAt, color = C.accent }) => (
    <Pop at={t0} style={{ position: 'absolute', left: X(d) - 230, top: 290, width: 460, textAlign: 'center' }}>
      <div style={{ fontSize: 42, whiteSpace: 'nowrap', fontWeight: 900, color }}>{title}</div>
      {sub && <Pop at={subAt ?? t0} style={{ fontSize: 28, color: C.muted, marginTop: 16, whiteSpace: 'nowrap' }}>{sub}</Pop>}
    </Pop>
  );
  return (
    <Scene id={3}><Stage>
      <Pop at={at(8)} style={{ fontSize: 76, fontWeight: 900 }}>往前倒五天</Pop>
      <div style={{ position: 'relative', marginTop: 90, height: 520 }}>
        <div style={{ position: 'absolute', left: X(8), top: 100, width: X(12) - X(8), height: 6, background: C.line, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: X(8), top: 100, width: Math.max(0, X(Math.min(head, 12)) - X(8)), height: 6, background: C.accent, borderRadius: 3, opacity: prog(t, tA, 0.3) }} />
        {days.map((d) => { const on = head >= d - 0.02 && t >= tA; return (
          <div key={d} style={{ position: 'absolute', left: X(d) - 60, top: 20, width: 120, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 600, color: on ? C.text : C.muted }}>11/{d}</div>
            <div style={{ margin: '24px auto 0', width: 26, height: 26, borderRadius: 13, background: on ? C.accent : C.bg, border: `4px solid ${on ? C.accent : C.line}`, boxSizing: 'border-box' }} />
          </div>); })}
        <Node d={8} t0={at(9, '董事会')} title="董事会启动独立调查" sub="起因：媒体对其私人关系的一连串报道" subAt={at(10)} />
        <Node d={11} t0={at(11, '董事会')} title="董事会接受辞呈" />
        <Node d={12} t0={at(11) + 1.6} title="对外公告" color={C.text} />
      </div>
    </Stage></Scene>
  );
};

const Person: React.FC<{ t0: number; zh: string; en: string; mono: string; children: React.ReactNode }> = ({ t0, zh, en, mono, children }) => (
  <Pop at={t0} dy={40} style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.line}`, borderRadius: 28, padding: '48px 52px', minHeight: 520, boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: C.bg, border: `2px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 900, color: C.accent }}>{mono}</div>
      <div><div style={{ fontSize: 60, fontWeight: 900 }}>{zh}</div><div style={{ fontSize: 28, color: C.muted, marginTop: 6 }}>{en}</div></div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, marginTop: 48 }}>{children}</div>
  </Pop>
);
export const S4: React.FC = () => (
  <Scene id={4}><Stage style={{ flexDirection: 'row', gap: 48, alignItems: 'flex-start', paddingTop: 190 }}>
    <Person t0={at(12, '首席财务官')} zh="科莱特·克雷斯" en="Colette M. Kress" mono="K">
      <Pop at={at(12, '首席财务官') + 0.2}><Chip>首席财务官</Chip></Pop>
      <Pop at={at(13, '出任')}><Chip color={C.accent}>＋ 临时首席执行官</Chip></Pop>
      <Pop at={at(14)} style={{ fontSize: 32, color: C.muted }}>财务官职务不变</Pop>
    </Person>
    <Person t0={at(15, '董事会')} zh="哈维·琼斯" en="Harvey C. Jones" mono="J">
      <Pop at={at(16, '第一位')}><Chip color={C.accent}>公司首任董事会主席</Chip></Pop>
      <Pop at={at(17, '九三年')}><Chip>1993 年起任董事</Chip></Pop>
    </Person>
  </Stage></Scene>
);
