---
name: pet-02-shots
description: 把频道宠物叠进这一期成片：右下角常驻、开场弹经验、升级换形态、片尾路线分数。成长结算做完、成片工程已经有了之后使用；用户说「把宠物放进去」时使用。
---

# 宠物 · 第 2 步 · 叠进成片

## 输入
`studio/src/episodes/<期名>/pet.json`（上一步导出的）、这一期的成片工程（新闻线或口播线做好的）。

## 形态素材
`studio/public/pet/<形态>/0001.png…`，48 帧循环，透明底。没有就先渲：`bash pet/render_seal.sh`（4 核约 40 分钟，冰蛋最慢）。
形态名：`egg1` `egg2` `egg3`（冰蛋裂纹由少到多）· `hatch` 破冰 · `young` 幼崽 · `young-happy` `young-shock` 表情 · `adult-tech` `adult-gold` `adult-flame` `adult-star` 四条成体路线。
等级对应：Lv 0–1 用 `egg1`，2–3 用 `egg2`，4 用 `egg3`，5–9 `hatch`，10–19 `young`，20 起按路线。

## 怎么放（全系列统一）
- **右下角**，用 `studio/src/components/pet.tsx` 的 `PetHud`，`size` 横屏 220、竖屏 200。竖屏口播要放在字幕和平台按钮区以上（`bottom` 至少 320）。
- **开场 3 秒内**出场，同时弹「+经验」（`gain`），升级的话在 `events` 里加 `level` / `evolve` 和新形态。
- **片中**：讲到高能处给一次小反应（`events` 里 `kind: 'react'`，换 `young-happy` 或 `young-shock`），全片不超过 3 次，不能压字幕、不能压人脸。
- **进化前三期**：片尾用 `RouteRace` 亮出四条路线分数。
- 演示写法见 `studio/src/episodes/petdemo/index.tsx`（合成 `PET-DEMO`）。

## 要用户确认
渲出宠物出场、升级、片尾这三处的关键帧给用户看，点头后再整片渲。
