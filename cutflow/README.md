# cutflow · 口播短视频 AI 剪辑工作流

对标「蛋解创业」成片做的一条流水线：**原片 + 素材进，成片出**。人和 AI 只需要改一份 `timeline.json`，
版式、字体、花字动效、调光全部由模板保证一致。设计依据见 [docs/STYLE_SPEC.md](docs/STYLE_SPEC.md)，
AI 排片规则见 [docs/PLAYBOOK.md](docs/PLAYBOOK.md)。

```
原片 raw/host.mp4 ─┐
                   ├─① prep ──→ work/host.mp4（删重录 + 去气口 + 自动调光 + 1080×1920@30）
专名表 terms.json ─┘            work/transcript.json（逐字时间戳）· timeline.json 草稿（全口播）
                                      │
        ② AI 剪辑师（Claude）按 PLAYBOOK：写 subs.txt（断句/纠错/标重点）→ resub 对齐时间
           排场景版式、配 B-roll（客户给的 / 自己找的）、加花字和数据面板 → timeline.json
                                      │
        ③ render --preview（540p 快速预览）→ 人看片提意见 → 改 timeline → 只重渲改动的场景
                                      │
        ④ render ──→ out/final.mp4（1080×1920@30，H.264 + AAC）
```

## 快速开始

```bash
npm run fonts                 # 拉 4 款可商用字体到 fonts/（不进仓库）
pip install faster-whisper "opencv-python-headless<4.11" numpy
# 需要 ffmpeg ≥ 6、Node ≥ 20、playwright + chromium

mkdir -p projects/ep01/raw   # 原片放 raw/host.mp4，素材也放 raw/
node src/prep.js projects/ep01 --beauty 0.3 --model large-v3-turbo
# …AI/人编辑 projects/ep01/subs.txt 与 timeline.json…
node src/resub.js projects/ep01
node src/render.js projects/ep01 --still 12.5      # 某一秒的合成静帧，排版自检
node src/render.js projects/ep01 --preview         # 预览片
node src/render.js projects/ep01                   # 成片
```

## 组件一览（都在 `src/stage/`，纯 HTML/CSS，逐帧确定性渲染）

| 类别 | 名称 | 对标来源 | 说明 |
|---|---|---|---|
| 版式 | `talk` | 三条都有 | 口播全屏，字幕在画面 63% 高度；支持 `zoom` 跳切景别、`push` 缓推 |
| 版式 | `band` | 01 Roadster | 通栏素材 + 上下光条 + 圆形头像压边；`hostPos:"right"` 时头像靠右、左上放章节角标（02） |
| 版式 | `cardTop` | 02 | 上：圆角素材卡；下：带取景角标的主讲人小窗 |
| 版式 | `cardBottom` | 02 / 03 | 上：主讲人小窗；下：金色描边素材卡 |
| 版式 | `data` | 02 / 03 | 深色底 + 圆形头像 + 数据面板：`stat` 数字滚动 / `compare` 对比条 / `steps` 因果链 |
| 字幕 | `subs` | 全部 | 口播全屏用黄油体正体，卡片版式用标题黑斜体；`hl` 关键词变金，`emph` 整行金句 |
| 花字 | `keyword` | 01「反作用姿态控制」 | 逐字砸入 + 扫光 + 下划线 |
| 花字 | `list` | 01「改善使用体验/突破能力边界」 | 分点逐条滑入，新条出现旧条压暗，字幕自动下移让位 |
| 花字 | `label` | 01「碳纤维缠绕压力容器」 | 素材上的红字白边标注，可带副标 |
| 花字 | `chapter` | 02「1 关税 / 2 油价」 | 紫色斜切横幅 + 黄色序号 |
| 花字 | `punch` | 结尾金句 | 书法体砸入 + 暖光闪 + 余震 |
| 装饰 | `rec` | 01 | 取景框 + REC 闪烁 |

## timeline.json

```jsonc
{
  "meta": { "fps": 30, "width": 1080, "height": 1920, "duration": 29.0 },
  "host": { "src": "work/host.mp4", "face": { "cx": 0.5, "cy": 0.33, "w": 0.34, "h": 0.2 } },  // prep 自动填
  "audio": { "bgm": "raw/bgm.mp3", "bgmVolume": 0.12 },                                        // 可选
  "scenes": [            // 必须首尾相接、铺满全片
    { "start": 0, "end": 2.04, "layout": "talk", "push": 0.05 },
    { "start": 2.04, "end": 5.48, "layout": "band", "hostPos": "right", "media": { "src": "raw/broll.mp4", "in": 0.4 } },
    { "start": 22.6, "end": 25.56, "layout": "data", "hostPos": "right",
      "panel": { "type": "stat", "title": "采购额", "from": 0, "to": 48, "unit": "亿美元", "caption": "2024.06 – 2026.02" } }
  ],
  "overlays": [          // 时间上可与场景任意重叠
    { "type": "keyword", "start": 6.0, "end": 8.36, "text": "什么才是创新" },
    { "type": "list", "start": 10.2, "end": 15.6, "items": [ { "at": 10.4, "text": "改善使用体验" }, { "at": 12.5, "text": "突破能力边界", "color": "red" } ] }
  ],
  "subs": [ { "start": 0, "end": 1.28, "text": "好那咱们最后就讨论一个", "hl": ["终极问题"] } ]   // 一般由 resub 生成
}
```

`render.js` 开头会校验（场景不相接、素材缺失、字幕超 16 字等直接报错），所以 AI 写错了不会悄悄出坏片。
完整可跑的例子见 [examples/demo/timeline.json](examples/demo/timeline.json)。

## 重录自动剪（`src/retakes.js`）

录的时候一句话说好几遍、说到一半重来、结巴重说，`prep` 会自动**只留最后一遍**：

- **整句重录 / 半句重来**：按停顿把逐字稿切成气口段，某段文字和后面 4 段内某段的开头相似度 ≥ 0.72，就判定前面是废掉的一遍，连同中间的内容一起删。
- **不停顿的结巴**：同一串 ≥3 个字紧挨着说了两遍，删前一遍。
- 相似度 0.55–0.72 的、只重复 2 个字的（可能是“研究研究”这种正常说法）不自动删，列进“待复核”。
- 结果写在 `work/retakes.json`（每条有时间段、删掉的字、保留的字）。删错了就把那条从 `auto` 里去掉；漏了就把 `suspect` 里的挪进 `auto`，或把时间段写进 `drops.json`，然后重跑 `prep`。`--retakes off` 可整体关闭，`--redetect` 重新检测。
- 约定是“最后一遍最好”。如果某句其实前一遍更好，在 `retakes.json` 里把那条的 `range` 改成后一遍的时间段即可。

## 调光与美颜（`py/grade.py`）

- **以脸为锚**：先检测人脸，把脸部亮度中位数拉到成片水准（0.58，量自三条对标成片的口播镜头），而不是按全画面平均——暗调布景不会被硬拉亮。
- **白平衡**：拿画面里最亮一档的中性高光（白纸/白墙）估色偏，修八成、单通道封顶 ±25~30%。
- **影调**：统一叠轻 S 曲线、饱和 +8%、轻锐化。
- **美颜**：`--beauty 0~1` 只做保边磨皮（双边滤波），**不瘦脸、不改五官**。
- 每次都会出 `work/grade_preview.jpg`（左原片右调后）和 `work/grade.json`（参数可手改后重跑）。
- 边界：混合色温、严重过曝、需要分区域压光/补光的片子，自动档救不了——在达芬奇/剪映里调好再放进 `raw/`，`prep --no-grade` 跳过。

## 性能

4 核 CPU 上成片约 4.4× 实时（29 秒片渲 129 秒），5 分钟片大约 20 多分钟；预览档快约 4 倍。
场景带指纹缓存，改一句花字只重渲那一个场景。

## 已知边界 / 下一步

- 音效（whoosh、叮）还没做成组件；BGM 只有整体压低，没有按人声自动闪避。
- 地图高亮、折线图、关系图谱这类成片里的定制信息图（02、03 用得多）目前只覆盖了 `stat / compare / steps` 三种通用面板，复杂的建议按需加面板类型。
- 素材检索（自己找 B-roll）现在由 AI 剪辑师按 PLAYBOOK 人工完成，没有自动下载器；注意素材版权。
- 口播全屏的画面抖动/闪白这类“镜头级特效”需要在 ffmpeg 侧做，暂未实现。
