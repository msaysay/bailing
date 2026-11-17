import type { Episode } from '../types.ts';

export const v08: Episode = {
  id: 'V08', no: 8, group: '流程篇', mood: 2,
  title: 'AI味从哪来',
  en: 'Where the AI Taste Comes From',
  beats: [
    { big: true, zh: '观众一秒就能认出 这是**AI写的**', en: 'Viewers can tell in one second that AI wrote this' },
    { s: { k: 'title' }, zh: 'AI味 到底是什么味', en: 'What exactly does AI taste like' },
    { s: { k: 'hub', center: 'AI味', spokes: ['空话开头', '排比堆砌', '万能形容词', '没有人和事', '结尾升华'] }, zh: '空话开头 排比堆砌', en: 'Empty openers, stacked parallelisms' },
    { zh: '万能形容词 没有具体的人', en: 'One-size-fits-all adjectives, no real people' },
    { zh: '还有 结尾一定要升华', en: 'And an ending that must soar' },
    { s: { k: 'compare', left: 'AI味', right: '人味', rows: [['在快节奏的今天', '上周三 一个客户跟我说'], ['匠心 品质', '这泡茶 我们晒了**七天**'], ['让我们一起', '你下次试试看']] },
      zh: '这五个特征 背后是同一个原因', en: 'All five share one root cause' },
    { zh: 'AI在说**最安全**的话', en: 'AI says the safest thing' },
    { zh: '人在说**最具体**的话', en: 'People say the most specific thing' },
    { s: { k: 'chat', head: '一句话去掉AI味', msgs: [
      { me: true, t: '把这段改具体：写出时间 地点 人 和一句原话' },
      { t: '上周三 杭州的王姐尝完第二泡 说了一句：这茶我得给我爸带一斤' },
    ] }, zh: '去AI味最快的办法', en: 'The fastest way to remove the AI taste' },
    { zh: '逼它写出**时间 地点 人 原话**', en: 'Make it name the time, place, person and exact words' },
    { s: { k: 'split', a: '润色', b: '换素材', aSub: '越改越像AI', bSub: '一次就有人味' }, zh: '别再让AI帮你润色了', en: 'Stop asking AI to polish it' },
    { zh: '润色只会让它**更像AI**', en: 'Polishing only makes it sound more like AI' },
    { zh: '要换的不是说法 是**素材**', en: 'Change the material not the wording' },
    { s: { k: 'list', head: '交稿前查三遍', items: [
      { t: '删掉**第一句**', d: '空话开头 多半可以直接删' },
      { t: '圈出**形容词**', d: '换成数字或细节' },
      { t: '放进一句**原话**', d: '客户的 员工的 你自己的' },
    ] }, zh: '第一 删掉第一句', en: 'One: delete the first sentence' },
    { zh: '第二 形容词换成数字和细节', en: 'Two: swap adjectives for numbers and details' },
    { zh: '第三 放进一句真人原话', en: 'Three: add one real quote' },
    { s: { k: 'quote', lines: ['AI说安全的话', '**人**说具体的话'], next: '给AI派活' }, zh: 'AI说安全的话 人说具体的话', en: 'AI says safe things. People say specific things.', d: 5 },
  ],
};
