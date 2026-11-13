# vendor · 第三方参考代码

这里是从外部拿进来学习和复用的开源代码，**原样保留、不在这里改**。要用哪一块，就把它复制到我们自己的工程目录里再改（video-shotcraft 自己也是这么要求的：组件 copy 进新项目后修改，不 import 本库）。

## 已放进来的

| 目录 | 来源 | 版本 | 许可 | 用来做什么 |
|---|---|---|---|---|
| `video-shotcraft/` | https://github.com/Vincentwei1021/video-shotcraft | commit `6700db2`（2026-11-12） | Apache-2.0 | 124 张镜头配方卡 + demo 源码、Ink Press 整片模板、PageCam 等组件、六阶段制作方法、审美准则、终检规程、音效选材、动效工作台、剪映导出、社交发布 |
| `fredtalk-shots/` | 你上传的 `Fredtalk-Shots-2.0.0` | 2.0.0 | MIT（Copyright 2026 Fred） | 对标视频拉片：切镜检测、逐镜分析、反推提示词、交互报告 |
| `brainstorming/` | https://github.com/obra/superpowers（Fred 包内的独立打包） | commit `bb92a77` | MIT（Jesse Vincent） | 动手前的创意澄清流程 |
| `humanizer-zh/` | 基于 blader/humanizer 的中文版（Fred 包内） | 2026-09-23 修订 | MIT（歸藏） | 文案去模板腔 |

各目录里的 `LICENSE` / `NOTICE` 必须随副本保留。

### video-shotcraft 裁掉了什么

为了控制仓库体积（上游 98MB → 这里 18MB），没有带进来：

- `gallery/media`、`gallery/source`（样片与画廊页面，在线看：https://vincentwei1021.github.io/video-shotcraft/ ）
- `assets/audio/bgm`（5 首 BGM，24MB；授权说明 `assets/audio/ATTRIBUTION.md` 留着，需要时从上游取）
- `assets/readme`、`assets/brand`、`shot-polish/`、`videos/`、`demos/_legacy/`、多语言 README

上游文档里有三处提到 `demos/_legacy`，那部分这里没有。

## 没有放进来的，以及为什么

| 东西 | 原因 | 怎么用 |
|---|---|---|
| **video-talkcraft**（https://github.com/Vincentwei1021/video-talkcraft ，口播视频版，108 张动效卡 + 字级时间戳管线） | 许可是 **PolyForm Noncommercial**：非商用免费，商用要作者事先授权。本仓库是公开产品仓库，把它拷进来再往商用方向做会违反许可 | 方法已经写进 `../docs/PLAN.md`（思路不受版权约束）；代码只在本地克隆参考。要直接用它的代码，先找作者谈授权 |
| Fred 分享包里的 `audio-subtitle-roughcut`、`fred-remake`、`fred-broll-generation`、`fred-poster-cover`、`fredtalk-account-data-pipeline`、`fred-deck-generation`、`fred-illustration-generation`、`xyq-skill` | 都是「脱敏分享版」，**包内没有开源许可**；其中两个带 Fred 本人形象参考图，声明不得冒充或暗示代言。不适合再分发到公开仓库 | 把你的 zip 解到 `../_private/fred-share/`（已 gitignore），本地照常可用。它们的方法要点已整理进 `../docs/PLAN.md` |
| 你上传的两条成片、抖音文案清单 | 他人作品与账号数据 | 同上，放 `../_private/` |
