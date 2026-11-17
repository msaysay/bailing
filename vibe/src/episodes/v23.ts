import type { Episode } from '../types.ts';

export const v23: Episode = {
  id: 'V23', no: 23, group: '方法篇', mood: 2,
  title: '开 展 收',
  en: 'Open, Build, Close',
  beats: [
    { big: true, zh: '你的视频 观众为什么**看不完**', en: 'Why don\'t viewers finish your videos?' },
    { s: { k: 'title' }, zh: '因为它没有骨架', en: 'Because it has no skeleton' },
    { s: { k: 'flow', nodes: ['开', '展', '收'], sub: ['3秒抓住人', '只讲一件事', '给个能带走的'] }, zh: '一条短视频 只有三块', en: 'A short video has only three parts' },
    { zh: '**开** 是让人留下', en: 'Open: make them stay' },
    { zh: '**展** 是让人相信', en: 'Build: make them believe' },
    { zh: '**收** 是让人带走东西', en: 'Close: give them something to take away' },
    { s: { k: 'compare', left: '常见写法', right: '开展收', rows: [['先自我介绍', '先给**结果**'], ['讲三件事', '只讲**一件**'], ['谢谢观看', '留一个**动作**']] }, zh: '多数人一开口 先介绍自己', en: 'Most people open by introducing themselves' },
    { zh: '中间讲三件事 结尾说谢谢观看', en: 'Cover three points, then say thanks for watching' },
    { zh: '观众在第一句就走了', en: 'Viewers are gone after the first line' },
    { s: { k: 'curve', pts: [100, 82, 76, 72, 69, 66, 64, 62, 60, 59, 58, 57], ref: [100, 58, 46, 41, 38, 35, 33, 31, 30, 29, 28, 27], label: '有骨架', refLabel: '没骨架', yl: '还在看的人', xl: ['0秒', '', '', '', '', '', '', '', '', '', '', '60秒'], note: '示意图' }, zh: '有骨架的视频 曲线更平', en: 'With a skeleton, the retention curve stays flatter' },
    { zh: '没骨架的 前几秒就塌下去', en: 'Without one, it collapses in seconds' },
    { s: { k: 'ring', parts: [{ label: '开 前15秒', v: 15, hot: true }, { label: '展 主体', v: 65 }, { label: '收 最后几秒', v: 20, hot: true }], center: '60秒', note: '示意图 按60秒一条计' }, zh: '时间大头花在展上', en: 'Most of the time goes to the build' },
    { zh: '但成败 在**两头**', en: 'But success is decided at both ends' },
    { zh: '开头留住人 结尾换来关注', en: 'The opening keeps viewers. The ending earns the follow.' },
    { s: { k: 'list', head: '写稿前先填三格', items: [
      { t: '开 **一句话**说出结果', d: '别铺垫 别问好' },
      { t: '展 只留**一个**论点', d: '其余的留给下一条' },
      { t: '收 告诉他**下一步**', d: '关注 · 收藏 · 去做' },
    ] }, zh: '第一 开头一句话说出结果', en: 'One: state the result in the first line' },
    { zh: '第二 中间只留一个论点', en: 'Two: keep one argument in the middle' },
    { zh: '第三 结尾告诉他下一步', en: 'Three: end with the next step' },
    { s: { k: 'quote', lines: ['先有**骨架**', '再长**肉**'], next: '钩子五式' }, zh: '先有骨架 再长肉', en: 'Skeleton first. Then the flesh.', d: 5 },
  ],
};
