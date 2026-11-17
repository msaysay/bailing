import type { Episode } from '../types.ts';

export const v12: Episode = {
  id: 'V12', no: 12, group: '流程篇', mood: 3,
  title: '声音的选择',
  en: 'Choosing a Voice',
  beats: [
    { big: true, zh: '不露脸的视频 **声音**就是你的脸', en: 'In a faceless video, your voice is your face' },
    { s: { k: 'title' }, zh: '配音有三条路 各有代价', en: 'There are three ways to voice a video, each with a cost' },
    { s: { k: 'stairs', head: '越往右 越像你本人', items: [{ label: '现成音色', v: '快' }, { label: '克隆音色', v: '像' }, { label: '真人录', v: '真' }] }, zh: '现成音色 选一个马上能用', en: 'Stock voice: pick one and go' },
    { zh: '克隆音色 录段样本让AI学你', en: 'Cloned voice: record a sample and let AI learn you' },
    { zh: '真人录 自己对着麦克风念', en: 'Real voice: read it into the mic yourself' },
    { s: { k: 'compare', left: '现成音色', right: '真人录', rows: [['**最快**', '最慢'], ['人人都能用', '**只有你有**'], ['听多了会腻', '有口误 也有**温度**']] }, zh: '最快的那条 谁都能用', en: 'The fastest option is available to everyone' },
    { zh: '最慢的那条 只有你有', en: 'The slowest one belongs only to you' },
    { zh: '同一个音色听多了 观众会腻', en: 'Hear the same stock voice enough and viewers tune out' },
    { s: { k: 'hub', center: '你的声音', spokes: ['语速', '口音', '停顿', '口头禅', '情绪', '笑声'] }, zh: '观众记住一个账号 靠的是这些', en: 'Viewers remember an account by these details' },
    { zh: '这些细节 就是信任', en: 'These details are trust' },
    { s: { k: 'split', a: '像你', b: '是你', aSub: '克隆学得到音色', bSub: '观众信的是本人' }, zh: '克隆能学到音色 学不全这些细节', en: 'A clone copies the timbre, not all the details' },
    { zh: '观众最后信的 是**你本人**', en: 'In the end viewers trust you, the person' },
    { s: { k: 'list', head: '怎么选', items: [
      { t: '试水阶段 用**现成音色**', d: '先把流程跑通' },
      { t: '固定栏目 用**克隆音色**', d: '只克隆你自己的声音' },
      { t: '关键观点 **真人录**', d: '最重要的话 本人来说' },
    ] }, zh: '试水阶段 用现成音色跑通流程', en: 'Testing: use a stock voice to get the pipeline working' },
    { zh: '固定栏目 只克隆你自己的声音', en: 'Regular series: clone only your own voice' },
    { zh: '关键观点 一定真人录', en: 'Key opinions: always record it yourself' },
    { s: { k: 'quote', lines: ['声音可以借', '**信任**借不来'], next: '卡准每一个字' }, zh: '声音可以借 信任借不来', en: "You can borrow a voice. You can't borrow trust.", d: 5 },
  ],
};
