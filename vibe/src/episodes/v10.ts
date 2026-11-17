import type { Episode } from '../types.ts';

export const v10: Episode = {
  id: 'V10', no: 10, group: '流程篇', mood: 1,
  title: 'AI怎么查资料',
  en: 'How AI Looks Things Up',
  beats: [
    { big: true, zh: '你给AI一整个知识库 它其实**只看几段**', en: 'You give AI a whole knowledge base. It only reads a few passages.' },
    { s: { k: 'title' }, zh: '先搞懂 AI是怎么查资料的', en: 'First understand how AI looks things up' },
    { s: { k: 'dots', cols: 20, rows: 8, legend: ['交给AI的', '相关的候选'], steps: [
      { label: '你的资料 先被切成**很多小段**' },
      { b: 24, label: '你一提问 它按**意思**去找' },
      { a: 5, label: '只挑**最相关的几段**' },
    ] }, zh: '你的资料 先被切成很多小段', en: 'Your material is first cut into small passages' },
    { zh: '你一提问 它按意思去找相关的', en: 'When you ask it searches by meaning' },
    { zh: '最后只挑最相关的几段 交给AI', en: 'Only the most relevant few go to the AI' },
    { s: { k: 'flow', nodes: ['提问', '检索', '挑几段', 'AI写'], sub: ['你说一句话', '在资料里找', '最相关的', '带着资料写'] }, zh: '这个过程叫 检索增强', en: "It's called retrieval-augmented generation" },
    { zh: '说白了就是 先查 再写', en: 'Put simply: look it up then write' },
    { s: { k: 'compare', left: '资料堆在一起', right: '资料理清楚', rows: [['标题叫 新建文档3', '标题写清 **是什么**'], ['十个版本混在一起', '只留**最新一版**'], ['一篇讲十件事', '一篇讲**一件事**']] },
      zh: '所以问题就来了', en: "So here's the problem" },
    { zh: '资料乱 它就会**找错段**', en: 'Messy material means it pulls the wrong passage' },
    { zh: '找错了 写得再好也是错的', en: 'Wrong source means wrong output however well written' },
    { s: { k: 'split', a: '多', b: '准', aSub: '越多越乱', bSub: '找得到才有用' }, zh: '知识库不是越大越好', en: "A knowledge base isn't better just because it's bigger" },
    { zh: '是越**准**越好', en: "It's better when it's precise" },
    { s: { k: 'list', head: '让AI找得准', items: [
      { t: '一篇只讲 **一件事**' },
      { t: '标题写清楚 **是什么**' },
      { t: '过时的 **删掉或标注**' },
    ] }, zh: '第一 一篇只讲一件事', en: 'One: one note one topic' },
    { zh: '第二 标题写清楚是什么', en: 'Two: titles that say what it is' },
    { zh: '第三 过时的删掉或标注', en: 'Three: delete or flag what is outdated' },
    { s: { k: 'quote', lines: ['AI会查资料', '前提是**你理过资料**'], next: '把成功打包' }, zh: 'AI会查资料 前提是你理过资料', en: 'AI can look things up, if you have tidied the shelves.', d: 5 },
  ],
};
