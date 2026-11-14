---
name: talk-04-build
description: 人为主的竖屏口播，第 4 步：按版式表写代码、先出关键帧再整片渲染、自查版式占比。版式表确认之后使用；用户说「出片」「渲染口播」时使用。
---

# 口播线 第 4 步 · 搭建与出片

参考实现：`studio/src/episodes/talk01/index.tsx`（77 秒，五种版式都用到了）。

## 引擎：`studio/src/kit/talk.tsx`

| 东西 | 用途 |
|---|---|
| `TalkStage` | 舞台。`src` 人物视频，`face` 人脸位置，`beats` 版式时间表；`under` 是垫在人下面的（素材），`children` 是压在人上面的（卡片、字幕） |
| `Beat` | `{ at, mode: 'full'｜'bubble'｜'card'｜'off', zoom, dur, box }`。换版式 `dur` 用默认 0.5；换景别 `dur: 0` 硬切 |
| `TalkSubs` | 字幕，固定在 `SUB_Y`；`hot` 是要变色的词，`hide` 是被标题页盖住不显示的行 |
| `TalkClip` | `UPPER` 区的一段横屏素材，可带来源 |
| `TalkTitle` | 整屏章节标题页 |
| `Lower` / `Plate` | 下巴以下的组件容器；压在人身上的半透明卡片底 |
| `TW, TH, PH, SUB_Y, UPPER, LOWER` | 画布 1080×1920，人物区高 1620，字幕行 1000，素材区 330 到 938，组件区 1090 到 1730 |

## 写法
1. 画布 1080×1920，帧率和原片一致，在 `studio/src/index.tsx` 注册一个 Composition。
2. **所有时刻用 `say(段名, 词)` 取**，剪口用 `cuts.json` 里的数。不手写秒数。
3. 每个内容块包在 `<Scene from to>` 里，起止比对应的版式切换晚 0.1 秒、早 0.3 秒，避免和人物过渡打架。
4. 组件库里的组件多数是按横屏做的：放进 `Plate` 里，用参数调小（`size`、`width`、`dot`），不够再套 `transform: scale()`。
5. 素材复用事为主那条线的做法：`scripts/tikhub.py` 搜和下，`tools/prep_footage.sh` 截片段，来源登记进 `sources.json`。
6. 音频用 `voice.wav`（已做响度归一），人物视频静音。

## 先看图，再整片渲染
```bash
cd studio
npx remotion still src/index.tsx <合成名> out/s.png --frame=<帧号> --scale=0.33   # 每种版式、每个组件出现的那一刻各出一张
npx remotion render src/index.tsx <合成名> out/<期>.mp4 --crf=20
```
关键帧里逐张看：组件有没有压脸、字有没有出框、卡片里的字颜色对不对、小圆有没有压住素材主体。看过没问题再整片渲染。

## 自查
```bash
python3 scripts/qc.py out/<期>.mp4                       # 黑场、闪帧、停滞、响度
python3 scripts/talk_check.py out/<期>.mp4 --full-w 0.40  # 版式占比和硬指标；--full-w 是全屏时脸宽占画面宽的比例
```
- `qc.py` 报的「亮度突变」如果正好在标题页进出，是预期内的。
- `talk_check.py` 报的每一条不达标，回到版式表改，不要调阈值。
- 机器查不了的：口型对不对、剪口顺不顺、卡片出现得早还是晚。这些在交付时明确告诉用户「我没法听和看动态，请你看一遍」。

## 交付时要说的
剪掉了哪几句；哪些原话照搬上了字幕（粗口、口头禅）；哪些数字和口播不一致以及怎么标的；素材的授权状态；机器没法验证的部分。

## 之后
封面和发布文案走 `video-08-cover`（竖屏封面 1080×1440，从全屏人脸的一帧出）。
