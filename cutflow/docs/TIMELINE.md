# timeline.json 字段手册

时间单位都是秒，指**剪后**时间轴（`work/host.mp4` 的时间）。坐标是 1080×1920 设计稿像素。

```jsonc
{
  "meta":  { "fps": 30, "width": 1080, "height": 1920, "duration": 30.8, "cuts": [2.333, 6.0] },   // prep 生成，别手改 cuts
  "host":  { "src": "work/host.mp4", "face": { "cx": 0.5, "cy": 0.33, "w": 0.34, "h": 0.2 } },     // 脸的位置（0–1），prep 自动测
  "audio": { "sfx": true, "sfxVolume": 1, "bgm": "raw/bgm.mp3", "bgmVolume": 0.16 },
  "scenes":   [ … ],   // 首尾相接铺满全片
  "overlays": [ … ],   // 花字贴片，时间随意
  "subs":     [ … ]    // 一般由 resub 生成
}
```

## scenes · 版式

| layout | 画面 | 必填 | 可选 |
|---|---|---|---|
| `talk` | 口播全屏 | — | `zoom`（1–1.3，景别）、`push`（0.03–0.06，全程缓推） |
| `band` | 通栏素材 + 圆头像压在素材上沿 | `media` | `hostPos:"right"`（头像靠右，左上留给章节角标） |
| `cardTop` | 上：圆角素材卡；下：主讲人小窗 | `media` | — |
| `cardBottom` | 上：主讲人小窗；下：金边素材卡 | `media` | — |
| `data` | 深色底 + 圆头像 + 数据面板 | `panel` | `hostPos:"right"` |

`media`: `{ "src": "raw/x.mp4 或 .jpg/.png", "in": 起始秒, "zoom": 缓推幅度（默认视频 0.03、图片 0.07，0 关闭） }`。素材会被等比放大裁满窗口；视频不够长会定格最后一帧。

同一版式连续几个场景只换 `media`，就是“同一版式里换画面”（只做一个快闪，不重播入场）。

## panel · 数据面板（只在 `data` 版式里）

`at` 都是相对场景开始的秒数。

| type | 字段 | 例 |
|---|---|---|
| `stat` 大数字滚动 | `title` `to` `from`(0) `unit` `prefix` `decimals` `caption` `at` `dur` | `{"type":"stat","title":"Megaspeed 采购额","to":48,"unit":"亿美元","caption":"2024.06 – 2026.02"}` |
| `compare` 对比条 | `title` `rows:[{label,value,unit,color(gold/red/blue/gray),decimals,at}]` | `{"type":"compare","title":"参议院席位","rows":[{"label":"民主党","value":54,"color":"blue","unit":"席"},{"label":"共和党","value":44,"color":"red","unit":"席"}]}` |
| `steps` 因果链/流程 | `title` `items:[{text,at,hl}]`（≤4 条，每条 ≤12 字） | `{"type":"steps","title":"…","items":[{"text":"加关税","at":0.3},{"text":"进口成本上涨","at":1.1},{"text":"农民两头挨刀","at":1.9,"hl":true}]}` |
| `line` 折线走势 | `title` `points:[数值…]` `labels:[横轴标签…]` `unit` `prefix` `decimals` `color` `at` `dur` | `{"type":"line","title":"美国汽油均价","points":[3.1,3.2,3.6,4.1,4.89],"labels":["1月","3月","5月"],"prefix":"$","decimals":2}` |
| `quote` 引文/文件卡 | `title` `text`（`\n` 分行，≤4 行） `source` `hl:[词]` | `{"type":"quote","title":"英伟达董事会 · 11月8日","text":"由独立董事组成委员会\n并请外部独立法律顾问\n协助调查","source":"公司声明","hl":["独立"]}` |

## overlays · 花字贴片

通用：`type` `start` `end`。

| type | 字段 | 用法 |
|---|---|---|
| `keyword` | `text`（≤8 字） `color`(gold/red/white) `y` `size` | 重点词大字：逐字砸入、下划线、扫光。默认在字幕上方 |
| `list` | `items:[{at(绝对时间), text, color}]` `x` `y` `size` | 分点清单，占字幕位，字幕自动下移 |
| `label` | `text` `sub` `y`（必填） `x`（不填则居中） `size` | 素材上的红字白边标注，`sub` 是白色副标 |
| `chapter` | `no` `title`（2–4 字） `en` `y` | 章节角标，贴在左上；配 `hostPos:"right"` 的 `band` |
| `image` | `src` `x` `y` `w` `h`(可省) `rotate`(-3) `r` `border` | 图片卡：截图、报道、logo 压在任意版式上 |
| `rec` | — | 取景框 + REC，给“说点题外话/自嘲”的口播段加戏 |
| `punch` | `text`（`\n` 分行，每行 ≤10 字） `y` `rotate` | 结尾金句，书法体砸入。全片一次；对应字幕设 `hide:true` |

## subs · 字幕

`{ "start", "end", "text", "hl": ["重点词"], "emph": true, "hide": true }`

- `hl`：行内这些词变金色。
- `emph`：整行金色斜体放大弹出（金句）。
- `hide`：这一行不显示（被 `punch` 或大字替代时）。

## 安全区

- 字幕基线：`talk` 1215，`band` 1532，`cardTop` 1040，`cardBottom` 950，`data` 1500。别往这些位置放别的字。
- 抖音界面会盖住：顶部 0–160、底部 1500 以下的右侧 180px 和最底 300px。`label`、`image` 避开。
- `talk` 版式里脸大约在 y 500–900：`keyword` 默认在 1065 上下，`list` 从 1095 起，都在下巴以下。
