import type { Episode } from '../types.ts';

export const v24: Episode = {
  id: 'V24', no: 24, group: '方法篇', mood: 3,
  title: '钩子五式',
  en: 'Five Kinds of Hooks',
  beats: [
    { big: true, zh: '前3秒 决定了**后面**还有没有人', en: 'The first three seconds decide whether anyone stays' },
    { s: { k: 'title' }, zh: '钩子不靠灵感 有五个现成的型', en: 'Hooks don\'t need inspiration. There are five ready-made forms.' },
    { s: { k: 'list', head: '五种钩子', items: [
      { t: '**结果**先行', d: '先说做成了什么' },
      { t: '**反常识**', d: '一个和直觉相反的结论' },
      { t: '**点人群**', d: '做企业的老板 这条你要看' },
      { t: '**提问**', d: '一个他答不上来的问题' },
      { t: '**冲突**', d: '两种做法 一对一错' },
    ] }, zh: '第一 结果先行 先说做成了什么', en: 'One: lead with the result' },
    { zh: '第二 反常识 一个反直觉的结论', en: 'Two: a counterintuitive claim' },
    { zh: '第三 点人群 让对的人停下来', en: 'Three: call out the audience so the right people stop' },
    { zh: '第四 提问 一个他答不上的问题', en: 'Four: a question they can\'t answer' },
    { zh: '第五 冲突 摆出两种做法', en: 'Five: set two approaches against each other' },
    { s: { k: 'number', items: [{ v: 2.03, suf: '%', dec: 2, label: '开头先点人群的那条 关注率', hot: true }], note: '来源 宁少视频号后台 截至2026-11-15' }, zh: '我自己的五条视频里', en: 'Among my own five videos' },
    { zh: '关注率最高的 是开头**点人群**的那条', en: 'The best follow rate came from the one that called out its audience' },
    { s: { k: 'chat', head: '同一条视频 两种开头', msgs: [
      { me: true, who: '改之前', t: '大家好 今天想和大家聊聊AI做内容' },
      { who: '改之后', t: '做企业的老板 不露脸也能把IP做起来' },
    ] }, zh: '同样的内容 换一个开头', en: 'Same content, a different opening' },
    { zh: '前一句是铺垫 后一句才是钩子', en: 'The first is a warm-up. The second is a hook.' },
    { s: { k: 'split', a: '铺垫', b: '理由', aSub: '大家好 今天聊聊', bSub: '第一句就给他' }, zh: '钩子的本质 是给他一个**留下的理由**', en: 'A hook is simply a reason to stay' },
    { s: { k: 'list', head: '今天就试', items: [
      { t: '同一条稿 写**五个开头**', d: '每种型各一个' },
      { t: '删掉第一句 **看还成不成立**', d: '成立 说明它是铺垫' },
      { t: '最好的那个 **先发**', d: '数据会告诉你' },
    ] }, zh: '第一 同一条稿 写五个开头', en: 'One: write five openings for the same script' },
    { zh: '第二 删掉第一句 看还成不成立', en: 'Two: delete the first line and see if it still works' },
    { zh: '第三 选最好的先发 让数据说话', en: 'Three: post the best one and let the data speak' },
    { s: { k: 'quote', lines: ['第一句话', '就是**全部的理由**'], next: '凭什么听你' }, zh: '第一句话 就是全部的理由', en: 'The first line is the whole reason to stay.', d: 5 },
  ],
};
