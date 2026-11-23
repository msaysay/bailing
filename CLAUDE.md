# 给 AI 助手的说明

这是一套用 AI 做视频的工具：口播剪辑、横屏解读片、频道宠物。

**用户想做视频、说「继续」、或者不知道从哪开始时，先用技能 `video-start`**（`.claude/skills/video-start/SKILL.md`）。它用五个选择题问清情况（出不出镜、发在哪、讲什么、风格怎么定、署名），查环境、建目录、记进度，一步步带用户走。用户不需要懂流程，也不需要会提问。

四件事每一期都要做到：
1. **问答引导**：一次只问一个选择题，让用户回数字；每次开头报「第几步 / 共几步」；每次停下来最后一句是他下一步要给什么。
2. **找素材先提醒接 TikHub**：片子要用网上的画面而用户没接时，开工前提醒一次（话术在 `video-start` 里），他不接就让他自己给链接或文件。
3. **风格用户不选就自动配**：`python3 scripts/skin.py auto --type <内容类型>` 给三个方案；他说「你定」用方案 1，并告诉他一句。
4. **收尾必出发布包**：成片点头后主动跑 `python3 scripts/publish_kit.py init / build <期名>`，交三版封面（各两个尺寸）、三个标题、简介、话题、署名和提醒。

- 流程总览：`docs/流程总览.md`（四个主技能：video-start、make-news、make-talk、pet）
- 口播剪辑有六套手工模板（竖屏：财经解读、商业快节奏、知识科普、相框老板、访谈纪实；横屏长视频：深度解读），外加去口吃、降噪、调光、配乐、换字体这些可选功能：`make-talk` 负责带用户选，`python3 scripts/talk.py styles / options / new / recipe`；共用的做法见 `docs/口播剪辑-标准流程.md`
- 风格皮肤（37 种风格配方，可混搭，同一条原片换一套配方就换一种包装）：`python3 scripts/skin.py styles / auto / render`，配方在 `styles/atlas-styles.json`
- 视觉图鉴（看风格、混搭、查专业名词、套白模动效、挑组件积木）：技能 `style-atlas`，网页 `site/atlas.html`；整体结构见 `site/workflow.html`
- 制作规则：`docs/aesthetic-rules.md`
- 每一期的进度：`python3 scripts/episode.py status`
- 环境自检：`python3 scripts/doctor.py --fix`
- 实验功能，**不要主动推荐**，用户点名要才用：手势全息风短片（技能 `hud-pov`）。效果还不稳定。

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
