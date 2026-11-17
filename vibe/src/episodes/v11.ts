import type { Episode } from '../types.ts';

export const v11: Episode = {
  id: 'V11', no: 11, group: '流程篇', mood: 1,
  title: '把成功打包',
  en: 'Package Your Wins',
  beats: [
    { big: true, zh: '你做出过一条爆款 **然后呢**', en: 'You made one hit video. Then what?' },
    { s: { k: 'title' }, zh: '大多数人的爆款 只发生了一次', en: 'For most people a hit happens only once' },
    { s: { k: 'split', a: '经验', b: '技能包', aSub: '在你脑子里', bSub: '在电脑里 谁都能跑' }, zh: '想让它反复发生 得把经验变成**技能包**', en: 'To make it repeat, turn experience into a skill pack' },
    { zh: '经验在你脑子里 技能包在电脑里', en: 'Experience lives in your head. A skill pack lives on the computer.' },
    { zh: '换谁来跑 结果都一样', en: 'Whoever runs it gets the same result' },
    { s: { k: 'flow', nodes: ['写稿', '配音', '剪辑', '封面', '发布'], sub: ['口播稿模板', '固定音色', '组件库', '标题规则', '三个平台'] }, zh: '一个技能包 装的是一整条做法', en: 'A skill pack holds a whole method' },
    { zh: '每一步做什么 用什么 做到什么标准', en: 'What each step is, what it uses, what good looks like' },
    { zh: 'AI照着它走 就不用每次从零开始', en: 'AI follows it and never starts from zero' },
    { s: { k: 'compare', left: '每次口头交代', right: '一个技能包', rows: [['每次重新解释', '说一遍 **永久生效**'], ['换人就走样', '谁来跑都**一样**'], ['好经验散落', '**越用越厚**']] }, zh: '口头交代 每次都得重来', en: 'Verbal instructions start over every time' },
    { zh: '技能包写一次 以后每次都按它来', en: 'Write the pack once and every run follows it' },
    { s: { k: 'stairs', head: '同一个技能包 跑到第几次', items: [{ label: '第1次', v: '能用' }, { label: '第5次', v: '顺手' }, { label: '第20次', v: '稳定' }, { label: '第50次', v: '交给员工' }] }, zh: '反直觉的是 它不是写完就好了', en: 'The surprise: it is not finished when you write it' },
    { zh: '每翻车一次 就往里补一条规则', en: 'Every failure adds one more rule' },
    { zh: '用得越久 越像你最好的那个员工', en: 'The longer you use it, the more it works like your best employee' },
    { s: { k: 'list', head: '打包你的第一个技能', items: [
      { t: '挑一件**做过三次**的事', d: '重复过 才值得打包' },
      { t: '把步骤和标准**写下来**', d: '用什么 做到什么程度' },
      { t: '每次翻车 **补一条规则**', d: '技能包是慢慢长出来的' },
    ] }, zh: '第一 挑一件你做过三次的事', en: 'One: pick something you have done three times' },
    { zh: '第二 把步骤和标准写成文字', en: 'Two: write down the steps and the standard' },
    { zh: '第三 每次翻车 就补一条规则', en: 'Three: every time it breaks, add a rule' },
    { s: { k: 'quote', lines: ['做成一次是运气', '**打包下来**才是能力'], next: '声音的选择' }, zh: '做成一次是运气 打包下来才是能力', en: 'Doing it once is luck. Packaging it is capability.', d: 5 },
  ],
};
