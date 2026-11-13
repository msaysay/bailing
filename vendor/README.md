# vendor · 第三方参考代码

从外部拿进来学习和复用的开源代码，**原样保留、不在这里改**。要用哪一块，复制到我们自己的目录里再改。各目录里的 `LICENSE` / `NOTICE` 必须随副本保留。

## 已放进来的

| 目录 | 来源 | 版本 | 许可 | 用来做什么 |
|---|---|---|---|---|
| `fredtalk/` | https://github.com/njrhts2kvv-star/FredTalk | commit `eec77dc`（2026-10-18，FredTalk 2.5） | MIT，仅覆盖 Fred 原创的代码、Skill、模板、文档 | 口播成片主管线：`fred-remotion-output`（选组件、门禁、关键帧、整期编排、审片台、动态与可读性检查）、音频字幕粗剪、复刻、云渲染、Deck 动效；组件目录 `library/catalog.json`（432 条）；检索与素材脚本；视觉库前端源码 |
| `video-shotcraft/` | https://github.com/Vincentwei1021/video-shotcraft | commit `6700db2`（2026-11-12） | Apache-2.0 | 124 张镜头配方卡 + demo 源码、Ink Press 整片模板、PageCam 等组件、审美准则、终检规程、音效选材、动效工作台、剪映导出、社交发布 |
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

### video-shotcraft 没带进来的部分

上游 98MB，这里 18MB。没带：画廊样片与页面、5 首 BGM（24MB，授权说明留着）、README 配图、`shot-polish/`、`videos/`、`demos/_legacy/`。上游文档有三处提到 `demos/_legacy`，这里没有。

## 没有放进来的

| 东西 | 原因 | 怎么用 |
|---|---|---|
| **video-talkcraft**（https://github.com/Vincentwei1021/video-talkcraft ） | **PolyForm Noncommercial**：商用要作者事先授权 | 只在本地克隆参考；方法要点见 `../docs/PLAN.md` |
| Fred 分享包里的 `fred-broll-generation`、`fred-poster-cover`、`fredtalk-account-data-pipeline`、`fred-deck-generation`、`fred-illustration-generation`、`xyq-skill` | 脱敏分享版，包内无开源许可；两个带 Fred 本人形象图 | 解到 `../_private/fred-share/`（已忽略）本地用 |
| 对标成片、抖音文案清单、官网梳理稿 | 他人作品与账号数据 | 放 `../_private/` |
