import type { Episode } from '../types.ts';

export const v14: Episode = {
  id: 'V14', no: 14, group: '流程篇', mood: 2,
  title: '越做越快',
  en: 'Faster Every Time',
  beats: [
    { big: true, zh: '同样做视频 为什么有人**越做越快**', en: 'Same job, so why do some people get faster every time?' },
    { s: { k: 'title' }, zh: '答案是一个组件库', en: 'The answer is a component library' },
    { s: { k: 'blocks', head: '一条视频的画面', items: ['片头', '大数字', '对比表', '流程图', '金句卡', '字幕条', '进度条', '封面', '片尾'], ai: [0, 2, 4, 5, 6, 8], aiLabel: '直接复用', keepLabel: '这期新做' }, zh: '拆开一条视频 画面就是一块块零件', en: 'Take a video apart and the visuals are parts' },
    { zh: '大部分零件 上一期已经做过', en: 'Most parts were already made last time' },
    { zh: '这期真正要新做的 只有少数', en: 'Only a few need to be built this time' },
    { s: { k: 'bars', items: [{ label: '第1期', v: 100 }, { label: '第5期', v: 60 }, { label: '第10期', v: 40 }, { label: '第30期', v: 20, hot: true }], unit: '%', note: '每期需要新做的画面占比 · 示意图' }, zh: '做得越多 要新做的越少', en: 'The more you make, the less you build from scratch' },
    { zh: '速度不是练出来的 是攒出来的', en: "Speed isn't practiced. It's accumulated." },
    { s: { k: 'number', items: [{ v: 247, suf: '个', label: '宁少组件库 现有组件' }], note: '来源 宁少视频工作室 截至2026-11-17' }, zh: '我自己的组件库 已经攒到两百多个', en: 'My own library now holds over two hundred components' },
    { zh: '每一个 都是之前某一期顺手留下的', en: 'Each one was left behind by an earlier episode' },
    { s: { k: 'split', a: '做视频', b: '攒零件', aSub: '每次从零开始', bSub: '每次都在复利' }, zh: '别把每一条只当成作品', en: "Don't treat each video as just a finished piece" },
    { zh: '把它当成攒零件的机会', en: 'Treat it as a chance to collect parts' },
    { zh: '每一条 都在给下一条铺路', en: 'Every video paves the way for the next' },
    { s: { k: 'list', head: '开始攒你的组件库', items: [
      { t: '做完一条 **拆出零件**', d: '片头 数字卡 对比表' },
      { t: '零件**起名字** 放一处', d: '下次一搜就有' },
      { t: '每期新做 **不超过四成**', d: '剩下的全部复用' },
    ] }, zh: '第一 做完一条 把零件拆出来', en: 'One: after each video, pull out the parts' },
    { zh: '第二 给零件起名字 统一存放', en: 'Two: name the parts and keep them in one place' },
    { zh: '第三 每期新做的不超过四成', en: 'Three: build no more than forty percent new' },
    { s: { k: 'quote', lines: ['快不是练出来的', '是**攒出来的**'], next: '选题的交集' }, zh: '快不是练出来的 是攒出来的', en: "Speed isn't practiced. It's accumulated.", d: 5 },
  ],
};
