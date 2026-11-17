# AI内容创作知识大赏 · vibe 系列出片引擎

30 条「vibe知识大赏」风格的知识短片，给做企业 IP 的学员看，也能直接发抖音、视频号。

**风格**：深色底、无配音、中英双语字幕、动画演原理、金句收尾、原创纯音乐。
**规格**：1920×1080、30fps、60–85 秒、响度 −16 LUFS；横版封面 1920×1080 和竖版封面 1080×1440（抖音 3:4）。

## 怎么做一期

只写一份稿子 `src/episodes/vNN.ts`。画面、时长、字幕、配乐、封面都从稿子自动推出来。

```ts
{ big: true, zh: '用AI写的稿子 为什么和同行**一模一样**', en: '...' },   // 强调字幕：居中放大，逐字出现
{ s: { k: 'title' }, zh: '这是AI时代最隐蔽的一个陷阱', en: '...' },      // s = 从这一拍换新场景
{ s: { k: 'bell', label: '...', outlier: '你的独家素材' }, zh: '...', en: '...' },
{ zh: '结果就全挤到了**平均值**附近', en: '...' },                       // 没写 s = 同一场景往前走一步
```

- 一拍的时长按中文字数自动算（无配音，观众要读完）；`d` 可以手动指定。
- `**词**` 在字幕和画面里变成强调色。
- 场景库（`src/scenes.tsx`）：title / number / dots / bars / compare / flow / funnel / curve / bell / ring / list / chat / blocks / scatter / hub / stairs / split / quote。每个场景随拍子推进，每一拍镜头轻推一次。

## 命令

```bash
npm install
# 首次：下载完整思源字体到 ~/.cache/vibe-fonts（约 42MB，只用来抽子集）
mkdir -p ~/.cache/vibe-fonts && cd ~/.cache/vibe-fonts && \
  curl -o NotoSerifSC.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf" && \
  curl -o NotoSansSC.ttf  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" && cd -
pip install fonttools brotli numpy

node scripts/export.ts                 # 检查稿子：字幕≤20字、无标点、时长 45–100 秒
node scripts/preview.ts V02 && python3 scripts/sheet.py V02   # 每拍截图拼联系表，出片前先看
bash scripts/render.sh V02             # 出片 → out/V02-平均值陷阱.mp4 + out/covers/
bash scripts/render.sh                 # 全部 30 条
npm run studio                         # Remotion Studio 里拖时间轴看
```

无显示器的 Linux 上，`render.sh` 默认用 `/opt/pw-browsers/...chrome-headless-shell`，别的机器设 `BROWSER=` 环境变量或删掉该参数。

## 文件

| 路径 | 作用 |
|---|---|
| `src/episodes/vNN.ts` | 30 期稿子 |
| `src/types.ts` | 稿子结构（场景类型定义） |
| `src/timeline.ts` | 稿子 → 时间轴（画面和配乐共用，切点一致） |
| `src/scenes.tsx` | 场景库 |
| `src/Video.tsx` | 成片外框：背景光点、顶栏、双语字幕、强调字幕、进度线 |
| `src/Cover.tsx` | 封面 |
| `src/kit.tsx` | 四色（底/字/暖橙/冷青）、字体、缓动 |
| `scripts/bgm.py` | 原创配乐：按时间轴合成，换场处一声轻响，强调字幕处一记低频，loudnorm 到 −16 LUFS |
| `scripts/fonts.py` | 按全部稿子用字做字体子集（public/fonts，约 300KB） |

## 规矩（沿用工作室审美手册）

- 四色：底、字、一个暖橙强调、一个冷青对照，不加第五种。
- 字幕不带标点，一行不超过 20 字；画面字不重复字幕。
- 数字只用真实来源（标在画面里）；示意图在画面上写「示意图」。
- 示例公司一律虚构，不出现具体企业名和竞品名。
- 出片后跑工作室的 `scripts/qc.py`（黑场、闪帧、停滞、响度）。
