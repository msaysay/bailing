---
name: video-04-footage
description: 为一期视频搜索并下载真实画面，拆成镜头，写镜头表，登记来源，并检测每个镜头里的人脸位置。配画面之前使用；用户说「找素材」「搜视频」「拆镜头」时使用。
---

# 第 4 步 · 素材与镜头

## 输入
`script.txt`、`timing.json`（知道每段多长、要几个镜头）。

## 输出
- `episodes/<期>/01_输入素材/x/`：下载的原片（不进 git）
- `episodes/<期>/03_制作过程/镜头表.txt`：每个镜头的源文件、起点、时长、放慢倍率、裁切
- `episodes/<期>/03_制作过程/sources.json`：每条素材的作者、页面、许可状态
- `studio/public/<期>/footage/`：截好的片段
- `studio/src/episodes/<期>/faces.json`：每个片段里人脸的位置

## 搜索与下载

首选 X（推特）上新闻机构和官方账号发的视频：文件能直接下、没有平台水印、多为 1080p 横屏。

```bash
scripts/tikhub.py xsearch "Nvidia headquarters" --landscape            # 默认只搜新闻机构和官方账号
scripts/tikhub.py xsearch "关键词" --from CNBC,Reuters --min 20
scripts/tikhub.py xget <推文ID> --out "episodes/<期>/01_输入素材/x" --name <别名>
```

- 关键词用英文，写「看得见的东西」（headquarters、trading floor、data center、Senate），不写抽象概念。
- 抖音素材可能带暗水印，只在别处找不到时用（`scripts/tikhub.py search / get`）。
- B 站、YouTube 从云端机器下不了，不要在上面花时间。
- **素材是平台公开内容，没有取得授权**。如实登记，并在交付时提醒用户由他判断能不能发布。

## 拆镜头

1. 每条原片先出一张带时间码的联系表（`ffmpeg -vf "fps=1/N,scale=…,drawtext=…,tile=…"`），看清里面有哪些镜头。
2. 候选镜头再出一条逐秒的条带，确认**起止点在同一个镜头内**。取点时离切点至少 0.3 秒。
3. 镜头数：全片平均 5 秒一个；每个镜头全片只用一次。
4. 每个镜头按口播内容对应：说公告配公司标志，说裁员配办公区，说国会配国会山。**表情要对得上情绪**，不给坏消息配笑脸。
5. 原片自带的字幕、台标、标题条要裁掉（镜头表里的裁切参数），裁不掉就换镜头。
6. 镜头比它要撑的时间短时用放慢倍率，不低于 0.35。几乎静止的画面不要放慢到 6 秒以上，会被判为停滞。

镜头表每行：`输出名 源文件名 起点秒 时长秒 放慢倍率 宽比:高比:左比:上比`

```bash
cd studio && bash tools/prep_footage.sh "<镜头表>" "<原片目录>" public/<期>/footage
```

## 测人脸

```bash
python3 scripts/faces.py studio/public/<期>/footage --out studio/src/episodes/<期>/faces.json
```

结果给第 5 步用来决定每个镜头配什么布局。检测会漏侧脸和暗脸，人脸特写镜头要自己再看一眼。

## 放行条件
每段都有镜头；每个镜头时长够用；来源已登记；人脸已检测。
