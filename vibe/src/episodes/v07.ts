import type { Episode } from '../types.ts';

export const v07: Episode = {
  id: 'V07', no: 7, group: '流程篇', mood: 0,
  title: '六步闭环',
  en: 'The Six-Step Loop',
  beats: [
    { big: true, zh: '少了一环 你就是在**碰运气**', en: "Skip one step and you're just gambling" },
    { s: { k: 'title' }, zh: '内容生产 是一个闭环', en: 'Content production is a loop' },
    { s: { k: 'flow', loop: true, nodes: ['定位', '计划', '创作', '发布', '采集', '复盘'] }, zh: '定位 计划 创作', en: 'Position, plan, create' },
    { zh: '发布 采集 复盘', en: 'Publish, collect, review' },
    { zh: '复盘的结论 再回到定位', en: 'What the review teaches flows back into positioning' },
    { s: { k: 'compare', left: '大多数人', right: '闭环的人', rows: [['只做**创作**和**发布**', '六步都走'], ['爆了不知道为什么', '知道是**哪一环**起作用'], ['没爆就换方向', '只改**一个地方**']] },
      zh: '多数人只做中间两步 创作和发布', en: 'Most people only do the middle two: create and publish' },
    { zh: '爆了不知道为什么 没爆就乱改', en: 'A hit is a mystery. A flop means random changes.' },
    { s: { k: 'stairs', head: '每转一圈', items: [{ label: '第1圈', v: '摸索' }, { label: '第2圈', v: '找规律' }, { label: '第3圈', v: '有打法' }, { label: '第4圈', v: '能复制' }] },
      zh: '闭环每转一圈 你就多一条经验', en: 'Every lap of the loop adds one lesson' },
    { zh: '转得越多 越接近自己的**打法**', en: 'More laps bring you closer to your own playbook' },
    { zh: '打法成形了 就能交给AI复制', en: 'Once the playbook is set AI can repeat it' },
    { s: { k: 'split', a: '多发', b: '多复盘', aSub: '发得越多越好', bSub: '每条都学到一点' }, zh: '很多人以为 多发就能做起来', en: 'Many think posting more is the answer' },
    { zh: '其实**复盘**才决定你能不能变好', en: 'Review is what decides whether you improve' },
    { s: { k: 'list', head: '让闭环转起来', items: [
      { t: '每周固定 **一个复盘时间**', d: '半小时就够' },
      { t: '复盘只找 **一个问题**', d: '下周只改这一处' },
      { t: '采集交给工具', d: '数据自动汇总到一张表' },
    ] }, zh: '第一 每周固定一个复盘时间', en: 'One: set a fixed weekly review slot' },
    { zh: '第二 每次只找一个问题', en: 'Two: find only one problem each time' },
    { zh: '第三 数据采集交给工具', en: 'Three: let tools collect the data' },
    { s: { k: 'quote', lines: ['不是做得多', '是**转得快**'], next: 'AI味从哪来' }, zh: '不是做得多 是转得快', en: "It's not how much you make. It's how fast you loop.", d: 5 },
  ],
};
