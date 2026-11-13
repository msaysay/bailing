#!/usr/bin/env python3
"""逐字稿（文字权威）+ 语音识别逐字时间 → 字幕行与全片唯一时间源 timing.json，并处理音频。
用法：scripts/align.py --script script.txt --asr asr.json --audio 原始录音 --out-dir remotion工程目录/…
  script.txt：「## 段名」分段，正文按句读自动拆成不超过 max 个字的字幕行。
  对齐：稿子与识别结果做字符级比对，对得上的字拿识别时间，对不上的（数字、英文、识别错字）在两侧锚点间按字数内插。
  音频：去片头静音、响度归一到 -16 LUFS，输出 voice.wav。
输出 timing.json：{fps,total,segments:[{id,name,start,end,lines}],lines:[{n,seg,text,start,end,chars:[{c,t}]}]}
同时打印每段对齐率；低于 0.85 的段要人工听一下。"""
import argparse, difflib, json, os, re, subprocess, sys
ap = argparse.ArgumentParser()
ap.add_argument("--script", required=True); ap.add_argument("--asr", required=True); ap.add_argument("--audio", required=True)
ap.add_argument("--out-timing", required=True); ap.add_argument("--out-audio", required=True); ap.add_argument("--max", type=int, default=20); ap.add_argument("--fps", type=int, default=30)
a = ap.parse_args()
PUNC = "，。！？；：、—“”\"'（）()《》…,.!?;: \n\t"
DIG = dict(zip("0123456789", "零一二三四五六七八九"))
segs, cur = [], None
for ln in open(a.script, encoding="utf-8"):
    ln = ln.strip()
    if not ln or (ln.startswith("#") and not ln.startswith("##")): continue
    if ln.startswith("##"): cur = {"name": ln[2:].strip(), "text": ""}; segs.append(cur)
    else: cur["text"] += ln
def split_lines(text, mx):
    """先按句末标点切句，长句再按逗号顿号切，仍超长的在中间硬切。显示时去掉句读，停顿处留空格。"""
    out = []
    for sent in re.split(r"(?<=[。！？；：])|——", text):
        sent = sent.strip()
        if not sent: continue
        parts = [p for p in re.split(r"(?<=[，、])", sent) if p.strip()]
        buf = ""
        for p in parts:
            vis = lambda s: len(re.sub(r"[%s]" % re.escape(PUNC), "", s))
            if buf and vis(buf) + vis(p) > mx: out.append(buf); buf = p
            else: buf += p
        if buf: out.append(buf)
    res = []
    for o in out:
        d = re.sub(r"[，、：；]", " ", o); d = re.sub(r"[。！？“”\"—…]", "", d).strip(); d = re.sub(r"\s+", " ", d)
        if d: res.append(d)
    return res
asr = json.load(open(a.asr)); toks = [(t["t"].strip().lower(), t["s"]) for t in asr["tokens"] if t["t"].strip()]
A = []                                    # 识别侧逐字符：(字, 时间)
for t, s in toks:
    for ch in t: A.append((ch, s))
lines = []
for si, sg in enumerate(segs):
    for txt in split_lines(sg["text"], a.max): lines.append({"seg": si + 1, "text": txt})
B = []                                    # 稿子侧逐字符：(比对用字, 行号, 行内位置)
for li, l in enumerate(lines):
    for ci, ch in enumerate(l["text"]):
        if ch in PUNC or ch in "%·": continue
        B.append((DIG.get(ch, ch.lower()), li, ci))
sm = difflib.SequenceMatcher(None, [x[0] for x in A], [x[0] for x in B], autojunk=False)
tb = [None] * len(B)
for i, j, n in sm.get_matching_blocks():
    for k in range(n): tb[j + k] = A[i + k][1]
known = [k for k, v in enumerate(tb) if v is not None]
if not known: sys.exit("完全对不上，检查稿子和录音是否对应")
for k in range(len(tb)):                  # 内插
    if tb[k] is None:
        lo = max([x for x in known if x < k], default=None); hi = min([x for x in known if x > k], default=None)
        if lo is None: tb[k] = tb[hi]
        elif hi is None: tb[k] = tb[lo] + 0.18 * (k - lo)
        else: tb[k] = tb[lo] + (tb[hi] - tb[lo]) * (k - lo) / (hi - lo)
for k in range(1, len(tb)): tb[k] = max(tb[k], tb[k - 1])
LEAD = 0.4; t0 = max(0.0, tb[0] - LEAD); end_src = min(asr["dur"], tb[-1] + 1.4); total = end_src - t0
for l in lines: l["chars"] = []
for (c, li, ci), t in zip(B, tb): lines[li]["chars"].append({"c": lines[li]["text"][ci], "i": ci, "t": round(t - t0, 3)})
for n, l in enumerate(lines):
    l["n"] = n + 1; l["start"] = l["chars"][0]["t"]
for n, l in enumerate(lines):
    nxt = lines[n + 1]["start"] if n + 1 < len(lines) else total
    l["end"] = round(min(nxt, l["chars"][-1]["t"] + 0.6), 3)
seglist = []
for si, sg in enumerate(segs):
    ls = [l for l in lines if l["seg"] == si + 1]
    idx = [k for k, b in enumerate(B) if lines[b[1]]["seg"] == si + 1]
    rate = sum(1 for k in idx if k in set(known)) / max(1, len(idx))
    seglist.append({"id": si + 1, "name": sg["name"], "start": ls[0]["start"], "lines": [l["n"] for l in ls], "match": round(rate, 2)})
for x, y in zip(seglist, seglist[1:]): x["end"] = round(y["start"] - 0.25, 3); y["start"] = x["end"]
seglist[0]["start"] = 0.0; seglist[-1]["end"] = round(total, 3)
os.makedirs(os.path.dirname(a.out_timing), exist_ok=True)
json.dump({"fps": a.fps, "total": round(total, 3), "segments": seglist, "lines": lines}, open(a.out_timing, "w"), ensure_ascii=False, indent=1)
os.makedirs(os.path.dirname(a.out_audio), exist_ok=True)
subprocess.run(["ffmpeg", "-nostdin", "-v", "fatal", "-y", "-err_detect", "ignore_err", "-i", a.audio, "-af",
                f"atrim={t0:.3f}:{end_src:.3f},asetpts=PTS-STARTPTS,pan=mono|c0=0.5*c0+0.5*c1,loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", a.out_audio], check=True)
print(f"总长 {total:.1f}s，{len(lines)} 行字幕，{len(seglist)} 段")
for s in seglist: print(f"  {s['id']:>2} {s['name']:<10} {s['start']:>6.1f}–{s['end']:>6.1f}  {len(s['lines'])} 行  对齐率 {s['match']}{'  ← 请听一下' if s['match'] < 0.85 else ''}")
