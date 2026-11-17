import type { Episode } from '../types.ts';

export const v30: Episode = {
  id: 'V30', no: 30, group: '红线篇', mood: 4,
  title: '别喂错东西',
  en: 'Don\'t Feed It the Wrong Things',
  beats: [
    { big: true, zh: '你喂给AI的公司资料 **去哪了**', en: 'Where does the company data you feed AI end up?' },
    { s: { k: 'title' }, zh: '这是企业用AI 最容易忽略的事', en: 'It\'s the most overlooked part of using AI at work' },
    { s: { k: 'hub', center: '公开AI', spokes: ['客户名单', '报价单', '合同', '财务数据', '内部会议', '员工信息'] }, zh: '很多人随手就把这些贴进去', en: 'People paste all of this in without thinking' },
    { zh: '图的是方便 风险却看不见', en: 'It\'s convenient, and the risk is invisible' },
    { zh: '资料一旦发出去 就**收不回来**', en: 'Once it\'s sent, you can\'t take it back' },
    { s: { k: 'funnel', layers: [{ label: '公开资料', tip: '随便用' }, { label: '内部资料', tip: '脱敏再用' }, { label: '核心机密', tip: '一个字都不出公司' }], weak: 2 }, zh: '先把资料分三级', en: 'First, sort data into three tiers' },
    { zh: '公开的随便用 内部的脱敏再用', en: 'Public data is fine. Internal data gets anonymized.' },
    { zh: '核心的 一个字都**不出公司**', en: 'Core secrets never leave the company' },
    { s: { k: 'compare', left: '随手贴', right: '企业的用法', rows: [['客户名单原件', '**脱敏**后再用'], ['合同全文', '只给**需要的段落**'], ['个人账号', '**企业账号**统一管']] }, zh: '同样是用AI', en: 'Both are using AI' },
    { zh: '一个在冒险 一个在管理', en: 'One is gambling. The other is managing.' },
    { s: { k: 'split', a: '禁用', b: '规矩', aSub: '员工偷偷用', bSub: '大家放心用' }, zh: '一刀切禁用 员工只会偷偷用', en: 'Ban it outright and staff will use it in secret' },
    { zh: '不如立好规矩 让大家**放心用**', en: 'Better to set rules so everyone can use it openly' },
    { s: { k: 'list', head: '这周就做', items: [
      { t: '列一张**资料分级表**', d: '公开 · 内部 · 核心' },
      { t: '统一**企业账号**', d: '不用个人号处理公司资料' },
      { t: '写进**新人手册**', d: '第一天就讲清楚' },
    ] }, zh: '第一 列一张资料分级表', en: 'One: draw up a data classification sheet' },
    { zh: '第二 统一用企业账号', en: 'Two: use company accounts only' },
    { zh: '第三 写进新人手册', en: 'Three: put it in the onboarding handbook' },
    { s: { k: 'quote', lines: ['AI 越好用', '**边界**越要清楚'], next: '回到第一期 任务思维' }, zh: 'AI越好用 边界越要清楚', en: 'The better AI gets, the clearer your boundaries must be.', d: 5 },
  ],
};
