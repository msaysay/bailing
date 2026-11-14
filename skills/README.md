# 视频生产工作流 · 操作说明

这套工作流有两条线，共用同一个组件库和同一套脚本：

| 线 | 成片 | 画面的底 | 什么时候用 | 步骤 |
|---|---|---|---|---|
| **事为主** | 横屏 1920×1080 | 真实画面垫底，组件压上面，人不出镜 | 内容靠「发生了什么」立住：新闻、财报、事件复盘 | `video-01` 到 `video-08` |
| **人为主** | 竖屏 1080×1920 | 真人口播垫底，人和画面交替 | 内容靠「谁在说」立住：观点、讲解、个人账号 | `talk-01` 到 `talk-04`，中间借用 `video-02`、`video-04`，最后接 `video-08` |

拿到需求先判断走哪条线，拿不准就问用户一句：这条片子，人出不出镜？

每个 Skill 是一步，按顺序执行；每一步都有明确的输入文件、输出文件和放行条件，上一步没放行不进下一步。

适用对象：Claude Code、Codex 等能读文件、跑命令、写代码的 AI 剪辑助手。把整个仓库交给它，让它先读这份说明，再按步骤读对应的 `SKILL.md`。

## 事为主：8 步

| 步 | Skill | 做什么 | 输入 | 输出 | 要人确认 |
|---|---|---|---|---|---|
| 1 | `video-01-script` | 定稿、分段、统计字数 | 想法或初稿 | `script.txt` | ✔ 稿子 |
| 2 | `video-02-factcheck` | 逐条核对事实，列来源表 | `script.txt` | `事实核对.md` | ✔ 有出入的地方 |
| 3 | `video-03-audio` | 识别录音、和稿子对齐、处理响度 | 录音、`script.txt` | `asr.json`、`timing.json`、`voice.wav` | 抽听 |
| 4 | `video-04-footage` | 搜素材、拆镜头、测人脸 | `script.txt`、分段时间 | 原片、`镜头表.txt`、`sources.json`、`faces.json` | 版权判断 |
| 5 | `video-05-storyboard` | 逐段定画面：选组件、定字幕处理、避开人脸 | 以上全部、组件目录 | `规划.md` | ✔ 方向 |
| 6 | `video-06-build` | 写场景代码，先做一段再铺全片 | `规划.md` | `studio/src/episodes/<期>/` | ✔ 第一段 |
| 7 | `video-07-qc` | 渲染、机器自查、逐秒看图、返修 | 工程 | 成片、`qc.json`、联系表 | ✔ 成片 |
| 8 | `video-08-cover` | 封面和发布包 | 成片 | 封面图、标题、简介 | ✔ 发布 |

人只在打勾的六处出面，其余由助手连续推进。

## 人为主：4 步加借用

| 步 | Skill | 做什么 | 输入 | 输出 | 要人确认 |
|---|---|---|---|---|---|
| 1 | `talk-01-shoot` | 定稿，给出镜人拍摄要求 | 想法或初稿 | `script.txt`、口播原片 | ✔ 稿子 |
| — | `video-02-factcheck` | 核对事实（同事为主） | `script.txt` | `事实核对.md` | ✔ 有出入的地方 |
| 2 | `talk-02-roughcut` | 转写、剪口误和停顿、去水印裁切、对齐字幕 | 口播原片、`script.txt` | `person.mp4`、`voice.wav`、`timing.json`、`cuts.json` | 报告剪了哪几句 |
| — | `video-04-footage` | 给「你看」「比如」找证据画面（同事为主） | `script.txt` | 素材片段、`sources.json` | 版权判断 |
| 3 | `talk-03-layout` | 逐行定版式：全屏、小圆头像、卡片、不出现；剪口怎么盖 | 以上全部 | `版式表.md` | ✔ 版式表 |
| 4 | `talk-04-build` | 写代码、先看关键帧、整片渲染、自查 | `版式表.md` | 成片 | ✔ 成片 |
| — | `video-08-cover` | 封面和发布包（竖屏封面） | 成片 | 封面图、标题、简介 | ✔ 发布 |

五种版式和切换规律来自 `docs/对标拆解-小Lin口播.md`；参考实现是 `studio/src/episodes/talk01/`。

### 人为主另外四条规矩
1. **人是底，别让人消失太久**：人脸出镜 80% 以上，纯素材每次不超过几秒。
2. **组件放在下巴以下或头两侧**，小圆头像固定在右上角。
3. **每个剪口都要盖住**：落在人很小的版式里、落在换版式的那一帧，或者硬切景别。
4. **字幕位置全片固定**，不跟着版式跳。

## 目录约定

```
episodes/<期号_选题>/
  01_输入素材/        录音、原片（不进 git）
  03_制作过程/        script.txt、asr.json、规划.md、镜头表.txt、sources.json、事实核对.md
studio/               所有期数共用的 Remotion 工程
  src/kit/            时钟、基础件、实拍层、章节条与字幕、运动函数（motion.ts）、竖屏口播版式引擎（talk.tsx）
  src/components/     组件库（232 个，21 组；目录见 studio/src/gallery/catalog*.tsx）
  src/episodes/<期>/  timing.json、shots.json、faces.json、场景代码、封面
  public/<期>/        配音、音乐、镜头片段（不进 git）
scripts/              asr.py、align.py、roughcut.py（口播粗剪）、talk_check.py（口播版式自查）、tikhub.py（搜索走 TikHub，下载走 yt-dlp 或 TikHub）、faces.py、seg_render.py、qc.py、facecheck.py、build_pack.py
docs/aesthetic-rules.md  制作规则（审美手册），所有步骤都受它约束
docs/对标拆解-小Lin口播.md  人为主那条线的版式依据
```

## 六条不能破的规矩（两条线都适用）

1. **时间只有一个来源**：录音的逐字时间（`timing.json`）。场景里用 `say(段名, 词)` 取时刻，不写秒数。
2. **画面要真**：一半以上时长垫真实画面，同一镜头全片只用一次，素材登记来源。
3. **数据要真**：数字旁标来源；查不到的不标来源，也不编。
4. **画面字不重复口播**：大字只放口播里没有的信息；关键句用强调字幕并隐藏底部字幕。
5. **组件不压人脸**：先测人脸，再挪脸、挪组件或换镜头。
6. **出片前自查**：`qc.py` 和 `facecheck.py` 都通过，并逐秒看过联系表，才给人看。

细则都在 `docs/aesthetic-rules.md`。人提的意见，判断为可复用的，写回这份规则。

## 环境

- Node.js 22、ffmpeg、Python 3.10+
- `cd studio && npm install`
- `pip install sherpa-onnx soundfile numpy opencv-python-headless`
- 识别模型和人脸模型放在 `~/.cache/video-studio/`（下载地址见 `scripts/asr.py`、`scripts/faces.py` 开头）
- 素材搜索需要 TikHub 的 API Token（环境变量 `TIKHUB_TOKEN`）
- 字体：MiSans Regular / Semibold / Heavy 放进 `studio/public/fonts/`
- 无显示器的 Linux 上渲染要加 `--browser-executable=<chrome-headless-shell 路径>`

## 一期大概多久

以 3 分 38 秒的第二期为参考：对齐几分钟，搜素材和拆镜头约 1 小时，写场景约 2 小时，整片首次渲染约 16 分钟（4 核）。之后的修改用分段渲染，改一段约 1 分钟，不整片重渲。人的时间主要花在定稿、看第一段、看成片。

人为主那条线以 77 秒的口播测试为参考：粗剪和对齐几分钟，排版式和写代码约 1 小时，整片渲染约 6 分钟。
