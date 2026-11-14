# 视频生产线

从一个想法到一条成片：由 Agent（Claude Code / Codex）带着 Skill 和脚本，完成选题、口播稿、音频字幕、逐段选组件、关键帧、Remotion 成片、封面和发布文案，并把发布数据回流到下一期。第一类内容是商业分析短片。

当前状态：两条线都跑通了。**事为主**（横屏，人不出镜）出过一条 3 分 38 秒的整片；**人为主**（竖屏口播）出过一条 77 秒的样片。组件库 181 个，另收录 talkcraft 的 108 张口播动效卡（仅限非商用）。

| 看什么 | 在哪 |
|---|---|
| 工作流操作说明（先读这个） | [skills/README.md](skills/README.md) |
| 项目完整规划 | [docs/PLAN.md](docs/PLAN.md) |
| 第三方开源代码、来源与许可 | [vendor/README.md](vendor/README.md) |
| 按需取 FredTalk 组件源码（约 570MB，不入库） | `scripts/fetch-fredtalk-components.sh` |
| 渲染冒烟测试（约 1 分钟出一条 7 秒样片） | `scripts/smoke-render.sh` |
| 本地私有参考（不进 git） | `_private/` |

> 这个仓库原先是百灵输入法（Mynah）。输入法代码已从当前分支移除，历史版本仍在 git 记录和 Releases 里。
