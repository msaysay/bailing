import type { Episode } from '../types.ts';

export const v21: Episode = {
  id: 'V21', no: 21, group: '数据篇', mood: 0,
  title: '只改一个变量',
  en: 'Change One Thing at a Time',
  beats: [
    { big: true, zh: '这条爆了 下条扑了 你说得清**为什么**吗', en: 'One video soars, the next one sinks. Can you say why?' },
    { s: { k: 'title' }, zh: '多数人说不清 因为一次改了太多', en: 'Most can\'t, because they changed too much at once' },
    { s: { k: 'number', items: [{ v: 6, label: '同时改掉的地方' }, { v: 64, label: '可能的原因组合', hot: true }], note: '6 个地方 各自改或不改 = 2 的 6 次方' }, zh: '标题 封面 开头 时长 配乐 时间 全换了', en: 'Title, cover, hook, length, music, timing: all changed' },
    { zh: '每处改或不改 就有**64种**可能', en: 'Changed or not, that is 64 possible explanations' },
    { zh: '数据再好 你也不知道该谢谁', en: 'However good the numbers, you can\'t tell what earned them' },
    { s: { k: 'compare', left: '一次改五处', right: '一次改一处', rows: [['爆了 说不清原因', '爆了 知道是**它**'], ['扑了 不知道怪谁', '扑了 也是**结论**'], ['经验 归零', '经验 **入库**']] }, zh: '一次改五处 爆了也学不到东西', en: 'Change five things, and even a hit teaches you nothing' },
    { zh: '一次改一处 扑了也是一条结论', en: 'Change one thing, and even a flop is a finding' },
    { zh: '经验才会一点点**存下来**', en: 'That is how experience actually accumulates' },
    { s: { k: 'curve', pts: [10, 12, 12, 19, 19, 26, 26, 34, 34, 43, 43, 54], ref: [10, 31, 8, 27, 12, 36, 9, 29, 15, 24, 11, 27], label: '每次只改一处', refLabel: '每次乱改', yl: '数据表现', note: '示意图' }, zh: '乱改的人 数据像心电图', en: 'Random changes give you a heart-monitor chart' },
    { zh: '单变量的人 是一级一级往上走', en: 'One-variable testers climb step by step' },
    { s: { k: 'hub', center: '打法库', spokes: ['钩子写法', '封面模板', '最佳时长', '发布时间', '选题方向', '结尾口令'] }, zh: '赢下来的打法 一条条写进**打法库**', en: 'Every winning move goes into a playbook' },
    { zh: '员工会换 打法库留在公司', en: 'People leave. The playbook stays with the company' },
    { s: { k: 'list', head: '从下一条开始', items: [
      { t: '每条只改**一个**变量', d: '钩子 · 封面 · 时长 选一个' },
      { t: '改了什么 结果如何 **记一行**', d: '别靠记忆' },
      { t: '赢了写进打法库 **输了也记**', d: '下一条从这里出发' },
    ] }, zh: '第一 每条只改一个变量', en: 'One: change a single variable per video' },
    { zh: '第二 改了什么 结果如何 记一行', en: 'Two: log what changed and what happened, one line' },
    { zh: '第三 赢了写进打法库 输了也记', en: 'Three: winners go in the playbook, and so do losers' },
    { s: { k: 'quote', lines: ['一次只改**一处**', '每次都在**变强**'], next: '第二天拆解' }, zh: '一次只改一处 每次都在变强', en: 'Change one thing at a time, and get stronger every time.', d: 5 },
  ],
};
