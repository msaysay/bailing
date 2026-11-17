import type { Episode } from '../types.ts';

export const v19: Episode = {
  id: 'V19', no: 19, group: '数据篇', mood: 2,
  title: '爆了却不涨粉',
  en: 'Views Without Followers',
  beats: [
    { big: true, zh: '一万播放 关注的人不到**三十个**', en: 'Ten thousand views, fewer than thirty follows' },
    { s: { k: 'title' }, zh: '播放和涨粉 是两回事', en: 'Views and followers are two different things' },
    { s: { k: 'bars', items: [{ label: '英伟达CFO故事', v: 2.8, tag: '播放1万' }, { label: '组件资源帖', v: 5.5 }, { label: '自己拆自己', v: 11.3 }, { label: '不露脸AI全自动', v: 20.3, hot: true }], unit: '人', note: '每千次播放带来的关注 · 来源 宁少视频号后台 截至2026-11-15' }, zh: '我自己几条作品 每千次播放带来的关注', en: 'Follows per thousand views, from my own videos' },
    { zh: '播放最高的那条 关注率最低', en: 'The most-viewed one has the lowest follow rate' },
    { zh: '涨粉最好的 是点名人群的那条', en: 'The best for followers named its audience' },
    { s: { k: 'compare', left: '为内容点赞', right: '为你关注', rows: [['故事好看', '**以后还想看**'], ['看完就走', '**和我有关**'], ['一次热点', '**一个栏目**']] }, zh: '观众会为一个好故事点赞', en: 'Viewers like a good story' },
    { zh: '但只为以后还想看的人关注', en: 'But they only follow someone they want to see again' },
    { zh: '关注 是对下一条的期待', en: 'A follow is an expectation of the next video' },
    { s: { k: 'scatter', n: 120, keep: 4, label: '看过的人', keepLabel: '留下来的人' }, zh: '流量来得快 走得也快', en: 'Traffic comes fast and leaves fast' },
    { zh: '留下的 是觉得和自己有关的人', en: 'Those who stay feel it is about them' },
    { s: { k: 'split', a: '要播放', b: '要关系', aSub: '追更大的热点', bSub: '点名你的人群' }, zh: '所以别只盯播放量', en: "So don't just watch the view count" },
    { zh: '关注率 才说明关系建立了', en: 'Follow rate shows a relationship has formed' },
    { s: { k: 'list', head: '让播放变成关注', items: [
      { t: '开头**点名人群**', d: '这条是给谁看的' },
      { t: '结尾**预告下一期**', d: '给一个关注的理由' },
      { t: '做成**固定栏目**', d: '让人知道还有下一条' },
    ] }, zh: '第一 开头就点名你的人群', en: 'One: name your audience at the start' },
    { zh: '第二 结尾预告下一期', en: 'Two: tease the next episode at the end' },
    { zh: '第三 做成固定栏目', en: 'Three: turn it into a regular series' },
    { s: { k: 'quote', lines: ['播放是路过', '**关注**才是认识'], next: '拿了就走' }, zh: '播放是路过 关注才是认识', en: 'A view is passing by. A follow is getting to know you.', d: 5 },
  ],
};
