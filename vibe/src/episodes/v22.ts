import type { Episode } from '../types.ts';

const SRC = '来源 宁少视频号后台 截至2026-11-15';

export const v22: Episode = {
  id: 'V22', no: 22, group: '数据篇', mood: 1,
  title: '第二天拆解',
  en: 'Break It Down the Next Day',
  beats: [
    { big: true, zh: '同一个账号 关注率差了**4倍**', en: 'Same account. A follow rate four times higher.' },
    { s: { k: 'title' }, zh: '差别只在于 第二天我做了什么', en: 'The difference was what I did the next day' },
    { s: { k: 'number', items: [{ v: 0.28, suf: '%', dec: 2, label: '故事片 关注率' }, { v: 1.13, suf: '%', dec: 2, label: '第二天的拆解片 关注率', hot: true }], note: SRC }, zh: '第一天 发一条故事片 拿播放', en: 'Day one: a story video to pull in views' },
    { zh: '第二天 把它拆开讲 拿关注', en: 'Day two: break it down and win follows' },
    { zh: '拆解片的关注率 是故事片的**4倍**', en: 'The breakdown converted four times better' },
    { s: { k: 'compare', left: '看故事的人', right: '看拆解的人', rows: [['图个热闹', '图个**方法**'], ['看完就走', '想看**下一条**'], ['记住了故事', '记住了**你**']] }, zh: '看故事的人 图个热闹', en: 'Story viewers come for the spectacle' },
    { zh: '看拆解的人 图的是方法', en: 'Breakdown viewers come for the method' },
    { zh: '方法只在你这儿 他就得关注你', en: 'The method lives with you, so they follow you' },
    { s: { k: 'flow', loop: true, nodes: ['发爆款', '看数据', '做拆解', '收关注'], sub: ['拉来流量', '找出原因', '讲清方法', '留住人'] }, zh: '这就成了一个循环', en: 'And it becomes a loop' },
    { zh: '爆款负责拉人 拆解负责留人', en: 'The hit brings people in. The breakdown keeps them.' },
    { s: { k: 'split', a: '藏着', b: '拆开', aSub: '怕被学走', bSub: '越讲越值钱' }, zh: '很多老板怕把方法讲出来', en: 'Many owners fear giving their method away' },
    { zh: '其实拆开讲 你才**更值钱**', en: 'In fact, explaining it is what makes you valuable' },
    { s: { k: 'list', head: '照着做', items: [
      { t: '爆款发出后 **记下数据**', d: '播放 · 完播 · 关注' },
      { t: '第二天 讲清它**为什么**爆', d: '只讲一个原因' },
      { t: '结尾告诉观众 **怎么用**', d: '让他带走一个动作' },
    ] }, zh: '第一 爆款发出后 记下它的数据', en: 'One: record the numbers once the hit is out' },
    { zh: '第二 第二天讲清它为什么爆', en: 'Two: next day, explain why it worked' },
    { zh: '第三 结尾告诉观众怎么用', en: 'Three: end by telling viewers how to use it' },
    { s: { k: 'quote', lines: ['第一天要**流量**', '第二天要**关注**'], next: '开 展 收' }, zh: '第一天要流量 第二天要关注', en: 'Day one is for reach. Day two is for followers.', d: 5 },
  ],
};
