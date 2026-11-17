import type { Episode } from '../types.ts';

export const v04: Episode = {
  id: 'V04', no: 4, group: '认知篇', mood: 4,
  title: '后面的80%',
  en: 'The Other 80 Percent',
  beats: [
    { big: true, zh: '拍完那一刻 你的活**才干了一小半**', en: "The moment you stop filming you're less than halfway done" },
    { s: { k: 'title' }, zh: '一个人做IP 时间都去哪了', en: 'Running an IP alone: where does the time go' },
    { s: { k: 'ring', parts: [{ label: '拍摄', v: 2 }, { label: '剪辑 字幕 封面', v: 4, hot: true }, { label: '发布 看数据', v: 2, hot: true }, { label: '回评论 想下一条', v: 2, hot: true }], center: '一条视频', note: '示意图 · 按一条视频的工时估算' },
      zh: '把一条视频的工时拆开', en: "Break down one video's working hours" },
    { zh: '剩下的全是**拍完以后**的事', en: 'Everything else happens after the shoot' },
    { s: { k: 'flow', nodes: ['剪辑', '字幕', '封面', '发布', '看数据', '回评论'] }, zh: '剪辑 字幕 封面 三个平台发一遍', en: 'Edit, caption, thumbnail, post to three platforms' },
    { zh: '再看数据 回评论 想下一条', en: 'Then read the data, reply, plan the next one' },
    { zh: '每一步都不难 但每天都要做', en: 'No step is hard but every step is daily' },
    { s: { k: 'scatter', n: 120, keep: 10, label: '开始做IP的人', keepLabel: '撑下来的人' }, zh: '很多人不是拍不好', en: "Most people don't fail at filming" },
    { zh: '是被后面这些事**耗没了**', en: 'They get worn down by everything after it' },
    { s: { k: 'blocks', head: '一条视频的全部工作', items: ['剪辑', '字幕', '封面', '三平台发布', '数据汇总', '评论初筛', '拍摄', '想选题', '回关键评论'], ai: [0, 1, 2, 3, 4, 5], aiLabel: 'AI 和工具接手', keepLabel: '你只做这些' },
      zh: '能交出去的 先交出去', en: 'Hand off whatever can be handed off' },
    { zh: '剪辑字幕封面 发布和数据汇总', en: 'Editing, captions, thumbnails, posting, data' },
    { zh: '你只留下**拍**和**判断**', en: 'You keep only filming and judgment' },
    { s: { k: 'list', head: '今天就开始', items: [
      { t: '记一周 **每件事花多久**', d: '手机备忘录就够' },
      { t: '挑**最耗时**的一件', d: '先让 AI 接手它' },
      { t: '每月再交出去一件', d: '别想一次全换掉' },
    ] }, zh: '第一 记一周 每件事花多久', en: 'One: log how long each task takes for a week' },
    { zh: '第二 挑最耗时的一件交给AI', en: 'Two: give the most time-consuming one to AI' },
    { zh: '第三 每月再交出去一件', en: 'Three: hand off one more each month' },
    { s: { k: 'quote', lines: ['拍是开始', '**拍完**才是工作'], next: '事为主 人为主' }, zh: '拍是开始 拍完才是工作', en: 'Filming is the start. The real work comes after.', d: 5 },
  ],
};
