# 对标拆解：Typeless 2.1.0（Windows）

> 拆解日期：2026-07-24　拆解对象：本机安装的 Typeless v2.1.0 x64
> 目的：找出百灵 Mynah 应该学什么、不该学什么、以及我们真正的护城河在哪
> 本文只做分析，不含任何代码改动

---

## 0. 拆解方法与证据来源

不是看官网吹的，是把安装包扒开逐层看的。证据文件：

| 证据 | 位置 | 价值 |
|---|---|---|
| 程序目录 | `%LocalAppData%\Programs\Typeless\` | Electron 32，5 个自研原生 DLL |
| `resources/drizzle/*.sql` | 12 个迁移文件 | **完整数据模型 = 产品思路的化石记录** |
| `resources/locales/en/index.json` | 73KB / ~1200 条 | **全量 UI 文案 = 完整功能地图 + 官方话术** |
| `app.asar` (287MB) | 11127 个文件 | 依赖全景、主进程逻辑（已混淆但字符串表可读） |
| `%AppData%\Typeless.exe\` | app-settings.json / typeless.db / Recordings/*.ogg | **你本机的真实运行记录 = 真实请求结构** |

数据模型的迁移历史特别有价值——能看出他们一路加了什么：
`focused_app` → `focused_app_window_web_domain/url` → `mode` → `mode_meta` → 最后 `history_v2` 重建表。
这条演进线就是"从单纯听写 → 场景感知 → 多模式"的产品路径。

---

## 1. 技术栈全景

```
Electron 32 + React + Vite
├─ 原生能力：5 个自研 DLL，用 koffi (FFI) 调用，不是 node-gyp
│   ├─ ContextHelper.dll    读前台 App / 焦点输入框 / 光标前后文 / 选中文本  ← 最关键
│   ├─ InputHelper.dll      insertText(text) / insertRichText(html, text)
│   ├─ KeyboardHelper.dll   全局快捷键（独立子进程 keyboard-helper-child-process.js）
│   ├─ UtilHelper.dll       系统信息 / 静音背景音
│   └─ libopusenc.dll       Opus 编码
├─ 本地库：better-sqlite3 + drizzle-orm（本地 typeless.db）
├─ 云同步：@libsql/client（Turso）
├─ 图表：echarts（个性化报表、用量统计）
├─ 其他：winax(COM)、undici、crypto-js、diff、csv-parse、node-schedule
└─ 监控：Sentry + OpenTelemetry + Mixpanel
```

**关键结论：模型全在云端。**本地没有任何 ASR/LLM 权重（287MB 全是 koffi 各平台二进制 + echarts + libsql）。
唯一接口是 `https://api.typeless.com`。

有一条决定性线索：主进程里出现 `https://vertexaisearch.cloud.google.com/grounding-api-redirect/` —— **Ask Anything 用的是 Gemini + Google Search Grounding**，这解释了官方文案里"你的模糊线索 → 精确的书名""用它自己的知识补完你的想法"。

---

## 2. 产品结构：三模式 + 一根悬浮条

你本机 `app-settings.json` 的真实配置：

```json
"featureShortcutBindings": {
  "dictationMode":     ["RightAlt"],              // 口述
  "askAnythingMode":   ["RightAlt+Space"],        // 问一切 / 改选中文本
  "translationMode":   ["RightAlt+RightShift"],   // 翻译
  "pasteLastTranscript": ["LeftCtrl+RightShift+V"] // 重贴上一条
}
```

| 模式 | DB 里的 mode | 官方一句话 | 做什么 |
|---|---|---|---|
| Dictate | `voice_transcript` | 杂乱的想法 → 清晰的文字 | 说话 → 润色 → 注入光标处 |
| Ask anything | `voice_command` | 编辑或询问文本 | **选中文本**后说指令：可编辑区就改写，只读区就回答 |
| Translate | `voice_translation` | 自然口语 → 地道母语书面语 | 说中文出英文（多目标语言） |

三个模式共用一根悬浮条（floating bar），按键逻辑双模：**按住说（push-to-talk）** 和 **点一下开/点一下关（hands-free）**，且会智能提示——文案里有 `do_not_hold_just_press`（你按住了但当前是点按模式）、`switch_hands_free`、`press_again_to_finish`。

### 悬浮条的告警体系（这是体验分水岭）

i18n 里有 **40+ 条** floating bar 告警，全是真实场景踩出来的：

```
no_network / poor_network / weak_network_indicator      网络分级
transcription_timeout / transcription_timeout__pro      超时（Pro 有不同话术）
microphone_unavailable / microphone_access_denied       麦克风
better_microphone_detected                              检测到更好的麦克风，建议切换
auto_language_detection                                 自动识别到语种切换
input_duration_exceeded / last_minute                   时长将到上限
previous_pending / multiple_cancelled                   上一条还没出来 / 连按取消了多条
frequent_shortcut                                       你按太频繁了
accessibility_required / authentication_required        权限
dictionary_auto_added                                   "XX 已添加到您的词典"  ← 学习反馈
selected_text__to_ask_anything                          检测到你选中了文字，提示可以问
```

**这不是"做得细"，这是把语音输入的所有失败模式都变成了一句人话。**百灵目前的悬浮窗只有五态（待机/聆听/转写/暂停/未听清），这是最容易补、收益最直接的一块。

---

## 3. 核心机制逐个拆

### 3.1 上下文注入：`audio_context`（他们最大的技术资产）

每次录音上传时，**不只传音频，还传一个加密的上下文包**。从字符串表能还原出字段：

```
focused_app_name / focused_app_bundle_id
focused_app_window_title
focused_app_window_web_title / web_domain / web_url    ← 浏览器里具体是哪个网站哪个页面
is_editable / has_text_selected / selected_text
text_before_cursor / text_after_cursor                 ← 光标前后文
text_after_input_area / surrounding_context            ← 输入框外围的可见文本
beforeCharsRequested / beforeCharsActual               ← 取多少字符，实际取到多少
focusedElementText / focusedElementPosition
ax_text / ax_html                                      ← 无障碍树里的文本和 HTML
```

Windows 上靠 `ContextHelper.dll` 走 UI Automation 拿这些；同步接口都有 async 版本 + **500ms 超时兜底**（超时就返回空对象，绝不阻塞录音）。

**这意味着什么：**你在 Slack 里回复某人时，模型看得到上面那句话是谁说的、说了什么；你在写邮件到一半开口，模型看得到已经写了什么、光标后面还有什么。所以它能"接着写"而不是"重新写"。

> 这是百灵和它最本质的差距。我们目前的 `scene.js` 只拿到了前台 App 名 + 窗口标题，做的是"选哪套润色规则"；Typeless 拿的是**内容级上下文**，做的是"看懂你在干嘛"。

### 3.2 自动学词典：编辑追踪 → diff → 自动进词库

这是"越用越懂你"落到实处的部分，也是我们必须抄的。字符串表还原出的完整链路：

```
插入文本后 → track-edit-text:start-track
           → startTrack / maxTrackTime / track_timeout
           → setupMouseTracking（你点走了就停止追踪）
           → 轮询焦点输入框内容，写 tracking_edit.log
用户手改了 → "[User Edit] 🟢 User edit detected, starting tracking"
           → checkEditedText，用 diffChars（npm diff 包）比对
           → edited_text / edited_text_status / edited_text_attempts 落库
           → sendTrackResultToServer
服务端判定 → auto_add_dictionary → dictionary:word-auto-added
           → 悬浮条弹："「泰斗」已添加到您的词典"
```

数据库里还有 `hasRevertedAI` 字段——**用户把 AI 润色撤销回原文，是一个独立的负反馈信号**。

词典（Dictionary）页面的设计也很聪明，三个 Tab：**All / Auto-added / Manually-added**，每个词有来源 tooltip（"由 Typeless 自动添加" vs "手动添加"），还支持 **CSV 批量导入**（单列，一行一词，≤5MB）。

官方文案（他们自己怎么定义这件事）：
> "Typeless remembers your unique names and words, learned automatically from your edits or added manually by you."

**对照百灵**：我们的 `terms.js` + 快速修正窗口，本质是同一件事，但是**手动触发**的——用户得主动去改错。Typeless 是**零操作自动捕获**。这是体验上的代差，不是功能上的代差。

### 3.3 个性化：风格打分表（表面很美，内核很浅）

设置里有一个独立 Personalization 页，echarts 画的表：**Category / Personalization 两列 + 一个"整体个性化程度"总分**，可以一键关闭（"Typeless 将停止学习您的写作风格，切换为非个性化措辞"）。

但看它的隐私声明就知道内核有多浅：
> "我们的 AI 只观察一般性模式——比如你在不同场景下偏好正式还是随意的语言。这些模式完全抽象，从不包含你写过或说过的任何具体信息。"
> "就像认出你的笔迹，却从不读那些字。"

**翻译成人话：他们只学"语气/句长/正式度"这种风格向量，不学任何内容。**因为他们承诺零留存（zero data retention），结构上就不可能学你的领域知识。

Pro 套餐里有一条叫 **"Different tones for each app"（每个 App 不同语气）**——这就是他们个性化的天花板：场景 × 风格。

> **这是百灵最大的战略机会，下面第 7 节展开。**

### 3.4 富文本注入：`insertRichText(html, text)`

DLL 导出签名直接可见：
```c
int32_t insertText(const char *text);
int32_t insertRichText(const char *html, const char *text);
```
两个参数——HTML 优先，纯文本兜底。所以在 Gmail / Notion / Google Docs 里说"第一点…第二点…"，出来的是**真的编号列表**，不是"1. 2. 3." 的字面文本。

还有 `insertPayloads` / `insertPayloadsIndividually`——长文本分片注入，避免一次性 paste 卡死目标程序。以及 `getSelectedTextBySimulateCopyAsync`——UIA 拿不到选中文本时，降级到模拟 Ctrl+C。

**这是低垂果实。**百灵现在是 nut-js 模拟 Ctrl+V 纯文本，在 Obsidian / 飞书 / Notion 里"梳理模式"的结构会被拍平。

### 3.5 音频与网络链路

从你本机 `audio_metadata` 的真实值：
```json
{"audio_format":"ogg","audio_codec":"opus","audio_bitrate":64000,
 "audio_channels":1,"audio_sample_rate":16000,"audio_bit_depth":16,
 "need_merge":true}
```
16kHz / 单声道 / Opus 64kbps —— 3 秒录音只有 8~40KB。`need_merge:true` 说明是**分片边录边传**，不是录完再传。

`client_metadata` 里还有服务端下发的自适应参数：
```json
{"need_weak_network_downgrade":false, "taking_longer_alert_delay_ms":6500,
 "full_audio_compression_time_ms":108.3}
```
连"多久之后弹『正在努力』提示"都是服务端按当时负载动态下发的。还有 `dynamicMicrophoneDegradationEnabled`（麦克风动态降级）。

另有 **Whisper mode（气声模式）**，Pro 功能，官方话术：
> "在下一步试着轻声说，Typeless 依然听得见。这个功能适合办公室这种不方便出声的安静场所。"

——把"不好意思在办公室说话"这个**最大的语音输入使用障碍**直接产品化成了一个卖点。

### 3.6 语音触发外部动作

`mode_meta.ai_result` 的真实结构（从你本机 DB 读到）：
```json
{"ai_result":{"user_prompt":"...","refined_text":"...",
              "web_metadata":null,"external_action":null,"delivery":null}}
```
`external_action` + 主进程里硬编码的一批 URL：
```
https://x.com/compose/post      https://www.reddit.com/submit
https://mail.google.com/mail/u/0/#inbox/edit
https://www.notion.so/          https://docs.google.com/document/d/
https://docs.qq.com/doc/  https://docs.qq.com/sheet/   ← 腾讯文档，说明他们在打中国市场
https://www.figma.com/design/
```
即"Quick actions"——说一句话可以直接开一条推文草稿 / 发一封邮件。目前看是浅集成（拼 URL 跳转），但产品叙事上很唬人。

---

## 4. 隐私设计（这是他们敢采上下文的**前提**，必须一起抄）

采了这么多上下文，凭什么用户不炸？三层防线：

1. **客户端加密**：`audio_context` 落库就是密文
   ```json
   {"_encrypted":true,"_v":1,"_type":"json","_key":"<RSA-OAEP 加密的 AES 密钥>","_data":"..."}
   ```
   RSA_PKCS1_OAEP 加密 AES 密钥 + AES 加密正文（信封加密），公钥从服务端拉。
2. **黑名单**：`/app/get_blacklist_domain` + `app_blacklist` / `url_blacklist` —— **服务端下发黑名单，网银/密码管理器等页面不采上下文**。
3. **三条承诺**（onboarding 权限页就摆出来，不藏在隐私政策里）：
   - 零云端留存（Zero cloud data retention）
   - 绝不用于训练（Never trained on your data）
   - 历史记录只在本机（On-device history storage）—— 且可设保留时长／"永不保留"

**顺序很重要：他们是先给承诺，再要权限。**onboarding 的权限页上，三条隐私承诺和麦克风/无障碍授权是同一屏。

---

## 5. 增长与商业化设计

| 环节 | 做法 |
|---|---|
| Onboarding | 职业调研（17 个选项：销售/法务/医疗/工程/创作者…）+ 行业 + 来源渠道 → **首屏就给用户打标签** |
| 首次体验 | Playground 让你**照着念现成的样例**，念完立刻看到"魔法能力"逐条高亮 |
| "魔法能力"话术 | 不说功能，说它替你干了什么：<br>· 去掉了口头禅<br>· **听出你改主意了：9点 → 9点半**<br>· 只保留你最后那版<br>· 自动排成了编号列表<br>· **把停车挪到第 1 条：你说过它最重要**<br>· 回头把开头的名字改对了<br>· 你的模糊线索 → 精确的书名 |
| 场景货架 | 按 App 分类给用例：AI 应用 / 写作 / 工程 / 项目管理 / 必备（ChatGPT、Claude、Notion、Slack、Gmail、飞书类…） |
| 免费额度 | **8000 词/周**，每周一 07:00 UTC 重置（不是按天，也不是一次性） |
| Pro 差异 | 无限词数、增强准确率、高峰期优先、Ask anything、翻译、气声模式、个人词典、个性化风格、**每 App 不同语气**、团队管理 |
| 定价话术 | **"升级到 Pro，每周省下 1 天"**——不卖功能，卖时间 |
| 数据回填 | 首页常驻用量看板：口述词数 / 总时长 / **节省时间** / 平均语速 WPM |
| 裂变 | 邀请码、推荐好友、Affiliate、礼品卡、团队席位 |
| 反馈 | 每条历史记录旁有旗标可举报，反馈框提示"**可以直接说，省时间**"（用自己的产品交反馈） |

"魔法能力"那七条是整份文案里最值钱的东西——**它把 LLM 润色这件抽象的事，翻译成了七个用户能立刻验证的具体承诺。**

---

## 6. 差距对照表：百灵 Mynah v0.2.1 vs Typeless 2.1.0

| 能力 | Typeless | 百灵现状 | 判定 |
|---|---|---|---|
| 上下文采集 | App+窗口+网页URL+**光标前后文+选中文本+AX树** | App名+窗口标题 | 🔴 代差 |
| 富文本注入 | insertRichText(html,text)+分片 | nut-js Ctrl+V 纯文本 | 🔴 明显落后 |
| 自动学词 | 追踪编辑→diff→自动进词典→弹提示 | 手动"快速修正"窗口 | 🟡 机制在，触发方式落后 |
| 词库管理 | 三 Tab + 来源标记 + CSV 导入 | 单一列表 | 🟡 小差距 |
| 多模式 | 口述 / 问一切 / 翻译，各自快捷键 | 仅口述（+梳理开关） | 🟡 缺 2 个 |
| 悬浮条告警 | 40+ 条场景化提示 | 5 态 | 🔴 体验分水岭 |
| 音频链路 | Opus 16k 分片边传+弱网降级+服务端调参 | 录完整段上传 | 🟡 |
| 气声模式 | 有（Pro 卖点） | 无 | 🟡 |
| 隐私工程 | 信封加密+域名黑名单+三承诺+保留期设置 | 全本地（天然更强） | 🟢 **我们更优** |
| 个性化深度 | 抽象风格向量（承诺不看内容） | **Obsidian 全库 RAG + 专名词库** | 🟢 **我们结构性更强** |
| 领域知识 | 无（靠 Google 搜索兜底） | 你的第二大脑 | 🟢 **无法被复制** |
| 增长体系 | 完整（调研/裂变/额度/看板） | 无 | 🔴 未开始 |

---

## 7. 战略判断：不要做中国版 Typeless

拆完最重要的结论不是"我们差在哪"，而是**看清了他们的天花板在哪**：

> Typeless 是纯云 SaaS，并且把"零留存 / 绝不训练 / 只学抽象风格"写死成了公开承诺。
> **这意味着他们在结构上永远学不会你的领域知识。**
> 他们的个性化上限就是"知道你在 Slack 里说话随意、在 Gmail 里说话正式"。
> 他们永远不会知道"肆拾玖坊"不是"四十九坊"、"泰斗酒"是个产品名、"张传宗"是谁。

而百灵的定位——**接入你的第二大脑**——恰好是他们主动放弃的地盘。这个判断决定了打法：

**抄机制，不抄定位。**
- 机制层（上下文采集、富文本注入、编辑追踪、悬浮条告警、音频链路）：他们花了两年踩坑踩出来的，照抄，不用重新发明。
- 认知层（我懂你的领域、你的人名、你的黑话、你的知识）：这是我们的，也只能是我们的。

一句话定位：
> **Typeless 学的是你怎么说话，百灵学的是你在说什么。**

---

## 8. 建议的对标方案

### P0｜必抄，且能立刻拉平（2 周内）

**① 上下文升级：从"场景"到"内容"**
把 `scene.js` 从"只认 App"升级为完整上下文包，对齐他们的字段设计：
```
focused_app / window_title / web_domain / web_url
is_editable / has_text_selected / selected_text
text_before_cursor / text_after_cursor
```
Windows 上走 UIA。**关键实现纪律照抄他们的**：全异步 + 500ms 超时兜底，取不到就返回空，**绝不阻塞录音**。
→ 直接收益：润色时能"接着写"而不是"重写"；RAG 检索也能用上光标前后文当 query，命中率会明显上一档。

**② 富文本注入**
`insertRichText(html, text)`，HTML 优先纯文本兜底 + 长文分片。
→ 直接收益：**"智能梳理结构"这个已有功能的效果直接翻倍**——现在梳理出的列表进 Obsidian/飞书是死的文本，之后是真的列表。这是投入产出比最高的一项。

**③ 编辑追踪 → 自动学词（把 L1 学习闭环从手动改成自动）**
插入后启动追踪（有 maxTrackTime + 鼠标点走即停）→ diff 出改动 → 判定是否专名 → 自动进词库 → 悬浮条弹"「泰斗」已记住"。
→ 这是"越用越懂我"从**口号**变成**用户每天能看见的事实**的唯一路径。现有的手动快速修正窗口保留，降级为兜底入口。

**④ 悬浮条告警体系**
先补最高频的 8 条：无网络 / 弱网 / 超时 / 麦克风不可用 / 上一条还在处理 / 说太久了 / 自动切换语种 / **词已记住**。
→ 成本极低，是"这软件很靠谱"和"这软件怪怪的"的分界线。

### P1｜差异化，把我们的长板做成绝对优势（1 个月）

**⑤ 专名词库 × RAG 的双层升级**
Typeless 的词典是**纯词表**（一列 CSV，一行一词）。我们已经有 Obsidian 全库——
- 让词库带**释义和关系**（"泰斗酒 = 肆拾玖坊产品线之一"），不只是纠错，还能在润色时提供正确用法
- 词条可以**反查来源笔记**，点进去看它在你的库里是什么
→ 这是他们的词典功能**结构上做不到**的。

**⑥ 沉淀回流（这是全局杀手锏，Typeless 完全没有）**
Typeless 的语音说完就进了别人的输入框，价值流出。
百灵可以做**双向**：说完的内容，一键（或自动）沉淀回 Obsidian —— 日志、想法、会议纪要。
→ 从"输入法"升级为"**第二大脑的语音入口**"。这是产品叙事的量级跃迁，也直接解释了为什么值得接入知识库。

**⑦ 两个新模式（对齐他们的三模式）**
- **问一切**：选中文本 + 说指令 → 改写（可编辑区）/ 回答（只读区）。**我们的版本答案来自你的知识库，不是 Google。**
- **翻译**：中→英，直接出地道书面语。

### P2｜商业化预备（跟网站/公众号一起做）

**⑧ 首页用量看板**：词数 / 时长 / **节省时间** / 语速。免费、直观、每天给用户一个留下来的理由。
**⑨ Onboarding 三件套**：隐私承诺与权限同屏 → 职业调研打标签 → Playground 照着念，逐条高亮"它替你干了什么"。
**⑩ "魔法能力"话术本地化**：把他们那七条翻译成百灵版，且必须有一条只有我们能说 ——
> "**把『四十九坊』改成了『肆拾玖坊』——你库里是这么写的**"

这一条抵得上前面六条。

### 明确不抄

- ❌ **零留存 / 不学内容的隐私承诺**——这是他们的枷锁。我们是全本地，可以承诺"数据一步不出你的电脑"，这比"我们保证不看"强得多，且**允许我们深度学习内容**。
- ❌ **Google Search grounding**——我们的兜底应该是知识库，不是搜索引擎。
- ❌ **按周词数限额**——中国用户对"词数"无感，且我们是本地+自带 key 的形态。
- ❌ **Quick actions 外部动作**（拼 URL 跳转）——叙事大于实用，优先级最低。

---

## 9. 执行顺序建议

```
第 1 周   ② 富文本注入 + ④ 悬浮条告警8条      ← 立刻可感知，先把"完成度"拉起来
第 2 周   ① 上下文升级（UIA 光标前后文）
第 3 周   ③ 编辑追踪自动学词                  ← "越用越懂我"落地
第 4 周   ⑥ 沉淀回流 MVP                      ← 差异化叙事成立
并行      ⑧⑨⑩ 随网站/公众号一起做
```

**验收标准**（用同一段话，在 Obsidian / 微信 / 飞书三个场景各测一次）：
1. 说到一半的邮件，能不能接着写而不是重写？
2. 说"第一…第二…"，进去是不是真的列表？
3. 手动把"四十九坊"改成"肆拾玖坊"，下一次是不是自己就对了？
4. 断网、说太久、麦克风被占用，是不是三句人话而不是一个转圈？

---

## 附：可复查的原始证据位置

```
程序      C:\Users\chenn\AppData\Local\Programs\Typeless\
数据      C:\Users\chenn\AppData\Roaming\Typeless.exe\   （typeless.db / app-settings.json / Recordings\*.ogg）
文案      ...\Programs\Typeless\resources\locales\en\index.json      （zh-CN 同目录）
数据模型  ...\Programs\Typeless\resources\drizzle\*.sql
DLL       ...\Programs\Typeless\resources\lib\*\build\windows\x64\*.dll
拆解产物  <scratchpad>\tl\dist\main\index.js     （从 app.asar 提取的主进程）
          <scratchpad>\main-strings.txt          （5204 条字符串表）
          <scratchpad>\asar-list.txt             （11127 个文件清单）
```
