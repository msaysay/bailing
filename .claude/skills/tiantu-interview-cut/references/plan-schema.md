# plan.json 字段

路径相对 plan.json 所在目录；`$SKILL` 展开为本 skill 目录。完整可运行样例：`examples/plan.reference-rebuild.json`。

```jsonc
{
  "sources": {                      // 每个 A-roll 源的取景（probe_aroll.py 给初值）
    "raw/a.mp4": { "focus_x": 0.5, "focus_y": 0.33,   // 人脸中心在源画面中的位置 0..1
                   "zoom": 1.0,        // wide 景别在“铺满”基础上的放大（有黑角/穿帮就调大）
                   "tight_zoom": 1.3,  // tight 景别放大
                   "face_to": 0.36 }   // 脸落在成片高度的哪个位置（默认 0.36）
  },
  "brand": { "logo": "$SKILL/assets/brand/logo.png",
             "slogan": ["天图通逊", "为客户", "竭尽全力"] },

  "cues": [                         // 直接粘贴 work/cues.json；顺序即成片顺序
    { "src": "raw/a.mp4", "in": 12.31, "out": 13.02, "text": "要提货", "kw": ["提货"] }
    // "sub": false 可隐藏该句字幕
  ],

  "shots": [                        // 按顺序铺满全部 cue，区间为闭区间 [首cue, 末cue]
    { "cues": [0, 1], "type": "aroll", "framing": "wide" },
    { "cues": [2, 3], "type": "broll", "src": "broll/ship.mp4", "src_in": 8.0,
      "focus_x": 0.5,               // 横素材裁竖屏时的水平取景中心
      "speed": 1.0, "zoom": 1.0, "push": 0 },      // push: 缓推总量，如 0.05；静帧默认 0.06
    { "cues": [4, 6], "type": "aroll", "framing": "tight",
      "push": true,                 // 省略时 ≥3s 自动缓推；false 关闭
      "src": "raw/camB.mp4", "offset": 1.84 }      // 可选第二机位：camB 时间 = 主机位时间 + offset
  ],

  "titles": [
    { "cues": [0, 1],               // 显示区间（闭区间），"hold": 0.5 可再延长秒数
      "pos": "lower",               // lower(默认，替代字幕) | top(与字幕并存) | vertical(竖排)
      "lines": [ { "text": "十三日达" } ] },        // 字号自动：单行按字数 4字→特大、6字→大；多行→标准
    { "cues": [22, 23],
      "lines": [ { "text": "能够做到", "size": "m", "at_cue": 22 },         // at_cue: 该行在哪一句出现
                 { "text": "14个自然日之内", "at_cue": 23, "indent": 190 } ] },
    { "cues": [28, 28], "pos": "top", "lines": [ { "text": "百分之九十几" } ] }
    // 可选: "x","y" 覆盖位置(1080×1920 坐标，y 为首行字底)；"size": "xl|l|m|s" 或整数；
    //       "replace_sub": true/false 覆盖默认；"on_broll": true 声明有意压在空镜上
  ],

  "person": { "cue": 5, "name": "天一（陈程）", "intro": "天图通逊董事长", "dur": 4 },   // 可选

  "ending": { "src": "broll/end.mp4", "src_in": 2.0, "dur": 4.7,
              "speed": 1.0, "focus_x": 0.5, "slogan": true },                       // "x","y" 可调标语位置

  "bgm": { "src": "bgm/track.mp3", "gain_db": -22, "src_in": 0 }                    // 可选
}
```

要点：
- 成片时间轴 = cues 依次首尾相接。镜头、标题全部用 **cue 序号**定位，不写绝对时间；想知道第几秒用 `timeline.py`。
- A 镜头的画面自动取自对应 cue 的原片时间（保证口型）；同一 A 镜头内若有 ✂，脚本会自动在剪口处放大 12% 遮跳剪，但更好的做法是在那里分镜头。
- B 镜头从 `src_in` 起连续播放镜头时长；素材不够长 QC 报 ERROR。
- 静态图片（png/jpg）可直接作 `broll` 的 `src`，自动缓推。
