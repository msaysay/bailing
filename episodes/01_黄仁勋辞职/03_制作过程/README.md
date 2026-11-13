# 01 黄仁勋辞职 · 制作过程

横屏 1920×1080，30fps，97.7 秒。第一条试做片。

## 重做步骤

在本目录下：

```bash
python3 tools/build_timing.py "../01_输入素材/录音-原始.mp3"
```

生成 `remotion/public/voice.wav`（剪掉片头静音和一处重说、提响度）和 `remotion/src/timing.json`（全片唯一时间源）。字幕行与识别原文的对应关系在 `lines.json`，逐字时间在 `asr.json`。

```bash
cd remotion && npm install && npm run render
```

渲染前把 MiSans 的 Regular、Semibold、Heavy 三个 otf 放进 `remotion/public/fonts/`（来自 FredTalk 仓库 `library/fonts/`，许可见同目录 `MiSans-License.txt`）。云端机器需加 `--browser-executable` 指向 chrome-headless-shell。

录音、字体文件、成片不进 git。

## 这一期没按 FredTalk 2.5 完整流程走的地方

- 没有用它的 Manifest、组件检索和门禁脚本；九段画面是按它的做法（时间只取自录音、底层值集中在 kit、每段一个文件）自己写的。
- 没有用它的组件库。原计划第②④段用「原文聚焦」组件打英伟达公告原文，但美国证监会网站拒绝未声明身份的自动访问，没拿到截图。
- 语音识别用的是 sherpa-onnx 的 SenseVoice 模型（本机 CPU），不是它的千问云端识别。

## 待处理

- 录音里两处与事实或原稿有出入，见 `逐字稿.md` 末尾「录音与稿子的差异」。
- 响度约 −20 LUFS，偏小，正式版要再提。
- 没有背景音乐和音效。
