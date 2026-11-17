import type { Episode } from '../types.ts';

export const v02: Episode = {
  id: 'V02', no: 2, group: '认知篇', mood: 1,
  title: '平均值陷阱',
  en: 'The Average Trap',
  beats: [
    { big: true, zh: '用AI写的稿子 为什么和同行**一模一样**', en: 'Why does your AI-written script read exactly like your competitor’s?' },
    { s: { k: 'title' }, zh: '这是AI时代最隐蔽的一个陷阱', en: 'It is the quietest trap of the AI era' },
    { s: { k: 'chat', head: '某茶叶公司 · 写文案', msgs: [
      { me: true, t: '帮我写一条茶叶品牌的短视频文案' },
      { t: '在快节奏的今天 一杯好茶 承载着匠心与温度……' },
      { who: '同行拿到的', t: '在快节奏的今天 一杯好茶 承载着时光与匠心……' },
    ] }, zh: '你让AI写一条品牌文案', en: 'You ask AI for a brand script' },
    { zh: '它给了你一段**匠心与温度**', en: 'It hands you “craftsmanship and warmth”' },
    { zh: '你的同行拿到的 几乎是同一段', en: 'Your competitor gets almost the same paragraph' },
    { s: { k: 'bell', label: 'AI 最可能写出的内容', outlier: '你的独家素材' }, zh: '大模型做的事 是预测**最可能**的下一个词', en: 'A language model predicts the most likely next word' },
    { zh: '大家的提示词又差不多', en: 'And everyone’s prompts look alike' },
    { zh: '结果就全挤到了**平均值**附近', en: 'So every output crowds around the average' },
    { zh: '能跳出这条曲线的 只有一样东西', en: 'Only one thing can break out of that curve' },
    { s: { k: 'compare', left: '改提示词', right: '喂素材', rows: [['换个语气', '客户的**原话**'], ['加点情绪', '你踩过的**坑**'], ['多写几版', '你的**一线数据**']] }, zh: '多数人的解法是 不停地改提示词', en: 'Most people keep rewriting the prompt' },
    { zh: '可提示词改的只是**语气**', en: 'But a prompt only changes the tone' },
    { zh: '素材改的才是**内容**', en: 'Material changes the substance' },
    { s: { k: 'hub', center: '你的素材库', spokes: ['客户原话', '踩坑记录', '一线数据', '老板观点', '行业黑话', '真实案例'] }, zh: '这些东西 AI从来没见过', en: 'AI has never seen any of this' },
    { zh: '同行也拿不走', en: 'And no competitor can take it' },
    { zh: '把它们喂进去 写出来的才只能是**你**', en: 'Feed it in and the result can only be you' },
    { s: { k: 'list', head: '今天就能做的三件事', items: [
      { t: '建一个**素材库**', d: '客户聊天 · 会议纪要 · 现场照片' },
      { t: '先喂素材 **再提要求**', d: '顺序别反过来' },
      { t: '出稿后问一句', d: '这句话 同行能不能原样照搬' },
    ] }, zh: '第一 建一个自己的素材库', en: 'One: build your own material library' },
    { zh: '第二 写稿前先喂素材 再提要求', en: 'Two: feed the material first then give the brief' },
    { zh: '第三 每句话都问 同行能不能照搬', en: 'Three: ask if a competitor could copy each line' },
    { s: { k: 'quote', lines: ['AI 都一样', '**你的素材**不一样'], next: '提示词就是工作说明书' }, zh: 'AI都一样 你的素材不一样', en: 'Every AI is the same. Your material is not.', d: 5 },
  ],
};
