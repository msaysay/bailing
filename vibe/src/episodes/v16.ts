import type { Episode } from '../types.ts';

export const v16: Episode = {
  id: 'V16', no: 16, group: '流程篇', mood: 1,
  title: '数字人的边界',
  en: 'Where Avatars Stop',
  beats: [
    { big: true, zh: '数字人能替你出镜吗 **能 也不能**', en: 'Can an avatar appear for you? Yes, and no.' },
    { s: { k: 'title' }, zh: '关键看你拿它干什么', en: 'It depends on what you use it for' },
    { s: { k: 'compare', left: '适合数字人', right: '必须真人', rows: [['产品**说明**', '创始人**观点**'], ['流程**教程**', '**道歉**和回应'], ['批量**通知**', '**故事**和情绪']] }, zh: '说明书一类的内容 数字人很合适', en: 'Manual-style content suits an avatar well' },
    { zh: '观点和情绪 必须你本人来', en: 'Opinions and emotion need the real you' },
    { zh: '道歉和回应 更不能交给它', en: 'Apologies and responses even more so' },
    { s: { k: 'blocks', head: '一条IP视频的活儿', items: ['写稿', '配音', '剪辑', '字幕', '封面', '发布', '出镜表态', '回应评论', '讲真故事'], ai: [0, 1, 2, 3, 4, 5], aiLabel: '可以交给AI', keepLabel: '只能是你' }, zh: '能交给AI的活 其实很多', en: 'Plenty of the work can go to AI' },
    { zh: '唯独这几件 换了人就不成立', en: 'Except these, which fall apart with anyone else' },
    { zh: '而它们 恰恰是IP的核心', en: 'And they are exactly the core of an IP' },
    { s: { k: 'ring', parts: [{ label: '信息', v: 35 }, { label: '信任', v: 65, hot: true }], center: 'IP视频', note: '示意图' }, zh: 'IP视频里 信息只占一部分', en: 'In an IP video, information is only part of it' },
    { zh: '观众买单的 是对你的**信任**', en: 'What viewers buy is trust in you' },
    { s: { k: 'split', a: '假装真人', b: '标明AI', aSub: '被发现 信任清零', bSub: '大方说 反而加分' }, zh: '最危险的用法 是假装真人', en: 'The most dangerous use is pretending to be human' },
    { zh: 'AI生成的内容 按规定也要标注', en: 'AI-generated content must be labeled by regulation' },
    { s: { k: 'list', head: '数字人的三条用法', items: [
      { t: '只做**信息类**内容', d: '教程 说明 通知' },
      { t: '用**你自己授权**的形象', d: '不借别人的脸' },
      { t: '**标注**AI生成', d: '大方说 不吃亏' },
    ] }, zh: '第一 只做信息类内容', en: 'One: use it only for informational content' },
    { zh: '第二 只用你自己授权的形象', en: 'Two: only an image you have authorized' },
    { zh: '第三 大方标注AI生成', en: 'Three: openly label it as AI-generated' },
    { s: { k: 'quote', lines: ['数字人能替你说话', '**替不了你**表态'], next: '前15秒' }, zh: '数字人能替你说话 替不了你表态', en: "An avatar can speak for you. It can't take a stand for you.", d: 5 },
  ],
};
