import type { Episode } from '../types.ts';

export const v09: Episode = {
  id: 'V09', no: 9, group: '流程篇', mood: 4,
  title: '给AI派活',
  en: 'Briefing Your AI',
  beats: [
    { big: true, zh: '你怎么给新员工派活 就怎么**给AI派活**', en: 'Brief AI the way you brief a new hire' },
    { s: { k: 'title' }, zh: '提示词不是咒语 是说明书', en: "A prompt isn't a spell. It's a brief." },
    { s: { k: 'chat', head: '一句话派活', msgs: [
      { me: true, t: '帮我写个短视频脚本' },
      { t: '好的 以下是一个短视频脚本：在这个快节奏的时代……' },
    ] }, zh: '大多数人是这样派活的', en: 'This is how most people assign the job' },
    { zh: '然后抱怨AI写得不行', en: 'Then they complain the AI is bad' },
    { s: { k: 'hub', center: '一份说明书', spokes: ['给谁看', '要什么结果', '参考素材', '不要什么', '多长 什么格式', '怎么算合格'] }, zh: '换成给新员工交代工作', en: "Now brief it like a new employee's first task" },
    { zh: '给谁看 要什么结果 参考什么', en: 'Who it is for, what result, what references' },
    { zh: '不要什么 多长 怎么算合格', en: "What to avoid, how long, what counts as done" },
    { s: { k: 'chat', head: '一份说明书派活', msgs: [
      { me: true, t: '给做餐饮的老板看 60秒口播稿\n素材：附件里三段客户原话\n不要：空话开头 排比\n合格：第一句就说出结果' },
      { t: '上周 一家火锅店老板跟我说 他把菜单砍掉一半 翻台率反而上去了……' },
    ] }, zh: '同一个AI 派活方式一换', en: 'Same AI, different brief' },
    { zh: '交回来的东西 完全不一样', en: 'Completely different work comes back' },
    { s: { k: 'split', a: '咒语', b: '信息', aSub: '神奇关键词', bSub: '把要求说清楚' }, zh: '很多人在网上收集提示词咒语', en: 'Many people collect magic prompts online' },
    { zh: '但AI缺的不是咒语 是**信息**', en: "AI doesn't lack spells. It lacks information." },
    { s: { k: 'list', head: '派活说明书 模板', items: [
      { t: '**给谁看** 要什么结果' },
      { t: '**参考素材** 一起附上' },
      { t: '**不要什么** 怎么算合格' },
      { t: '**存成模板** 反复用' },
    ] }, zh: '第一 写清给谁看 要什么结果', en: 'One: state the audience and the result' },
    { zh: '第二 参考素材一起给它', en: 'Two: attach the reference material' },
    { zh: '第三 说清不要什么 怎么算合格', en: "Three: say what to avoid and what counts as done" },
    { zh: '写好一次 存成模板反复用', en: 'Write it once and keep it as a template' },
    { s: { k: 'quote', lines: ['AI不缺能力', '缺**一份说明书**'], next: 'AI怎么查资料' }, zh: 'AI不缺能力 缺一份说明书', en: "AI doesn't lack ability. It lacks a brief.", d: 5 },
  ],
};
