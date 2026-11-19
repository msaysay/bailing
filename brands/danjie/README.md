# 蛋解创业（抖音商业财经口播）

- 成片：竖屏 1080×1920，真人口播为底，口播全屏和素材版式交替。走「人为主」那条线（`talk-01` 到 `talk-04`）。
- 规则：`rules.md`——三条参考成片的节奏、版式坐标、字体、颜色、动效，逐项量出来的。
- 粗剪两件事要注意：出镜人一句话会录很多遍（`scripts/retakes.py`）；原片光不稳定（`scripts/grade.py`，脸不瘦）。
- 这个号有一套独立的工作流 `cutflow/`（HTML 舞台 + ffmpeg，不依赖 `studio/`），入口是 `cutflow/SKILL.md`，可以整个目录交给别的 AI 跑。
  它自带转写、重录检测、调光、五种版式、七种花字、五种数据面板、音效和出片自查。
- `studio/` 这边的口播线（`talk-02-roughcut`）也接了同样的重录检测和调光：`scripts/retakes.py`、`scripts/grade.py`。
