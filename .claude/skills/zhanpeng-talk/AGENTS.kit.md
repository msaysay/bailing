# 给接手的 AI：张展鹏科普口播自动剪辑

你要做的事：他给一条口播原片和一份文案，你按固定风格出一条 1080×1920 的成片。
风格已经锁在模板里，你不写视频代码。你的工作是**断句、排分镜、配素材、看图自查**，并在三个节点停下来等他确认。

## 按这个顺序读

1. `.claude/skills/zhanpeng-talk/SKILL.md` —— 六步流程和三个确认点。**这是主文档，照它做。**
2. `reference/` 里的图片 —— 对标片长什么样（逐秒联系表、与本模板的并排对比）。用看图工具看。
3. `.claude/skills/zhanpeng-talk/references/style-spec.md` —— 对标片逐段拆解、样式、交片清单。
4. `.claude/skills/zhanpeng-talk/references/board.md` —— 文案怎么断句、`分镜.json` 怎么写、每句话选什么处理。
5. `.claude/skills/zhanpeng-talk/references/handoff.md` —— 环境、耗时、报错怎么办。
6. `.claude/skills/zhanpeng-talk/examples/` —— 对标片的文案和完整分镜表，照着这个密度和写法来。

## 先把环境跑通

```bash
pip install -r requirements.txt
python3 scripts/zp.py setup
python3 scripts/zplib/selftest.py
python3 scripts/zp.py fonts --preview   # 字体包样张，默认的寒蝉正楷最接近对标片
```

## 然后

```bash
python3 scripts/zp.py new 01_选题 --video <原片> --script <文案.txt> --slug zp01
python3 scripts/zp.py align 01_选题      # → 给他看剪掉了什么（确认点一）
python3 scripts/zp.py cut 01_选题
#  写 episodes/01_选题/03_制作过程/分镜.json
python3 scripts/zp.py board 01_选题      # → 给他讲分镜和素材清单（确认点二）
python3 scripts/zp.py stills 01_选题     # → 你自己看联系表，改两轮
python3 scripts/zp.py render 01_选题 --preview
python3 scripts/zp.py render 01_选题     # → 给他看成片（确认点三）
python3 scripts/zp.py check 01_选题
```

## 五条底线

1. 不手写秒数，时间只从声音里来；不改 `studio/src/zhanpeng/` 里组件的样式数值。
2. 字幕是他的原话，只改错别字和断句。
3. 不编造文献、数据、出处。
4. 每一步的命令输出里有 ⚠ 的，要么处理，要么原话转告他。
5. 做不到的如实说（没法听、没法看动态、素材还是占位图），不要说成做完了。
