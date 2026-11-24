# 给 AI 助手的说明（Codex 等读这个文件；Claude Code 读 CLAUDE.md，内容一样）

这是一套用 AI 做视频的工具：口播剪辑、横屏解读片、频道宠物。

**用户想做视频、说「继续」、或者不知道从哪开始时，先用技能 `video-start`**（`.claude/skills/video-start/SKILL.md`）。它装环境、把开工要定的事一次问完（带样图）、建目录、记进度，一步步带用户走。用户不需要懂流程，也不需要会提问。

六件事每一期都要做到：
1. **环境你来装**：先跑 `python3 scripts/doctor.py --fix`，它会自己装依赖、模型、字体，缺 ffmpeg / Node.js 也会用包管理器装。还有没装上的，照它打印的命令你接着装。**不要让用户自己装东西**；只有系统弹密码框、公司电脑禁装、没网时才找他。
2. **开工的事一次问完**：出不出镜、发在哪、讲什么、用哪个骨架、署名、要哪些处理、要不要网上的画面、怎么确认，八件事一次给出去（让他打开最外层的「开工单.html」点完复制回来，或在聊天里一次列完让他回一行）。不要一问一答地挤。用户贴来「这是我填好的开工单」就直接开工。开工之后每个确认点一次只说一件事，最后一句是他下一步要给什么。
3. **说到风格就给图**：提到哪个骨架就把 `styles/previews/<骨架>.jpg` 发给他，让他挑时发 `styles/previews/总览.jpg`；粗剪后用他自己的原片出一张关键帧再确认。
4. **审美听骨架的**：一条片子只用一个骨架（对标大 V 的整套模板；不出镜用我们自己定的那套）。用户不选就 `python3 scripts/skeleton.py pick --type <内容类型> [--no-face] [--wide]` 替他选。不要自己混搭风格；组件只从 `skeleton.py blocks <骨架>` 里挑，改成骨架的颜色和字体。
5. **署名是三样东西，都不全程挂着**：角标（底部小牌子）、个人介绍（上方：称呼 + 身份）、简介（结尾）。内容用户填，`python3 scripts/sign.py set / show / demo`；出现时机见 `docs/署名规则.md`，画面里用 `studio/src/kit/sign.tsx` 的 `<Sign>`。不替用户编身份和简介。
6. **收尾必出发布包**：成片点头后主动跑 `python3 scripts/publish_kit.py init / build <期名>`，交三版封面（各两个尺寸）、三个标题、简介、话题、署名和提醒。找素材要用网上的画面而用户选了接 TikHub 时，把接法发给他（话术在 `video-start` 里）。

## 技能在哪（不会自动加载技能的 AI：用到哪个，就先把那个文件完整读一遍再动手）

| 技能 | 什么时候读 | 文件 |
|---|---|---|
| `video-start` | **总入口**。用户说想做视频、说「继续」、不知道干嘛时先读它 | `.claude/skills/video-start/SKILL.md` |
| `make-talk` | 出镜：口播原片剪成成片（选骨架、选功能、交给下面某个骨架的技能） | `.claude/skills/make-talk/SKILL.md` |
| `make-news` | 不出镜：录音或题目做成横屏解读片 | `.claude/skills/make-news/SKILL.md` |
| `xiaolin-talk` | 骨架：财经解读风（竖屏） | `.claude/skills/xiaolin-talk/SKILL.md` |
| `danjie-cut` | 骨架：商业快节奏风（竖屏） | `.claude/skills/danjie-cut/SKILL.md` |
| `zhanpeng-talk` | 骨架：知识科普风（竖屏） | `.claude/skills/zhanpeng-talk/SKILL.md` |
| `frame-talk` | 骨架：相框老板风（竖屏） | `.claude/skills/frame-talk/SKILL.md` |
| `tiantu-interview-cut` | 骨架：访谈纪实风（竖屏） | `.claude/skills/tiantu-interview-cut/SKILL.md` |
| `ziqi-wide` | 骨架：横屏深度解读风（长视频） | `.claude/skills/ziqi-wide/SKILL.md` |
| `style-atlas` | 选骨架、挑组件、查专业名词、把新风格拆成新骨架 | `.claude/skills/style-atlas/SKILL.md` |
| `pet` | 频道宠物（用户提到才做） | `.claude/skills/pet/SKILL.md` |
| `hud-pov` | 试验功能，不主动用 | `.claude/skills/hud-pov/SKILL.md` |

## 第一次打开这个文件夹

1. 读完这个文件，再读 `.claude/skills/video-start/SKILL.md`。
2. 跑 `python3 scripts/doctor.py --fix` 装环境（要 Python 3.10+、Node.js 22+、ffmpeg；它会自己装，没装上的你照它打印的命令接着装）。装的同时把开工单发给用户，别让他干等。
3. 照 `video-start` 第 2 节把开工的八件事一次问完。**不要一上来就讲流程，也不要一问一答。**
4. 命令都在这个文件夹最外层运行（`python3 scripts/…`）；渲染在 `studio/` 里（`npx remotion …`）。
5. 自测工程能不能出画面：`cd studio && npx remotion still src/index.tsx GALLERY out/自测.jpg --frame 90`。`studio/src/index.tsx` 里登记的 TALK01、WIDE01、FULL02 这些是往期样例，**包里没有带它们的原片，不能直接渲染**，只用来照抄写法。
6. 你听不到声音、看不了动态：出片后看关键帧联系表自查，并把没法验证的地方如实告诉用户。

## 其他要知道的

- 流程总览：`docs/流程总览.md`（四个主技能：video-start、make-news、make-talk、pet）
- 口播剪辑有六套手工模板（竖屏：财经解读、商业快节奏、知识科普、相框老板、访谈纪实；横屏长视频：深度解读），外加去口吃、降噪、调光、配乐、换字体这些可选功能：`make-talk` 负责带用户选，`python3 scripts/talk.py styles / options / new / recipe`；共用的做法见 `docs/口播剪辑-标准流程.md`
- 骨架和组合规矩：`python3 scripts/skeleton.py list / pick / show / blocks / rules`，配置在 `styles/skeletons.json`
- 视觉图鉴（骨架库、帮我选骨架、组件积木、专业名词、候选区）：技能 `style-atlas`，网页 `site/atlas.html`；整体结构见 `site/workflow.html`
- 制作规则：`docs/aesthetic-rules.md`
- 每一期的进度：`python3 scripts/episode.py status`
- 环境自检：`python3 scripts/doctor.py --fix`
- 试验功能，**不要主动推荐、不用来交付**：手势全息风短片（技能 `hud-pov`）；风格皮肤引擎（`scripts/skin.py`，只给候选风格出样片看）。

和用户说话用大白话，一次只要一样东西，每次停下来都告诉用户下一步要他给什么。
