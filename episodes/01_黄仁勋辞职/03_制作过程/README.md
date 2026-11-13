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

## 第二版（对标 Fred《400万播放的财经视频，全是AI剪的》的做法）

```bash
scripts/tikhub.py search "黄仁勋 采访" --landscape --sort 1      # 仓库根目录下；搜抖音横屏素材
scripts/tikhub.py get <作品ID> --out episodes/01_黄仁勋辞职/01_输入素材/douyin --name <别名>
bash tools/prep_footage.sh                                       # 按镜头表截取、裁台标、放慢、转码
cd remotion && npm run render
python3 ../../../../scripts/qc.py out/<成片>.mp4                   # 出片前自查
```

- 14 个真实镜头垫在组件后面，每个只用一次；镜头表在 `tools/prep_footage.sh`，镜头与口播的对应在 `remotion/src/shots.json`（时间写成段号或字幕行号，不写秒数）。
- 素材来源登记在 `sources.json`。**素材来自抖音上央视新闻《面对面》专访和一条硅谷航拍，是平台公开内容，没有取得授权**，能不能发布由你判断。
- 每个数字旁有来源标签；盘中最低点、分时走势、人物照片标「未取得」。
- 自查结果：黑场、闪帧、亮度突变、画面停滞均无，响度 −17.1 LUFS，机器检查通过；每秒联系表已逐张看过。
- 已知瑕疵：航拍镜头里有原视频自带的一行中文字幕没裁干净；专访画面裁切放大后偏软。

## 这一期没按 FredTalk 2.5 完整流程走的地方

- 没有用它的 Manifest、组件检索和门禁脚本；九段画面是按它的做法（时间只取自录音、底层值集中在 kit、每段一个文件）自己写的。
- 没有用它的组件库。原计划第②④段用「原文聚焦」组件打英伟达公告原文，但美国证监会网站拒绝未声明身份的自动访问，没拿到截图。
- 语音识别用的是 sherpa-onnx 的 SenseVoice 模型（本机 CPU），不是它的千问云端识别。

## 待处理

- 录音里两处与事实或原稿有出入，见 `逐字稿.md` 末尾「录音与稿子的差异」。
- 没有背景音乐和音效。
