import type { Episode } from '../types.ts';

export const v17: Episode = {
  id: 'V17', no: 17, group: '数据篇', mood: 3,
  title: '前15秒',
  en: 'The First 15 Seconds',
  beats: [
    { big: true, zh: 'AI类视频 平均只被看**16到26秒**', en: 'AI videos get watched for just 16 to 26 seconds on average' },
    { s: { k: 'title' }, zh: '前15秒 决定这条的命', en: 'The first 15 seconds decide its fate' },
    { s: { k: 'curve', pts: [100, 74, 56, 44, 36, 31, 27, 24, 22, 20, 19, 18], xl: ['0秒', '15秒', '30秒', '45秒', '60秒'], yl: '还在看的人', label: '留存', marks: [{ x: 0.25, label: '15秒' }], note: '示意图' }, zh: '这是一条典型的留存曲线', en: 'This is a typical retention curve' },
    { zh: '最陡的一段 就在前15秒', en: 'The steepest drop is in the first 15 seconds' },
    { zh: '过了这道坎 后面就平了', en: 'Get past it and the curve flattens' },
    { s: { k: 'number', items: [{ v: 9, suf: '%', label: '完播率 最低' }, { v: 14, suf: '%', label: '完播率 最高', hot: true }], note: '宁少视频号 AI类作品 · 来源 宁少视频号后台 截至2026-11-15' }, zh: '我自己的AI类视频 完播只有一成左右', en: 'My own AI videos finish at only around ten percent' },
    { zh: '大部分人 没看到我的观点就走了', en: 'Most people leave before they reach my point' },
    { s: { k: 'compare', left: '第1秒抓人', right: '15秒兑现', rows: [['一句吓人的话', '**一个结果**'], ['让人停下', '让人**留下**'], ['钩子', '**交付**']] }, zh: '很多人以为 第1秒抓住人就够了', en: 'Many think grabbing attention in second one is enough' },
    { zh: '抓住只是停下 兑现才是留下', en: 'Grabbing makes people pause. Delivering makes them stay.' },
    { s: { k: 'chat', head: '开头改写', msgs: [
      { who: '改前', t: '今天跟大家聊聊 怎么用AI做视频' },
      { who: '改后', t: '这条视频是AI一个人做完的 先看成片' },
    ] }, zh: '这样的开头 观众凭什么留下', en: 'With an opening like this, why would anyone stay?' },
    { zh: '改成先给结果 再讲怎么做', en: 'Show the result first, then explain how' },
    { zh: '结果在前 道理在后', en: 'Results first, reasons after' },
    { s: { k: 'list', head: '前15秒自查', items: [
      { t: '第3秒 说出**给谁看**', d: '点名你的人群' },
      { t: '第10秒 亮出**结果**', d: '画面就是证据' },
      { t: '第15秒 给出**留下的理由**', d: '后面还有什么' },
    ] }, zh: '第3秒 说清这条给谁看', en: 'By second 3: say who this is for' },
    { zh: '第10秒 亮出结果', en: 'By second 10: show the result' },
    { zh: '第15秒 给出留下来的理由', en: 'By second 15: give a reason to stay' },
    { s: { k: 'quote', lines: ['钩子让人停下', '**兑现**让人留下'], next: '五段漏斗' }, zh: '钩子让人停下 兑现让人留下', en: 'A hook makes them stop. Delivery makes them stay.', d: 5 },
  ],
};
