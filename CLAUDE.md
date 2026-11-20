# 给 AI 助手的说明

这是一套用 AI 做视频的工具：横屏解读片、竖屏口播、频道宠物。

**用户想做视频、说「继续」、或者不知道从哪开始时，先用技能 `video-start`**（`.claude/skills/video-start/SKILL.md`）。它会判断走哪条线、查环境、建目录、记进度，一步步带用户走，用户不需要懂流程。

- 流程总览：`docs/流程总览.md`（四个主技能：video-start、make-news、make-talk、pet）
- 口播剪辑有六种风格可选（竖屏：财经解读、商业快节奏、知识科普、相框老板、访谈纪实；横屏长视频：深度解读），外加去口吃、降噪、调光、配乐、换字体这些可选功能：`make-talk` 负责带用户选，`python3 scripts/talk.py styles / options / new / recipe`；共用的做法见 `docs/口播剪辑-标准流程.md`
- 制作规则：`docs/aesthetic-rules.md`
- 每一期的进度：`python3 scripts/episode.py status`
- 环境自检：`python3 scripts/doctor.py --fix`

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
