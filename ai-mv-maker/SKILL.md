---
name: ai-mv-maker
description: 把一首歌（Suno 等 AI 生成的、或自己的歌）做成竖屏 MV：自动听写歌词和逐字时间、按歌词写分镜、用代码一帧帧画出画面（剪影插画 / 霓虹城市 / AI 生图动起来三种画风）、渲染出片、做封面和发布文案。用户说「把这首歌做成 MV」「给歌配画面」「做个音乐视频」「歌词视频」「继续做 MV」时使用。
---

# AI 做 MV · 给 AI 助手的操作说明

你（AI 助手：WorkBuddy、Claude Code、Codex、Cursor 等）负责全部技术活；用户只需要给一首歌，然后在 **4 个地方** 看一眼、说「可以」或提意见：

1. 校对好的歌词　2. 分镜表　3. 第一批测试图　4. 成片

**和用户说话的规矩**：用大白话，不讲术语；一次只要一样东西；每次停下来，最后一句都是「下一步需要你给我：……」或「请你看一下……，可以吗？」。

参考成片：《早早晚晚》，3 分 37 秒，19 个场景，约 6500 帧，没用任何视频生成模型（`examples/zaozaowanwan/`）。

---

## 第 0 步 · 查环境（每台电脑第一次做）

在本文件夹里运行：

```bash
node tools/doctor.js --fix
```

它会自动装 npm 依赖、ffmpeg、浏览器、Python 依赖（下载失败会自动换国内镜像）。剩下装不了的，它会一项项说怎么办，**一次只转告用户一项**，等用户说「好了」再跑一次 `node tools/doctor.js`。

- 没有 Node.js：让用户到 https://nodejs.org/zh-cn 装 LTS 版。
- 没有 Python：让用户装 Python 3.11 或 3.12（Windows 安装时勾选「Add python.exe to PATH」）。
- 浏览器：Windows 自带的 Edge 就能用，一般不用另外装。

**Python 装不上也能做**：跳过听写，第 2 步改用「剪映导出歌词」的办法，但节拍和响度数据需要 Python，那就让用户先把 Python 装好。

## 第 1 步 · 建项目、拿到歌

先问用户：**歌在哪？**（mp3 / wav 文件）。还没有歌就看 `reference/Suno做歌.md` 带他做一首。

```bash
node tools/new-project.js 歌名 "歌曲文件的完整路径"
```

项目建在 `projects/歌名/`。之后所有命令都带这个文件夹路径。

## 第 2 步 · 听歌：歌词和逐字时间（✔ 用户确认歌词）

```bash
python tools/prep_audio.py transcribe projects/歌名
```

（Mac 上用 `python3`。第一次会下载约 3GB 的听写模型；电脑慢可以加 `--model medium`。）

输出 `lyrics_draft.txt`，每行「开始秒-结束秒 歌词」。**你要自己先校对一遍**：

- 伴奏会让听写出错同音字（「叮咛」听成「定义」、「鼓点」听成「古典」），按上下文改。
- 删掉「作词 作曲 编曲」「字幕志愿者」这类前奏里的幻听行。
- 一行太长（超过 14 个字）就在中间加一个空格，画面上会分两行。
- 拿不准的字列给用户问。最好请用户把原歌词（Suno 里的歌词）发给你对照。

**最容易出错的地方：第一句从哪开始。** 取第一行真实歌词的开始时间，不要凭感觉判断前奏多长。《早早晚晚》第一版就把前四句当前奏切掉了。

把校对好的歌词给用户确认。确认后：

```bash
python tools/prep_audio.py build projects/歌名
```

它生成 `data.js`（歌词时间、鼓点、响度），`分场建议.txt`（按歌词和节拍预分好的场，标了每段能量高低），并告诉你 `config.js` 里 `start`、`end` 填多少。**把 start、end、title、bigLine 填进 `config.js`。**

> 听写跑不了时：让用户在剪映里导入这首歌 →「文本」→「识别歌词」→ 导出 SRT 字幕，然后
> `python tools/prep_audio.py import projects/歌名 歌词.srt`，再 `build`。

## 第 3 步 · 选画风、写分镜表（✔ 用户确认分镜）

先问用户一个问题：**想要什么感觉？** 给三个选项（详见 `reference/画风选择.md`）：

| 画风 | 适合 | 用户要给什么 |
|---|---|---|
| **剪影插画**（silhouette） | 温暖、回忆、成长、家人、民谣、抒情 | 什么都不用给 |
| **霓虹城市**（neon） | 都市、失眠、思念、电子、说唱、快歌 | 什么都不用给 |
| **AI 生图动起来**（image-layers） | 想要最精致、最像电影的画面；有具体场景（古风、校园、海边） | 每场一张 AI 生成的竖图（即梦、豆包、可灵、Midjourney 都行） |

三种可以混用（比如主歌剪影、副歌换 AI 生图）。效果最好的组合：**主体用 AI 生图，转场和桥段用代码画面**；完全不想生图就用剪影插画。

然后打开 `分场建议.txt`，写分镜表 `projects/歌名/分镜表.md`，每场一行：开始秒、歌词、画面、转场、歌词样式。写法规则在 `reference/分镜规则.md`，**必须读**。最重要的五条：

1. **画面讲故事，不翻译歌词**。「戒指戴上了手」→ 戒指绕着月亮画出一圈，而不是一只手。
2. **一个主角贯穿全片**（同一个背包剪影 / 同一件衣服），观众靠它认人。
3. **颜色跟着情绪走**：主歌冷、副歌暖；桥段换一种画风（水墨、霓虹）制造惊喜。
4. **副歌要有大场面**：大落日、云海山顶、满天星、城市全景；副歌标题句用大号毛笔字砸出来（`bigLine`）。
5. **结尾回到开头的意象**，给一个往前走的背影。

选了 AI 生图的：按 `reference/AI生图提示词.md` 给每一场写好提示词（统一的风格词 + 统一的主角描述），**和分镜表一起给用户**，请他生成后按场景编号命名放进 `projects/歌名/assets/`（如 `01.jpg`、`02.jpg`）。

## 第 4 步 · 写场景代码，出测试图（✔ 用户确认第一批测试图）

在 `projects/歌名/scenes.js` 里写：上面是场景函数，下面是 `SCENES` 场景表。模板里有说明和一个示例场景。

三种写法：

```js
// ① 用现成的画风工厂（换歌不用改时间）
const sStreet = neonStreet({ signs: ['未眠', '旧梦', '24H'] });
const sRoad = synthRoad({});
// ② AI 生图动起来：一张图 + 运镜 + 粒子 + 漏光
const s01 = imageScene('assets/01.jpg', 'push', 'petals', { leak: .3 });
const s02 = layerScene({ layers: [{ src: 'assets/02.jpg' }, { src: 'assets/02_前景.png', depth: 1 }], move: 'left', particles: 'fireflies', glowAt: [540, 900] });
// ③ 自己用画画函数写（剪影插画风，参考 styles/silhouette/scenes.js）
function sHill(ctx, T, A, t, u) { sky(ctx, [...]); sun(...); ridge(...); figure(...); }

const SCENES = [
  { a: 16.2, f: s01, ly: 1450, lyric: 'minimal' },
  { a: 28.5, f: sHill, ly: 520, x: 1 },
  { a: 58.7, f: sStreet, ly: 380, fx: 'white' },   // 副歌：白闪进
];
```

画画函数清单在 `reference/画画函数速查.md`；三种画风的完整例子在 `styles/*/scenes.js` 和 `examples/zaozaowanwan/`。

出测试图（每场 2 张，拼成一张联系表）：

```bash
node tools/preview.js projects/歌名
```

**你必须先自己看 `out/预览_场景总览.jpg`，按 `reference/自查清单.md` 逐条查，改好再给用户看。** 常见问题：歌词压在人物/太阳上（调 `ly`）；主角太小（竖屏里至少 150 像素高）；树和房子被画面边缘切掉；亮画面上白字看不清（换 `lyric: 'minimal'` 或压暗天空）。

只想看某几秒：`node tools/preview.js projects/歌名 20 35.5 60`

## 第 5 步 · 草稿 → 成片（✔ 用户确认成片）

先出草稿（540×960、15 帧，快 4 倍），给用户看整体节奏：

```bash
node tools/render.js projects/歌名 --draft
```

用户点头后出正式版（1080×1920、30 帧；4 核电脑 3 分半的歌约 15–25 分钟）：

```bash
node tools/render.js projects/歌名
```

成品在 `projects/歌名/out/MV.mp4`。只改了某一段：`--from 60 --to 80` 只渲那一段给用户看，确认后再整片重渲。

## 第 6 步 · 封面和发布文案

```bash
node tools/cover.js projects/歌名 127.5 "致每一个赶路的人"
```

取最有冲击力的那一秒（大落日、剪影奔跑、霓虹全景），不带歌词，出抖音 9:16 和视频号/小红书 3:4 两张。**副标题选暖的、给人力量的那句**，别选丧的。

发布文案按 `reference/发布文案.md`：抖音、视频号、小红书各写一版（标题、正文、话题、置顶评论）。

---

## 不要做

- 不要用 AI 视频生成模型去「补」画面：风格会对不上。
- 不要照搬某个现有电影、动画、游戏的角色和画面；AI 生图提示词里也不要写具体作品名和画师名。
- 不要编造歌词；听不清的字问用户。
- 不要跳过自查直接把测试图给用户。

## 文件在哪

```
SKILL.md                 本说明（给 AI 看）
给学员看-先读我.md        给人看的安装和使用说明
engine/                  画面引擎：lib.js 画画函数、fx.js 特效和生图动起来、lyrics.js 歌词样式、player.js 合成
styles/                  画风包：silhouette 剪影插画、neon 霓虹城市、image-layers AI 生图
tools/                   doctor 自检、new-project 建项目、prep_audio 听歌、preview 测试图、render 出片、cover 封面
templates/project/       新项目模板（config.js、scenes.js）
examples/zaozaowanwan/   完整示例《早早晚晚》（不含歌）
reference/               分镜规则、画风选择、AI 生图提示词、Suno 做歌、自查清单、发布文案、画画函数速查
projects/                学员自己的项目都放这里
```
