import type { Episode } from '../types.ts';

export const v01: Episode = {
  id: 'V01', no: 1, group: '认知篇', mood: 0,
  title: '任务思维',
  en: 'Think in Tasks Not Jobs',
  beats: [
    { big: true, zh: 'AI拿走的不是你的岗位 是岗位里的**任务**', en: "AI won't take your job. It takes the tasks inside it." },
    { s: { k: 'title' }, zh: '先把一个岗位拆开看看', en: "Let's take one job apart" },
    { s: { k: 'blocks', head: '一个新媒体运营的一周', items: ['找选题', '写脚本', '拍摄', '剪辑', '配字幕', '做封面', '发布', '看数据', '回评论', '对接客户', '判断方向', '讲品牌故事'], ai: [1, 3, 4, 5, 6, 7, 8], aiLabel: 'AI 已经能接手', keepLabel: '必须由人来做' },
      zh: '一个运营岗 其实是十几件事', en: 'One content job is really a dozen tasks' },
    { zh: '其中一大半 AI已经能做', en: 'AI can already do more than half of them' },
    { zh: '剩下的 是**判断**和**关系**', en: 'What remains is judgment and relationships' },
    { s: { k: 'split', a: '岗位', b: '任务', aSub: '一个职位 一份工资', bSub: '一件件能交出去的事' }, zh: '所以别问 AI会不会取代我', en: "So don't ask whether AI will replace you" },
    { zh: '要问 我的哪些任务该交出去', en: 'Ask which of your tasks should be handed off' },
    { s: { k: 'compare', left: '岗位思维', right: '任务思维', rows: [['我是做剪辑的', '我负责让视频被**看完**'], ['学一个新软件', '把流程交给**AI**'], ['怕被替代', '盯住**结果**']] },
      zh: '岗位思维的人 守着一个工种', en: 'Job thinkers guard a trade' },
    { zh: '任务思维的人 盯着一个**结果**', en: 'Task thinkers guard an outcome' },
    { zh: '工种会过时 结果永远有人要', en: 'Trades expire. Outcomes are always in demand.' },
    { s: { k: 'hub', center: '你的位置', spokes: ['懂客户', '懂产品', '做判断', '担结果', '攒信任', '定方向'] }, zh: '岗位会被拿走', en: 'A job can be taken away' },
    { zh: '但你的**位置**拿不走', en: 'Your position cannot' },
    { zh: '位置是客户心里 想到你的那一刻', en: 'Position is the moment a client thinks of you' },
    { s: { k: 'list', head: '这周就能做的三件事', items: [
      { t: '列出你的**全部任务**', d: '按一周真实发生的写' },
      { t: '标出 **AI 能接手**的', d: '先交出最重复的那一件' },
      { t: '省下的时间', d: '花在客户和判断上' },
    ] }, zh: '第一 把一周的任务全列出来', en: 'One: list every task in your week' },
    { zh: '第二 标出AI能接手的', en: 'Two: mark the ones AI can take' },
    { zh: '第三 省下的时间给客户和判断', en: 'Three: spend the saved time on clients and judgment' },
    { s: { k: 'quote', lines: ['岗位会被拿走', '**位置**拿不走'], next: '平均值陷阱' }, zh: '岗位会被拿走 位置拿不走', en: 'Jobs can be taken. Positions cannot.', d: 5 },
  ],
};
