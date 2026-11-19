---
name: talk-02-roughcut
description: 人为主的竖屏口播，第 2 步：把口播原片转写、剪掉口误和长停顿、去水印裁切、对齐字幕，得到剪好的人物视频和全片时间。拿到口播原片之后使用；用户说「粗剪」「去口误」「对字幕」时使用。
---

# 口播线 第 2 步 · 粗剪与对齐

## 输入
`口播原片.mp4`、`script.txt`（没有稿子就以转写结果为准，整理成稿）。

## 步骤

```bash
E=episodes/<期>; P=studio/public/<期>; X=studio/src/episodes/<期>
ffmpeg -i "$E/01_输入素材/口播原片.mp4" -ac 1 -ar 16000 /tmp/raw16k.wav
python3 scripts/asr.py /tmp/raw16k.wav "$E/03_制作过程/asr-原片.json"        # 逐字时间
```

1. **读转写，找口误。** 打印 `asr-原片.json` 里可疑位置前后的逐字时间。要剪的是：说了一半重说的、说反了自己纠正的、「呃」「那个」连用的。**只剪口误，不改出镜人的意思和用词**；粗口、口头禅保留，在交付时提醒用户由他决定。
2. **量水印和人脸。** 抽一帧看：水印在哪个矩形里；人脸的位置和宽度（`cv2.FaceDetectorYN`，模型同 `scripts/faces.py`）。
3. **定裁切。** 成片的人物区是 1080×1620。从原片里取一个 1080×1620 的窗口，让**脸的中心落在窗口高度 38% 附近**。
4. **粗剪。**

```bash
python3 scripts/roughcut.py "$E/01_输入素材/口播原片.mp4" "$E/03_制作过程/asr-原片.json" \
  --drop "7.55-10.48,70.80-71.72" \
  --vf "delogo=x=30:y=280:w=680:h=90,crop=1080:1620:0:240" \
  --out "$P/person.mp4" --cuts "$E/03_制作过程/cuts.json"
cp "$E/03_制作过程/cuts.json" "$X/cuts.json"
```

   `--drop` 是要整段删掉的口误（原片时间）；超过 0.7 秒的停顿会自动收紧到 0.35 秒。`cuts.json` 里是每个剪口在成片时间轴上的时刻，第 3 步要用。

5. **对齐。** 对剪好的视频再转写一次，和稿子对齐：

```bash
ffmpeg -i "$P/person.mp4" -vn -ac 1 -ar 16000 /tmp/cut16k.wav
python3 scripts/asr.py /tmp/cut16k.wav "$E/03_制作过程/asr.json"
python3 scripts/align.py --script "$E/03_制作过程/script.txt" --asr "$E/03_制作过程/asr.json" \
  --audio "$P/person.mp4" --out-timing "$X/timing.json" --out-audio "$P/voice.wav" --max 14 --fps 24
```

   竖屏字幕一行不超过 14 个字。`--fps` 用原片的帧率。

## 检查
- 每段对齐率不低于 0.85。
- `voice.wav` 和 `person.mp4` 时长相差不到 0.1 秒（差得多说明片头静音被裁了，音画会错位）。
- 抽一帧看水印去干净没有、脸的位置对不对。
- 剪口超过每 10 秒一个时，告诉用户这条原片口误偏多，成片会显得碎。

## 输出
`person.mp4`（不进 git）、`voice.wav`、`timing.json`、`cuts.json`、人脸位置三个数（中心横纵坐标、宽度，单位像素）。

## 放行条件
对齐率达标；音画时长一致；向用户报告剪掉了哪几句。
