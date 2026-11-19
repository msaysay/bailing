#!/usr/bin/env python3
"""transcript.json -> editable paper edit (work/script.txt).

    python3 draft_script.py work/transcript.json -o work/script.txt [--max 10]

One line = one subtitle = one cut unit:

    ASR原文 | 字幕文本(改错别字后) | 关键词,关键词

Only the first column is required. The editor (you) then
  * deletes lines        -> that speech is cut out
  * reorders lines       -> the speech is re-ordered
  * re-breaks lines      -> move characters between neighbouring lines (keep the ASR characters!)
  * cuts INSIDE a line by wrapping characters in [ ]: 我[我我]们这个[这个]渠道  [嗯]其实
    (stutters / repeats / fillers found in the text are pre-marked; un-transcribed ones are
     found acoustically by cues_from_script.py)
  * fixes column 2, adds keywords in column 3
then runs cues_from_script.py. Lines starting with # are comments.
"""
import argparse, json, re

ap = argparse.ArgumentParser()
ap.add_argument("transcript")
ap.add_argument("-o", "--out", default="work/script.txt")
ap.add_argument("--max", type=int, default=10)
a = ap.parse_args()
P = re.compile(r"[，。！？、；：,.!?;:…\s]")
# natural reduplication that is NOT a stutter
KEEP = set("非常 特别 一直 慢慢 好好 刚刚 常常 往往 仅仅 渐渐 偏偏 明明 默默 稍稍 多多 等等 谢谢 哈哈 看看 试试 想想 聊聊 说说 天天 年年 人人 家家 个个 一个 一点 一些 很多 大大 小小 高高 轻轻 好多".split())
STUT1 = set("我你他她它这那就是的在有和对把给被要会能可都也还不没很个")   # single chars people stutter on
found = []
lines = []
for seg in json.load(open(a.transcript, encoding="utf8")):
    lines.append("# [%s %.1f-%.1f]" % (seg["src"], seg["start"], seg["end"]))
    cur = []

    def flush():
        global cur
        t = P.sub("", "".join(w["w"] for w in cur)).replace("][", "")
        if re.sub(r"\[[^\]]*\]", "", t):
            lines.append(t)
        elif t and lines and not lines[-1].startswith("#"):
            lines[-1] += t
        cur = []

    ws = [dict(w) for w in seg["words"]]
    # text-level disfluencies the ASR did write down: fillers and immediate repeats -> [ ] = cut
    flat = [(wi, ch) for wi, w in enumerate(ws) for ch in P.sub("", w["w"])]
    txt = "".join(ch for _, ch in flat)
    mark = [False] * len(txt)
    for m in re.finditer(r"[嗯呃额唔]+", txt):
        mark[m.start():m.end()] = [True] * (m.end() - m.start())
    for m in re.finditer(r"(.{1,6}?)\1+", txt):
        u = m.group(1)
        if u in KEEP or (len(u) == 1 and u not in STUT1) or re.fullmatch(r"[\dA-Za-z%]+", u):
            continue
        mark[m.start(): m.end() - len(u)] = [True] * (m.end() - len(u) - m.start())      # keep the last one
    for m in re.finditer(r"(.{2,6}?)(那个|这个|就是|然后|嗯|呃)\1", txt):                      # restart: 我们的那个我们的
        mark[m.start(): m.start() + len(m.group(1)) + len(m.group(2))] = [True] * (len(m.group(1)) + len(m.group(2)))
    k = 0
    for wi, w in enumerate(ws):                    # write the brackets back into the words
        t, out = P.sub("", w["w"]), ""
        tail = w["w"][len(w["w"].rstrip("，。！？、；：,.!?;:… ")):]
        for ch in t:
            out += ("[%s]" % ch) if mark[k] else ch
            k += 1
        w["w"] = out.replace("][", "") + tail
        if "[" in out: found.append(out.replace("][", ""))
    for i, w in enumerate(ws):
        n = len(P.sub("", re.sub(r"\[[^\]]*\]", "", "".join(x["w"] for x in cur))))
        glue = cur and re.search(r"[A-Za-z0-9%]$", cur[-1]["w"]) and re.match(r"[A-Za-z0-9%]", w["w"])
        if cur and not glue and (w["s"] - cur[-1]["e"] > 0.3 or n + len(P.sub("", w["w"])) > a.max):
            flush()
        cur.append(w)
        if w["w"] and P.search(w["w"][-1]):
            flush()
    flush()
open(a.out, "w", encoding="utf8").write("\n".join(lines) + "\n")
print("\n".join(lines))
print("# wrote %s - now edit it (delete / re-break / correct / keywords)" % a.out)
if found:
    print("# %d suspected stutters/fillers pre-marked with [ ] (they will be cut): %s" % (len(found), " ".join(found[:20])))
    print("# review them: remove the brackets if it is intended emphasis; add [ ] around any you still see")
