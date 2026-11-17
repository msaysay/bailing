import type { Episode } from '../types.ts';

export const v27: Episode = {
  id: 'V27', no: 27, group: '方法篇', mood: 1,
  title: '幸存者偏差',
  en: 'Survivorship Bias',
  beats: [
    { big: true, zh: '你学的爆款方法 为什么在你身上**不灵**', en: 'Why doesn\'t the viral formula you learned work for you?' },
    { s: { k: 'title' }, zh: '因为你只看到了活下来的那些', en: 'Because you only ever see the survivors' },
    { s: { k: 'scatter', n: 160, keep: 9, label: '用同一个方法发出的视频', keepLabel: '你刷到的 只有这些' }, zh: '用同一个方法发的视频 成千上万', en: 'Thousands of videos use the same formula' },
    { zh: '大部分沉了 你根本刷不到', en: 'Most sink, and you never see them' },
    { zh: '你看到的 只是浮上来的几条', en: 'You only see the few that float up' },
    { s: { k: 'compare', left: '弹孔多的地方', right: '该加固的地方', rows: [['机翼', '**发动机**'], ['机身', '**驾驶舱**'], ['回来的飞机', '**没回来的**']] }, zh: '二战时 军方想给飞机加装甲', en: 'In WWII, the military wanted to armor its planes' },
    { zh: '返航的飞机 弹孔多在机翼机身', en: 'Returning planes had bullet holes in the wings and body' },
    { zh: '统计学家瓦尔德说 该加固的是**发动机**', en: 'Statistician Abraham Wald said: armor the engines' },
    { zh: '因为打中发动机的 都没回来', en: 'Because the planes hit there never came back' },
    { s: { k: 'funnel', layers: [{ label: '发出去的', tip: '成千上万' }, { label: '被推荐的', tip: '一部分' }, { label: '爆了的', tip: '极少数' }, { label: '被总结成方法的', tip: '你看到的' }], weak: 3 }, zh: '爆款方法论 都是从最窄这层总结的', en: 'Viral formulas are drawn from the narrowest layer' },
    { zh: '上面那些用了也没火的 没人讲', en: 'Nobody talks about everyone above who used it and failed' },
    { zh: '你学的 其实是一份**幸存者名单**', en: 'What you studied was a list of survivors' },
    { s: { k: 'list', head: '换个学法', items: [
      { t: '看爆款 也看**同类扑了的**', d: '对比才看得出差别' },
      { t: '问一句 是方法爆 **还是人爆**', d: '账号底子不一样' },
      { t: '拿回来 **小样本先测**', d: '测过了再当打法' },
    ] }, zh: '第一 看爆款 也去看同类扑了的', en: 'One: study the flops alongside the hits' },
    { zh: '第二 问一句 是方法爆还是人爆', en: 'Two: ask whether the method or the person went viral' },
    { zh: '第三 拿回来先小样本测试', en: 'Three: test it small before you adopt it' },
    { s: { k: 'quote', lines: ['别只看**回来的飞机**', '也问问**没回来的**'], next: '反复出现的力量' }, zh: '别只看回来的飞机 也问问没回来的', en: 'Don\'t just study the planes that returned. Ask about the ones that didn\'t.', d: 5.5 },
  ],
};
