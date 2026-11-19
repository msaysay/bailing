---
name: frame-00-setup
description: 相框口播线（约读书房这类「固定相框 + 横屏口播」的竖屏成片）开工前的准备：装环境、认识品牌包、改署名、把客户给的素材入库。第一次在一台机器上跑这条线，或者用户说「换个出镜人」「改一下名字和头衔」「客户发来一批素材」时使用。
---

# 相框口播线 第 0 步 · 环境、品牌包、素材库

这条线做的东西：用户给一条横屏口播原片，出一条 1080×1920 的竖屏成片。画面是一个不动的相框（纸纹底、三行标题、署名条、标志），中间一个 1080×813 的画面窗，所有变化都在窗里。成品样子见 `episodes/14_约读书房_样片/04_成片/关键帧.jpg`。

全流程四步，人只出面三次：

| 步 | Skill | 做什么 | 要人确认 |
|---|---|---|---|
| 0 | `frame-00-setup` | 环境、署名、素材入库 | 署名对不对（只在变的时候） |
| 1 | `frame-01-cut` | 转写、校对、粗剪、对齐 | ✔ **文字对不对** |
| 2 | `frame-02-plan` | 出三组标题、排剪辑决定表 | ✔ **选标题、看版式表** |
| 3 | `frame-03-render` | 关键帧、整片渲染、自查、封面 | ✔ **看成片** |

## 环境（一次）

```bash
cd studio && npm install && cd ..
pip install sherpa-onnx soundfile numpy opencv-python-headless
scripts/fetch-fonts.sh                      # 思源宋体、得意黑、MiSans → studio/public/fonts/
```
识别模型和人脸模型放 `~/.cache/video-studio/`，下载地址在 `scripts/asr.py`、`scripts/faces.py` 开头。
（人脸模型的 GitHub raw 地址被拒时，换 `https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx`。）

验证环境：`scripts/frame_render.sh episodes/14_约读书房_样片 keys`，一分钟内应当得到 `04_成片/关键帧.jpg`。
样片的人物视频不进 git；仓库里没有 `studio/public/yuedu-demo/person.mp4` 时这条命令会失败，改用卡片总览验证：
`cd studio && tools/yuedu_stills.sh YueduCards /tmp/cards.jpg - 135,285,435,585 2`。

## 品牌包 `brands/yuedu/`

读 `brands/yuedu/README.md` 和 `rules.md`。记住一条：**相框里能改的只有两样，三行标题（每期不同）和署名条的名字、头衔（`speaker.json`）**。底图、标志、颜色、字体、位置都不动；用户没明确要求，不改 `studio/src/yuedu/base.tsx` 和 `frame.tsx` 里的任何数值。

改署名：编辑 `brands/yuedu/speaker.json`。名字 2 到 5 个字，头衔每行不超过 12 个字、最多两行。默认是「单新杰｜约读书房合伙人｜一间书房项目发起人」，用户没说换就不动。

## 素材入库（客户给了素材时）

```bash
python3 scripts/library_index.py "<客户给的素材目录>" studio/public/<期短名>/clips
```
它把视频按镜头拆开、转成成片规格、测人脸，生成 `library.json` 和 `联系表.jpg`。然后**你要看联系表**，给每条素材在 `library.json` 里填 `desc`：一句话写清地点、谁、在干什么、画面里有没有字。排版式时就靠这句话找画面，写得含糊等于没入库。

画面上已经烧了字幕、贴纸、水印的镜头，从 `library.json` 里删掉，不用。

客户没给素材，或者给的不够：不要停，也不要回头催。第 2 步里有搜索和生成卡片两条路。

## 输出
`brands/yuedu/speaker.json`（确认过）、`studio/public/<期短名>/clips/library.json`（每条都有 desc；没有素材时这个文件可以不存在）。
