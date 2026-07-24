# 百灵 Mynah · 交接文档

> 续开发先读本文件顶部。中文「百灵」/ 英文「Mynah」。神鸟家族成员（玄鸟/金乌/青鸟/朱雀/百灵）。

## 🔴 当前状态（2026-07-24 · v0.3.0）

**一句话**：Windows AI 语音输入，越用越懂你。核心链路 + 知识库 RAG + 专名同音纠错 + 专名词库 + 场景感知 + 智能梳理结构 + 快速修正学习闭环全部落地；**v0.3.0 完成 UI 重设计：宣纸墨朱 × 苹果 HUD**。

**产物**：`dist/百灵Mynah-安装包-0.3.0.exe`（NSIS 免管理员，桌面快捷方式「百灵」）。默认热键 **右 Ctrl**（按住说话/松开出字，短按=持续录音再按停）。

**对外渠道（2026-07-24 上线）**：
- **GitHub**：`github.com/msaysay/bailing`（开源，main 分支；Release v0.3.0 挂**无 Key** 安装包 `BailingMynah-Setup-0.3.0.exe`）。推送用本机 git 凭据（msaysay）。
- **官网**：`https://49.gx.cn/bailing/`（静态单页，源在 `site/`）。服务器 `root@159.75.115.84`（密钥 `D:/cd/ssjf-deploy/secrets/deploy_ed25519`），目录 `/var/www/bailing`，Nginx 在 `xiakehui.conf` 的 49.gx.cn 块加了 `location /bailing/ { alias /var/www/bailing/; }`——**别动坊主会/知更/aiops 的块**。
- **百度网盘**：`https://pan.baidu.com/s/1Vs5IUEae33lyUsRgv_NOpA`（提取码 hisb，用户自传无 Key 包）。
- ⚠️ **打包红线**：`extraResources` 会把 `.env`（含 key）打进安装包。**对外发包前必须临时换成 .env.example 再 dist**（首版曾误带 key 上线，已换无 Key 版，用户已知情需重置 key）。
- 主标语（全渠道统一）：**「连着你的第二大脑，越说越懂你」**。官网文案定稿在 `docs/website-content.md`。

**v0.3.0 设计系统（宣纸墨朱 × 苹果极简）**：
- **形态**：悬浮窗改 **200×60 HUD 圆角卡片**，`roundedCorners:true`（Win11 DWM 原生圆角+投影，系统级抗锯齿），**废弃 setShape 条带裁形**（无抗锯齿、边角必然锯齿）。无描边无 inset 高光。
- **色板**：`--paper #FAF7F1 宣纸` / `--ink #2A2723 墨色` / `--ink-dim #8C857A 灰墨` / `--zhu #C8402A 朱砂`（深色：#201D1A/#F0EBE2/#8F887B/#E05A44）。青蓝渐变全项目废弃。
- **图标**：白描线条鸟（闭合圆身一笔 + 外卷尾 + 朱砂眼点），`scripts/gen-icons.js` 用 Electron 离屏渲染 SVG 出 PNG（bird-badge 512 / icon 1024 / tray 64 + 自动重写 tray-icon.js base64）。**改鸟形要同步 gen-icons.js 与 indicator.html 内联 SVG 两处**。
- **细节**：波形 9 根墨色圆头短柱；「改错」改朱砂方章样式；删 proc 态 `⌄`（200px 宽度挤不下）；`scripts/preview-indicator.js` 可离屏截四态图自检。
- 设置/词库/修正三页同步换肤（墨底 hero + 朱砂强调，结构未动）。

**已验证 ✅（node 脚本 + 打包版启动）**
- 全链路只靠一个 MiMo key：ASR 100% 准，润色关思考 2–4s。
- RAG 检索到相关笔记、专名不泄露进输出。
- 专名纠错实测：季婷→冀婷、四十九坊→肆拾玖坊、太抖酒→泰斗酒，且「四十九个/经理开会」零误伤。
- 词库覆盖：泰斗/宗师/茅台/肆拾玖坊 均能从 KB 挑出。
- 场景润色：doc 规范化数字、code 保留原样；梳理模式把交错口述归并成分类结构。
- 学习闭环：教「太抖→泰斗」后「太抖酒→泰斗酒」。
- 每版打包启动无崩溃。

**仅剩需人在键盘/麦克风前验的**
- 真实按键触发 + 录音 + 注入回 App 的端到端手感。
- v0.3.0 新悬浮窗真机观感：DWM 圆角/投影、宣纸白卡在白底上的分离度（无描边，靠原生投影）。
- 悬浮窗「改错」按钮在 focusable:false 窗能否点击（点不动有托盘「修正上一句…」兜底）。

---

## 架构 / 关键文件

管线：`全局热键(uiohook) → 录音(16k WAV) → MiMo ASR → 专名同音纠错(names.correct) → [RAG 检索 Obsidian] → 场景感知润色(polish, 可梳理结构) → 术语纠正+专名纠错兜底 → 剪贴板+Ctrl+V 注入 → 存 lastResult 供快速修正`

- `src/main/main.js` — 主进程：窗口(悬浮/设置/词库/修正)、托盘、热键、全部 IPC、打包数据搬迁、悬浮窗 roundedCorners、主题、场景抓取。
- `src/main/hotkey.js` — uiohook 双模式热键（长按 ptt / 短按 toggle），`keyToCode` 支持几乎全键盘 + 单修饰键（RightCtrl）。回退 globalShortcut。
- `src/main/pipeline.js` — 编排 ASR→专名纠错→RAG→润色→术语/专名兜底→落历史。
- `src/main/asr/` — `mimo.js`(默认 mimo-v2.5-asr) / `whisper-local.js` / `huoshan`,`xunfei`(待接)。工厂 `index.js`。
- `src/main/polish.js` — MiMo 润色，关思考；prompt 注入 场景规则(chat/code/email/doc/social)+数字规范化(code 除外)+风格+热词+知识库背景+**可选梳理模式**(`opts.structure`)。
- `src/main/kb.js` — **知识库 RAG**（本地 TF-IDF，见下）。
- `src/main/names.js` — **专名同音纠错 + 词库建议**：`correct(text,terms)` 拼音同长纠错；`suggestRaw()` 从 KB 提候选（虚词字过滤+去片段）；`candidates()` 频次法。用 pinyin-pro。
- `src/main/terms.js` — 词库：`loadAll/getLibrary/saveLibrary`(hotwords+corrections)、`learnCorrection/removeCorrection`(L1 学习)、`applyCorrections`(精确替换)。
- `src/main/scene.js` — **场景感知**：active-win(动态 import) 读前台 App+标题 → chat/code/email/doc/social。
- `src/main/inject.js` — 注入：结果**始终留剪贴板** + 可选自动粘贴。
- `src/main/store.js` `settings.js` `config.js` — 本地JSON/用户设置/配置。
- `src/renderer/` — `indicator.*`(悬浮 HUD 卡+改错方章)、`settings.*`(设置页)、`termlib.*`(专名词库页)、`correction.*`(快速修正页)、`preload.js`、`bird-badge.png`、`tray.png`。
- `src/main/tray-icon.js` — 托盘图标内嵌 base64（**由 scripts/gen-icons.js 生成，勿手改**）。
- `build/icon.png` — App 图标（1024）。`build/icon.ico` — 多分辨率 ICO（16~256，尺寸自适应，桌面/任务栏/开始菜单用）。`scripts/` — test-asr/pipeline/polish、import-vocab、**gen-icons（图标三件套+ICO+托盘 base64）**、**preview-indicator（离屏截悬浮窗四态自检）**、**preview-settings（离屏截设置页自检）**。
- **原生依赖**（都要 asarUnpack）：uiohook-napi(热键)、@nut-tree-fork/nut-js(Ctrl+V)、active-win(场景)、pinyin-pro(纯 JS 无需 unpack)。

---

## 知识库 RAG（`src/main/kb.js`）

- **本地 TF-IDF 检索**，零嵌入 API、离线、快。中文 2-gram + 英文词分词。
- 索引 Obsidian 库：默认 `C:/Users/chenn/Documents/赚钱/ChenNing-Operating-Wiki`（`config.kb.vaultPath`，可设置页改）。
- **排噪**：`excludeDirs` 默认排除 07_Logs/02_Raw_Sources/10_Journal/09_Scripts/11_Finance/05_Templates/99_Attachments 等原始/流水目录（转写稿噪声大）。当前有效 136 篇/716 块/~150ms。
- **锚点词过滤**：命中必须匹配到 IDF≥3.5 的稀有区分词，避免只撞常见字的噪声。`minScore=5`。
- **注入**：`pipeline` 用 ASR 原文检索 top3 → 拼成背景喂 `polish`，prompt 明令「仅帮理解领域/写对专名，严禁加进输出」。
- **交付自动建索引**：设置页「选择文件夹」按钮 → `kb:pickFolder` IPC（dialog）→ 自动 save + reindex + 显示篇/块数。支持 .md/.txt/.markdown。别人拿到软件选自己的库即自动建 RAG。启动 `kb.warmup()` 后台预建。
- IPC：`kb:status` / `kb:reindex` / `kb:pickFolder`。

---

## 「把东西写对」= 专名纠错 + 词库 + 学习（`names.js` / `terms.js`）

**核心真相**（用户戳中，务必记住）：纯扫知识库**保证不了**名字对——频次会骗人（笔记里「四十九坊」804 次 > 「肆拾玖坊」494 次，但正字是肆拾玖坊）、库里没有的（张传宗 0 篇）变不出。**可兑现机制 = 一份「确定正字」的专名词库 + 拼音纠错**，词库靠四条腿收敛到高覆盖：

1. **自动 bootstrap**：`names.suggestRaw()` 从 KB 提候选（**虚词字过滤**：含 的/了/我/们/这 的 n-gram 不是专名 → 滤掉后专名浮上来；+ 去 n-gram 片段 + 去 frontmatter 噪声）→ `terms:suggest` IPC **分批(300/批)过 MiMo** 只留真专名。实测挖出 泰斗/宗师/茅台/肆拾玖坊 等。词库页可「全部加入」。
2. **手动加**：低频人名（冀婷）、库里没有的（张传宗）。
3. **L1 学习闭环（快速修正）**：出字后悬浮窗「改错」/托盘「修正上一句…」→ `correction.html` 填「听成了→应该是」→ `terms.learnCorrection` 存 corrections+hotwords → 下次自动对。**这是覆盖长尾、越用越准的真引擎。**
4. **RAG 软兜底**：即使词库没收，LLM 看到相关笔记也常能写对。

**纠错怎么跑**：`names.correct(text, hotwords)` 对 ASR 文本滑动重叠窗口，**同拼音+同长+不同字**才替换（季婷→冀婷、太抖→泰斗；「四十九个/经理开会」不动）。管线在 ASR 后先纠（让 RAG/润色用对的名字）+ 末尾再纠兜底 + `applyCorrections` 精确替换。IPC：`terms:library/save/suggest`、`terms:learn/removeCorrection`、`termlib:open`、`correction:open/last`。

## 场景感知 + 润色（`scene.js` / `polish.js`）
- **场景感知**：录音开始时 `scene.detect()`（active-win 读前台）→ 存 `recordScene`，`detectScene()` 回落 `defaultScene`。映射：微信/钉钉/飞书→chat、VSCode/终端→code、Outlook→email、Word/Obsidian→doc、小红书→social、浏览器按标题启发式。设置有「自动识别场景」开关。
- **润色强化**：场景规则细化 + **数字/日期/金额规范化**（两千三→2300、下午三点→下午3点，**code 场景保留原样**）。**智能梳理结构**开关(`structureMode`→`config.polish.structure`)：开了把交错重复颠倒的口述归并成分类结构（小标题/编号），关=线性整理。

---

## 设计系统（用户在设计工具定稿，代码实现）

- **品牌色（v0.3.0 起）**：宣纸墨朱——宣纸 `#FAF7F1` / 墨色 `#2A2723` / 灰墨 `#8C857A` / 朱砂 `#C8402A`（深色 #201D1A / #F0EBE2 / #8F887B / #E05A44）。青蓝渐变已废弃。
- **图标/鸟标（v0.3.0 起）**：白描线条鸟——墨圆底 + 宣纸色闭合圆身一笔 + 外卷尾 + 朱砂眼点。App 图标 = 宣纸 squircle 托居中墨圆鸟标。托盘/头像 = 纯墨圆鸟标。**全部由 `scripts/gen-icons.js` 渲染 SVG 生成（Electron 离屏 capturePage），改鸟形同步改 gen-icons.js 与 indicator.html/settings.html 内联 SVG 后重跑 `npx electron scripts/gen-icons.js`。** **小尺寸不糊的关键**：`build/icon.ico` 是 16~256 七档多分辨率 ICO，每档**尺寸自适应**（线条加粗 2.2→3.8、墨圆放大 0.62→0.84），脚本手工打包 ICO 格式；`package.json` 的 `win.icon` 指向 `build/icon.ico`。设置页/悬浮窗头像一律用**内联 SVG**（矢量永不糊），不再引用 PNG。
- **悬浮 HUD 卡**（`indicator`）：不透明窗 200×60 + `roundedCorners:true`（Win11 DWM 原生圆角+投影，系统级抗锯齿），主题自适应（浅=宣纸/深=墨底）。左=白描鸟圆徽（内联 SVG）；中=墨色波形(录音)/文字；右=计时`0:03`+朱砂闪烁点(录音) / 朱砂方章「改错」(完成) / 朱砂`!`(未听清)。录音计时、处理中墨色流光、完成淡入。无描边——原生投影负责与背景分离。
- **设置页**：墨底 hero + 白描鸟内联 SVG 头像 + 分组卡片，朱砂强调色；**无边框窗 + 自绘窗口按钮**（`frame:false`，min/close 幽灵钮画进墨底 hero，悬停 close 变朱砂；`win:control` IPC；hero 兼拖动区）。主标语：**「连着你的第二大脑，越说越懂你」**（知识库是核心差异化，对外统一用这句）。内容：快捷键捕获 e.code / ASR 引擎 / 润色开关 / **智能梳理结构** / 自动粘贴 / **自动识别场景** / 默认场景 / 润色模型 / BYOK API Key+测试连接 / 知识库开关+选文件夹+重建索引 / **专名词库管理入口**。
- **专名词库页** `termlib.*`：我的词库(chips 增删) + 从 KB 挑专名(点选/全部加入) + 手动加。朱砂 chip 配色。同款无边框自绘按钮。
- **快速修正页** `correction.*`：显示上次结果 + 填「听成了→应该是」+ 最近修正列表。同款无边框自绘按钮。

---

## 版本变更（倒序）
- **v0.3.0**：UI 重设计「宣纸墨朱 × 苹果 HUD」——悬浮窗改 200×60 圆角卡片（roundedCorners 替代 setShape，边角干净+原生投影回归，去描边）；白描线条鸟图标（gen-icons.js 生成，**多分辨率 ICO 尺寸自适应，小图标不糊**）；青蓝渐变全废弃，四页面统一宣纸墨朱；「改错」改朱砂方章；**三窗口无边框 + 自绘 min/close 幽灵钮融进墨底 hero**（frame:false + win:control IPC，弃用 titleBarOverlay 系统色块）；主标语定稿「**连着你的第二大脑，越说越懂你**」。
- **v0.2.1**：L1 学习闭环·快速修正（悬浮窗改错按钮/托盘「修正上一句」→ correction 页教「听错→正字」→ learnCorrection 永久记住）。
- **v0.2.0**：词库覆盖率（虚词字过滤+大池分批过 LLM，挖出泰斗/宗师）+「全部加入」；智能梳理结构开关。
- **v0.1.9**：真场景感知（active-win 读前台自动切档）+ 润色强化（数字/日期规范化，code 保留）。
- **v0.1.8**：专名词库设置页（KB 自动建议→确认）+ 专名同音纠错接管线（names.js，pinyin-pro）。
- **v0.1.7**：白胶囊加描边（白底分离）+ 胶囊缩到 236×56 + 设置头像换鸟标 + hero 改青蓝。
- **v0.1.6**：落地用户自设计视觉——青蓝渐变圆+白胖歌鸟图标；悬浮窗重做成设计稿样式（白/深胶囊+鸟头像+波形+计时红点/⌄/未听清）。
- **v0.1.5**：悬浮窗改不透明+setShape 真圆角胶囊（根治灰块）；交付自动建索引（选文件夹 IPC）；图标一度改暖色旋律波（后被 v0.1.6 覆盖）。
- **v0.1.4**：知识库 RAG（kb.js）上线并接入管线。
- **v0.1.3**：热键真因修复（捕获改 e.code，小键盘/左右修饰键可绑）；灰块改不透明窗兜底。
- **v0.1.2**：5 条真机反馈（关硬件加速试灰块/剪贴板兜底/扩键位/图标/完成动效）。
- **v0.1.1**：托盘图标内嵌 base64（修根因）+ 默认热键改右 Ctrl。
- **v0.1.0**：首个打包版。

---

## ⚠️ 已知取舍 / 坑
1. **透明窗在该机器一直露灰方块**（hasShadow/关硬件加速都压不住，疑该机透明合成不支持）→ 悬浮窗用**不透明窗**。v0.3.0 起圆角方案为 **`roundedCorners:true`**（Win11 DWM 原生圆角+原生投影，系统级抗锯齿），替代旧 setShape 条带裁形（无抗锯齿、边角锯齿、且无原生投影需描边补丁）。**代价**：圆角只有 ~8px（是卡片不是胶囊）；Win10 上 roundedCorners 无效退回直角（DWM 投影仍在，可接受）。
2. **润色延迟不稳**：关思考多为 2–4s，偶发 10s（MiMo 云端抖动）。策略：ASR 已带标点，可「短按只 ASR 秒出/长按走润色」；设置页有润色开关；生产可换更快模型。
3. **MiMo 是推理模型**：`max_tokens` 给足（3000）；关思考用 `enable_thinking:false`+`thinking:{type:'disabled'}`。
4. **打包**：首次需 npmmirror 镜像绕 GitHub：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ npm run dist`。可写数据搬 userData（`app.isPackaged` 时设 `BAILING_DATA_DIR`，首启从 resources/data 播种）；key 走 resources/.env。
5. **PowerShell 变量大小写不敏感**（`$AI`=`$ai` 会撞车，画图时改名）。**托盘 base64 必须脚本读 PNG 写文件，手贴会截断**（现由 gen-icons.js 自动重写）。**Electron 离屏出图两个坑（gen-icons.js 已绕开）**：这台机器连续建第二个隐藏 BrowserWindow 会 loadFile 失败（复用一个窗）；窗口小于 ~512 会被 Windows 撑回去导致裁切（小图先大渲染再 nativeImage.resize）。
6. **indicator `focusable:false`**：不抢焦点才能注入回原 App。

---

## 对标（差异化护城河）
- 调研过市面上多种语音输入/听写工具（Mac/Win、订阅制/端侧、输入法大厂）：共性短板是**个性化靠手动维护词库、数据上封闭云、不懂用户领域**。
- **百灵差异**：Windows+中文+**接 Obsidian 双向**——入=第二大脑自动变词库/RAG，出（待做）=有价值口述沉淀回 Obsidian。「越用越懂你」的自动学习是护城河。

## 决策已定（用户拍板）
- 定位：神鸟家族商业新成员（自用+外售同码分 DB，照青鸟模式）。
- ASR：云端优先（默认 MiMo；生产可切火山/讯飞）。
- 知识库：先做 RAG（已完成）+ 整个 ChenNing-Operating-Wiki 库。
- 视觉：用户设计工具定稿（青蓝鸟标），代码已实现。

## 凭证
- MiMo key 在 `.env`（已 gitignore），本会话用户提供，仅运行用，勿写入交付文档/源码。
- 端点 `https://api.xiaomimimo.com/v1`；ASR=`mimo-v2.5-asr`，润色=`mimo-v2.5-pro`。

## 已完成里程碑
- ✅ 核心链路 + 双模式热键 + 剪贴板兜底 + 打包交付
- ✅ 知识库 RAG（接 Obsidian，交付自动建索引）
- ✅ 专名同音纠错 + 专名词库（KB 自动建议 + 手动 + 全部加入）
- ✅ 场景感知（L3，active-win 真检测）+ 润色强化（数字规范化 + 智能梳理结构）
- ✅ L1 学习闭环（快速修正，越用越准）
- ✅ 设计系统 v2（宣纸墨朱 × 苹果 HUD，白描线条鸟，DWM 原生圆角）

## 路线图 / 下一步
- **对外获客（用户点名要，最优先）**：产品页(Hero=接入你第二大脑·懂你领域；人群=Obsidian 知识工作者)+公众号文章。文案初稿+定位已对齐（见对话）。下载挂 GitHub Releases + 百度网盘（零占服务器），底部留用户二维码+介绍。
- **英文/技术词纠错**（下一个高频错场景）：音译→英文（克劳德→Claude、欧博西丁→Obsidian）+ KB 自动提英文词。
- **知识库·沉淀回流**：有价值口述自动/一键归档回 Obsidian（说得越多，第二大脑越丰富）。
- **L2 风格画像**：从采纳文本学个人语气 + 「语音记忆」可视化页。
- **商业化**：授权/自启、同码分 DB、（可选）Tauri 重写降常驻内存。
- 待用户真机确认：悬浮窗描边/改错按钮点击（见「仅剩需人验的」+「已知取舍」1）。
