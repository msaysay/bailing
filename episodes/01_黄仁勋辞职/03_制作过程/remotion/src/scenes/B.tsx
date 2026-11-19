// S5–S9：跌幅尺、两笔账、细节、后续、说明。S5 的尺子在 S6 原位延续。
import React from 'react';
import { at, prog, mix, inOut, seg } from '../lib';
import { C, Chip, Count, Note, Pop, Scene, Src, Stage, useT } from '../kit';

const LOW = 10, CLOSE = 4.34, W = 1500, X = (v: number) => (v / 12) * W;
/** 跌幅尺：0% 在左，越往右跌得越深。不是行情图，只表示幅度。 */
const Ruler: React.FC<{ v: number; reached: number; zones: number; top: number; opacity?: number }> = ({ v, reached, zones, top, opacity = 1 }) => (
  <div style={{ position: 'absolute', left: 210, top, width: W, height: 150, opacity }}>
    <div style={{ position: 'absolute', left: 0, top: 60, width: W, height: 28, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14 }} />
    <div style={{ position: 'absolute', left: 0, top: 60, width: X(reached), height: 28, background: `${C.down}55`, borderRadius: 14 }} />
    <div style={{ position: 'absolute', left: X(CLOSE), top: 60, width: X(LOW) - X(CLOSE), height: 28, background: C.accent, opacity: zones * 0.9, borderRadius: '0 14px 14px 0' }} />
    <div style={{ position: 'absolute', left: 0, top: 60, width: X(CLOSE), height: 28, background: C.down, opacity: zones * 0.9, borderRadius: '14px 0 0 14px' }} />
    {[0, 2, 4, 6, 8, 10, 12].map((k) => <div key={k} style={{ position: 'absolute', left: X(k) - 40, top: 104, width: 80, textAlign: 'center', fontSize: 24, color: C.muted }}>{k === 0 ? '0%' : `−${k}%`}</div>)}
    <div style={{ position: 'absolute', left: X(v) - 3, top: 40, width: 6, height: 68, background: C.text, borderRadius: 3 }} />
    <div style={{ position: 'absolute', left: X(v) - 90, top: -14, width: 180, textAlign: 'center', fontSize: 40, fontWeight: 900 }}>{v < 0.05 ? '0%' : `−${v.toFixed(1)}%`}</div>
  </div>
);
const rulerState = (t: number) => {
  const a = at(19, '跌超') - 0.5, b = at(20, '收窄') - 0.3;
  const down = inOut((t - a) / 1.1), back = inOut((t - b) / 1.3);
  return { v: mix(0, LOW, down) - (LOW - CLOSE) * back, reached: mix(0, LOW, down), zones: prog(t, at(20, '百分之四') + 0.5, 0.6) };
};

export const S5: React.FC = () => {
  const t = useT(), r = rulerState(t);
  return (
    <Scene id={5}><Stage>
      <Pop at={at(18)} style={{ fontSize: 76, fontWeight: 900 }}>市场怎么算这笔账</Pop>
      <Ruler {...r} top={330} opacity={prog(t, at(19) - 0.2, 0.4)} />
      <div style={{ position: 'absolute', left: 210, top: 560, width: 1500, display: 'flex', gap: 40 }}>
        <Pop at={at(19, '跌超')} style={{ flex: 1 }}><div style={{ fontSize: 30, color: C.muted }}>消息公布后一度</div><div style={{ fontSize: 84, fontWeight: 900, color: C.down }}>跌超 10%</div><Src>网易财经 · 11-12 盘前</Src><div style={{ fontSize: 22, color: C.muted }}>盘中最低点：未取得</div></Pop>
        <Pop at={at(20, '百分之四')} style={{ flex: 1 }}><div style={{ fontSize: 30, color: C.muted }}>当日收盘</div><div style={{ fontSize: 84, fontWeight: 900 }}>−4.34%</div><Src>CNBC · 11-12 收盘</Src></Pop>
        <Pop at={at(21, '一千八百亿')} style={{ flex: 1.5 }}><div style={{ fontSize: 30, color: C.muted }}>一天少掉的市值</div><div style={{ fontSize: 84, fontWeight: 900, whiteSpace: 'nowrap' }}>约 <Count to={1800} at={at(21, '一千八百亿')} /> 亿美元</div><Src>网易财经报道 1817 亿 · 11-12</Src></Pop>
      </div>
      <Note>幅度示意，非行情走势图。分时走势数据：未取得</Note>
    </Stage></Scene>
  );
};

const Col: React.FC<{ color: string; left: number; width: number; children: React.ReactNode }> = ({ color, left, width, children }) => (
  <div style={{ position: 'absolute', left, top: 400, width, borderTop: `6px solid ${color}`, paddingTop: 30, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>{children}</div>
);
export const S6: React.FC = () => {
  const t = useT(), end = rulerState(seg(5).end + 1);
  return (
    <Scene id={6}><Stage>
      <Ruler {...end} top={190} />
      <Col color={C.down} left={210} width={700}>
        <Pop at={at(25)}><div style={{ fontSize: 30, color: C.muted }}>没涨回来的那一截</div></Pop>
        <Pop at={at(25, '长期')} style={{ fontSize: 80, fontWeight: 900, color: C.down }}>长期</Pop>
        <Pop at={at(26)}><Chip>谁来接</Chip></Pop>
        <Pop at={at(27)}><Chip>还能不能像他一样下注</Chip></Pop>
      </Col>
      <Col color={C.accent} left={970} width={740}>
        <Pop at={at(22)}><div style={{ fontSize: 30, color: C.muted }}>跌回来的那一截</div></Pop>
        <Pop at={at(22, '短期')} style={{ fontSize: 80, fontWeight: 900, color: C.accent }}>短期</Pop>
        <div style={{ display: 'flex', gap: 18 }}>
          <Pop at={at(23, '订单')}><Chip>订单</Chip></Pop><Pop at={at(23, '产能')}><Chip>产能</Chip></Pop><Pop at={at(23, '下一代')}><Chip>下一代芯片</Chip></Pop>
        </div>
        <Pop at={at(24)} style={{ fontSize: 36, color: C.muted }}>换了一个人，会停吗？</Pop>
      </Col>
    </Stage></Scene>
  );
};

export const S7: React.FC = () => {
  const t = useT(), sw = prog(t, at(31, '补上'), 0.6);
  return (
    <Scene id={7}><Stage>
      <div style={{ display: 'flex', gap: 90, alignItems: 'flex-end', marginTop: 20 }}>
        <Pop at={at(29, '四万亿')}><div style={{ fontSize: 30, color: C.muted }}>市值</div><div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.1 }}>4 万亿<span style={{ fontSize: 56 }}> 美元</span></div><Src>CNBC · 11-12 收盘略高于此数</Src></Pop>
        <Pop at={at(30)}><div style={{ fontSize: 30, color: C.muted }}>公司历史</div><div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.1 }}>33<span style={{ fontSize: 56 }}> 年</span></div><Src>1993 年创立</Src></Pop>
      </div>
      <Pop at={at(30, '董事会主席')} style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 32, fontSize: 52 }}>
        <span style={{ color: C.muted }}>董事会主席</span>
        <Chip style={{ fontSize: 52, opacity: mix(1, 0.4, sw) }}>此前未设</Chip>
        <span style={{ color: C.accent, opacity: sw, fontWeight: 900 }}>→</span>
        <span style={{ opacity: sw }}><Chip color={C.accent} style={{ fontSize: 52 }}>首任主席</Chip></span>
      </Pop>
      <Pop at={at(32)} style={{ marginTop: 60, fontSize: 64, fontWeight: 900 }}>一套<span style={{ color: C.warm }}>不靠某一个人</span>的安排</Pop>
    </Stage></Scene>
  );
};

export const S8: React.FC = () => {
  const Item: React.FC<{ n: string; t0: number; title: string; children?: React.ReactNode }> = ({ n, t0, title, children }) => (
    <Pop at={t0} style={{ display: 'flex', gap: 36, alignItems: 'flex-start', background: 'rgba(13,17,25,.82)', border: `1.5px solid ${C.line}`, borderRadius: 24, padding: '40px 48px' }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{n}</div>
      <div><div style={{ fontSize: 56, fontWeight: 900 }}>{title}</div><div style={{ display: 'flex', gap: 20, marginTop: 24, alignItems: 'center' }}>{children}</div></div>
    </Pop>
  );
  return (
    <Scene id={8}><Stage>
      <Pop at={at(33)} style={{ fontSize: 76, fontWeight: 900 }}>接下来看两件事</Pop>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 56 }}>
        <Item n="1" t0={at(34)} title="正式的接班人">
          <Pop at={at(34, '内部')}><Chip>内部提拔</Chip></Pop><Pop at={at(35)} style={{ fontSize: 36, color: C.muted }}>还是</Pop><Pop at={at(35) + 0.3}><Chip>从外面请</Chip></Pop>
        </Item>
        <Item n="2" t0={at(36)} title="克雷斯主持的第一份财报"><Pop at={at(36, '怎么说')} style={{ fontSize: 36, color: C.muted }}>怎么说</Pop></Item>
      </div>
    </Stage></Scene>
  );
};

export const S9: React.FC = () => {
  const steps: [string, string][] = [['查资料', '查资料'], ['写稿', '写稿'], ['画面剪辑', '画面剪辑']];
  return (
    <Scene id={9}><Stage style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Pop at={at(37)} style={{ fontSize: 40, color: C.muted }}>关于这条视频</Pop>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 48 }}>
        {steps.map(([s, k], i) => <React.Fragment key={s}><Pop at={at(38, k)}><Chip style={{ fontSize: 52 }}>{s}</Chip></Pop>{i < 2 && <Pop at={at(38, steps[i + 1][1])} style={{ color: C.muted, fontSize: 44 }}>→</Pop>}</React.Fragment>)}
      </div>
      <Pop at={at(39, 'ai')} style={{ fontSize: 110, fontWeight: 900, marginTop: 56 }}><span style={{ color: C.accent }}>AI</span> 自动完成</Pop>
      <Pop at={at(40)} style={{ fontSize: 40, color: C.muted, marginTop: 28 }}>声音：本人录制</Pop>
      <Pop at={at(41)} style={{ fontSize: 56, fontWeight: 600, marginTop: 60 }}>我们下期见</Pop>
    </Stage></Scene>
  );
};
