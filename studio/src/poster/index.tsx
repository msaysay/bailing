// 私域承接海报：视频号公域来的人看到这张图，知道三件事——工具免费拿、980 的社群买的是什么、19800 的企业服务做什么。
// 1080×2560，出图时 --scale=2。数字只用核对过的：232 个组件、12 个 Skill、2 条生产线、34 条做片规则。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, FONT, useFonts } from '../kit/kit';

const W = 1080, PAD = 64;
const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.muted }) => <div style={{ fontSize: 26, fontWeight: 600, color, letterSpacing: 2 }}>{children}</div>;
const H2: React.FC<{ no: string; children: React.ReactNode }> = ({ no, children }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 26 }}>
    <span style={{ fontSize: 30, fontWeight: 900, color: C.accent }}>{no}</span><span style={{ fontSize: 48, fontWeight: 900 }}>{children}</span>
  </div>
);
const Bullet: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.accent }) => (
  <div style={{ display: 'flex', gap: 16, fontSize: 30, lineHeight: 1.5, color: C.text }}>
    <span style={{ flex: 'none', width: 10, height: 10, borderRadius: 5, background: color, marginTop: 17 }} /><span>{children}</span>
  </div>
);

type Plan = { price: string; unit?: string; name: string; mode: string; color: string; hot?: boolean; who: string; items: React.ReactNode[]; note?: React.ReactNode };
const PlanCard: React.FC<Plan> = ({ price, unit, name, mode, color, hot, who, items, note }) => (
  <div style={{ position: 'relative', background: hot ? 'linear-gradient(160deg, #1B2333 0%, #131925 100%)' : C.surface, border: `${hot ? 3 : 2}px solid ${hot ? color : C.line}`, borderRadius: 28, padding: '38px 44px 40px', boxShadow: hot ? `0 30px 80px rgba(255,212,121,.10)` : 'none' }}>
    {hot && <div style={{ position: 'absolute', right: 40, top: -22, background: color, color: '#14171D', fontSize: 26, fontWeight: 900, padding: '6px 22px', borderRadius: 999 }}>私域主推</div>}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ display: 'inline-block', fontSize: 24, fontWeight: 900, color, border: `2px solid ${color}`, borderRadius: 10, padding: '2px 14px', marginBottom: 14 }}>{mode}</div>
        <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.15 }}>{name}</div>
      </div>
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 40, fontWeight: 900, color }}>¥</span><span style={{ fontSize: 96, fontWeight: 900, color, lineHeight: 1 }}>{price}</span>
        {unit && <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>{unit}</div>}
      </div>
    </div>
    <div style={{ height: 2, background: C.line, margin: '26px 0 24px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{items.map((x, i) => <Bullet key={i} color={color}>{x}</Bullet>)}</div>
    <div style={{ marginTop: 22, fontSize: 26, color: C.muted, lineHeight: 1.5 }}><span style={{ color: C.text, fontWeight: 600 }}>适合：</span>{who}</div>
    {note && <div style={{ marginTop: 22, background: 'rgba(255,212,121,.08)', borderLeft: `6px solid ${color}`, borderRadius: 10, padding: '18px 24px', fontSize: 28, lineHeight: 1.6, color: C.text }}>{note}</div>}
  </div>
);

export const POSTER_W = W, POSTER_H = 3650;
export const Poster: React.FC = () => {
  useFonts();
  const stats: [string, string][] = [['232', '个画面组件'], ['12', '个 Skill'], ['2', '条生产线'], ['34', '条做片规则']];
  const pillars: [string, string, string][] = [
    ['01', '实践里更新知识库', '每做一条片，踩过的坑写回规则，下一条不再犯'],
    ['02', '工具持续迭代', '组件、脚本跟着成片一起长，用得越多越顺手'],
    ['03', '跟着你的场景完善', '你在群里提的需求，会变成下一版 Skill'],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <AbsoluteFill style={{ background: 'radial-gradient(900px 700px at 85% 4%, rgba(91,155,255,.22), rgba(0,0,0,0) 70%), radial-gradient(800px 600px at 0% 30%, rgba(255,212,121,.08), rgba(0,0,0,0) 70%)' }} />
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: 'radial-gradient(#fff 0.8px, transparent 0.9px)', backgroundSize: '6px 6px' }} />
      <div style={{ position: 'relative', padding: `56px ${PAD}px 0`, display: 'flex', flexDirection: 'column' }}>
        {/* 顶栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 900 }}><span style={{ width: 16, height: 16, borderRadius: 8, background: C.warm }} />宁少 AI 进化论</div>
          <Label>视频号 · 抖音 同名</Label>
        </div>

        {/* 主标题 */}
        <div style={{ marginTop: 80 }}>
          <div style={{ display: 'inline-block', fontSize: 28, fontWeight: 900, color: C.accent, border: `2px solid ${C.accent}`, borderRadius: 999, padding: '6px 22px' }}>公开实践 · 内容创作的 AI 化</div>
          <div style={{ fontSize: 128, fontWeight: 900, lineHeight: 1.08, letterSpacing: -3, marginTop: 30 }}>一个人</div>
          <div style={{ fontSize: 128, fontWeight: 900, lineHeight: 1.08, letterSpacing: -3, color: C.warm }}>一条内容生产线</div>
          <div style={{ fontSize: 34, lineHeight: 1.6, color: C.muted, marginTop: 30 }}>
            我拿自己做实验，把内容生产一步步交给 AI。<br />
            <span style={{ color: C.text }}>工具免费拿走；想跟上，就一起进化。</span>
          </div>
        </div>

        {/* 数字 */}
        <div style={{ display: 'flex', gap: 18, marginTop: 52 }}>
          {stats.map(([n, t]) => (
            <div key={t} style={{ flex: 1, background: 'rgba(21,26,36,.85)', border: `2px solid ${C.line}`, borderRadius: 20, padding: '22px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05 }}>{n}</div><div style={{ fontSize: 24, fontWeight: 600, color: C.muted, marginTop: 6 }}>{t}</div>
            </div>
          ))}
        </div>

        {/* 为什么一直在变强 */}
        <div style={{ marginTop: 72 }}>
          <H2 no="为什么">这套 Skill 会一直变强</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pillars.map(([no, t, d]) => (
              <div key={no} style={{ display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(21,26,36,.7)', border: `2px solid ${C.line}`, borderRadius: 20, padding: '22px 30px' }}>
                <div style={{ fontSize: 60, fontWeight: 900, color: 'transparent', WebkitTextStroke: `2px ${C.accent}`, width: 84 }}>{no}</div>
                <div><div style={{ fontSize: 36, fontWeight: 900 }}>{t}</div><div style={{ fontSize: 27, color: C.muted, marginTop: 4 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* 三种用法 */}
        <div style={{ marginTop: 72 }}>
          <H2 no="怎么用">三种方式，按你的节奏来</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <PlanCard price="0" name="免费开源" mode="自己动手" color={C.accent}
              items={['12 个 Skill + 232 个画面组件，全部开放', '交给你手上的 AI 就能跑：Claude Code、Codex、WorkBuddy', '人出镜、人不出镜，两条生产线都在']}
              who="愿意自己折腾、动手能力强的人" />
            <PlanCard price="980" unit="一年" name="阿宁的 AI 实践" mode="自学 + 社群答疑" color={C.warm} hot
              items={['Skill 持续更新，新版本群里第一时间拿到', '社群定期集中答疑，卡住了有人帮你看', '配套知识星球一年：我每一次实践、踩坑和复盘都在里面', <>你的问题，会进下一版 Skill</>]}
              who="想跟上 AI 内容创作、愿意自学的创作者"
              note={<>AI 一个月就换一代，一个人追不过来。<br />我在前面趟路，你们在后面盯着我、给我压力——<br /><span style={{ color: C.warm, fontWeight: 900 }}>这 980，买的是一起进化的一年。</span></>} />
            <PlanCard price="19800" name="企业内容创作工作流" mode="一对一服务" color={C.accent}
              items={['打造创始人 IP 或品牌 IP', <>把过去靠人工的标准流程 <span style={{ color: C.warm, fontWeight: 900 }}>AI 化</span>：一整个内容和剪辑团队的活，变成一套工作流</>, '一个人能管更多的号，产出更多的内容', '一对一：按你的业务和风格定制，带你跑通']}
              who="企业、企业老板、个人创业者" />
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 24, color: C.muted, marginTop: 56 }}>陈宁 · 宁少 AI 进化论 · 分享 AI 时代的内容创作认知</div>
      </div>
    </AbsoluteFill>
  );
};
