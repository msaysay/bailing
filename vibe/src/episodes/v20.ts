import type { Episode } from '../types.ts';

export const v20: Episode = {
  id: 'V20', no: 20, group: '数据篇', mood: 4,
  title: '拿了就走',
  en: 'Take and Leave',
  beats: [
    { big: true, zh: '评论区打口令领资料 为什么**不涨粉**', en: "Comment a code word for a freebie. Why doesn't it grow followers?" },
    { s: { k: 'title' }, zh: '因为他们是来拿东西的', en: 'Because they came to take something' },
    { s: { k: 'number', items: [{ v: 1.42, dec: 2, suf: '%', label: '评论率 五条里最高', hot: true }, { v: 0.55, dec: 2, suf: '%', label: '关注率' }], note: '组件资源帖 · 来源 宁少视频号后台 截至2026-11-15' }, zh: '我发过一条资源帖 评论率最高', en: 'I posted a resource giveaway with my highest comment rate' },
    { zh: '关注率却只有零点五五', en: 'Yet its follow rate was only 0.55%' },
    { zh: '很多人拿完资料 就走了', en: 'Many people took the files and left' },
    { s: { k: 'flow', nodes: ['看到', '评论', '领取', '离开'], sub: ['资源诱人', '打口令', '拿到资料', '没理由留下'] }, zh: '看到资源 打口令 拿到就走', en: 'See it, comment, take it, leave' },
    { zh: '整条路上 没有一步需要关注你', en: 'Not one step requires following you' },
    { s: { k: 'split', a: '评论多', b: '关系浅', aSub: '数据好看', bSub: '拿完就忘' }, zh: '评论多 看起来很热闹', en: 'Lots of comments look lively' },
    { zh: '可口令换来的 是交易不是关系', en: 'But a code word buys a transaction, not a relationship' },
    { s: { k: 'compare', left: '口令领资料', right: '关注再领', rows: [['打口令 直接给', '**先关注** 再打口令'], ['拿完就走', '留下**看下一条**'], ['一次交易', '**长期关系**']] }, zh: '口令要和关注绑在一起', en: 'Tie the code word to a follow' },
    { zh: '先关注 再在评论区打口令', en: 'Follow first, then comment the code word' },
    { zh: '资料只是见面礼 后面还有下一条', en: 'The freebie is a greeting gift. More is coming.' },
    { s: { k: 'list', head: '口令的正确用法', items: [
      { t: '口令**绑定关注**', d: '先关注 再领取' },
      { t: '资料是**系列**的一部分', d: '下一期接着讲' },
      { t: '领完**私信回访**', d: '问一句用得怎么样' },
    ] }, zh: '第一 口令和关注绑定', en: 'One: bind the code word to a follow' },
    { zh: '第二 资料做成系列的一部分', en: 'Two: make the freebie part of a series' },
    { zh: '第三 领完私信回访一句', en: 'Three: follow up with a direct message' },
    { s: { k: 'quote', lines: ['资料是见面礼', '**下一条**才是理由'], next: '只改一个变量' }, zh: '资料是见面礼 下一条才是留下的理由', en: 'The freebie is a greeting. The next video is the reason to stay.', d: 5 },
  ],
};
