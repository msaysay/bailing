#!/usr/bin/env python3
"""网格取景框口播风（对标直男财经）：丢一条竖屏口播原片，出一条成片。
人全屏两秒一换景别、网格底取景框面板放素材、满屏素材带小人窗、胸口贴素材和表情、黄色大数字、身后大黄字。全部硬切。
拆解和每条规矩的出处：docs/对标拆解-直男财经.md。操作说明：.claude/skills/zhinan-talk/SKILL.md。

前四步和红顶风共用一套（转写、确认单、粗剪），命令一样：
  python3 scripts/zhinan.py new <期名> --video 原片.mp4
  python3 scripts/zhinan.py transcribe <期名>
  python3 scripts/zhinan.py confirm <期名> --titles "行一|行二;行一|行二;行一|行二" [--hooks "金句一;金句二"]      标题只用在封面上，片子里没有常驻标题
  python3 scripts/zhinan.py cut <期名> [--drop "7.5-10.4,…"] [--keep-retakes] [--hook "提到开头的那句"] [--denoise] [--grade]
  python3 scripts/zhinan.py suggest <期名>          逐句给出「这句配什么、要找什么素材」的初稿（匹配表），照着它备素材
排版式（每个参数都可以写多次；@ 后面是字幕里的几个字，表示「说到这里时出现」；写 从~到 表示一段）：
  python3 scripts/zhinan.py plan <期名> [--badge 账号名]
        --panel "a.mp4,b.jpg,c.mp4@从这几个字~到这几个字"     取景框面板：框不动，里面的素材两秒一换
        --cover "a.mp4,b.mp4@从~到" [加 +mini 带小人窗]        满屏素材
        --chest "图或视频@这几个字"                            胸口素材窗（贴在字幕下面，2 到 4.5 秒）
        --num "1499|两人票价@这几个字"                         胸口黄色大数字（竖线前是数字，后面是小字，可以不写）
        --word "LV的老板|其实是他@这几个字"                    胸口白色大字（这几秒不出字幕）
        --tags "比较,炫耀,量化@这几个字"                       黄色词牌，一个一个弹
        --behind "倒反天罡@这几个字"                           身后大黄字（会自动把这几秒的人抠出来，慢）
        --emoji "💩@这几个字"   --float "❤@这几个字"           胸口一个大表情 / 满屏飘
        --card "老王:抠好的人像.png@这几个字"                  网格底卡片：大黄字 + 一张图（图可以不写）
        --doc "截图.png@这几个字"                              网格底歪着的文件截图
        [--no-auto-num] [--no-punch] [--note "部分素材由AI生成"]
  python3 scripts/zhinan.py music <期名> [--track 曲子.mp3 | --mood light|drive|calm|warm] [--off] [--no-sfx]
  python3 scripts/zhinan.py stills <期名>           关键帧联系表（先看这个再渲整片）
  python3 scripts/zhinan.py render <期名>           渲整片 + 节奏自查
  python3 scripts/zhinan.py publish <期名>          发布包
plan 生成的 episodes/<期名>/plan.json 可以直接改，改完再 stills / render。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
import argparse, contextlib, io, json, os, re, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import redtop as rt

R, PUB, STUDIO, PY, SC = rt.R, rt.PUB, rt.STUDIO, rt.PY, rt.SC
ZOOM, ZOOM_EVERY, PUNCH_MAX, NUM_EVERY = 1.1, 2.7, 4, 10.0       # 量自对标片：1.0 / 1.1 倍来回换、棚拍 2.7 到 3 秒一换、怼脸一条约 4 次、讲数字时 10 秒一个大数字
TARGET = "对标片：画面平均 2.0 到 2.5 秒变一次；人全屏 55% 到 60%，取景框面板 14% 到 20%，满屏素材 10% 到 18%，网格卡片 8% 到 12%"
strip = rt.strip


def shared(fn, a):
    """红顶风那套脚本里共用的步骤；把它打印的命令名换成这一套的。"""
    buf = io.StringIO(); code = None
    with contextlib.redirect_stdout(buf):
        try: fn(a)
        except SystemExit as x: code = x.code
    out = buf.getvalue().replace("scripts/redtop.py", "scripts/zhinan.py").replace("红顶双标题口播风", "网格取景框口播风")
    out = re.sub(r"下一步：python3 scripts/zhinan\.py plan [^\n]*", f"下一步：python3 scripts/zhinan.py suggest {a.ep}（看要备哪些素材）→ plan", out)
    print(out, end="")
    if code not in (None, 0): sys.exit(str(code).replace("scripts/redtop.py", "scripts/zhinan.py") if isinstance(code, str) else code)


def lines_of(e):
    T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8")); L = T["lines"]; out = []
    for i, l in enumerate(L):
        to = L[i + 1]["start"] - 0.02 if i + 1 < len(L) and L[i + 1]["start"] - l["end"] < 0.5 else min(T["total"], l["end"] + 0.25)
        out.append({"from": round(max(0, l["start"] - 0.04), 2), "to": round(to, 2), "text": l["text"].strip(), "seg": l["seg"]})
    return out, T["total"]


def find(L, frag, after=0):
    f = strip(frag)
    for i, l in enumerate(L):
        if i >= after and f and f in strip(l["text"]): return i
    for i in range(after, len(L) - 1):                                   # 跨了两行
        if f and f in strip(L[i]["text"] + L[i + 1]["text"]): return i
    return None


def span(L, where, what):
    f0, _, f1 = where.partition("~"); i0 = find(L, f0); i1 = find(L, f1, i0 or 0) if f1 else i0
    if i0 is None or i1 is None: sys.exit(f"字幕里没找到这几个字：{f0 if i0 is None else f1}（{what}）")
    return i0, i1


def asset(e, f, sub="mat"):
    """素材拷进这一期的公开目录；返回给画面用的相对路径。"""
    if not os.path.exists(f): sys.exit("找不到素材：" + f)
    d = os.path.join(e.pub, sub); os.makedirs(d, exist_ok=True); n = re.sub(r"[^\w.]", "_", os.path.basename(f)); shutil.copy(f, os.path.join(d, n)); return f"{e.slug}/{sub}/{n}"


def cmd_suggest(a):
    e = rt.Ep(a.ep); e.need("cut"); L, total = lines_of(e); tk = []
    T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8"))
    for l in T["lines"]: tk += [{"t": c["c"], "s": c["t"]} for c in l["chars"] if c["c"].strip()]
    f = os.path.join(e.tmp, "match-asr.json"); os.makedirs(e.tmp, exist_ok=True); json.dump({"dur": total, "tokens": tk}, open(f, "w", encoding="utf8"), ensure_ascii=False)
    subprocess.run([PY, os.path.join(SC, "match.py"), f, "--depth", "--out", e.work], check=True)
    print(f"匹配表在 {os.path.join(e.work, '匹配表.md')}。通读一遍，删掉牵强的，然后：\n"
          "  1. 「要找的素材」交给技能 footage-guide 去备（先用没风险的）；每条先 check 再 fit --slot zhinan-window（取景框）或 tall-full（满屏）。\n"
          "  2. 数字 → --num，设问或最重的词 → --behind 或 --word，几个并列的词 → --tags，现场画面 → --panel，证据截图 → --doc 或 --chest。\n"
          f"  3. 这条片子 {total:.0f} 秒，照对标片的密度大约要 {max(1, round(total * 0.3 / 2))} 到 {max(2, round(total * 0.4 / 2))} 个素材镜头（素材版式占三到四成，两秒一换）。备不到这么多就少用面板，多用怼脸、数字和词牌。")


def cmd_plan(a):
    e = rt.Ep(a.ep); e.need("cut"); L, total = lines_of(e); n = len(L); beats_at = {}; overs = []; used = set()
    hook_n = sum(1 for l in L if l["seg"] == 1) if e.st.get("hook") else 0; hook_end = L[hook_n - 1]["to"] if hook_n else 0.0

    def parse(spec, what):
        if "@" not in spec: sys.exit(f"{what} 的写法：内容@字幕里的几个字")
        body, where = spec.rsplit("@", 1); mini = where.endswith("+mini"); where = where[:-5] if mini else where; i0, i1 = span(L, where.strip(), what); return body.strip(), i0, i1, mini
    # 整屏换掉的版式：面板、满屏素材、卡片、文件
    for mode, specs in (("panel", a.panel), ("cover", a.cover)):
        for spec in specs or []:
            body, i0, i1, mini = parse(spec, "--" + mode); files = [asset(e, x.strip()) for x in body.split(",") if x.strip()]; t0, t1 = L[i0]["from"], L[i1]["to"]; k = max(len(files), round((t1 - t0) / 1.9)); step = (t1 - t0) / k
            clips = [{"src": files[j % len(files)], "at": round(t0 + j * step, 2), "startFrom": round((j // len(files)) * step, 2)} for j in range(k)]
            beats_at[i0] = {"at": t0, "mode": mode, "clips": clips, **({"mini": True} if mini else {})}; used.update(range(i0, i1 + 1))
    for spec in a.card or []:
        body, i0, i1, mini = parse(spec, "--card"); word, _, img = body.partition(":"); b = {"at": L[i0]["from"], "mode": "card", "word": word.strip()}
        if img.strip(): b["img"] = asset(e, img.strip())
        if mini: b["mini"] = True
        beats_at[i0] = b; used.update(range(i0, i1 + 1))
    for spec in a.doc or []:
        body, i0, i1, mini = parse(spec, "--doc"); beats_at[i0] = {"at": L[i0]["from"], "mode": "card", "doc": asset(e, body), "mini": True}; used.update(range(i0, i1 + 1))
    # 叠在人身上的东西
    def over(typ, spec, lo=1.5, hi=4.5):
        body, i0, i1, _ = parse(spec, "--" + typ); t0 = L[i0]["from"]; t1 = min(max(L[i1]["to"], t0 + lo), t0 + hi, total); return body, i0, t0, round(t1, 2)
    for spec in a.chest or []: body, i0, t0, t1 = over("chest", spec, 2.0); overs.append({"type": "media", "from": t0, "to": t1, "src": asset(e, body)})
    for spec in a.num or []: body, i0, t0, t1 = over("num", spec, 2.0, 3.0); tx, _, sb = body.partition("|"); overs.append({"type": "num", "from": t0, "to": t1, "text": tx.strip(), **({"sub": sb.strip()} if sb.strip() else {})})
    for spec in a.word or []: body, i0, t0, t1 = over("word", spec, 1.5, 3.0); tx, _, sb = body.partition("|"); overs.append({"type": "word", "from": t0, "to": t1, "text": tx.strip(), **({"sub": sb.strip()} if sb.strip() else {})})
    for spec in a.tags or []:
        body, i0, i1, _ = parse(spec, "--tags"); items = [x.strip() for x in re.split("[,，]", body) if x.strip()]; t0 = L[i0]["from"]; t1 = min(total, max(L[i1]["to"], t0 + 0.6 * len(items)) + 1.0); ats = []
        T = json.load(open(os.path.join(e.work, "timing.json"), encoding="utf8"))["lines"]; chars = [(c["c"], c["t"]) for l in T[i0:i1 + 1] for c in l["chars"]]; flat = "".join(c for c, _ in chars)
        for j, it in enumerate(items): p = flat.find(it[:2]); ats.append(round(chars[p][1] - 0.05, 2) if p >= 0 else round(t0 + j * (t1 - 1 - t0) / max(1, len(items)), 2))     # 念到哪个词弹哪个
        overs.append({"type": "tags", "from": t0, "to": round(t1, 2), "items": items, "ats": ats})
    for spec in a.emoji or []: body, i0, t0, t1 = over("emoji", spec, 1.5, 3.0); overs.append({"type": "emoji", "from": t0, "to": t1, "text": body})
    for spec in a.float or []: body, i0, t0, t1 = over("float", spec, 2.0, 3.0); overs.append({"type": "float", "from": t0, "to": t1, "text": body})
    behind = []
    for spec in a.behind or []: body, i0, t0, t1 = over("behind", spec, 1.5, 3.0); behind.append({"type": "behind", "from": t0, "to": t1, "text": body})
    # 自动的大数字：这句里有够大的数、这一句没别的东西、离上一个数字够远
    if not a.no_auto_num:
        last = -99
        for i, l in enumerate(L):
            m = re.search(r"\d[\d,.]*\s*(?:亿|万|%|％|倍|块|元|美元|人|家|年|天|个|米|公里|吨|度|岁)?", l["text"])
            if not m or len(re.sub(r"\D", "", m.group(0))) < 2 or i in used or i < hook_n: continue
            if l["from"] - last < NUM_EVERY or any(o["from"] < l["to"] + 0.3 and l["from"] < o["to"] + 0.3 for o in overs + behind): continue
            overs.append({"type": "num", "from": l["from"], "to": round(min(total, max(l["to"], l["from"] + 2.0)), 2), "text": m.group(0).strip(), "auto": True}); last = l["from"]
    # 景别：默认人全屏，1.0 和 1.1 倍来回换（剪口上必换，否则 2.7 秒一换）；短的设问句和全片最后一句怼脸
    cuts = json.load(open(os.path.join(e.work, "cuts.json"), encoding="utf8")).get("cuts", []); shift = e.st["hook"]["dur"] if e.st.get("hook") else 0
    beats = []; zoom = 1.0; last_z = -9.0; punched = 0; i = 0
    while i < n:
        l = L[i]; t = l["from"]
        if i in beats_at:
            b = beats_at[i]; beats.append(b); i += 1
            while i < n and i in used and i not in beats_at: i += 1
            last_z = -9.0; continue
        busy = any(o["from"] < l["to"] and l["from"] < o["to"] for o in overs + behind); d = l["to"] - l["from"]
        is_q = re.search(r"(吗|呢|凭什么|为什么|怎么|啥)[？?]?$", strip(l["text"])) is not None
        if not a.no_punch and not busy and ((is_q and d <= 1.6 and punched < PUNCH_MAX and i > hook_n) or i == n - 1): beats.append({"at": t, "mode": "punch"}); punched += i < n - 1; last_z = -9.0; i += 1; continue
        on_cut = any(abs(c + shift - t) < 0.35 for c in cuts)
        if not beats or beats[-1]["mode"] != "full" or on_cut or t - last_z >= ZOOM_EVERY: zoom = 1.0 if zoom > 1 else ZOOM; last_z = t; beats.append({"at": t, "mode": "full", "zoom": zoom})
        i += 1
    beats[0]["at"] = 0; mattes = []
    # 身后大黄字：只能出在人全屏上；把那几秒的人抠出来
    for k, o in enumerate(behind):
        b = [x for x in beats if x["at"] <= o["from"] + 0.05][-1]
        if b["mode"] not in ("full", "punch"): print(f"提醒：「{o['text']}」落在{b['mode']}版式上，身后大字只能出在人全屏时，这一处没加。"); continue
        nxt = next((x["at"] for x in beats if x["at"] > o["from"] + 0.05 and x["mode"] not in ("full", "punch")), total); o["to"] = round(min(o["to"], nxt), 2); d = os.path.join(e.pub, f"m{k}"); fps = e.st["raw"].get("fps", 30)
        o["from"] = round(round(o["from"] * 30) / 30, 4)
        print(f"抠像：{o['from']:.1f} 到 {o['to']:.1f} 秒（「{o['text']}」），要等一会儿 …", flush=True)
        r = subprocess.run([PY, os.path.join(SC, "matte.py"), "make", os.path.join(e.pub, "person.mp4"), "--from", str(o["from"]), "--to", str(o["to"] + 0.1), "--out", d, "--check"], capture_output=True, text=True)
        if r.returncode: print("抠像没成功，这一处身后大字没加：" + (r.stderr or r.stdout)[-300:]); continue
        for junk in ("person-fg.webm", "person-matte.mp4"):
            if os.path.exists(os.path.join(d, junk)): os.remove(os.path.join(d, junk))
        mattes.append({"from": o["from"], "to": o["to"], "dir": f"{e.slug}/m{k}/person-fg"}); overs.append(o); print("  检查图（要看）：" + os.path.join(d, "person-抠像检查.jpg"))
    # 每一句一条字幕；太长的自动缩字号
    subs = [{"from": l["from"], "to": l["to"], "text": l["text"]} for l in L]
    plan = {"video": f"{e.slug}/person.mp4", "audio": f"{e.slug}/mix.wav", "total": round(total, 2), "vw": 1080, "vh": 1920, "face": e.st["face"], "beats": [{**b, "at": round(b["at"], 2)} for b in beats], "subs": subs,
            "overs": sorted(overs, key=lambda o: o["from"]), "mattes": mattes, "sign": {"badge": a.badge} if a.badge else None, "note": a.note or None}
    w, h, _, _ = rt.probe(os.path.join(e.pub, "person.mp4")); plan["vw"], plan["vh"] = w, h
    json.dump(plan, open(e.plan, "w", encoding="utf8"), ensure_ascii=False, indent=1); e.st.update(planned=True, style="zhinan", hook_end=round(hook_end, 2), key_ranges=[], speech_total=total); e.save()
    if not os.path.exists(os.path.join(e.pub, "mix.wav")): shutil.copy(os.path.join(e.pub, "voice.wav"), os.path.join(e.pub, "mix.wav"))
    print(report(e, plan)); print(f"plan.json 可以直接改：episodes/{a.ep}/plan.json\n下一步：python3 scripts/zhinan.py music {a.ep}（不要配乐加 --off）→ stills → render")


def changes(plan):
    """画面上每一次看得见的变化的时刻：换版式、换景别、面板里换素材、叠上去一样东西。"""
    ts = {b["at"] for b in plan["beats"]} | {c["at"] for b in plan["beats"] for c in b.get("clips", [])} | {o["from"] for o in plan.get("overs", [])} | {x for o in plan.get("overs", []) for x in o.get("ats", [])}
    return sorted(ts)


def report(e, plan):
    N = {"full": "人全屏", "punch": "怼脸", "panel": "取景框面板", "cover": "满屏素材", "card": "网格卡片"}; O = {"media": "胸口素材窗", "emoji": "表情", "float": "满屏飘", "num": "黄色数字", "word": "白色大字", "tags": "黄色词牌", "behind": "身后大黄字"}
    T = plan["total"]; bs = plan["beats"]; sh = {}
    for i, b in enumerate(bs): sh[b["mode"]] = sh.get(b["mode"], 0) + (bs[i + 1]["at"] if i + 1 < len(bs) else T) - b["at"]
    ch = changes(plan); gaps = [b - a for a, b in zip(ch, ch[1:] + [T])]; long = [(a, g) for a, g in zip(ch, gaps) if g > 5.0]
    rows = ["# 版式表 · 网格取景框口播风", "", "| 时间 | 版式 | 字幕 | 叠了什么 |", "|---|---|---|---|"]
    for s in plan["subs"]:
        b = [x for x in bs if x["at"] <= s["from"] + 0.05][-1]; ov = [O[o["type"]] + "「" + (o.get("text") or "、".join(o.get("items", [])) or os.path.basename(o.get("src", ""))) + "」" for o in plan.get("overs", []) if min(o["to"], s["to"]) - max(o["from"], s["from"]) > 0.3]
        rows.append(f"| {s['from']:.1f} | {N[b['mode']]}{'（推近）' if b.get('zoom', 1) > 1 else ''} | {s['text']} | {'；'.join(ov)} |")
    rows += ["", f"占比：" + "，".join(f"{N[k]} {v / T:.0%}" for k, v in sorted(sh.items(), key=lambda x: -x[1])), f"画面平均 {T / max(1, len(ch)):.1f} 秒变一次（{len(ch)} 次）。" + (f"超过 5 秒没动的有 {len(long)} 处：" + "、".join(f"{a:.0f} 秒起 {g:.0f} 秒" for a, g in long[:6]) + "。在这些地方加一样东西（数字、词牌、表情、胸口素材）。" if long else "没有超过 5 秒不动的地方。"), TARGET]
    os.makedirs(e.work, exist_ok=True); open(os.path.join(e.work, "版式表.md"), "w", encoding="utf8").write("\n".join(rows) + "\n"); return "\n".join(rows)


def cmd_music(a):
    """配乐比红顶风再轻一点（对标片比人声低 22 分贝以上，有的干脆不铺）；每往人身上贴一样东西配一声很轻的「啵」。"""
    import numpy as np, soundfile as sf
    rt.BED_DB = -26.0; sfx = not a.no_sfx; a.no_sfx = True; shared(rt.cmd_music, a)
    if not sfx: return
    e = rt.Ep(a.ep); plan = json.load(open(e.plan, encoding="utf8")); mp = os.path.join(e.pub, "mix.wav"); x, SR = sf.read(mp); n = 0
    def pop(at, f0=520.0, db=-25.0):
        i0 = int(at * SR); m = int(0.09 * SR)
        if i0 < 0 or i0 + m > len(x): return 0
        tt = np.arange(m) / SR; w = np.sin(2 * np.pi * (f0 + 900 * np.exp(-tt * 60)) * tt) * np.exp(-tt * 45) * 10 ** (db / 20); x[i0:i0 + m] += w[:, None] if x.ndim == 2 else w; return 1
    for o in plan.get("overs", []):
        for at in (o.get("ats") or [o["from"]]): n += pop(at, 620 if o["type"] in ("num", "word", "behind") else 520)
    sf.write(mp, np.clip(x, -0.95, 0.95), SR); print(f"音效：往人身上贴东西的 {n} 处各加了一声很轻的「啵」（普通剪口不加）。不要的话重跑 music 加 --no-sfx。")


def cmd_stills(a):
    e = rt.Ep(a.ep); e.need("planned"); plan = json.load(open(e.plan, encoding="utf8")); os.makedirs(e.out, exist_ok=True); os.makedirs(e.tmp, exist_ok=True); bs = plan["beats"]; ts = []; seen = set()
    for i, b in enumerate(bs):
        k = (b["mode"], b.get("zoom", 1)); t1 = bs[i + 1]["at"] if i + 1 < len(bs) else plan["total"]
        if k not in seen and t1 - b["at"] > 0.4: seen.add(k); ts.append(min(b["at"] + (t1 - b["at"]) * 0.6, t1 - 0.1))
    for o in plan.get("overs", []):
        if o["type"] not in seen or o["type"] == "behind": seen.add(o["type"]); ts.append(min(o["to"] - 0.15, o["from"] + (1.6 if o["type"] == "tags" else 0.7)))
    ts = sorted(set(round(t, 2) for t in ts))[:12]; shots = []
    for i, t in enumerate(ts):
        o = os.path.join(e.tmp, f"k{i}.jpg"); rt.run(["npx", "remotion", "still", "src/index.tsx", "ZHINAN", o, "--props", e.plan, "--frame", str(int(t * 30)), "--scale", "0.4", "--log", "error", *rt.browser()], cwd=STUDIO); shots.append(o)
    sheet = os.path.join(e.out, "关键帧.jpg"); rt.ff(*sum((["-i", s] for s in shots), []), "-filter_complex", f"hstack={len(shots)}" if len(shots) > 1 else "null", sheet)
    print(f"关键帧联系表（{len(shots)} 张，时间点 {ts}）：{sheet}\n用看图工具看：字幕有没有出框或压住素材、取景框里的素材有没有黑边、数字和词牌有没有挡脸、身后大字能不能读出来（被头挡住不超过一半）。没问题再 render。")


def cmd_render(a):
    e = rt.Ep(a.ep); e.need("planned"); os.makedirs(e.out, exist_ok=True); plan = json.load(open(e.plan, encoding="utf8")); o = os.path.join(e.out, "成片.mp4")
    rt.run(["npx", "remotion", "render", "src/index.tsx", "ZHINAN", o, "--props", e.plan, "--concurrency", str(min(4, os.cpu_count() or 2)), "--log", "error", *rt.browser()], cwd=STUDIO)
    print(f"成片：{o}\n" + report(e, plan).split("\n\n")[-1]); q = os.path.join(SC, "qc.py")
    if os.path.exists(q):
        r = subprocess.run([PY, q, o], capture_output=True, text=True); print(r.stdout.strip()[-700:])
        if "亮度突变" in r.stdout: print("说明：这种风格全是硬切，进出网格底面板时亮度本来就会跳，「亮度突变」报在这些时刻属于正常；黑场、闪帧、画面停滞有内容才是真问题。")
    print(f"下一步：逐秒看 out/qc/sheet-1fps.jpg，再把成片给用户看；他点头后 python3 scripts/zhinan.py publish {a.ep}")


def cmd_publish(a):
    e = rt.Ep(a.ep); e.need("planned"); pj = os.path.join(e.dir, "发布.json")
    if not os.path.exists(pj):
        rt.run([PY, os.path.join(SC, "publish_kit.py"), "init", a.ep], capture_output=True); print(f"已生成 {pj}。请你填：封面两行字（cover.l1 / l2）、三个标题、简介、话题、提醒，填完再跑一次 publish。"); return
    plan = json.load(open(e.plan, encoding="utf8")); bd = os.path.join(R, "brands", "_zhinan"); os.makedirs(bd, exist_ok=True)
    json.dump({"name": (plan.get("sign") or {}).get("badge", ""), "font": "AlimamaShuHeiTi-Bold.ttf", "colors": {"底色": "#1E1D17", "主色": "#FAF106", "辅色": "#FFFFFF"}}, open(os.path.join(bd, "fingerprint.json"), "w", encoding="utf8"), ensure_ascii=False)
    r = subprocess.run([PY, os.path.join(SC, "publish_kit.py"), "build", a.ep, "--video", os.path.join(e.pub, "person.mp4"), "--clean", "--brand", "_zhinan", "--max-title", "20"], capture_output=True, text=True)
    print((r.stdout + (r.stderr if r.returncode else "")).strip()[-900:])
    if r.returncode: sys.exit(1)
    if (e.st.get("music") or {}).get("credit"): print("配乐要署名，写进简介：" + e.st["music"]["credit"])


def cmd_status(a):
    e = rt.Ep(a.ep); e.need(); s = e.st; steps = [("转写", s.get("transcribed")), ("用户确认字幕稿、要剪的地方、封面标题", s.get("cut")), ("粗剪", s.get("cut")), ("匹配表和备素材", os.path.exists(os.path.join(e.work, "匹配表.md"))), ("排版式", s.get("planned")), ("配乐", s.get("music") is not None), ("成片", os.path.exists(os.path.join(e.out, "成片.mp4"))), ("发布包", os.path.isdir(os.path.join(e.out, "发布包")))]
    for i, (n, ok) in enumerate(steps, 1): print(("✓ " if ok else "· ") + f"{i}. {n}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("new"); p.add_argument("ep"); p.add_argument("--video", required=True)
    p = sub.add_parser("transcribe"); p.add_argument("ep"); p.add_argument("--force", action="store_true")
    p = sub.add_parser("confirm"); p.add_argument("ep"); p.add_argument("--titles", required=True); p.add_argument("--hooks", default=""); p.add_argument("--name", default=""); p.add_argument("--role", default="")
    p = sub.add_parser("cut"); p.add_argument("ep"); p.add_argument("--drop", default=""); p.add_argument("--keep-retakes", action="store_true"); p.add_argument("--hook", default=""); p.add_argument("--denoise", action="store_true"); p.add_argument("--grade", action="store_true")
    p = sub.add_parser("plan"); p.add_argument("ep"); p.add_argument("--badge", default=""); p.add_argument("--note", default=""); p.add_argument("--no-auto-num", action="store_true"); p.add_argument("--no-punch", action="store_true")
    for k in ("panel", "cover", "chest", "num", "word", "tags", "behind", "emoji", "float", "card", "doc"): p.add_argument("--" + k, action="append")
    p = sub.add_parser("music"); p.add_argument("ep"); p.add_argument("--track"); p.add_argument("--mood", default="drive"); p.add_argument("--off", action="store_true"); p.add_argument("--no-sfx", action="store_true")
    for c in ("suggest", "stills", "render", "publish", "status"): sub.add_parser(c).add_argument("ep")
    a = ap.parse_args()
    if a.cmd in ("new", "transcribe", "confirm", "cut"): shared(getattr(rt, "cmd_" + a.cmd), a)
    else: globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
