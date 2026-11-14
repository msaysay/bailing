// 站点配置：上线前改这里。
window.SITE_CONFIG = {
  // 自有部分的许可。仓库根目录目前没有 LICENSE 文件，定下来之后把这句改成实际的许可名。
  ownLicense: '许可：以仓库根目录的 LICENSE 为准。',
  // 首屏组件墙：三行，每行若干组件编号（见组件库里的编号）。
  wall: [
    ['E11', 'B07', 'D05', 'E17', 'B10', 'X14', 'E09', 'B18'],
    ['E03', 'B06', 'E18', 'D07', 'B44', 'E07', 'B22', 'D06'],
    ['B12', 'E08', 'B46', 'E16', 'B36', 'D11', 'E25', 'B29'],
  ],
  // 作品。视频放在 assets/videos/ 下。
  works: [
    { title: '181 个口播组件，我全部开源', note: '实拍口播 78 秒 · 剪掉一处口吃 · 开场是组件炫技片', src: 'assets/videos/kaiyuan.mp4', poster: 'assets/videos/talk03-cover.jpg' },
    { title: '自己拆自己：一条 AI 视频是怎么做出来的', note: '实拍口播 89 秒 · 一刀没剪 · 五张章节标题页', src: 'assets/videos/zichai.mp4', poster: 'assets/videos/talk02-cover.jpg' },
    { title: '组件炫技片', note: '21 个组件，三行同时演示 · 17 秒 · 无声', src: 'assets/videos/showreel.mp4', poster: '' },
  ],
  // 第三方代码：名称、来源、许可、用途、是否仅限非商用。
  third: [
    ['FredTalk', 'njrhts2kvv-star/FredTalk', 'MIT（仅覆盖原创部分）', '口播成片管线、组件目录', false],
    ['video-shotcraft', 'Vincentwei1021/video-shotcraft', 'Apache-2.0', '镜头配方卡、审美准则', false],
    ['video-talkcraft', 'Vincentwei1021/video-talkcraft', 'PolyForm Noncommercial 1.0.0', '108 张口播动效卡', true],
    ['remocn', 'Remocn/remocn', 'MIT', 'Remotion 组件源码', false],
    ['snapcn', 'shadcn-labs/snapcn', 'MIT', '产品演示组件', false],
    ['remotion-bits', 'av/remotion-bits', 'MIT', '计数器、打字机等基础件', false],
    ['superpowers · brainstorming', 'obra/superpowers', 'MIT', '动手前的创意澄清', false],
    ['humanizer-zh', '基于 blader/humanizer', 'MIT', '文案去模板腔', false],
  ],
};
