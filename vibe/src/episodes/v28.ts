import type { Episode } from '../types.ts';

export const v28: Episode = {
  id: 'V28', no: 28, group: '方法篇', mood: 2,
  title: '反复出现的力量',
  en: 'The Power of Showing Up Again',
  beats: [
    { big: true, zh: '为什么要固定栏目 固定**人设名字**', en: 'Why keep a fixed series and a fixed persona name?' },
    { s: { k: 'title' }, zh: '因为人会喜欢 见过很多次的东西', en: 'Because people like what they\'ve seen many times' },
    { s: { k: 'curve', pts: [10, 24, 34, 42, 48, 53, 57, 60, 62, 63], xl: ['第1次', '', '', '', '', '', '', '', '', '第N次'], yl: '好感', label: '见的次数越多 好感越高', note: '示意图 参考 Zajonc 1968 单纯曝光效应' }, zh: '心理学家扎荣茨 1968年做过实验', en: 'Psychologist Robert Zajonc ran the experiment in 1968' },
    { zh: '同一样东西 看的次数越多 人越喜欢', en: 'The more often people see something, the more they like it' },
    { zh: '这叫**单纯曝光效应**', en: 'It\'s called the mere-exposure effect' },
    { s: { k: 'compare', left: '每次都变', right: '每次都一样', rows: [['名字换来换去', '只叫**一个名字**'], ['封面随心', '**一套**封面'], ['想到啥发啥', '**固定栏目**']] }, zh: '我自己就犯过这个错', en: 'I made this mistake myself' },
    { zh: '同一个账号 用过三个名字', en: 'One account, three different names' },
    { zh: '观众每次见到的 都像一个新人', en: 'Every time, viewers met a stranger' },
    { s: { k: 'dots', cols: 20, rows: 5, steps: [{ a: 6, label: '第一次见到你' }, { a: 30, label: '第五次 有点眼熟' }, { a: 80, label: '第二十次 他**记住你了**' }] }, zh: '名字不变 每一次曝光都在累积', en: 'Keep the name, and every view adds up' },
    { zh: '一换名字 又从零开始', en: 'Change it, and you start from zero' },
    { zh: '重复 是给他记住你的机会', en: 'Repetition gives them the chance to remember you' },
    { s: { k: 'split', a: '新鲜感', b: '熟悉感', aSub: '留住一次', bSub: '留住一直' }, zh: '新鲜感留住一次 熟悉感留住一直', en: 'Novelty keeps them once. Familiarity keeps them for good.' },
    { s: { k: 'list', head: '三个固定', items: [
      { t: '固定**一个名字**', d: '账号名 · 片尾 · 口头禅 统一' },
      { t: '固定**栏目名**和期号', d: '让他知道还有下一期' },
      { t: '固定**封面和片头**', d: '刷到第一眼就认出你' },
    ] }, zh: '第一 固定一个名字', en: 'One: fix a single name' },
    { zh: '第二 固定栏目名和期号', en: 'Two: fix the series name and episode numbers' },
    { zh: '第三 固定封面和片头', en: 'Three: fix the cover style and the opening' },
    { s: { k: 'quote', lines: ['见过一百次的你', '才是**他信任的你**'], next: '素材的红线' }, zh: '见过一百次的你 才是他信任的你', en: 'The you they\'ve seen a hundred times is the you they trust.', d: 5.5 },
  ],
};
