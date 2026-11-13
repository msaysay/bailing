# 视频生产工作流 · 操作说明

这套工作流把「一段口播稿 + 一条录音」做成一条带真实画面、信息组件、字幕、音乐的横屏成片。它由 8 个 Skill 组成，每个 Skill 是一步，按顺序执行；每一步都有明确的输入文件、输出文件和放行条件，上一步没放行不进下一步。

适用对象：Claude Code、Codex 等能读文件、跑命令、写代码的 AI 剪辑助手。把整个仓库交给它，让它先读这份说明，再按步骤读对应的 `SKILL.md`。

## 总览

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

## 目录约定

```
episodes/<期号_选题>/
  01_输入素材/        录音、原片（不进 git）
  03_制作过程/        script.txt、asr.json、规划.md、镜头表.txt、sources.json、事实核对.md
studio/               所有期数共用的 Remotion 工程
  src/kit/            时钟、基础件、实拍层、章节条与字幕
  src/components/     组件库（37 个，目录见 studio/src/gallery/catalog.tsx）
  src/episodes/<期>/  timing.json、shots.json、faces.json、场景代码、封面
  public/<期>/        配音、音乐、镜头片段（不进 git）
scripts/              asr.py、align.py、tikhub.py、faces.py、seg_render.py、qc.py、facecheck.py、build_pack.py
docs/aesthetic-rules.md  制作规则（审美手册），所有步骤都受它约束
```

## 六条不能破的规矩

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
