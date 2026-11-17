import type { Episode } from '../types.ts';

export const v18: Episode = {
  id: 'V18', no: 18, group: '数据篇', mood: 0,
  title: '五段漏斗',
  en: 'The Five-Layer Funnel',
  beats: [
    { big: true, zh: '数据一大堆 这周到底**该改什么**', en: 'So much data. What should you actually fix this week?' },
    { s: { k: 'title' }, zh: '把数据排成一个漏斗', en: 'Line the data up as a funnel' },
    { s: { k: 'funnel', layers: [{ label: '流量', tip: '播放 推荐' }, { label: '留存', tip: '平均观看 完播' }, { label: '互动', tip: '点赞 评论 转发' }, { label: '关系', tip: '关注' }, { label: '转化', tip: '私信 成交' }], weak: 1 }, zh: '流量 留存 互动 关系 转化', en: 'Reach, retention, engagement, relationship, conversion' },
    { zh: '从上往下 找第一个偏弱的', en: 'Go top-down and find the first weak layer' },
    { zh: '它就是这周**唯一**要改的事', en: 'That is the only thing to fix this week' },
    { s: { k: 'split', a: '全都改', b: '只改一个', aSub: '不知道谁起了作用', bSub: '下周就有答案' }, zh: '最常见的错 是哪里差改哪里', en: 'The common mistake: fix everything that looks bad' },
    { zh: '全改了 就不知道哪个起作用', en: "Change it all and you won't know what worked" },
    { zh: '一次只改一个 下周就有答案', en: 'Change one thing and next week you have an answer' },
    { s: { k: 'compare', left: '哪层弱', right: '改什么', rows: [['流量', '**选题和封面**'], ['留存', '**前15秒**'], ['互动', '**观点和提问**'], ['关系', '**人设和栏目**']] }, zh: '流量弱 改选题和封面', en: 'Weak reach: change topic and cover' },
    { zh: '留存弱 改前15秒', en: 'Weak retention: fix the first 15 seconds' },
    { zh: '互动弱 观点更鲜明 留个问题', en: 'Weak engagement: sharpen the view, leave a question' },
    { zh: '关系弱 固定人设和栏目', en: 'Weak relationship: fix your persona and series' },
    { s: { k: 'list', head: '每周复盘三步', items: [
      { t: '排出**五层数据**', d: '和上周比' },
      { t: '圈出**第一个偏弱**的', d: '只圈一个' },
      { t: '下周**只改它**', d: '其他都不动' },
    ] }, zh: '第一 把五层数据排出来', en: 'One: lay out all five layers' },
    { zh: '第二 圈出第一个偏弱的', en: 'Two: circle the first weak one' },
    { zh: '第三 下周只改它 别的不动', en: 'Three: next week change only that' },
    { s: { k: 'quote', lines: ['不是哪里差改哪里', '是**先改第一个**'], next: '爆了却不涨粉' }, zh: '不是哪里差改哪里 是先改第一个', en: "Don't fix whatever looks bad. Fix the first one.", d: 5 },
  ],
};
