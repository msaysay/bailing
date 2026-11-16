---
name: video-03-audio
description: 识别录音得到逐字时间，把逐字稿和录音对齐成字幕行与全片唯一时间源 timing.json，并把人声响度归一。拿到录音之后使用。
---

# 第 3 步 · 录音对时

## 输入
录音文件（mp3、m4a、wav 都行）、`script.txt`。

## 输出
- `episodes/<期>/03_制作过程/asr.json`：逐字起点时间
- `studio/src/episodes/<期>/timing.json`：字幕行、分段、每个字的时刻
- `studio/public/<期>/voice.wav`：去掉片头静音、响度约 −16 LUFS 的人声

## 命令

```bash
python3 scripts/asr.py "<录音>" "episodes/<期>/03_制作过程/asr.json"
python3 scripts/align.py --script "episodes/<期>/03_制作过程/script.txt" \
  --asr "episodes/<期>/03_制作过程/asr.json" --audio "<录音>" \
  --out-timing studio/src/episodes/<期>/timing.json --out-audio studio/public/<期>/voice.wav --max 17
```

## 步骤

1. 跑识别，通读识别出的文字，和稿子对一遍：
   - **念错、漏念、多念**：告诉用户具体位置。字幕以稿子为准，但声音改不了，事实性的口误（念错数字、说反意思）要建议重录那一句。
   - **重说**（一句话说了两遍）：需要剪掉前一遍。`align.py` 目前不处理中间剪切，遇到时先用 ffmpeg 剪好录音再对齐，并请用户听剪口。
2. 跑对齐。它把稿子和识别结果做字符级比对：对得上的字拿识别时间，数字、英文、识别错的字在两侧按字数内插。
3. 看每段的**对齐率**。低于 0.85 的段，说明这段录音和稿子差得多，要回去查。
4. 看字幕行：每行不超过约 20 个字，不带句读，停顿处是空格。太长的行调小 `--max` 重跑。

## 放行条件
所有段对齐率 ≥ 0.85；口误和重说已告知用户并处理。

## 之后怎么用时间
场景代码里：

```ts
const { seg, say } = useClock();
say('市场', '高盛')        // 「市场」这段里「高盛」两个字被念到的时刻（秒）
seg('市场').start          // 这一段的起点
```

**任何地方都不手写秒数。** 改稿或换录音后重跑这一步，全片时间自动跟着变。
