# studio · 公共制作工程

所有期数共用的一个 Remotion 工程。从第二期开始在这里做；第一期仍在它自己的目录里。

```
src/kit/         底层：时钟（时间只取自 timing.json）、颜色字体与基础件、实拍层、章节条和字幕
src/components/  公共组件库：章节页、目录、年份拨盘、左右对比、大数字、引用卡、环形占比、统计项、双文件
src/episodes/    每期一个目录：timing.json（对齐生成）、shots.json（镜头与口播对应）、场景
public/<期>/     每期的配音、音乐、镜头片段（不进 git）
tools/prep_footage.sh  按镜头表截取、裁切、放慢、转码
```

一期的流程（仓库根目录下）：

```bash
scripts/align.py --script <逐字稿> --asr <识别结果> --audio <录音> --out-timing studio/src/episodes/<期>/timing.json --out-audio studio/public/<期>/voice.wav
scripts/tikhub.py xsearch "关键词" --landscape          # 搜 X 上新闻机构和官方账号的视频
scripts/tikhub.py xget <推文ID> --out <期目录>/01_输入素材/x --name <别名>
cd studio && bash tools/prep_footage.sh <镜头表> <原片目录> public/<期>/footage
npx remotion render src/index.tsx <合成名> out/<文件>.mp4
python3 ../scripts/qc.py out/<文件>.mp4
```

场景里取时间用 `say(段名, 词)`：这个词在录音里被念到的时刻。不写秒数。
