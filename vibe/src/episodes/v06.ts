import type { Episode } from '../types.ts';

export const v06: Episode = {
  id: 'V06', no: 6, group: '认知篇', mood: 3,
  title: '第二大脑',
  en: 'The Second Brain',
  beats: [
    { big: true, zh: 'AI人人都有 **你的知识库**只有你有', en: 'Everyone has AI. Only you have your knowledge base.' },
    { s: { k: 'title' }, zh: '决定AI上限的 不是模型', en: "What sets AI's ceiling isn't the model" },
    { s: { k: 'dots', cols: 20, rows: 6, legend: ['你的独家资料', '人人都能拿到的'], steps: [
      { b: 120, label: '大家用的模型 **差不多**' },
      { a: 14, b: 106, label: '差别在 **喂进去的东西**' },
    ] }, zh: '各家模型的差距 越来越小', en: 'The gap between models keeps shrinking' },
    { zh: '拉开差距的 是你喂进去的东西', en: 'The gap comes from what you feed it' },
    { s: { k: 'hub', center: '第二大脑', spokes: ['客户档案', '会议纪要', '产品资料', '踩坑复盘', '行业笔记', '老板语录'] }, zh: '把公司散落的经验 收到一个地方', en: "Gather the company's scattered experience in one place" },
    { zh: '这就是你的**第二大脑**', en: 'That is your second brain' },
    { zh: '它越厚 AI就越像你', en: 'The thicker it gets the more AI sounds like you' },
    { s: { k: 'curve', pts: [1, 1.6, 2.3, 3.1, 4, 5.1, 6.4, 7.9, 9.6], ref: [1, 1.5, 1.8, 2, 2.1, 2.15, 2.2, 2.2, 2.25], yl: '内容质量', xl: ['开始', '', '', '', '', '', '', '', '一年后'], note: '示意图 · 橙线 有知识库 · 蓝线 没有知识库' },
      zh: '有知识库 每多存一条 它就更懂你', en: 'With a knowledge base every note makes it know you better' },
    { zh: '没有知识库 AI的水平就停在那', en: "Without one AI's level just stays put" },
    { zh: '这就是复利', en: 'That is compounding' },
    { s: { k: 'split', a: '囤资料', b: '用资料', aSub: '存了不看', bSub: '写稿前先喂' }, zh: '但知识库不是网盘', en: "But a knowledge base isn't cloud storage" },
    { zh: '存了不用 等于没存', en: 'Stored and unused is the same as not stored' },
    { s: { k: 'list', head: '搭第二大脑的三步', items: [
      { t: '选一个**统一的地方**', d: 'Obsidian 飞书文档 都行' },
      { t: '每天**存一条**', d: '客户原话 会议结论' },
      { t: '写稿前 **先让 AI 读**', d: '读完再让它动笔' },
    ] }, zh: '第一 选一个统一的地方', en: 'One: pick a single place' },
    { zh: '第二 每天存一条', en: 'Two: add one note a day' },
    { zh: '第三 写稿前先让AI读', en: 'Three: have AI read it before writing' },
    { s: { k: 'quote', lines: ['模型是租来的', '**知识库**是你的'], next: '六步闭环' }, zh: '模型是租来的 知识库是你的', en: 'The model is rented. The knowledge base is yours.', d: 5 },
  ],
};
