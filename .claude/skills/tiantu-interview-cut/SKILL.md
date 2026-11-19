---
name: tiantu-interview-cut
description: 把访谈/口播原片自动剪成「天图通逊」风格的 9:16 竖版短视频成片（约 60 秒：口播主线 + 满屏空镜 B-roll + 鸿蒙粗体字幕与关键词放大 + 宋体小标题 + 左上角 logo + 品牌片尾）。当用户给出口播/访谈原片要求“按成片/按 SOP 剪”“做天图通逊口播视频”“自动剪辑访谈短视频”时使用；素材不足时通过 TikHub 搜抖音素材或生成关键帧补 B-roll。
---

# 天图通逊 · 访谈口播短视频自动剪辑

目标只有一个：**交付物看起来必须和参考成片是同一个剪辑师剪的。**
参考成片的画面在 `assets/reference/`（开工前必须用 Read 看 `ref_sheet_1~5.jpg` 和 `ref_closeup_1~2.jpg`），
逐镜头拆解在 `references/reference-film.md`，所有数值规范在 `references/style-spec.md`。

你（AI）只负责**剪辑决策**；所有样式（字体、字号、位置、阴影、logo、片尾排版、响度）都写死在脚本里，
**不要改脚本里的样式常量，也不要自己写 ffmpeg 叠字**。

## 输入

| 项 | 必须 | 说明 |
|---|---|---|
| 原片 A-roll | 是 | 访谈/口播视频，1 个或多个机位，横竖均可 |
| B-roll 素材 | 否 | 用户的仓库/码头/车队/办公等实拍；没有或不够 → 第 4 步自己找 |
| 片尾画面 | 否 | “好看的人物片段”4–5 秒；没有则从原片/B-roll 选一段人物或品牌画面 |
| BGM | 否 | 用户给了就用；没给就用 `bgm_match.py` 从免版税曲库匹配 3 首出 A/B/C 版让用户选 |
| 人物姓名/头衔 | 否 | 有则加人物介绍条 |
| 瑞意宋字体文件 | 否 | 剪映字体，不能再分发；用户给了就存成 `assets/fonts/title.ttf`，否则自动用思源宋体 Light |

缺原片就停下来要原片；其他缺项按上表自行兜底，不要为此停下来问。

## 流程（按顺序，每步都有脚本）

工作目录约定：`proj/raw/`（原片）`proj/broll/` `proj/bgm/` `proj/work/` `proj/out/`，`plan.json` 放 `proj/`。下文 `$K` = 本 skill 目录。

**0. 环境** `bash $K/scripts/setup.sh`（装依赖、下字体；缺 logo 会提示）。

**1. 看原片** 
`python3 $K/scripts/sheet.py raw/a.mp4 --fps 0.2` 然后 Read 生成的图：确认人物位置、是否有穿帮/黑角、有几个机位。
`python3 $K/scripts/probe_aroll.py raw/a.mp4` 得到 `focus_x/focus_y/zoom/tight_zoom`（检测不到人脸时按图目测人脸中心）。
多机位：`python3 $K/scripts/sync_offset.py raw/main.mp4 raw/camB.mp4` 得到 offset。

**2. 转写** `python3 $K/scripts/transcribe.py raw/a.mp4 -o work/transcript.json --prompt "品牌名、产品名、地名、行业词…"`
（专有名词一定写进 `--prompt`，否则同音字错很多）。

**3. 纸面剪辑（最重要的一步）**
`python3 $K/scripts/draft_script.py work/transcript.json -o work/script.txt`，然后**编辑 `work/script.txt`**：

```
ASR原文 | 字幕文本 | 关键词,关键词
```

- 一行 = 一句字幕 = 一个剪辑单元。**删行=剪掉；调行序=重排；相邻行之间挪字=改断句；`[ ]` 括起来的字=句内剪掉**（口吃、重复、语气词，如 `我[我我]们这个[这个]渠道`）。第一列必须保留 ASR 听到的原字（用来对时间），错别字在第二列改。
- **口吃、重复、语气词、长停顿必须剪干净**：文字里看得见的已自动标 `[ ]`，你要复核并补标；转写没写出来的由下一条命令按声音自动找。细则见 `references/audio-cleanup.md`。
- 选段原则见 `references/editing-rules.md`：开头 1 秒内给钩子（品牌/产品名或最抓人的结论）、砍掉口水话重复和跑题、成片口播 45–90 秒、结尾落在一句有记忆点的话上。
- 断句：每行 ≤12 字，按语义断，不留标点；数字用阿拉伯数字（“10天或11天船期”）。
- 关键词：约一半的行标 1 个关键词（2–5 字，名词/数字/结论，如 `提货` `20条柜` `真的快`），不要每行都标。

`python3 $K/scripts/cues_from_script.py work/transcript.json work/script.txt -o work/cues.json` → 自动剪掉口吃/起头重说/语气词/长停顿和气口，得到剪紧后的 cues，并把结果**复听校验**一遍。
逐行读它的日志：`✂ 口吃/重复…` 是已剪的；`? 疑似…` 和 `verify` 里的“少了/多了”要你处理（改 script.txt 重跑），**verify 干净才能往下走**。
cue 列表里 `✂` = 硬剪口（画面必须换镜头或盖 B-roll），`·` = 只抽掉了停顿/口吃的微跳剪（不用管），`〃` = 同一句字幕的后半段。

**4. 备 B-roll**（规范见 `references/broll-sourcing.md`）
先把每个要盖素材的句子列成“说到什么 → 画面要什么”。来源优先级：
1. 用户素材：`sheet.py` 逐个看，记下可用时间段。
2. TikHub 搜抖音：`python3 $K/scripts/tikhub_broll.py "集装箱码头 航拍" -n 3 -o broll --max-dur 60`（会下载、出缩略图、记 `broll/manifest.json`）。**每个下载的片段都必须 Read 它的 `_sheet.jpg`**：有字幕/贴纸/大水印/人脸特写/画质差的一律不用。
3. 仍缺的画面：用你可用的生图能力按 `broll-sourcing.md` 的提示词模板生成 9:16 关键帧，再 `python3 $K/scripts/still_to_clip.py key.png -o broll/x.mp4 --dur 4 --move push` 变成缓推镜头（有图生视频能力更好）。没有生图能力就用原片换景别顶上，并在交付说明里写明。

**4b. 配乐** 用户没给曲子时：`python3 $K/scripts/bgm_match.py -o bgm --mood light -n 3`（情绪按内容选，见 `references/audio-cleanup.md`），把第一名写进 plan 的 `bgm`。

**5. 写 `plan.json`**（字段见 `references/plan-schema.md`，完整样例 `examples/plan.reference-rebuild.json`）
把 `work/cues.json` 放进 `cues`，再写 `shots`（每个镜头覆盖一段连续的 cue）、`titles`、`ending`、`bgm`、可选 `person`。
写的时候随时 `python3 $K/scripts/timeline.py plan.json` 看每句落在第几秒、被哪个镜头/标题覆盖。

**6. 质检 → 渲染 → 复检**
```
python3 $K/scripts/qc.py plan.json                 # 必须 0 ERROR；WARN 逐条处理或说明理由
python3 $K/scripts/render.py plan.json -o out/final.mp4 --draft   # 快速小样，可省
python3 $K/scripts/render.py plan.json -o out/final.mp4
python3 $K/scripts/qc.py plan.json out/final.mp4   # 验文件 + 生成 out/final_review_*.jpg、final_still*.jpg
```
**必须 Read 复检图**并与 `assets/reference/` 对照，逐条过 `references/style-spec.md` 末尾的交片清单。发现问题改 `script.txt`/`plan.json` 重渲，不要带病交付。
人声降噪是自动的（渲染日志 `voice: SNR … -> denoise …`）；原片自带音乐时在 plan 里设 `"audio": {"denoise": "off"}`。

**6b. 出配乐备选**（几秒一个，不重渲画面）
```
python3 $K/scripts/swap_bgm.py plan.json out/final.mp4 --all bgm/candidates.json   # final_A/_B/_C
python3 $K/scripts/swap_bgm.py plan.json out/final.mp4 --none                      # 无配乐版
```

**7. 交付** `out/final.mp4`（默认配乐）+ `final_A/B/C.mp4`（配乐备选）+ `final_nobgm.mp4` + 一段说明：
各版本的曲名和 `bgm/CREDITS.txt` 里的署名文字（CC BY，发布时须写进简介，或换成用户自己的曲子——给我曲子即可用 `swap_bgm.py --bgm` 替换）；剪掉了多少秒停顿/几处口吃、有无没把握的地方；降噪档位；用了哪些第三方素材（`broll/manifest.json`，需授权或替换）；哪些画面是 AI 生成；是否缺瑞意宋；QC 遗留的 WARN 及理由。

## 不可违反的硬约束

1. 1080×1920、30fps；分镜**铺满全屏**，不留黑边、不做画中画、不做上下分屏。
2. 所有文字**纯白 + 阴影，无描边、无底色条、无彩色字**；动画只有渐显/渐隐，常规字幕硬切。无花字、无贴纸、无音效、无综艺转场（镜头之间全部硬切）。
3. 常规字幕单行居中，位置固定在画面 72% 高度；关键词只放大不变色。
4. logo 全程在左上角。
5. 第一个镜头是人物出镜 + 钩子小标题；最后是 4–5 秒品牌片尾（「天图通逊 / 为客户竭尽全力」）。
6. 口播单镜头 >3 秒要缓推（脚本自动）；任何镜头不超过约 4 秒不变（口播最长 6.5 秒）；B-roll 占口播时长 35–65%。
7. 嘴型永远对声音：A-roll 画面只能来自与声音同一时间点的原片（脚本保证，别绕过）。
8. 不编造人物没说过的话：字幕第二列只改错别字和数字写法，不改意思。
9. 口播里不留口吃、重复、语气词和超过约 0.3 秒的停顿；`cues_from_script.py` 的 verify 必须干净。

## 文件索引

- `references/style-spec.md` 样式数值 + 交片检查清单（SOP 与成片实测的合并版）
- `references/reference-film.md` 参考成片逐镜头拆解（节奏、景别、B-roll 对词关系）
- `references/editing-rules.md` 选段、断句、关键词、小标题、镜头编排的决策规则
- `references/plan-schema.md` plan.json 字段
- `references/broll-sourcing.md` TikHub 找素材、关键帧生成、素材筛选标准
- `references/audio-cleanup.md` 剪口吃/气口、降噪、配乐匹配与替换
- `scripts/` 见上；`examples/` 用参考成片反向重建的 script 与 plan
