import type { Episode } from '../types.ts';

export const v13: Episode = {
  id: 'V13', no: 13, group: '流程篇', mood: 0,
  title: '卡准每一个字',
  en: 'On Every Word',
  beats: [
    { big: true, zh: 'AI剪的视频 为什么能**卡准**每一个字', en: 'How does an AI edit land on every single word?' },
    { s: { k: 'title' }, zh: '秘密是一张时间表', en: 'The secret is a timing table' },
    { s: { k: 'flow', nodes: ['配音', '识别', '对齐', '时间表', '画面'], sub: ['一段音频', '听出每个字', '和稿子对上', '每个字几秒', '到点出现'] }, zh: '先把配音转成文字', en: 'First, the voiceover is transcribed' },
    { zh: '再和稿子逐字对上', en: 'Then matched to the script word by word' },
    { zh: '每个字在第几秒 全记下来', en: 'The exact second of every word is recorded' },
    { s: { k: 'chat', head: '时间表 · timing', msgs: [
      { who: '稿子', t: '岗位会被拿走 位置拿不走' },
      { who: '时间表', t: '岗位 3.2秒 · 拿走 4.1秒 · 位置 5.0秒' },
    ] }, zh: '比如这一句话', en: 'Take this sentence' },
    { zh: '每个词几点几秒出口 一清二楚', en: 'When each word is spoken, to the tenth of a second' },
    { s: { k: 'split', a: '写死秒数', b: '跟着词走', aSub: '改一句 全片错位', bSub: '改一句 自动跟上' }, zh: '画面不写秒数 只认这个词', en: 'Visuals don’t use fixed seconds, they follow the word' },
    { zh: '改了稿子重新配音 画面自动跟上', en: 'Change the script, re-record, and the visuals follow' },
    { s: { k: 'compare', left: '剪辑师卡点', right: '时间表卡点', rows: [['靠耳朵', '靠**数据**'], ['改稿要重剪', '改稿**自动对齐**'], ['一条一条做', '可以**批量**']] }, zh: '剪辑师靠耳朵卡点', en: 'An editor syncs by ear' },
    { zh: '时间表靠的是数据', en: 'A timing table syncs by data' },
    { zh: '所以改稿不用重剪 还能批量', en: 'So edits need no re-cut, and it scales' },
    { s: { k: 'list', head: '用好它的三个习惯', items: [
      { t: '稿子先**定稿**再配音', d: '配音之后尽量不改字' },
      { t: '专有名词写进**词表**', d: '识别就不会听错' },
      { t: '画面跟着**词**走', d: '不要手写秒数' },
    ] }, zh: '第一 先定稿 再配音', en: 'One: lock the script, then record' },
    { zh: '第二 专有名词提前写进词表', en: 'Two: put names and jargon in a word list' },
    { zh: '第三 画面跟着词走 不写秒数', en: 'Three: tie visuals to words, not seconds' },
    { s: { k: 'quote', lines: ['会卡点的不是AI', '是**那张时间表**'], next: '越做越快' }, zh: '会卡点的不是AI 是那张时间表', en: "It's not the AI that hits the beat. It's the timing table.", d: 5 },
  ],
};
