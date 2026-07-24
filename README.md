# 百灵 Mynah · 越用越懂你的 AI 语音输入（Windows）

神鸟家族成员。对标 [TypeFree](https://typefree.app/)，差异化在**自动学习**——不靠你手动加词，而是越用越懂你的说话习惯、词汇和场景。

## 形态
不是传统 IME，而是「**按住/按键说话 → 光标处出干净文本**」的全局听写工具（同 superwhisper / Handy）。

## 管线
```
全局热键录音 → ASR 转写 → LLM 润色(注入 风格画像+场景+热词) → 术语纠正 → 剪贴板注入光标
```

## 越用越懂我（四层学习引擎）
- **L0 冷启动**：从 Obsidian/客户库一键导入专名，开机第一天就有上千词（`scripts/import-vocab.js`）
- **L1 词汇自学习**：ASR 原文 vs 你改后的文本 diff → 高频纠正自动进术语表（`src/main/terms.js` `learnCorrection`）
- **L2 风格画像**：从采纳文本学你的语气/句长/用词 → 注入润色 prompt（`data/style-profile.json`）
- **L3 场景自适应**：检测前台窗口切档（微信/邮件/文档/代码/社交）（`src/main/main.js` `detectScene`）
- **L4 纠错闭环**：一键"这次不对" + 「语音记忆」可查看/清空（roadmap）

## 选型
- **技术栈**：测试期 Electron（团队熟、出活快），生产版计划迁 Tauri（常驻更轻）
- **ASR**：测试期本地 faster-whisper（零 key、离线）；生产期云端优先（火山 BigASR / 讯飞，`.env` 即插即换）
- **润色 LLM**：测试期小米 MiMo（`.env`）。⚠️ MiMo 是推理模型，润色 13–18s 偏慢，**生产版换低延迟模型**（DeepSeek-V3/豆包-lite/通义-turbo，约 1s）

## 跑起来
```bash
npm install
# 本地 ASR（测试期）
pip install -r python/requirements.txt      # 首次会下模型 ~500MB
# 冷启动词库（可选，指向你的 Obsidian 库）
node scripts/import-vocab.js "D:/path/to/ObsidianVault"
# 启动
npm start                                    # 按 Ctrl+Shift+Space 开始/结束说话
```

## 快速验证（无需麦克风/Electron）
```bash
npm run test:polish                          # 实测 MiMo 润色 + 场景/术语注入（已通过）
node scripts/test-pipeline.js audio.wav doc  # 给个 wav 跑全链路（需装 faster-whisper）
```

## 目录
```
src/main/       主进程：main(热键/托盘/编排) · pipeline · asr/ · polish(MiMo) · terms · inject · store · config
src/renderer/   悬浮指示器 + 录音(WAV 16k) + preload
python/         faster-whisper ASR sidecar
scripts/        test-polish · test-pipeline · import-vocab(L0)
data/           terms.default.json · terms.learned.json · style-profile · history（本地存储，隐私优先）
```

详见 `docs/PROJECT_HANDOFF.md`。
