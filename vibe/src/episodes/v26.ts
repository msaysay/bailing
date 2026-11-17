import type { Episode } from '../types.ts';

export const v26: Episode = {
  id: 'V26', no: 26, group: '方法篇', mood: 0,
  title: '画面就是证据',
  en: 'Footage Is Evidence',
  beats: [
    { big: true, zh: '同一句话 说出来没人信 **拍出来**就信了', en: 'Say it and nobody believes. Show it and they do.' },
    { s: { k: 'title' }, zh: '短视频里 画面比嘴更有说服力', en: 'In short video, the picture outargues the mouth' },
    { s: { k: 'compare', left: '说', right: '拍', rows: [['我们效率很高', '后台**实时**在跑'], ['产品很好用', '一段**操作录屏**'], ['客户很满意', '客户**原话截图**']] }, zh: '说效率高 不如给他看后台', en: 'Don\'t claim efficiency. Show the dashboard.' },
    { zh: '说好用 不如录一段屏', en: 'Don\'t say it\'s easy. Record the screen.' },
    { zh: '说客户满意 不如放一张截图', en: 'Don\'t say clients are happy. Show their words.' },
    { s: { k: 'hub', center: '一个画面', spokes: ['时间', '地点', '人物', '动作', '数字', '结果'] }, zh: '一个画面 同时交代了这么多', en: 'One shot carries all of this at once' },
    { zh: '用嘴说 要半分钟', en: 'Saying it would take half a minute' },
    { zh: '但画面不是越炫越好', en: 'But flashier footage isn\'t better footage' },
    { s: { k: 'number', items: [{ v: 773, label: '一条全是3D特效的视频 播放量', hot: true }], note: '来源 宁少视频号后台 截至2026-11-15' }, zh: '我做过一条全是3D特效的视频', en: 'I once made a video entirely of 3D effects' },
    { zh: '播放只有**773**', en: 'It got 773 views' },
    { s: { k: 'split', a: '炫', b: '证', aSub: '看着好看', bSub: '看完相信' }, zh: '因为它好看 却什么都没证明', en: 'It looked great and proved nothing' },
    { zh: '画面要**证明** 不要表演', en: 'Footage should prove, not perform' },
    { zh: '观众要的不是好看 是**相信**', en: 'Viewers don\'t need pretty. They need to believe.' },
    { s: { k: 'list', head: '每条视频备三类画面', items: [
      { t: '**过程** 录屏', d: '让他看到你怎么做' },
      { t: '**结果** 截图', d: '让他看到做成了什么' },
      { t: '**现场** 实拍', d: '让他看到真有其事' },
    ] }, zh: '第一 过程录屏', en: 'One: screen recordings of the process' },
    { zh: '第二 结果截图', en: 'Two: screenshots of the result' },
    { zh: '第三 现场实拍', en: 'Three: real footage on site' },
    { s: { k: 'quote', lines: ['能拍的', '就**别说**'], next: '幸存者偏差' }, zh: '能拍的 就别说', en: 'If you can show it, don\'t say it.', d: 5 },
  ],
};
