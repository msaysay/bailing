import type { Episode } from '../types.ts';

export const v05: Episode = {
  id: 'V05', no: 5, group: '认知篇', mood: 1,
  title: '事为主 人为主',
  en: 'Story-led or Person-led',
  beats: [
    { big: true, zh: '不露脸也能做IP 但你得**先选对路**', en: "You can build an IP without showing your face, if you pick the right road" },
    { s: { k: 'title' }, zh: '做IP有两条路 选错了会很累', en: 'There are two roads. The wrong one wears you out' },
    { s: { k: 'chat', head: '学员提问', msgs: [
      { me: true, who: '学员', t: '我不想露脸 还能做IP吗' },
      { who: '宁少', t: '能 先想清楚一件事：你想让人记住你这个人 还是记住你讲的事' },
    ] }, zh: '很多老板问我同一个问题', en: 'Many owners ask me the same question' },
    { zh: '答案取决于 你想让人记住什么', en: 'It depends on what you want people to remember' },
    { s: { k: 'compare', left: '人为主', right: '事为主', rows: [['你出镜 讲**观点**', '你不出镜 讲**事情**'], ['靠人设攒信任', '靠内容攒信任'], ['口播 访谈 vlog', '图解 录屏 拆案例']] },
      zh: '人为主 是你站到镜头前', en: 'Person-led: you stand in front of the camera' },
    { zh: '事为主 是让**事情**站到镜头前', en: 'Story-led: the story stands there instead' },
    { zh: '图解 录屏 案例拆解都算', en: 'Diagrams, screen recordings, case breakdowns' },
    { s: { k: 'flow', nodes: ['选题', '写稿', '配音', '画面', '发布'] }, zh: '事为主的片子 全程可以不出镜', en: 'A story-led video needs no face at all' },
    { zh: '稿子 配音 画面都能交给AI', en: 'Script, voice and visuals can all go to AI' },
    { zh: '你正在看的这条 就是事为主', en: "The video you're watching is story-led" },
    { s: { k: 'split', a: '露脸', b: '观点', aSub: '不是关键', bSub: '才是关键' }, zh: '但不露脸 不等于没有**你**', en: "But no face doesn't mean no you" },
    { zh: '观点和判断 必须是你自己的', en: 'The views and the judgment must be yours' },
    { s: { k: 'list', head: '怎么选', items: [
      { t: '爱表达 有镜头感', d: '走人为主 口播访谈' },
      { t: '不想露脸 手里事多', d: '走事为主 图解拆解' },
      { t: '**两条一起跑**', d: '事为主打底 人为主建信任' },
    ] }, zh: '爱表达 有镜头感 走人为主', en: 'Love talking on camera: go person-led' },
    { zh: '不想露脸 手里事多 走事为主', en: 'Camera-shy with lots to show: go story-led' },
    { zh: '最稳的是 两条一起跑', en: 'The safest bet: run both' },
    { s: { k: 'quote', lines: ['露不露脸是形式', '**观点**才是你'], next: '第二大脑' }, zh: '露不露脸是形式 观点才是你', en: 'Your face is the format. Your view is you.', d: 5 },
  ],
};
