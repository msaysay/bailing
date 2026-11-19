#!/usr/bin/env python3
"""相框口播线：检查剪辑决定表 edl.json，把「段名 + 词」换成秒数，生成渲染参数 props.json 和给人看的版式表。
用法：scripts/frame_plan.py <期目录>  [--brand brands/yuedu] [--strict]
读：<期目录>/03_制作过程/{timing.json, edl.json, meta.json}，可选 cuts.json；<brand>/speaker.json；meta.json 里指的 library.json
写：<期目录>/03_制作过程/props.json、版式表.md
有「不通过」时退出码为 1，不写 props.json。「提醒」不拦，但 --strict 时也算不通过。
edl.json 的写法见 skills/frame-02-plan/SKILL.md。"""
import argparse, json, os, re, sys

ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("--brand", default=None); ap.add_argument("--strict", action="store_true"); a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); W = os.path.join(a.ep, "03_制作过程")
brand = a.brand or os.path.join(ROOT, "brands", "yuedu")
def load(p, d=None):
    if not os.path.exists(p):
        if d is not None: return d
        sys.exit("缺文件：" + p)
    return json.load(open(p, encoding="utf-8"))
tm, edl, meta = load(f"{W}/timing.json"), load(f"{W}/edl.json"), load(f"{W}/meta.json")
cuts = load(f"{W}/cuts.json", {"cuts": []})["cuts"]; speaker = edl.get("speaker") or load(f"{brand}/speaker.json")
lib = {x["id"]: x for x in load(os.path.join(ROOT, meta["library"]), [])} if meta.get("library") else {}
cards_src = open(os.path.join(ROOT, "studio/src/yuedu/cards.tsx"), encoding="utf-8").read()
CARDS = [x.strip() for x in re.search(r"export const CARDS[^=]*= \{([^}]*)\}", cards_src).group(1).split(",")]
total = tm["total"]; bad, warn = [], []
PUNC = "，。！？；：、—“”\"'（）()《》…,.!?;: \n\t·%"
strip = lambda s: "".join(c for c in s if c not in PUNC).lower()

# ---- 时刻：每段把所有字连起来，按词找第一个字的时间 ----
segs = {}
for s in tm["segments"]:
    cs = [c for l in tm["lines"] if l["seg"] == s["id"] for c in l["chars"] if c["c"] not in PUNC]
    segs[s["name"]] = ("".join(c["c"] for c in cs).lower(), [c["t"] for c in cs])
def when(x, ctx):
    if isinstance(x, (int, float)): return float(x)
    if not (isinstance(x, list) and len(x) >= 2): bad.append(f"{ctx}：at 要写成 [段名, 词] 或秒数，现在是 {x!r}"); return 0.0
    if x[0] not in segs: bad.append(f"{ctx}：没有「{x[0]}」这一段（现有：{'、'.join(segs)}）"); return 0.0
    txt, ts = segs[x[0]]; i = txt.find(strip(x[1]))
    if i < 0: bad.append(f"{ctx}：「{x[0]}」段里找不到「{x[1]}」（要照 script.txt 里的原字写）"); return 0.0
    return round(ts[i] + (x[2] if len(x) > 2 else 0), 3)

# ---- 字幕：超过 16 个字的行硬拆（会提醒：最好回稿子里加逗号，让它断在词与词之间） ----
MAXC = 16; BREAK = "的了在和与将是到让把而对从"
subs = []
for k, l in enumerate(tm["lines"]):
    nxt = tm["lines"][k + 1]["start"] if k + 1 < len(tm["lines"]) else total
    end = min(nxt, l["end"] + 0.25); text = l["text"]
    if len(strip(text)) <= MAXC: subs.append({"start": l["start"], "end": round(end, 3), "text": text}); continue
    warn.append(f"字幕「{text}」超过 {MAXC} 个字，被硬拆成两行，可能断在词中间；在 script.txt 这句中间加个逗号再重新对齐")
    n = -(-len(strip(text)) // MAXC); pos = []; cur = 0
    for j in range(1, n):
        want = round(len(text) * j / n); best = min(range(max(cur + 3, want - 3), min(len(text) - 2, want + 4)), key=lambda p: (0 if text[p - 1] == " " else 1 if text[p - 1] in BREAK else 2, abs(p - want)), default=want)
        pos.append(best); cur = best
    bounds = [0] + pos + [len(text)]
    for s, e in zip(bounds, bounds[1:]):
        cs = [c for c in l["chars"] if s <= c["i"] < e]
        if not cs: continue
        subs.append({"start": cs[0]["t"], "end": 0, "text": text[s:e].strip()})
    subs[-1]["end"] = round(end, 3)
for x, y in zip(subs, subs[1:]):
    if not x["end"]: x["end"] = y["start"]

# ---- 标题、署名 ----
title = edl.get("title") or []
if len(title) != 3: bad.append("title 要正好三行")
else:
    if len(strip(title[1])) > 9: bad.append(f"标题第二行「{title[1]}」超过 9 个字，黄条放不下")
    for i in (0, 2):
        if len(strip(title[i])) > 14: bad.append(f"标题第 {i + 1} 行超过 14 个字")
if not speaker.get("name") or len(speaker.get("titles", [])) < 1: bad.append("speaker 要有 name 和 titles")

# ---- 逐条解析 ----
BASE_DO, OVER_DO = "PSERCG", "KL"; base, overlays = [], []
for n, b in enumerate(edl.get("beats", [])):
    ctx = f"第 {n + 1} 条（{b.get('do')}）"; do = b.get("do")
    if do not in BASE_DO + OVER_DO: bad.append(f"{ctx}：do 只能是 P S E R C G K L"); continue
    t = when(b.get("at", 0), ctx)
    if do == "K":
        if not b.get("text"): bad.append(f"{ctx}：缺 text")
        if len(b.get("text", "")) > 8: bad.append(f"{ctx}：贴纸「{b['text']}」超过 8 个字")
        overlays.append({"kind": "K", "t": t, "end": round(t + b.get("hold", 2.6), 3), "text": b.get("text", ""), "side": b.get("side", "left"), "row": b.get("row", 0)})
    elif do == "L":
        items = [{"t": when(x.get("at", t), ctx), "text": x["text"]} for x in b.get("items", [])]
        if not 2 <= len(items) <= 4: bad.append(f"{ctx}：清单要 2 到 4 条")
        if any(len(x["text"]) > 8 for x in items): bad.append(f"{ctx}：清单每条不超过 8 个字")
        overlays.append({"kind": "L", "t": t, "end": round((items[-1]["t"] if items else t) + b.get("hold", 2.4), 3), "side": b.get("side", "left"), "items": items})
    else:
        o = {"t": t, "do": do, "_n": n + 1}
        if "zoom" in b: o["zoom"] = b["zoom"]
        if b.get("person"): o["person"] = b["person"]
        if b.get("clip"):
            c = lib.get(b["clip"])
            if not c: bad.append(f"{ctx}：素材库里没有「{b['clip']}」")
            else:
                o["show"] = {"kind": c["kind"], "src": c["src"], "from": b.get("from", 0), "fit": b.get("fit", c.get("fit", "cover"))}; o["_clip"] = c
                if not os.path.exists(os.path.join(ROOT, "studio/public", c["src"])): bad.append(f"{ctx}：文件不在 studio/public/{c['src']}")
        if b.get("card"):
            if b["card"] not in CARDS: bad.append(f"{ctx}：没有「{b['card']}」这张卡（现有：{'、'.join(CARDS)}）")
            o["card"] = {"name": b["card"], "props": b.get("props", {}), "cues": [when(x, ctx) for x in b.get("cues", [])]}
        if b.get("lines"): o["lines"] = [{"t": when(x.get("at", t), ctx), "text": x["text"], "tone": x.get("tone", "white"), "size": x.get("size", "m" if do == "S" else "xl")} for x in b["lines"]]
        if do in "RC" and not (o.get("show") or o.get("card")): bad.append(f"{ctx}：{do} 要给 clip 或 card")
        if do == "G" and not o.get("card"): bad.append(f"{ctx}：G 要给 card")
        if do in "SE" and not o.get("lines"): bad.append(f"{ctx}：{do} 要给 lines")
        if do == "S" and not b.get("clip") and any(len(x["text"]) > 10 for x in o.get("lines", [])): bad.append(f"{ctx}：聚光的每行字不超过 10 个（字只能放在人脸左边）")
        if do == "S" and o.get("show"): o["spotOn"] = "show"; o["person"] = "off"
        if do == "E": o.setdefault("zoom", 1.35)
        base.append(o)
base.sort(key=lambda x: x["t"]); overlays.sort(key=lambda x: x["t"])
if not base or base[0]["t"] > 0.05: base.insert(0, {"t": 0.0, "do": "P", "zoom": 1.0, "_n": 0})
base[0]["t"] = 0.0
mode = lambda b: b.get("person") or ("off" if b["do"] in "RG" else "bubble" if b["do"] == "C" else "full")
for b, nx in zip(base, base[1:] + [{"t": total}]): b["_end"] = nx["t"]; b["_dur"] = round(nx["t"] - b["t"], 3)

# ---- 硬指标 ----
holes = meta.get("no_person", []); in_hole = lambda t: any(s - 0.05 <= t < e for s, e in holes)
used = {}
for i, b in enumerate(base):
    ctx = f"{b['t']:.1f} 秒的 {b['do']}（第 {b['_n']} 条）"
    if b["_dur"] < 0.7 and b["do"] != "P": bad.append(f"{ctx}：只有 {b['_dur']} 秒，太短，看不清")
    c = b.get("_clip")
    if c:
        used.setdefault(c["id"], []).append(b["t"])
        if c["kind"] == "video" and b["do"] != "C" and c["dur"] - b["show"]["from"] < b["_dur"] - 0.05: bad.append(f"{ctx}：素材「{c['id']}」只有 {c['dur']} 秒，这里要放 {b['_dur']} 秒。换一条、提前切走，或改成卡片")
    if b["do"] == "R" and b["_dur"] > 4.6 and not in_hole(b["t"]): warn.append(f"{ctx}：素材连放 {b['_dur']} 秒，超过 4.5 秒")
    if b["do"] == "G" and mode(b) == "off" and b["_dur"] > 6 and not in_hole(b["t"]): warn.append(f"{ctx}：卡片占满 {b['_dur']} 秒且人不在，超过 6 秒就把 person 设成 bubble")
    if i and b["do"] == "P" and base[i - 1]["do"] == "P" and abs(b.get("zoom", 1) - base[i - 1].get("zoom", 1)) < 0.08: bad.append(f"{ctx}：和上一个景别只差 {abs(b.get('zoom', 1) - base[i - 1].get('zoom', 1)):.2f}，至少差 0.08（不然像抖了一下）")
    if b.get("zoom", 1) > 1.5: bad.append(f"{ctx}：推近超过 1.5，画面会糊")
for k, v in used.items():
    if len(v) > 1: bad.append(f"素材「{k}」用了 {len(v)} 次（{'、'.join(f'{x:.1f}s' for x in v)}），同一条全片只用一次")
def off_at(t): return mode(next(b for b in reversed(base) if b["t"] <= t + 1e-6)) == "off"
for s, e in holes:
    t = s + 0.1
    while t < e - 0.1:
        if not off_at(t): bad.append(f"{s}–{e} 秒原片里没有人，{t:.1f} 秒这里却排了要出现人的处理；改成 R 或 G"); break
        t += 0.25
run = 0.0
for b in base:                                     # 人连续不在画面的时长（原片本身没人的时段不计）
    if mode(b) == "off" and not in_hole(b["t"]): run += b["_dur"]
    else:
        if run > 8.05: bad.append(f"{b['t']:.1f} 秒之前，人连续 {run:.1f} 秒不在画面里，上限 8 秒；中间换成 C（人缩成小圆）")
        run = 0.0
sec = {"full": 0.0, "bubble": 0.0, "off": 0.0}
for b in base: sec[mode(b)] += b["_dur"]
hole_s = sum(e - s for s, e in holes); avail = max(1.0, total - hole_s)
vis, full = (sec["full"] + sec["bubble"]) / avail, sec["full"] / avail
if vis < 0.70: bad.append(f"人在画面里只占 {vis:.0%}，不能低于 70%")
if full < 0.45: bad.append(f"人铺满画面窗只占 {full:.0%}，不能低于 45%")
ks = [o for o in overlays if o["kind"] == "K"]; ss = [b for b in base if b["do"] == "S"]
sgroups = [b for i, b in enumerate(ss) if not any(p["do"] == "S" and p["_end"] == b["t"] for p in base)]
if len(ks) > 8: bad.append(f"关键词贴纸 {len(ks)} 处，上限 8 处")
if len(sgroups) > 4: bad.append(f"聚光 {len(sgroups)} 处，上限 4 处")
for x, y in zip(sgroups, sgroups[1:]):
    if y["t"] - x["t"] < 40: warn.append(f"{x['t']:.1f} 和 {y['t']:.1f} 秒两次聚光间隔不到 40 秒")
for o in overlays:
    cur = next(b for b in reversed(base) if b["t"] <= o["t"] + 1e-6)
    if mode(cur) != "full" or cur["do"] in "SE": bad.append(f"{o['t']:.1f} 秒的{'贴纸' if o['kind'] == 'K' else '清单'}落在 {cur['do']} 里；贴纸和清单只能放在人铺满的时候")
    elif o["end"] > cur["_end"] + 0.05:
        o["end"] = round(cur["_end"], 3)
        if o["end"] - o["t"] < 1.2: warn.append(f"{o['t']:.1f} 秒的{'贴纸' if o['kind'] == 'K' else '清单'}只能停 {o['end'] - o['t']:.1f} 秒就被下一个处理切走")
for c in cuts:                                      # 每个剪口都要盖住
    cur = next(b for b in reversed(base) if b["t"] <= c + 1e-6)
    if mode(cur) == "full" and not any(abs(b["t"] - c) <= 0.07 for b in base): bad.append(f"{c:.2f} 秒有剪口没盖住：在这一刻加一条 {{\"at\": {c}, \"do\": \"P\", \"zoom\": …}} 硬切景别，或让它落在 R、C、G 里")
changes = sorted(set([b["t"] for b in base] + [o["t"] for o in overlays]))
gap = total / max(1, len(changes))
if gap > 7: warn.append(f"平均 {gap:.1f} 秒才有一次变化，目标 4 到 6 秒")
if gap < 2.5: warn.append(f"平均 {gap:.1f} 秒就变一次，太碎，目标 4 到 6 秒")
for x, y in zip(changes, changes[1:] + [total]):
    if y - x > 15 and not in_hole(x): warn.append(f"{x:.1f}–{y:.1f} 秒连续 {y - x:.0f} 秒没有任何变化")
for h in edl.get("hot", []):
    if not any(h in s["text"] for s in subs): warn.append(f"热词「{h}」没在任何一行字幕里完整出现（被拆行了或写法不同）")
if base[-1]["do"] != "E": warn.append("最后一条不是 E（收束金句）")

# ---- 版式表 ----
NAME = {"P": "人", "S": "聚光对比", "E": "收束金句", "R": "素材", "C": "画中画", "G": "生成卡片"}
def what(b):
    if b["do"] == "P": return f"景别 {b.get('zoom', 1)}"
    if b["do"] in "SE": return " / ".join(x["text"] for x in b["lines"])
    s = (b["_clip"]["id"] + "：" + b["_clip"]["desc"]) if b.get("_clip") else ""
    if b.get("card"): s += f"卡片 {b['card']['name']}「{b['card']['props'].get('title', b['card']['props'].get('text', ''))}」"
    return s
rows = [(b["t"], NAME[b["do"]], what(b), f"{b['_dur']:.1f}s") for b in base] + [(o["t"], "贴纸" if o["kind"] == "K" else "清单", o.get("text") or "、".join(x["text"] for x in o["items"]), f"{o['end'] - o['t']:.1f}s") for o in overlays]
rows.sort()
def said(t0, t1): return "".join(s["text"] for s in subs if s["start"] < t1 and s["end"] > t0)[:26]
md = [f"# 版式表\n", f"标题：{' / '.join(title)}", f"署名：{speaker.get('name')}｜{'｜'.join(speaker.get('titles', []))}\n", "| 时间 | 处理 | 内容 | 时长 | 这时在说 |", "|---|---|---|---|---|"]
for i, r in enumerate(rows): md.append(f"| {int(r[0] // 60)}:{r[0] % 60:04.1f} | {r[1]} | {r[2]} | {r[3]} | {said(r[0], r[0] + 2.5)} |")
md += ["", "## 统计", f"- 总长 {total:.1f} 秒，{len(base)} 段画面，{len(overlays)} 处贴纸和清单，平均 {gap:.1f} 秒一次变化",
       f"- 人在画面里 {vis:.0%}（铺满 {full:.0%}，小圆 {sec['bubble'] / avail:.0%}）" + (f"；原片有 {hole_s:.0f} 秒本身没有人，未计入" if holes else ""),
       f"- 素材 {sum(1 for b in base if b['do'] == 'R')} 段，生成卡片 {sum(1 for b in base if b.get('card'))} 张，聚光 {len(sgroups)} 处，贴纸 {len(ks)} 处",
       f"- 剪口 {len(cuts)} 个" + ("，全部盖住" if cuts and not any('剪口' in x for x in bad) else "")]
if bad: md += ["", "## 不通过"] + ["- " + x for x in bad]
if warn: md += ["", "## 提醒"] + ["- " + x for x in warn]
open(f"{W}/版式表.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
for x in bad: print("不通过：" + x)
for x in warn: print("提醒：" + x)
print(md[-len(bad) - len(warn) - 8] if False else "\n".join(md[md.index("## 统计") + 1: md.index("## 统计") + 5]))
if bad or (a.strict and warn): sys.exit(1)
clean = lambda d: {k: v for k, v in d.items() if not k.startswith("_")}
props = {"fps": meta.get("fps", tm["fps"]), "total": total, "title": title, "speaker": speaker,
         "media": {"person": meta["person"], "voice": meta["voice"], "vw": meta["vw"], "vh": meta["vh"], "face": meta["face"], "plate": "yuedu/plate.png", "logo": "yuedu/logo.png"},
         "subs": subs, "hot": edl.get("hot", []), "base": [clean(b) for b in base], "overlays": overlays}
json.dump(props, open(f"{W}/props.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"通过 → {W}/props.json、版式表.md")
