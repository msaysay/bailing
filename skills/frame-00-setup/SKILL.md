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
| 1 | `frame-01-cut` | 转写、校对、去口误、粗剪、对齐、降噪和配乐 | ✔ **文字对不对** |
| 2 | `frame-02-plan` | 出三组标题、排剪辑决定表 | ✔ **选标题、看版式表** |
| 3 | `frame-03-render` | 关键帧、整片渲染、自查、封面 | ✔ **看成片** |

## 环境（一次）

先自己装好三样：Python 3.10 以上、Node.js 20 以上、ffmpeg（`ffmpeg` 和 `ffprobe` 都要在 PATH 里）。然后：

```bash
python3 scripts/frame_setup.py            # 装依赖，下载识别模型、人脸模型、字体；约 500 MB，重复运行不会重下
python3 scripts/frame_setup.py --check    # 只检查，不安装
```
所有脚本都是 Python 和 Node，Windows、macOS、Linux 都能跑（Windows 上把 `python3` 换成 `python`）。
哪一项标了「缺」就按提示补；下载失败多半是网络，地址都在 `scripts/frame_setup.py` 里，可以手动下好放到对应目录。

验证环境（出一张卡片总览，半分钟）：
```bash
cd studio && node tools/yuedu_stills.cjs YueduCards cards.jpg - 135,285,435,585 2
```
能得到一张四格的 `cards.jpg`，字体是宋体标题加绿色小标，就说明渲染没问题。

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

## 配乐（可选）

用户给了音乐文件，就放进 `brands/yuedu/music/`，之后每期自动用。没给也不用问：第 1 步会用代码合成一条。

## 输出
`brands/yuedu/speaker.json`（确认过）、`studio/public/<期短名>/clips/library.json`（每条都有 desc；没有素材时这个文件可以不存在）。
