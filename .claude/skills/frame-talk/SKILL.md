---
name: frame-talk
description: 口播剪辑的「相框老板风」（对标约读书房这类企业老板、创始人口播）：横屏口播原片出 1080×1920 竖屏成片，固定相框（纸纹底、三行标题、署名条、品牌标志），中间画面窗里是人、素材、贴纸、十三种生成卡片和字幕；自带口误检测、降噪、自动配乐、封面。用户选了这种风格，或说「老板口播」「带相框的那种」「按约读书房的做」时使用。由 make-talk 交过来。
---

# 相框老板风 · 入口

四步，说明在 `steps/` 里，**按顺序读、读一步做一步**：

| 步 | 读哪份 | 做什么 | 要用户确认 |
|---|---|---|---|
| 0 | `steps/frame-00-setup.md` | 装环境、认识品牌包、改署名、素材入库 | |
| 1 | `steps/frame-01-cut.md` | 转写、确认文字、去口误、粗剪、对齐、降噪配乐 | ✔ 转写的文字；剪掉了哪几处 |
| 2 | `steps/frame-02-plan.md`（连同 `steps/卡片目录.md`、`steps/卡片总览.jpg`） | 出三组标题、写剪辑决定表 `edl.json` | ✔ 标题选一组、版式表 |
| 3 | `steps/frame-03-render.md` | 关键帧、整片渲染、自查、封面、交付 | ✔ 成片 |

- 这一期选了哪些可选功能、每条命令带什么参数：`python3 scripts/talk.py recipe <期名>`。降噪和配乐这条线自带（`scripts/frame_audio.py`），不要再用 `polish.py` 叠一遍；调光用 `scripts/grade.py`，滤镜串放到粗剪 `--vf` 的最前面。
- 品牌包在 `brands/yuedu/`，长期规则 `brands/yuedu/rules.md` 每期开工前读一遍。**换一家公司**：把 `brands/yuedu` 复制成 `brands/<新品牌>`，换底图 `plate.png`、标志 `logo.png`、`speaker.json`、`glossary.txt`，各脚本加 `--brand brands/<新品牌>`；颜色和坐标在 `studio/src/yuedu/base.tsx`。
- 换字体：`python3 scripts/fonts.py use <包> --style frame`（换标题、署名和字幕的字）。品牌方锁定了字体时不要换。
- `kit/` 里是这条线单独打包交付时用的说明（`python3 scripts/frame_pack.py`），平时不用读。
- 样片：`episodes/14_约读书房_样片/`。设计说明：`docs/约读书房-口播成片工作流设计.md`。
