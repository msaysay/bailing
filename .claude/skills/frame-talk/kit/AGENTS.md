# 给 AI 助手

你要用这套工具，把用户给的一条横屏口播原片，剪成约读书房的竖屏成片。**不要自己另写剪辑代码，也不要改版式**：流程、脚本、模板都在这个文件夹里，照着做。

## 先读

1. `.claude/skills/frame-talk/steps/frame-00-setup.md`：这条线做什么、环境怎么装、哪些东西不能动。
2. 然后按顺序读并执行：`.claude/skills/frame-talk/steps/frame-01-cut.md` → `.claude/skills/frame-talk/steps/frame-02-plan.md`（连同 `卡片目录.md`）→ `.claude/skills/frame-talk/steps/frame-03-render.md`。
3. 动手前看一眼完整的例子：`episodes/14_约读书房_样片/03_制作过程/` 里的 `script.txt`、`稿子确认.md`、`标题候选.md`、`edl.json`、`版式表.md`，以及 `04_成片/关键帧.jpg`。
4. 每期开工前读 `brands/yuedu/rules.md`。

## 一期的全部命令（细节以各 SKILL.md 为准）

```bash
python3 scripts/frame_setup.py                                             # 第一次：装环境
python3 scripts/frame_ingest.py "<原片>" "episodes/<期号_选题>" --slug <期短名>   # 转写、找口误、量人脸
#   → 你：读转写稿，写 script.txt 和 稿子确认.md，发给用户确认；读 口误建议.md，定 --drop
python3 scripts/roughcut.py … --drop "…" --vf "…" --fps 30 --out … --cuts …      # 粗剪
python3 scripts/asr.py … ; python3 scripts/align.py …                         # 对齐
python3 scripts/frame_audio.py "episodes/<期>"                               # 降噪、配乐
#   → 你：出三组标题让用户选；写 edl.json
python3 scripts/frame_plan.py "episodes/<期>"                                # 检查，生成版式表
python3 scripts/frame_render.py "episodes/<期>" keys                         # 关键帧；看图返修
python3 scripts/frame_render.py "episodes/<期>" full                         # 整片加自查
python3 scripts/frame_render.py "episodes/<期>" cover --at <秒>              # 封面
```
期短名用英文和数字（如 `yuedu-0312`），素材放在 `studio/public/<期短名>/`。Windows 上把 `python3` 换成 `python`，多行命令写成一行。

## 六条不能破的规矩

1. **相框不动**。能改的只有三行标题和 `brands/yuedu/speaker.json` 里的名字、头衔。不改 `studio/src/yuedu/base.tsx`、`frame.tsx` 里的位置、颜色、字体。
2. **文字先确认**。转写的稿子必须发给用户确认过，才排画面。拿不准的词要单独列出来问。
3. **时间不靠估**。`edl.json` 里的时刻写 `[段名, 词]`，由脚本从对齐结果里取；只有盖剪口时才写秒数。
4. **内容不编**。卡片上的字和数字必须来自口播；示意图的「示意」角标不许去掉。
5. **检查不绕**。`frame_plan.py` 报「不通过」就改 `edl.json`，不许改脚本里的阈值，不许跳过检查直接渲染。
6. **看了图再出片**。先 `keys` 出关键帧，一格一格看过、改到没问题，再 `full`。

## 没有素材怎么办

不要停，不要让人脸干放着。按顺序：客户给的素材 → `scripts/tikhub.py` 搜（只用约读书房官方账号发的，并在交付时列出来请用户确认）→ 用 `.claude/skills/frame-talk/steps/卡片目录.md` 里的十三张卡把这句话画出来。

## 交付时必须说的

成片位置和时长；用的哪组标题；剪掉了哪几句；降噪档位和配乐来源；画面来源（客户素材、搜来的、生成卡片各几处）；哪些卡是示意；没处理的「提醒」；**你验证不了的东西**（声音听感、口型、动态节奏），请用户看一遍。
