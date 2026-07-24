# 百灵 Mynah · 交接文档

> **这份文档的目的**：让任何一个接手的人（人或 AI）在 30 分钟内搞清楚——这是什么、怎么跑、每个关键决策为什么这么做、哪些红线不能碰。
> 维护原则：代码是最终事实，但**「为什么」只活在这份文档里**。改了架构/决策/渠道，必须同步改这里。
> 中文「百灵」/ 英文「Mynah」。神鸟家族成员（玄鸟/金乌/青鸟/朱雀/百灵）。

---

## 一、30 秒上手

**这是什么**：Windows 上的 AI 语音输入工具。不是传统 IME，是「按住/按键说话 → 光标处出干净文本」的全局听写工具。核心差异化：**接入用户的 Obsidian 知识库**，越用越懂你。

**当前版本**：v0.4.1（2026-07-24）。

**它在哪**：
- 源码：`D:\cd\bailing`（本机）= `github.com/msaysay/bailing`（公开仓库，main 分支）
- 官网：`https://49.gx.cn/bailing/`（+ 教程页 `/bailing/guide/`）
- 云服务中转：`https://49.gx.cn/bailing-api/` → 腾讯云 `159.75.115.84` → MiMo
- 下载：GitHub Releases（主）+ 百度网盘（备用，链接在本文「对外渠道」节）

**怎么跑**：
```bash
npm install
cp .env.example .env   # 填 MiMo key（本地开发直连用；不填则默认走云服务）
npm start              # 默认热键 右 Ctrl：按住说话/松开出字，短按=持续录音再按停
npm run dist           # 打包（⚠️ 先读「打包红线」）
```

**主标语（全渠道统一）**：连着你的第二大脑，越说越懂你。

---

## 二、产品观：为什么做这个

**作者的判断（也是全案叙事根基）**：语音输入的**算法端大家都差不多**——识别准确率早就不相上下。真正的差距是「**它不认识你**」：人名/产品名/行业黑话次次写错，改一百遍第一百零一遍还错。要懂用户，靠手动维护词库没人坚持得下来。

**百灵的答案**：答案躺在用户的知识库里。让输入法自己去读笔记、自己学词、自己记住每一次修改。**识别算法谁都买得到，「懂你」只有接上第二大脑才能做到。**

护城河（对竞品）：竞品个性化靠手动词库 + 封闭云；百灵 = Windows+中文+接 Obsidian + 改一次永久记住的学习闭环。

---

## 三、当前状态速览

**架构一句话**：
```
App ─默认→ 49.gx.cn/bailing-api/（中转，服务器存 key，3000字/天/装机，作者承担）→ MiMo
   ─可选→ 用户自己的接入方（MiMo / DeepSeek / 任何 OpenAI 兼容端点 / 本地 Whisper）
```

**已落地**：核心管线、知识库 RAG、专名同音纠错+词库、场景感知、智能梳理、快速修正学习闭环、宣纸墨朱设计系统、首启四步引导、云服务中转、官网+教程页、GitHub 开源。

**已验证**：ASR 准确、RAG 不泄露进输出、专名纠错零误伤同音常用词、学习闭环生效、防指令执行回归测试通过、云服务端到端（额度计数/转发/429）全通、每版打包可启动。

**待真机长期验证**：端到端手感、悬浮窗在各类壁纸上的观感、云服务在真实用户量下的成本。

---

## 四、管线与文件地图

管线：`全局热键(uiohook) → 录音(16k WAV) → ASR → 专名同音纠错 → [RAG 检索知识库] → 场景感知润色(可梳理结构) → 术语/专名兜底 → 剪贴板+Ctrl+V 注入 → 存 lastResult 供快速修正`

| 文件 | 职责 |
|---|---|
| `src/main/main.js` | 主进程：窗口/托盘/热键/全部 IPC/数据搬迁/引导窗 |
| `src/main/hotkey.js` | 双模式热键（长按 ptt/短按 toggle），**自跟踪按键状态**（v0.4.1 重写） |
| `src/main/pipeline.js` | 管线编排 |
| `src/main/provider.js` | **提供方层**：决定 ASR/润色走云服务还是 BYOK 直连 |
| `src/main/asr/` | mimo（MiMo 格式）/ openai-audio（Whisper API 通用格式）/ whisper-local / 工厂 index.js |
| `src/main/polish.js` | 润色 + **防指令执行 prompt**（血泪教训，见下） |
| `src/main/kb.js` | 知识库 RAG（本地 TF-IDF） |
| `src/main/names.js` | 专名同音纠错 + 词库建议（pinyin-pro） |
| `src/main/terms.js` | 词库 + L1 学习（learnCorrection） |
| `src/main/scene.js` | 场景感知（active-win 读前台窗口） |
| `src/main/inject.js` | 注入：结果**始终留剪贴板** + 可选自动粘贴 |
| `src/main/settings.js` | 用户设置（含 installId 装机 ID、onboarded、providerMode） |
| `src/renderer/` | indicator(悬浮 HUD) / settings / termlib / correction / welcome(首启引导) / preload |
| `relay/server.js` | **云服务中转**（服务器端，Node 单文件无依赖） |
| `site/` | 官网静态页（index.html + guide/） |
| `scripts/` | test-*（回归）/ gen-icons（图标生成）/ preview-*（离屏截图自检）/ import-vocab |
| `docs/` | 本文档 + website-content.md（官网文案定稿） |

---

## 五、关键决策与为什么（本档案的灵魂）

### 1. 为什么云服务要走「服务端中转」，而不是把 key 封装进客户端
**客户端藏 key 无解**——打进二进制的 key，任何会解包/抓包的人都能提出来。唯一真方案：key 只存腾讯云，App 默认请求 `49.gx.cn/bailing-api/`，服务器代签转发 + 按装机 ID 限额（3000 字/天）。**中转不记内容只记字数**（隐私红线，写进官网 FAQ）。用户要无限用/换算法，自己去设置页配 BYOK。

### 2. 为什么用装机 ID 而不是账号系统
免费额度只需要一个闸门，不需要用户体系。首启生成随机 UUID 存 settings.json，匿名、零摩擦。防刷靠「每 IP 每日新装机 ID 上限 20」。**明确不做**：账号、付费充值。

### 3. 为什么润色 prompt 有「防指令执行」最高优先级规则（血泪教训，v0.3.1/v0.4.1）
真实事故：用户口述「帮我基于官网写一篇公众号文章」，模型把指令当真，直接产出成稿文章；说「帮我整理一下桌面的文档」，它反问「请问您想怎么整理」。**语音输入的用户会口述命令给别的 AI 用，输入法必须只转录不执行。**修复：system prompt 两条最高规则（不执行 + 禁止对话式回应）+ user 消息加【口述原文】标记。回归测试：`scripts/test-antijailbreak.js`（改 prompt 必跑）。

### 4. 为什么专名纠错靠「确定正字词库 + 拼音纠错」，而不是纯扫知识库
**频次会骗人**（笔记里错写可能比正字出现更多次）、库里没有的名字变不出。可兑现机制 = 一份用户确认过正字的词库 + 同拼音同长才替换的保守纠错。词库收敛四条腿：KB 自动建议（虚词字过滤+LLM 分批过滤）→ 手动加 → **L1 改错学习闭环（越用越准的真引擎）** → RAG 软兜底。

### 5. 为什么 RAG 用本地 TF-IDF 而不是嵌入 API
零成本、离线、快（136 篇/716 块/~150ms）、隐私（笔记一个字都不出本机）。排噪三招：excludeDirs 排除流水目录、IDF≥3.5 锚点词过滤、prompt 明令「背景仅帮理解，严禁加进输出」。

### 6. 为什么悬浮窗是不透明 + roundedCorners，而不是透明窗/胶囊
血泪史：① 透明窗在作者机器上露灰方块（疑该机透明合成不支持）；② setShape 条带裁形无抗锯齿，边角必然锯齿；③ 后来描边补丁也很丑。终解：**不透明窗 + `roundedCorners:true`**（Win11 DWM 原生圆角+原生投影，系统级抗锯齿）。代价：圆角只有 ~8px（是卡片不是胶囊）；Win10 退直角但投影还在，可接受。

### 7. 为什么设置页等窗口是无边框 + 自绘按钮
Electron `titleBarOverlay` 的系统按钮是一块独立色块，跟墨底 hero 气质冲突（用户原话「突兀」）。改 `frame:false` + 自绘 min/close 幽灵钮（`win:control` IPC），hero 兼拖动区。

### 8. 为什么结果始终留剪贴板
自动粘贴可能因焦点丢失失败。**剪贴板是兜底**——焦点丢了用户也能 Ctrl+V，永不丢字。

### 9. 为什么 indicator 是 focusable:false
不抢焦点，文本才能注入回用户原来在用的 App。

### 10. 为什么 ASR/润色默认 MiMo
一个 key 同时搞定 ASR（mimo-v2.5-asr，¥0.5/小时）和润色（mimo-v2.5-pro），中文强、自带标点，配置最简单。它是推理模型，**关思考用 `enable_thinking:false` + `thinking:{type:'disabled'}`，max_tokens 给足 3000**。

### 11. 为什么 Electron（而不是 Tauri/原生）
测试期团队熟、出活快。生产版可评估 Tauri 重写降常驻内存（roadmap，未启动）。

### 12. 为什么热键自己跟踪按键状态（v0.4.1 重写）
旧实现依赖 uiohook 事件瞬间的修饰键标志，按压顺序稍不对（先按主键后按修饰键）就丢触发。改为全程维护 pressedSet。另：**空格（打字冲突）、Alt+空格（系统菜单占用）不建议绑**，设置页有提示。

---

## 六、操作手册

### 开发
- 跑起来：`npm install && npm start`（默认走云服务；本地直连 MiMo 就 cp .env.example .env 填 key）
- 无麦克风验证：`npm run test:polish`、`node scripts/test-antijailbreak.js`（改 prompt 后必跑）
- 视觉自检（离屏截图）：`npx electron scripts/preview-indicator.js`（悬浮窗四态）/ `preview-settings.js` / `preview-welcome.js` / `preview-site.js`
- 图标：`npx electron scripts/gen-icons.js`（改鸟形要同步 indicator.html/settings.html 内联 SVG）

### 打包（⚠️ 三条红线，都出过事）
```bash
cp .env .env.real-backup && cp .env.example .env && \
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
npm run dist && mv .env.real-backup .env
```
1. **`.env` 会被 `extraResources` 打进安装包**——对外发包前必须换占位 .env（曾误带真 key 上线，已泄露轮换）。
2. **`data/` 只放行 `terms.default.json`**（package.json filter）——history/learned 等个人数据绝不进包（曾误带）。
3. **原生依赖重建要访问 GitHub**（node-pre-gyp 下二进制）——打包需能通 GitHub（作者环境=开 VPN）。
4. 提交前**检查 `git status`**：曾把 `.env.real-backup` 误 `git add -A` 提交进公开仓库（已重写历史清除）。`.gitignore` 已收录，但永远先看一眼再提交。

### 部署（作者环境特殊：**连 GitHub 要开 VPN，连腾讯云 SSH 要关 VPN，互斥**）
- 服务器：`root@159.75.115.84`，密钥 `D:/cd/ssjf-deploy/secrets/deploy_ed25519`。
- **铁律：别动坊主会（xiakehui.conf 其他块）/知更（/zhigeng/）/aiops（根路径）的配置**。改 nginx 前先备份 conf。
- 官网：`scp site/... → /var/www/bailing/`。
- 云服务：`relay/deploy.sh`（systemd `bailing-relay`，node 在 `/root/.nvm/versions/node/v22.22.0/bin/node`——**不写 /usr/bin/node，曾 203/EXEC**）。key 在服务器 `/var/www/bailing-relay/secrets.env`（不进 git）。
- ssh 命令行里直接改 nginx 转义极易踩坑——**把修改脚本 scp 上去执行**，别在 ssh 行内嵌套引号。

### 发布节奏（用户拍板 v0.4.1 起）
**先本地验证、用户点头，再发 GitHub/官网**——不每轮都发，防带 bug 上线。

---

## 七、对外渠道

| 渠道 | 位置 |
|---|---|
| GitHub | `github.com/msaysay/bailing`（公开；推送用本机 git 凭据 msaysay） |
| 官网 | `https://49.gx.cn/bailing/`（+ `/guide/` 教程页） |
| 云服务 | `https://49.gx.cn/bailing-api/`（relay 127.0.0.1:8350） |
| 百度网盘 | `https://pan.baidu.com/s/1BbicfCfsBgCmAUKcXigw0Q?pwd=83vw`（提取码 83vw，用户自传） |
| 下载文件名 | `BailingMynah-Setup-x.y.z.exe`（ASCII 名——GitHub 会吞中文文件名） |

**凭证纪律**：MiMo key 只许出现在三处——本机 `.env`（gitignore）、服务器 `secrets.env`、小米后台。**绝不进源码/文档/安装包**。

---

## 八、已知坑清单

1. 透明窗灰方块（该机特性）→ 不透明 + roundedCorners（见决策 6）。
2. 润色延迟不稳（2–4s，偶发 10s，MiMo 云端抖动）→ 设置页润色开关；可换快模型。
3. Electron 离屏出图两坑：该机连续建第二个隐藏 BrowserWindow 会失败（复用一个窗）；窗口小于 ~512 会被 Windows 撑回去导致裁切（小图先大渲染再 resize）。
4. 托盘 base64 必须脚本读 PNG 写文件（gen-icons.js），手贴会截断。
5. PowerShell 变量大小写不敏感（`$AI`=`$ai` 会撞车）。
6. GitHub 资产文件名用 ASCII（中文会被吞成乱码名）。
7. 打包的 `npm run dist` 偶发原生重建网络失败——重试即可（GitHub 抖动）。

---

## 九、路线图

- **选文整理**：选中任何文字 → 热键 → 整理/改写回填（Typeless 的 polish existing text，用户已点名）。
- **「它学会了多少」可视化**：已学词数/修正条数（L4 语音记忆雏形）。
- **L2 风格画像**：从采纳文本学个人语气。
- **英文/技术词纠错**：音译→英文（克劳德→Claude）。
- **知识库回流**：有价值口述沉淀回 Obsidian。
- **商业化**：授权/自启、（可选）Tauri 重写。
- 竞品分析参考：`docs/COMPETITIVE_TYPELESS.md`（Typeless 深度拆解，**仅本地，含竞品内部细节，不进公开仓库**）。

---

## 十、版本变更（倒序，只记决策级）

- **v0.4.1**：修三真机 bug——悬浮窗被旧隐藏计时器误藏；组合键重写（自跟踪按键状态）；润色禁止对话式回应。
- **v0.4.0**：开箱即用——云服务中转 + provider 层 + 通用接入方 + 首启引导 + 教程页。
- **v0.3.1**：防指令执行（见决策 3）。
- **v0.3.0**：设计系统 v2「宣纸墨朱 × 苹果 HUD」（见决策 6/7）+ 多分辨率 ICO。
- **v0.2.x**：L1 学习闭环、词库覆盖率、场景感知+数字规范化、专名同音纠错。
- **v0.1.x**：核心链路、热键修复、RAG 上线、首个打包版。

## 决策已定（用户拍板，勿翻案）
- 定位：给构建知识库的人做的新时代语音输入法；神鸟家族成员。
- 免费策略：云服务每日 3000 字作者承担；不配 key 低成本版/订阅制。
- 叙事不提「作者不懂代码」（加深不安全感）；讲「算法同质化，知识库是分水岭」。
- 对外材料不出现作者业务名（肆拾玖坊等）与具名竞品；示例用虚构词（云杉/星宸/沈婷）。
