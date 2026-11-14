# vendor · 第三方参考代码

从外部拿进来学习和复用的开源代码，**原样保留、不在这里改**。要用哪一块，复制到我们自己的目录里再改。各目录里的 `LICENSE` / `NOTICE` 必须随副本保留。

## 已放进来的

| 目录 | 来源 | 版本 | 许可 | 用来做什么 |
|---|---|---|---|---|
| `fredtalk/` | https://github.com/njrhts2kvv-star/FredTalk | commit `eec77dc`（2026-10-18，FredTalk 2.5） | MIT，仅覆盖 Fred 原创的代码、Skill、模板、文档 | 口播成片主管线：`fred-remotion-output`（选组件、门禁、关键帧、整期编排、审片台、动态与可读性检查）、音频字幕粗剪、复刻、云渲染、Deck 动效；组件目录 `library/catalog.json`（432 条）；检索与素材脚本；视觉库前端源码 |
| `video-shotcraft/` | https://github.com/Vincentwei1021/video-shotcraft | commit `6700db2`（2026-11-12） | Apache-2.0 | 124 张镜头配方卡 + demo 源码、Ink Press 整片模板、PageCam 等组件、审美准则、终检规程、音效选材、动效工作台、剪映导出、社交发布 |
| `video-talkcraft/` | https://github.com/Vincentwei1021/video-talkcraft | commit `5017088`（2026-11-09） | **PolyForm Noncommercial 1.0.0：仅限非商用**，商用须先取得作者授权 | 108 张口播动效卡的 Remotion 源码（`template/cards/`）、逐卡调参说明（`references/cards/`）、镜头语言与设计规范、口播制作 Skill。用户 2026-11-14 说明是自用后入库。接进工程的办法见 `scripts/sync_talkcraft.py`，索引见 `../docs/参考-talkcraft动效索引.md` |
| `remocn/` | https://github.com/Remocn/remocn | commit `1d15141` | MIT | 789 个 Remotion 组件源码（`registry/`）：图表、对比、计数、文字、转场、背景 |
| `snapcn/` | https://github.com/shadcn-labs/snapcn | commit `18b973d` | MIT | 60 多个产品演示组件、配套 Skill、设计与动效规范 |
| `remotion-bits/` | https://github.com/av/remotion-bits | commit `de35fda` | MIT（见其 `package.json`，仓库无单独 LICENSE 文件） | 计数器、打字机、代码块、粒子等基础件 |
| `fredtalk-shots/` | 上传的 `Fredtalk-Shots-2.0.0` | 2.0.0 | MIT | 对标视频拉片：切镜检测、逐镜分析、反推提示词 |
| `brainstorming/` | https://github.com/obra/superpowers | commit `bb92a77` | MIT | 动手前的创意澄清 |
| `humanizer-zh/` | 基于 blader/humanizer 的中文版 | 2026-09-23 修订 | MIT | 文案去模板腔 |

### fredtalk 没带进来的部分

上游 723MB，这里 9MB。没带的：

| 没带的 | 体积 | 原因 | 怎么取 |
|---|---|---|---|
| `components/projects/`（各组件的 Remotion 工程快照） | 567MB | 太大，不入库；已决定全部可用（含复刻类） | `scripts/fetch-fredtalk-components.sh` 按需取到 `vendor/_cache/`（已忽略） |
| `library/fonts/` | 54MB | 字体各有各的许可 | 同上游仓库取，逐个核对许可后再用 |
| `library/demo/`、`media-manifest.json`、`docs/assets/` | 约 30MB | 预览媒体 | 在线看：https://www.fred-fu.com/visual-library |
| `skills/remotion-best-practices/` | 0.2MB | Remotion 官方的 Skill，包内没有许可文件 | 从 Remotion 官方获取 |

Fred 的组件分三类（见 `fredtalk/docs/license-scope.md`）：他原创的（MIT）；参考别人成片复刻的（权利未确认）；媒体、字体、音效、品牌（各自许可）。**项目决定：三类都用，按来源登记，便于日后替换。** 目录里标为会员专享的条目源码不在公开仓库。

remocn、snapcn 只带了组件源码和说明，没带它们的文档站和演示应用。

### video-talkcraft 的使用边界

上游 66MB，这里 4MB。没带：`gallery/`（展示页和缩略图）、`demos/`（网页版演示和示意素材）、`workbench/`、`assets/`。在线看：https://vincentwei1021.github.io/video-talkcraft/

- **只能非商用**。接商单、给客户做片、放进收费产品之前，先找作者要授权；要不到就把用到的卡换成我们自己的组件。
- **不进我们的组件包**（`studio/out/组件包`），避免把两种许可混在一起发出去。
- 复制卡片进成片工程时，文件头的来源和许可说明要留着。

### video-shotcraft 没带进来的部分

上游 98MB，这里 18MB。没带：画廊样片与页面、5 首 BGM（24MB，授权说明留着）、README 配图、`shot-polish/`、`videos/`、`demos/_legacy/`。上游文档有三处提到 `demos/_legacy`，这里没有。

## 没有放进来的

| 东西 | 原因 | 怎么用 |
|---|---|---|
| Fred 分享包里的 `fred-broll-generation`、`fred-poster-cover`、`fredtalk-account-data-pipeline`、`fred-deck-generation`、`fred-illustration-generation`、`xyq-skill` | 脱敏分享版，包内无开源许可；两个带 Fred 本人形象图 | 解到 `../_private/fred-share/`（已忽略）本地用 |
| Yin's Broadcast「After Jensen 黄仁勋之后」成片（用户提供，2026-11-14） | 他人成片 | 不入库；只拆解了它的做法（`../docs/对标拆解-AfterJensen.md`），「广播风」三组 51 个组件是照做法自己写的，没有用它的素材、台标和文字 |
| MotionHarness 的宣传片和「动效案例与源码」包（用户提供，2026-11-14） | 包内许可写明保留所有权利、未授予开源许可 | 不入库、不抄代码；只参考了它的动效手法和「15 种效果 + 6 种运动函数」这份清单，实现都是自己写的（`studio/src/components/fx*.tsx`、`effects.tsx`、`kit/motion.ts`） |
| 对标成片、抖音文案清单、官网梳理稿 | 他人作品与账号数据 | 放 `../_private/` |
