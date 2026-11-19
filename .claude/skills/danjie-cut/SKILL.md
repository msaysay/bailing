---
name: danjie-cut
description: 口播剪辑的「商业快节奏风」（对标蛋解创业这类头部商业财经博主）：近黑藏青底，口播全屏和素材版式交替，金色重点词、清单、章节角标、数据面板，结尾毛笔金句，1080×1920。用户选了这种风格，或说「按蛋解的风格做」「商业财经那种快节奏的」时使用。由 make-talk 交过来。
---

# 商业快节奏风 · 入口

这条线的全部说明和代码在仓库根目录的 `cutflow/`，它本身是一个能单独交付的工具包。

1. 先读 `cutflow/SKILL.md`（六步流程和红线），再读 `cutflow/docs/STYLE_SPEC.md`、`cutflow/docs/PLAYBOOK.md`；字段查 `cutflow/docs/TIMELINE.md`。
2. 这一期的长期规则在 `brands/danjie/rules.md`，开工前读一遍。
3. 命令都在 `cutflow/` 目录下运行。项目目录不用 `cutflow/projects/`，用 `talk.py new` 建好的 `episodes/<期名>/cut/`（原片已经在 `cut/raw/host.mp4`），所以命令写成 `node src/prep.js ../episodes/<期名>/cut`。
4. 这一期选了哪些可选功能、每条命令带什么参数：`python3 scripts/talk.py recipe <期名>`。
   - 降噪：`prep` 之后对 `cut/work/host.mp4` 跑 `python3 scripts/polish.py … --inplace --denoise auto`（在仓库根目录跑）。
   - 换字体：`python3 scripts/fonts.py use <包> --style danjie`，会重写 `cutflow/src/stage/fonts.css`；换回原配用 `use default`。
5. 每个确认点做完：`python3 scripts/episode.py done <期名> <步骤号> --note "…"`。
