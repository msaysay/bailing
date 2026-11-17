import type { Episode } from '../types.ts';

export const v03: Episode = {
  id: 'V03', no: 3, group: '认知篇', mood: 2,
  title: '流程比人长久',
  en: 'Workflows Outlast People',
  beats: [
    { big: true, zh: '企业IP最大的风险 是**会拍的人**走了', en: 'The biggest risk to a company IP: the one who can shoot it leaves' },
    { s: { k: 'title' }, zh: '很多公司的IP 其实是一个人的IP', en: "Many company IPs are really one person's IP" },
    { s: { k: 'curve', pts: [1, 3, 5, 8, 10, 11, 12, 2, 1.5, 2], label: '账号产出', yl: '每月出片', xl: ['第1月', '', '', '', '', '', '', '', '', '第10月'], marks: [{ x: 0.667, label: '他离职了' }], note: '示意图' },
      zh: '一个运营 把账号带了起来', en: 'One staffer builds the account up' },
    { zh: '他一走 风格节奏方法全带走了', en: 'When he leaves the style and method leave too' },
    { zh: '新人只能从零开始摸索', en: 'The newcomer starts again from zero' },
    { s: { k: 'compare', left: '靠人', right: '靠流程', rows: [['方法在他**脑子里**', '方法写成**文档**'], ['换人就断档', '换人**照着跑**'], ['越做越累', '越做**越快**']] },
      zh: '问题不是人不行', en: "The problem isn't the person" },
    { zh: '是方法只存在**一个人**的脑子里', en: "It's that the method lives in one person's head" },
    { s: { k: 'flow', nodes: ['选题', '写稿', '配音', '剪辑', '发布', '复盘'] }, zh: '把每一步写下来 交给AI和工具', en: 'Write down every step and hand it to AI and tools' },
    { zh: '流程跑起来 谁来都能接上', en: 'Once it runs anyone can pick it up' },
    { zh: '新人第一天 就能出片', en: 'A new hire ships a video on day one' },
    { s: { k: 'ring', parts: [{ label: '流程能跑的', v: 70 }, { label: '只有人能做的', v: 30, hot: true }], center: '一条视频', note: '示意图' },
      zh: '流程不是为了不要人', en: "A workflow isn't about removing people" },
    { zh: '是让人只做**最值钱**的那部分', en: "It's about people doing only the most valuable part" },
    { s: { k: 'list', head: '从明天开始', items: [
      { t: '每做完一条 **记一页**', d: '用了什么 改了什么 为什么' },
      { t: '重复三次的事 **写成模板**', d: '下次直接套用' },
      { t: '模板交给 **AI** 去跑', d: '人只看结果' },
    ] }, zh: '第一 每做完一条 记一页', en: 'One: write one page after every video' },
    { zh: '第二 重复三次的事 写成模板', en: 'Two: turn anything done three times into a template' },
    { zh: '第三 模板交给AI 人只看结果', en: 'Three: let AI run the template you check the result' },
    { s: { k: 'quote', lines: ['人会走', '**流程**留下'], next: '后面的80%' }, zh: '人会走 流程留下', en: 'People leave. Workflows stay.', d: 5 },
  ],
};
