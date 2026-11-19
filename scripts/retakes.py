#!/usr/bin/env python3
"""重录检测：出镜人一句话录了好几遍、说到一半重来、结巴重说时，自动找出该删的那几遍（默认留最后一遍）。
用法：scripts/retakes.py <asr-原片.json> [--out 重录检测.json] [--auto 0.72] [--suspect 0.55] [--gap 0.3]
输出：打印每一处「删什么 / 留什么 / 相似度」，最后一行是可以直接贴给 roughcut.py 的 --drop 串；
      --out 写成 JSON：{"drop": "起-止,…", "auto": [...], "suspect": [...]}。
怎么判的：按停顿把逐字稿切成气口段。某一段的文字和它后面 4 段以内某一段的「开头」很像，
      说明前面那段是废掉的一遍，从它的开头到重录那遍的开头整段删。同一串三个字以上紧挨着说两遍算结巴，删前一遍。
      单独一个「呃、嗯、额、唔」前后都有停顿算语气词，也删（--no-fillers 关掉）。
拿不准的（相似度在 suspect 和 auto 之间、只重复两个字的）只列出来不进 --drop，由助手对着稿子判断。
它只看字面。换了说法的重录（意思一样、用词不同）抓不到，仍要通读转写稿补。"""
import argparse, json, re
ap = argparse.ArgumentParser(); ap.add_argument("asr"); ap.add_argument("--out"); ap.add_argument("--auto", type=float, default=0.72)
ap.add_argument("--suspect", type=float, default=0.55); ap.add_argument("--gap", type=float, default=0.3); ap.add_argument("--look", type=int, default=4); ap.add_argument("--no-fillers", action="store_true")
a = ap.parse_args(); CH = 0.22; PRE = 0.06
tk = [t for t in json.load(open(a.asr, encoding="utf-8"))["tokens"] if re.sub(r"[\W_]", "", t["t"])]

def dist(x, y):
    prev = list(range(len(y) + 1))
    for i in range(1, len(x) + 1):
        cur = [i]
        for j in range(1, len(y) + 1): cur.append(min(prev[j - 1] + (x[i - 1] != y[j - 1]), prev[j] + 1, cur[j - 1] + 1))
        prev = cur
    return prev[-1]

def prefix_sim(x, y):                      # x 和 y 的开头有多像：y 取和 x 差不多长的前缀，挑最像的
    best = 0.0
    for L in range(max(2, int(len(x) * .8)), min(len(y), -(-len(x) * 5 // 4)) + 1):
        best = max(best, 1 - dist(x, y[:L]) / max(len(x), L))
    return best

utts = []                                  # 气口段：[{s, toks, text}]
for i, t in enumerate(tk):
    if not utts or t["s"] - (tk[i - 1]["s"] + CH) > a.gap: utts.append({"s": t["s"], "a": i, "toks": []})
    utts[-1]["toks"].append(t)
for u in utts: u["text"] = [t["t"] for t in u["toks"]]
ALL = [t["t"] for t in tk]
auto, suspect = [], []
i = 0
while i < len(utts):                       # 1) 整句重录、半句重来
    x, hit = utts[i]["text"], None
    if len(x) >= 2:
        for j in range(i + 1, min(len(utts), i + a.look + 1)):
            y = sum((u["text"] for u in utts[j:j + 3]), [])      # 重录那遍中间可能又换了气
            s = prefix_sim(x, y) if len(y) >= len(x) * .8 else 0
            if (s == 1 if len(x) <= 3 else s >= a.suspect) and (not hit or s > hit[1]): hit = (j, s)
    if hit:
        j, s = hit
        # 识别给的停顿位置常偏一两个字（重录那遍的第一个字被算进前一段）。在分界点前后各挪两个字，取最像的切法
        cut = utts[j]["a"]
        for k in (-1, 1, -2, 2):
            c = utts[j]["a"] + k
            if not utts[i]["a"] + 2 <= c < len(ALL) - 1: continue
            xk = ALL[utts[i]["a"]:c] if j == i + 1 else x
            sk = prefix_sim(xk, ALL[c:c + len(xk) * 2])
            if sk > s + 0.05: s, cut = sk, c
        item = {"kind": "重录", "range": [round(max(0, utts[i]["s"] - PRE), 3), round(tk[cut]["s"] - PRE, 3)], "score": round(s, 2),
                "dropped": "".join(ALL[utts[i]["a"]:cut]), "kept": "".join(ALL[cut:cut + max(len(x), 6)]) + "…"}
        (auto if s >= a.auto else suspect).append(item)
        if s >= a.auto: i = j; continue    # 跳到留下的那遍接着看（它也可能又被重录）
    i += 1
covered = lambda t: any(r["range"][0] <= t < r["range"][1] for r in auto)
for u in utts:                             # 2) 段内结巴：同一串字紧挨着说了两遍
    if covered(u["s"]): continue
    c, p = u["text"], 0
    while p < len(c):
        found = False
        for L in range(min(8, (len(c) - p) // 2), 1, -1):
            for g in range(0, 3):
                q = p + L + g
                if q + L <= len(c) and c[p:p + L] == c[q:q + L]:
                    item = {"kind": "结巴", "range": [round(max(0, u["toks"][p]["s"] - PRE), 3), round(u["toks"][q]["s"] - PRE, 3)], "score": 1.0,
                            "dropped": "".join(c[p:q]), "kept": "".join(c[q:q + L])}
                    (auto if L >= 3 else suspect).append(item); p = q; found = True; break   # 两个字的重复常是正常说法（研究研究），只提示
            if found: break
        if not found: p += 1
if not a.no_fillers:                       # 3) 语气词：单独一个字，前后都有停顿（和相框口播线 frame_ingest.py 同一个判法）
    for i, t in enumerate(tk):
        if t["t"] in "呃嗯额唔" and i + 1 < len(tk) and (i == 0 or t["s"] - tk[i - 1]["s"] > 0.3) and tk[i + 1]["s"] - t["s"] > 0.3 and not covered(t["s"]):
            auto.append({"kind": "语气词", "range": [round(max(0, t["s"] - PRE), 3), round(tk[i + 1]["s"] - PRE, 3)], "score": 1.0, "dropped": t["t"], "kept": "".join(x["t"] for x in tk[i + 1:i + 5])})
auto.sort(key=lambda r: r["range"][0]); suspect.sort(key=lambda r: r["range"][0])
drop = ",".join(f"{r['range'][0]:.2f}-{r['range'][1]:.2f}" for r in auto)
for tag, rows in (("自动删", auto), ("待判断", suspect)):
    for r in rows: print(f"{tag} {r['kind']} {r['range'][0]:7.2f}–{r['range'][1]:7.2f}  相似 {r['score']:.2f}  删「{r['dropped']}」  留「{r['kept']}」")
print(f"共 {len(utts)} 个气口段；自动删 {len(auto)} 处，待判断 {len(suspect)} 处。")
print("--drop", f'"{drop}"' if drop else "（没有要自动删的）")
if a.out: json.dump({"drop": drop, "auto": auto, "suspect": suspect}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
