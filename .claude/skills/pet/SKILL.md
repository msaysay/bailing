---
name: pet
description: 频道宠物（右下角那只海豹）：每期结算成长、叠进成片。片子做完以后、用户提到「宠物」「海豹」「结算一下」「把宠物放进去」时使用。
---

# 频道宠物

规则全文：`docs/宠物成长规则.md`。细节：`docs/steps/pet-01-growth.md`、`docs/steps/pet-02-shots.md`。

## 1. 结算（要用户确认）
**问用户**：上期的点赞、评论、转发、收藏、新关注（后台截图就行），和上期评论（导出文件或视频链接）。
- 读前 200 条有效评论，逐条判断偏机芯（技术、数据）、金羽（生意、赚钱）、焰心（情绪、争论）、星语（故事、共鸣），摘证据，写 `pet/episodes/<期名>.json`。**必须真读，不能编，结果不许手改。**
- `python3 scripts/pet.py add <期名> --likes … --comments … --shares … --saves … --follows … --judge pet/episodes/<期名>.json`，再 `export`。
- 给用户看涨了多少、升没升级、凭哪几条评论，并写一段置顶评论用的成长日志。

## 2. 叠进成片（要用户确认）
- 形态素材在 `studio/public/pet/`，没有就 `bash pet/render_seal.sh`（约 40 分钟）。
- **全系列放右下角**，用 `studio/src/components/pet.tsx` 的 `PetHud`；开场 3 秒内出场并弹「+经验」，升级就换形态；全片小反应不超过 3 次，不压字幕和人脸。示例：合成 `PET-DEMO`。
- 渲出出场、升级、片尾三处关键帧给用户看，点头再整片渲。
