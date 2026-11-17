import type { Episode } from '../types.ts';

export const v29: Episode = {
  id: 'V29', no: 29, group: '红线篇', mood: 3,
  title: '素材的红线',
  en: 'Red Lines for Material',
  beats: [
    { big: true, zh: 'AI生成得再快 有两条线**碰不得**', en: 'However fast AI produces, two lines must never be crossed' },
    { s: { k: 'title' }, zh: '一条是版权 一条是数据真实', en: 'One is copyright. The other is truthful data.' },
    { s: { k: 'blocks', head: '一条视频的流程', items: ['写稿', '配音', '剪辑', '配乐', '版权确认', '数据核实'], ai: [0, 1, 2, 3], aiLabel: 'AI可以代劳', keepLabel: '必须人来把关' }, zh: '流程里大部分 都能交给AI', en: 'Most of the pipeline can go to AI' },
    { zh: '写稿 配音 剪辑 配乐', en: 'Script, voice, edit, music' },
    { zh: '但有两步 必须**人来把关**', en: 'But two steps need a human gatekeeper' },
    { s: { k: 'list', head: '版权自查', items: [
      { t: '音乐 **有授权**才用', d: '平台曲库 · 原创 · 买断' },
      { t: '图片视频 **登记来源**', d: '谁拍的 · 什么许可' },
      { t: '别人的视频 **不搬运**', d: '剪一段也算' },
    ] }, zh: '先说版权 音乐有授权才用', en: 'Copyright first: only licensed music' },
    { zh: '图片视频 每一个都登记来源', en: 'Log the source of every image and clip' },
    { zh: '别人的视频 剪一段也算搬运', en: 'Cutting from someone else\'s video still counts as copying' },
    { s: { k: 'chat', head: '示意 · 某次写稿', msgs: [
      { me: true, t: '帮我找一个行业增长的数据' },
      { t: '据统计 该行业年增长率高达37%……' },
    ] }, zh: '再说数据 你让AI给个数字', en: 'Then data: you ask AI for a number' },
    { zh: '它张口就来 说得有板有眼', en: 'It answers instantly and sounds certain' },
    { zh: '可这个数字 可能**根本不存在**', en: 'But that number may not exist at all' },
    { s: { k: 'flow', nodes: ['数字', '找出处', '标来源', '查不到'], sub: ['每一个', '原始报告', '写在画面上', '写未取得'] }, zh: '每个数字 都要找到原始出处', en: 'Every number needs its original source' },
    { zh: '来源标在画面上', en: 'Show the source on screen' },
    { zh: '查不到 就写**未取得** 不估算', en: 'If you can\'t find it, say so. Never estimate.' },
    { zh: '这两条线一碰 伤的是**品牌**', en: 'Cross either line and it\'s the brand that gets hurt' },
    { s: { k: 'quote', lines: ['**快** 是AI给的', '**信** 是你守的'], next: '别喂错东西' }, zh: '快是AI给的 信是你守的', en: 'AI gives you speed. Trust is yours to keep.', d: 5 },
  ],
};
