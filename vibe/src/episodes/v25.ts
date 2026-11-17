import type { Episode } from '../types.ts';

export const v25: Episode = {
  id: 'V25', no: 25, group: '方法篇', mood: 4,
  title: '凭什么听你',
  en: 'Why Should They Listen?',
  beats: [
    { big: true, zh: '你讲得再对 观众心里只有三个字 **凭什么**', en: 'However right you are, the viewer is thinking: says who?' },
    { s: { k: 'title' }, zh: '这就是信任状要解决的问题', en: 'That is the problem credentials solve' },
    { s: { k: 'hub', center: '信任状', spokes: ['做过的项目', '服务过的客户', '真实数据', '行业年限', '现场画面', '第三方认可'] }, zh: '信任状 就是你有资格讲这件事的证明', en: 'Credentials prove you have the right to speak' },
    { zh: '它可以是你做过的事', en: 'It can be something you\'ve done' },
    { zh: '也可以是你拿到的结果', en: 'Or a result you\'ve achieved' },
    { s: { k: 'compare', left: '空口观点', right: '带信任状', rows: [['AI能提效', '我们的**剪辑**交给了AI'], ['内容很重要', '这是我们的**后台数据**'], ['IP要长期做', '我在这行**十年**']] }, zh: '同样一句话', en: 'The same statement' },
    { zh: '后面跟一个证明 分量完全不同', en: 'Backed by proof, it carries a different weight' },
    { s: { k: 'stairs', head: '信任状的三个强度', items: [{ label: '我觉得', v: '弱' }, { label: '我做过', v: '中' }, { label: '你亲眼看', v: '强' }] }, zh: '我觉得 最弱', en: '"I think" is the weakest' },
    { zh: '我做过 好一些', en: '"I\'ve done it" is better' },
    { zh: '让他**亲眼看到** 最强', en: 'Letting them see it themselves is strongest' },
    { s: { k: 'flow', nodes: ['钩子', '信任状', '内容', '口令'], sub: ['3秒', '15秒内', '主体', '结尾'] }, zh: '位置也有讲究 钩子之后 内容之前', en: 'Placement matters: after the hook, before the content' },
    { zh: '放晚了 人已经走了', en: 'Put it too late and they\'re already gone' },
    { s: { k: 'list', head: '找到你的信任状', items: [
      { t: '翻出你**做过的项目和结果**', d: '越具体越好' },
      { t: '能拍画面的 **别口述**', d: '截图 · 录屏 · 现场' },
      { t: '压成**一句话** 放进前15秒', d: '不超过十个字' },
    ] }, zh: '第一 翻出你做过的项目和结果', en: 'One: dig out your projects and results' },
    { zh: '第二 能拍画面的 就别口述', en: 'Two: if you can show it, don\'t just say it' },
    { zh: '第三 压成一句话 放进前15秒', en: 'Three: compress it to one line in the first 15 seconds' },
    { s: { k: 'quote', lines: ['先回答**凭什么**', '再讲**是什么**'], next: '画面就是证据' }, zh: '先回答凭什么 再讲是什么', en: 'Answer "says who" before "what".', d: 5 },
  ],
};
