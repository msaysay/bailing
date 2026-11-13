---
name: fredtalk-shots
description: 用 Fredtalk Shots 对用户提供的视频做深度拉片，输出 Fred 的交互报告、逐镜动作与摄影分析、人物和镜头关系、六项深度拆解，以及覆盖全片的分秒镜头反推提示词。用户说 Fredtalk Shots、Fred 拉片、视频深度分析、动作拆解或反推视频提示词时使用。
metadata:
  brand: Fredtalk Shots
  version: 2.0.0
  requires:
    bins: [python3, ffmpeg, ffprobe]
---

# Fredtalk Shots

把一个视频转成可看片、可核对、可复制导演提示词的 Fred 拉片报告。默认分析全片，沿用本包的暖纸、墨绿、朱红页面；新视频重新确定人物、镜头、动作和时间窗。用户只给视频时直接开始，不要求再提供模板或写一遍分析需求。

`{baseDir}` 是这个 Skill 的目录。所有脚本、样式和分析规范都在包内，运行使用 Python 标准库，不依赖其他 Skill、旧项目、外部模板或第三方 Python 模块。实际运行需要 Python 3.10+、FFmpeg 和 ffprobe。浏览器用于实际播放与页面验收；工具可按当前环境选择。

## 输出标准

产出一个目录，包含 `shots-report.html`、`shots.json`、`track.json`、`analysis.json`、`reverse-prompts.json`、`timed-camera-prompts.json`、对应 Markdown、原片副本、兼容预览、关键帧、真实裁切头像与检查记录。

页面固定保留这六个模块，但内容和数量由本次视频决定：

1. 原片播放、同步高亮和镜头节奏带。
2. 逐镜档案：画面、具体动作内容、文字与声音，以及展开的镜头变化、空间关系和重新制作要点。
3. 人物关系：真实外观和头像、主要／背景／边缘出场、人物 × 镜头矩阵。
4. 深度拆解：动作因果、空间调度、摄影与剪辑、节奏、人物状态、连续性；按片型表达每项证据和作用。
5. 反推提示词：默认显示完整时间轴版，另有共同设定、分段执行与换自己的故事。
6. 依据与数据：观察方法、限制、镜长分布、检测修正和检查结果。

打斗片的具体内容必须写到“谁发起—对方怎么接—身体如何变化—怎样恢复或进入下一步”。没有新增攻击时写清停顿、对白、姿态或残余反应。非打斗片将页面 `report.actionLabel` 改为“具体动作过程”等合适名称，沿用 `fight` / `beats` 数据字段承载真实行为，不制造打斗。

## 执行

先运行本包的依赖检查：

```bash
python3 {baseDir}/scripts/doctor.py --verify-manifest
```

选择用户项目中的新输出目录，避免覆盖已手改数据。测量、复制原片、制备兼容媒体与前后代表帧：

```bash
python3 {baseDir}/scripts/prepare.py "<video>" --output-dir "<output>" --title "<title>"
```

默认全片；用户指定片段时在输出中记录原片时间偏移。原片不修改、不删除。只完成本地分析和提示词，不因 Skill 调用自动上传、生成付费视频或发布。

### 1. 核对镜头与全片

先看输出中的 `sheets/` 前后代表帧联系表和连续播放，再用全片采样定位镜内变化。代表帧不是严格首帧或尾帧。动作快速、角色混淆、接触模糊或切点可疑时，补看局部每源帧：

```bash
python3 {baseDir}/scripts/sample.py "<video>" --end <duration> --interval 0.5 --output-dir "<output>/review/full"
python3 {baseDir}/scripts/sample.py "<video>" --start <start> --end <end> --interval 0 --output-dir "<output>/review/focus"
```

采样映射 `frame-map.json` 来自解码 PTS，引用它作为局部时间证据。采样间隔随片型调整，不必给所有长片抽每源帧。

检测是候选切点。用切点邻帧区分真实切镜和遮挡、闪光、快速运动；确认漏切或多切时使用包内引擎补刀／并刀：

```bash
cd "<output>"
python3 {baseDir}/scripts/engine.py recut shots.json --track track.json --split <time> --merge <time> > shots.new.json
```

只传实际需要的 `--split` 或 `--merge`，可重复传入多个时间；成功后再替换底稿；重新抽帧与复核受影响镜头。重新补入 `frames`、人物角色和扩展分析字段。不可直接手改切点、时长、运动量或检测证据。`track.json` 由测量脚本生成。2.0 使用新的测量合同，已有报告需在新目录重新测量；不得把旧轨迹改名当作新测量。检测、时间精度、运动量和校验边界见 [engine-method.md](references/engine-method.md)。

### 2. 写分析与人物

读取 [analysis-method.md](references/analysis-method.md) 执行逐镜与六项拆解；景别、类别、运镜和节奏字段用 [taxonomy.md](references/taxonomy.md)。数据结构和默认值见 [report-input.schema.json](references/report-input.schema.json)，页面检查见 [report-qa.md](references/report-qa.md)。

在 `shots.json` 补视觉字段及 `title`、`fight`、`beats`、`cameraRead`、`spatial`、`remake`、`principalSubjects`、`backgroundSubjects`、`castPresence`。主要／背景身份按每个镜头变化，不能按某个固定角色 ID 一刀切。整镜都要检查，不能只凭两张代表帧决定出场。

人物按衣着、发型、道具与前后动作人工关联；不推断真实身份或隐藏往事。先看实际帧，选择清楚的角色或群体局部，在原像素坐标上裁头像：

```bash
python3 {baseDir}/scripts/crop_portrait.py "<video>" --time <time> --box <x> <y> <width> <height> --output "<output>/portraits/<ID>.jpg"
```

把返回的来源时间与裁切框放进人物记录。确认输出头像确实是该角色，不能用整镜多人画面冒充单人头像。

保存 `analysis.json`。每项包含原片可回看的证据、作用解释与用于自己作品的写法。现有镜头的 `remake` 和提示词属于重新制作设计；不能用它们倒填原片事实。像素运动量同时受主体与摄影机影响，不能直接等同于相机运镜。

### 3. 反推详细提示词

读取 [prompt-method.md](references/prompt-method.md)。共同设定明确角色、场景、质感和连续性。按原片镜头边界和镜内动作生成连续、覆盖全片的时间窗；每窗都写景别、机位／可选焦段建议、运镜、动作因果、切镜或镜内连续、结束状态。

不是只写“电影感、拳拳到肉”等形容词，也不是固定一个动作对应一刀。长镜内可有多个时间窗；硬切必须落在确认的切点，设计高度、焦段、接触和不可确认动作要注明属于重新制作建议。

保存 `timed-camera-prompts.json`，并将同一完整文本放进 `reverse-prompts.json` 的首项 `kind: timed`。再给共同设定、可执行分段、换故事版本，总体至少六份；分段数跟随实际长度和场景，不固定为三段。用户可逐段复制，人物外观、方位与伤势要衔接。

### 4. 构建与验收

```bash
python3 {baseDir}/scripts/validate_bundle.py --directory "<output>"
python3 {baseDir}/scripts/build_report.py --input "<output>/shots.json" --analysis "<output>/analysis.json" --prompts "<output>/reverse-prompts.json" --camera "<output>/timed-camera-prompts.json" --validation "<output>/validation.txt" --output-dir "<output>"
```

检查失败先修再交付。跳过的检查单列；结构通过不等于视觉判断已经正确。源码注释、帮助文案、页面标题和默认提示词都用 Fredtalk Shots 品牌；新视频的来源名称据实显示。

使用空闲本地端口启动报告，不重复占用已有服务：

```bash
python3 {baseDir}/scripts/serve_report.py --directory "<output>" --port <free-port>
```

按 [report-qa.md](references/report-qa.md) 在实际浏览器验收，核对全片连续播放、动作链、人物、提示词回看与复制、桌面和窄屏。时间／镜号独立一行，标题和正文在下方；任何时间标签与标题重叠都要修。

交付可直接打开的页面地址和目录，简述镜头数、分析与提示词范围，以及仍不能确认的实质内容。音轨保留、字幕读到、ASR完成、声效听辨分别记录，不能互相替代。

## 维护

修改脚本后运行 `python3 scripts/engine_selftest.py` 、`python3 scripts/bundle_selftest.py` 和 `python3 scripts/report_selftest.py`，再针对新增功能验证真实输出。`assets/manifest.json` 记录包内文件的哈希；修改后运行 `python3 scripts/write_manifest.py`，再用 `python3 scripts/doctor.py --verify-manifest` 检查。发布或移动包时保持完整目录，项目入口和本地注册镜像须一致。本包代码许可见 `LICENSE`，工具边界见 `NOTICE`；FFmpeg、ffprobe 和 Python 是外部运行工具，各自许可独立。正式目录与分发包不得包含缓存、旧引擎、旧自测或历史案例。
