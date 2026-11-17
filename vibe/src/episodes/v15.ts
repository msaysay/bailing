import type { Episode } from '../types.ts';

export const v15: Episode = {
  id: 'V15', no: 15, group: '流程篇', mood: 4,
  title: '选题的交集',
  en: 'Where Topics Meet',
  beats: [
    { big: true, zh: '热点天天有 为什么你**接不住**', en: "Trends come every day. Why can't you catch one?" },
    { s: { k: 'title' }, zh: '因为好选题 是一个交集', en: 'Because a good topic is an intersection' },
    { s: { k: 'dots', cols: 20, rows: 6, steps: [{ b: 120, label: '热榜上的话题' }, { a: 14, b: 0, label: '和你的生意**有关**的' }, { a: 4, b: 0, label: '你能讲出**不一样**的' }] }, zh: '热榜上每天几十上百个话题', en: 'Dozens of topics hit the trending list every day' },
    { zh: '和你生意有关的 只剩一小撮', en: 'Only a handful relate to your business' },
    { zh: '你能讲出别人讲不出的 就那几个', en: 'Only a few let you say something no one else can' },
    { s: { k: 'split', a: '追热点', b: '接热点', aSub: '别人说什么你说什么', bSub: '借热点 讲你的事' }, zh: '追热点 是跟着别人说', en: 'Chasing a trend means repeating others' },
    { zh: '接热点 是借它讲你自己的事', en: 'Catching it means using it to tell your own story' },
    { s: { k: 'chat', head: '选题会', msgs: [
      { who: '热点', t: '某车企发布会 全网刷屏' },
      { me: true, t: '我们是卖茶叶的 和我有什么关系' },
      { who: '接法', t: '一场发布会的茶歇 卖茶的人能看到什么' },
    ] }, zh: '比如一场发布会刷屏了', en: 'Say a product launch takes over the feed' },
    { zh: '卖茶叶的老板 要不要追', en: 'Should a tea business owner chase it?' },
    { zh: '能接 但要从你的位置讲', en: 'Yes, but from where you stand' },
    { s: { k: 'hub', center: '你的位置', spokes: ['你的行业', '你的客户', '你的产品', '你踩过的坑', '你的观点', '你的数据'] }, zh: '所以先想清楚 你站在哪', en: 'So first be clear about where you stand' },
    { zh: '热点只是路过你的位置', en: 'A trend just passes by your position' },
    { s: { k: 'list', head: '每天十分钟选题法', items: [
      { t: '扫一遍**热榜**', d: '只记标题 不急着追' },
      { t: '问一句 **和我有关吗**', d: '无关就放过' },
      { t: '写下**我的说法**', d: '说不出不同 就不做' },
    ] }, zh: '第一 扫一遍热榜 只记标题', en: 'One: scan the trending list, note titles only' },
    { zh: '第二 问一句 和我有关吗', en: 'Two: ask, does this relate to me?' },
    { zh: '第三 写不出不同的说法 就不做', en: "Three: if you can't say it differently, skip it" },
    { s: { k: 'quote', lines: ['热点是别人的', '**交集**才是你的'], next: '数字人的边界' }, zh: '热点是别人的 交集才是你的', en: 'The trend belongs to everyone. The intersection is yours.', d: 5 },
  ],
};
