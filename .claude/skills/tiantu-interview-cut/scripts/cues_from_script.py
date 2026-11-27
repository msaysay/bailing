#!/usr/bin/env python3
"""Paper edit (script.txt) + transcript.json -> tight cues.json (stutters, false starts, fillers, long pauses removed).

    python3 cues_from_script.py work/transcript.json work/script.txt -o work/cues.json [--no-verify]

script.txt line:   ASR原文 | 字幕文本 | 关键词,关键词 | 选项
  * column 1 keeps the ASR characters (they locate the audio). Characters inside [ ] are CUT OUT:
        我[我我]们这个[这个]渠道      -> stutter / repeated word removed
        [嗯]其实也是美国时间           -> filler removed
  * 选项 `keep`: do not auto-remove anything inside this line (use when the tool cut a real word).

What happens automatically (see references/audio-cleanup.md):
  1. the audio of the kept lines is split into voiced bursts at energy dips;
  2. each burst is re-recognised on its own; a burst is dropped when it is a false start
     (its syllables are the beginning of the next burst: "剩下的…剩下的洛杉矶"、"除、除、除了"),
     a filler (嗯/呃), or an unscripted noise the ASR did not transcribe;
  3. every pause longer than --pause is shortened to --gap (breaths between sentences go too);
  4. cuts are only placed in energy dips, never through a syllable;
  5. the tightened audio is transcribed again and compared with the script (verify).
Output: cues; a line that was cut internally becomes several cues, the extra ones marked "cont".
"""
import argparse, json, os, re, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("transcript"); ap.add_argument("script")
ap.add_argument("-o", "--out", default="work/cues.json")
ap.add_argument("--pause", type=float, default=0.28, help="pauses longer than this are shortened")
ap.add_argument("--gap", type=float, default=0.13, help="...to this length")
ap.add_argument("--model", default="large-v3-turbo")
ap.add_argument("--repeat", type=float, default=0.55, help="acoustic similarity above which a burst is a repeat of what follows")
ap.add_argument("--no-asr", action="store_true", help="skip burst recognition (pauses only, no stutter removal)")
ap.add_argument("--no-verify", action="store_true")
a = ap.parse_args()
P = re.compile(r"[，。！？、；：,.!?;:…\s]")
FILL = set("嗯呃额唔哦噢啊哎唉诶欸")
HOP = 0.01
try:
    from pypinyin import lazy_pinyin
    py = lambda s: [x for x in lazy_pinyin(P.sub("", s)) if x.strip()]
except Exception:
    py = lambda s: list(P.sub("", s))

# ------------------------------------------------------------------ transcript -> char stream
chars = []                                   # [char, start, end, src]
for seg in json.load(open(a.transcript, encoding="utf8")):
    for w in seg["words"]:
        t = P.sub("", w["w"])
        if not t:
            continue
        d = (w["e"] - w["s"]) / len(t)
        for k, ch in enumerate(t):
            chars.append([ch.lower(), w["s"] + k * d, w["s"] + (k + 1) * d, seg["src"]])
stream = "".join(c[0] for c in chars)

# ------------------------------------------------------------------ script -> lines
lines, ptr, bad = [], 0, 0
for ln, raw in enumerate(open(a.script, encoding="utf8"), 1):
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    col = [c.strip() for c in raw.split("|")]
    key, cut, inb = "", [], False
    for ch in P.sub("", col[0]).lower():
        if ch in "[【":
            inb = True
        elif ch in "]】":
            inb = False
        else:
            key += ch
            cut.append(inb)
    if not key or all(cut):
        continue
    i = stream.find(key, ptr)
    if i < 0:
        i = stream.find(key)
    if i < 0:
        print("line %d: '%s' not found in the transcript - column 1 must keep the ASR characters" % (ln, col[0]))
        bad += 1
        continue
    plain = "".join(ch for ch, c in zip(key, cut) if not c)
    text = P.sub("", col[1]) if len(col) > 1 and col[1] else plain
    kw = [k.strip() for k in re.split("[,，]", col[2]) if k.strip()] if len(col) > 2 else []
    lines.append({"i": i, "j": i + len(key) - 1, "cut": cut, "text": text, "kw": kw, "plain": plain,
                  "keep": len(col) > 3 and "keep" in col[3].lower(), "src": chars[i][3], "ln": ln})
    ptr = i + len(key)
if bad:
    sys.exit("%d lines could not be aligned" % bad)

# ------------------------------------------------------------------ audio envelope per source
ENV, FEAT = {}, {}
def _melfb(n_fft=400, n_mel=26, sr=16000):
    m = lambda f: 2595 * np.log10(1 + f / 700); im = lambda v: 700 * (10 ** (v / 2595) - 1)
    bins = np.floor((n_fft + 1) * im(np.linspace(m(100), m(7000), n_mel + 2)) / sr).astype(int)
    fb = np.zeros((n_mel, n_fft // 2 + 1))
    for i in range(n_mel):
        p, q, r = bins[i], bins[i + 1], bins[i + 2]
        fb[i, p:q] = (np.arange(p, q) - p) / max(q - p, 1); fb[i, q:r] = (r - np.arange(q, r)) / max(r - q, 1)
    return fb
def feats(x):
    """Log-mel frames (10 ms), channel- and loudness-normalised: what a syllable 'sounds like'."""
    fb, out = _melfb(), []
    n = (len(x) - 400) // 160 + 1
    for s0 in range(0, max(n, 0), 6000):                       # one minute at a time
        idx = np.arange(400)[None, :] + 160 * np.arange(s0, min(s0 + 6000, n))[:, None]
        out.append(np.log((np.abs(np.fft.rfft(x[idx] * np.hanning(400), axis=1)) ** 2) @ fb.T + 1e-8).astype(np.float32))
    M = np.vstack(out) if out else np.zeros((0, 26), np.float32)
    M = M - M.mean(0, keepdims=True)
    return M - M.mean(1, keepdims=True)
def sim(src, a0, b0, L):
    """Similarity (0..1) of two stretches of length L seconds starting at a0 and b0: ~1 = the same syllables again."""
    F = FEAT[src]; n = int(L / HOP); ia, ib = int(a0 / HOP), int(b0 / HOP)
    best = 0.0
    for sh in range(-3, 4):
        A, B = F[max(ia + sh, 0): max(ia + sh, 0) + n], F[ib: ib + n]
        k = min(len(A), len(B))
        if k < 6:
            continue
        c = (A[:k] * B[:k]).sum(1) / (np.linalg.norm(A[:k], axis=1) * np.linalg.norm(B[:k], axis=1) + 1e-9)
        best = max(best, float(c.mean()))
    return best
def env(src):
    if src not in ENV:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-af", "highpass=f=100",
                              "-f", "s16le", "-"], stdout=subprocess.PIPE, check=True).stdout
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
        n = len(x) // 160
        e = 20 * np.log10(np.sqrt((x[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-6)
        e = np.convolve(e, np.ones(3) / 3, "same")
        lo, hi = np.percentile(e, 5), np.percentile(e, 95)
        thr = lo + min(max(0.3 * (hi - lo), 6), 15)
        ENV[src] = (x, e, thr)
        FEAT[src] = feats(x)
        print("# %s: noise floor %.0f dB, speech %.0f dB, voiced above %.0f dB" % (os.path.basename(src), lo, hi, thr))
    return ENV[src]

def bursts(src, t0, t1, min_dip=0.09, min_burst=0.06):
    """Voiced bursts [(start,end)] inside [t0,t1]; dips shorter than min_dip do not split."""
    x, e, thr = env(src)
    a0, a1 = max(int(t0 / HOP), 0), min(int(t1 / HOP), len(e))
    v = e[a0:a1] > thr
    out, k = [], 0
    while k < len(v):
        if v[k]:
            m = k
            while m < len(v) and v[m]:
                m += 1
            out.append([a0 + k, a0 + m]); k = m
        else:
            k += 1
    merged = []
    for b in out:
        if merged and (b[0] - merged[-1][1]) * HOP < min_dip:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    return [(b[0] * HOP, b[1] * HOP) for b in merged if (b[1] - b[0]) * HOP >= min_burst]

def quiet_point(src, t, win=0.07):
    """Nearest local energy minimum around t - where a cut inside continuous speech hurts least."""
    x, e, thr = env(src)
    c = int(t / HOP); w = int(win / HOP)
    lo, hi = max(c - w, 0), min(c + w + 1, len(e))
    return (lo + int(np.argmin(e[lo:hi]))) * HOP if hi > lo else t

MODEL = None
def hear(src, t0, t1):
    global MODEL
    if a.no_asr:
        return None
    if MODEL is None:
        from faster_whisper import WhisperModel
        MODEL = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    x = env(src)[0]
    pad = np.zeros(4800, np.float32)
    clip = np.concatenate([pad, x[int(max(t0 - 0.03, 0) * 16000): int((t1 + 0.03) * 16000)], pad])
    segs, _ = MODEL.transcribe(clip, language="zh", vad_filter=False, condition_on_previous_text=False,
                               initial_prompt="以下是普通话口语。", beam_size=5)
    t = P.sub("", "".join(s.text for s in segs))
    return "" if (t1 - t0 < 0.6 and len(t) > 6) else t       # tiny burst + long text = hallucination

# ------------------------------------------------------------------ runs of consecutive lines
groups = []
for L in lines:
    if groups and groups[-1][-1]["j"] + 1 == L["i"] and groups[-1][-1]["src"] == L["src"]:
        groups[-1].append(L)
    else:
        groups.append([L])

cues, log, removed, stut = [], [], 0.0, 0
for g in groups:
    src = g[0]["src"]
    i0, j1 = g[0]["i"], g[-1]["j"]
    lo = chars[i0 - 1][2] if i0 and chars[i0 - 1][3] == src else 0.0          # neighbours we must not swallow
    hi = chars[j1 + 1][1] if j1 + 1 < len(chars) and chars[j1 + 1][3] == src else chars[j1][2] + 0.6
    T0 = max(chars[i0][1] - 0.25, min(lo + 0.02, chars[i0][1]), 0)
    T1 = min(chars[j1][2] + 0.30, max(hi - 0.02, chars[j1][2]))
    bs = bursts(src, T0, T1)
    if not bs:
        bs = [(chars[i0][1], chars[j1][2])]
    # which characters are kept / bracketed, and line boundaries in time
    kept = []                                       # (start, end, line_index)
    brk = []                                        # bracketed spans
    for li, L in enumerate(g):
        k = L["i"]
        while k <= L["j"]:
            c = L["cut"][k - L["i"]]
            m = k
            while m + 1 <= L["j"] and L["cut"][m + 1 - L["i"]] == c:
                m += 1
            (brk if c else kept).append((chars[k][1], chars[m][2], li))
            k = m + 1
    def cover(b0, b1, spans):
        return sum(max(0, min(b1, e) - max(b0, s)) for s, e, _ in spans)
    # --- decide burst by burst
    info = []
    for n, (b0, b1) in enumerate(bs):
        d = b1 - b0
        ck, cb = cover(b0, b1, kept), cover(b0, b1, brk)
        li = max(range(len(g)), key=lambda q: cover(b0, b1, [s for s in kept if s[2] == q]) - abs(q - 0) * 1e-9)
        info.append({"b": [b0, b1], "d": d, "ck": ck, "cb": cb, "li": li, "drop": None, "txt": None})
    for n, it in enumerate(info):
        L = g[it["li"]]
        if it["cb"] > 0.6 * it["d"] and it["ck"] < 0.25 * it["d"]:
            it["drop"] = "删除标记[]"
            continue
        nxt = info[n + 1] if n + 1 < len(info) else None
        if L["keep"]:
            continue
        # acoustic repeat: this burst (or the tail of it) sounds the same as the start of the next one
        if nxt and nxt["b"][0] - it["b"][1] <= 1.5:
            dn = nxt["b"][1] - nxt["b"][0]
            if it["d"] <= 1.5:
                Lc = min(it["d"], dn, 0.8)
                sc = sim(src, it["b"][0], nxt["b"][0], Lc) if Lc >= 0.08 else 0
                if sc >= a.repeat:
                    it["drop"] = "口吃/重复（声学相似 %.2f）" % sc
                    continue
                elif sc >= a.repeat - 0.15:
                    log.append("  ? %s %.2f-%.2f 与后一段相似 %.2f，疑似重复，未剪（确认后可用 [ ] 标掉）" % (os.path.basename(src), it["b"][0], it["b"][1], sc))
            best = None
            for Lc in [x / 100 for x in range(15, 85, 5)]:        # a repeat glued to the end of this burst
                if Lc > min(it["d"] - 0.1, dn):
                    break
                sc = sim(src, it["b"][1] - Lc, nxt["b"][0], Lc)
                if sc >= a.repeat + 0.15:
                    best = (Lc, sc)
            if best and it["d"] > 1.5 or (best and best[0] < it["d"] - 0.1):
                cutp = quiet_point(src, it["b"][1] - best[0], 0.04)
                log.append("  ✂ %s %.2f-%.2f 口吃/重复（句尾粘连，声学相似 %.2f）" % (os.path.basename(src), cutp, it["b"][1], best[1]))
                removed += it["b"][1] - cutp; stut += 1
                it["b"][1] = cutp; it["d"] = cutp - it["b"][0]
        if a.no_asr:
            continue
        suspicious = it["ck"] < 0.3 * it["d"] or it["d"] <= 0.7 or (nxt and nxt["b"][0] - it["b"][1] > 0.2)
        if not suspicious or not nxt:
            if it["ck"] < 0.3 * it["d"] and it["d"] <= 1.2 and not nxt:
                it["txt"] = hear(src, *it["b"])
                if not it["txt"] or set(it["txt"]) <= FILL:
                    it["drop"] = "句尾杂音/语气词"
            continue
        it["txt"] = hear(src, *it["b"])
        pa = py(it["txt"])
        if it["ck"] < 0.3 * it["d"] and (not pa or set(it["txt"]) <= FILL):
            it["drop"] = "语气词/杂音 '%s'" % it["txt"]
            continue
        if nxt["b"][0] - it["b"][1] > 1.5 or not pa:
            continue
        if nxt["txt"] is None:
            nxt["txt"] = hear(src, *nxt["b"])
        pb = py(nxt["txt"])
        if pb[: len(pa)] == pa and (len(pb) > len(pa) or it["d"] < 0.5):
            it["drop"] = "起头重说 '%s'→'%s'" % (it["txt"], nxt["txt"][:8])
        elif it["d"] <= 0.45 and pb and pa[0] == pb[0]:
            it["drop"] = "口吃 '%s'→'%s'" % (it["txt"], nxt["txt"][:6])
        elif it["ck"] < 0.3 * it["d"] and it["d"] <= 1.2:
            exp = " ".join(py("".join(x["plain"] for x in g)))
            if " ".join(pa) not in exp:
                it["drop"] = "未在稿中的发声 '%s'" % it["txt"]
    # a bracket inside continuous speech: carve it out of its burst at the quietest points
    pieces = []
    for it in info:
        if it["drop"]:
            stut += 1
            removed += it["d"]
            log.append("  ✂ %s %.2f-%.2f %s" % (os.path.basename(src), it["b"][0], it["b"][1], it["drop"]))
            continue
        segs = [list(it["b"])]
        for s, e, _ in brk:
            if cover(it["b"][0], it["b"][1], [(s, e, 0)]) > 0.04:
                qs, qe = quiet_point(src, s), quiet_point(src, e)
                new = []
                for p0, p1 in segs:
                    if qe <= p0 or qs >= p1:
                        new.append([p0, p1]); continue
                    if qs - p0 > 0.06: new.append([p0, qs])
                    if p1 - qe > 0.06: new.append([qe, p1])
                    removed += min(qe, p1) - max(qs, p0); stut += 1
                    log.append("  ✂ %s %.2f-%.2f 删除标记[]（句中）" % (os.path.basename(src), max(qs, p0), min(qe, p1)))
                segs = new
        for p in segs:
            pieces.append(p)
    if not pieces:
        continue
    # split pieces at line boundaries (continuous speech across two subtitle lines)
    bounds = []
    for li in range(len(g) - 1):
        e_prev, s_next = chars[g[li]["j"]][2], chars[g[li + 1]["i"]][1]
        bounds.append(quiet_point(src, (e_prev + s_next) / 2) if s_next - e_prev < 0.1 else (e_prev + s_next) / 2)
    out = []
    for p0, p1 in pieces:
        cur = p0
        for li, bd in enumerate(bounds):
            if cur < bd < p1 and bd - cur > 0.05 and p1 - bd > 0.05:
                out.append([cur, bd, li]); cur = bd
        mid = (cur + p1) / 2
        out.append([cur, p1, sum(1 for bd in bounds if mid > bd)])
    # pad the pieces into the dips: pauses <= --pause stay natural, longer ones shrink to --gap
    for n, p in enumerate(out):
        prev_end = out[n - 1][1] if n else None
        nxt_start = out[n + 1][0] if n + 1 < len(out) else None
        p.append(0.05 if prev_end is None else min((p[0] - prev_end) / 2, a.gap * 0.4 if p[0] - prev_end > a.pause else 9))
        p.append(0.09 if nxt_start is None else min((nxt_start - p[1]) / 2, a.gap * 0.6 if nxt_start - p[1] > a.pause else 9))
    for n, (p0, p1, li, pl, pr) in enumerate(out):
        if n and out[n - 1][1] < p0 and p0 - out[n - 1][1] > a.pause:
            removed += (p0 - out[n - 1][1]) - a.gap
        L = g[li]
        s, e = max(p0 - pl, 0), p1 + pr
        if cues and cues[-1]["_L"] is L and abs(cues[-1]["out"] - s) < 0.015:
            cues[-1]["out"] = e
            continue
        if cues and cues[-1]["src"] == src and abs(cues[-1]["out"] - s) < 0.015:
            s = cues[-1]["out"]
        cues.append({"src": src, "in": s, "out": e, "text": L["text"], "kw": L["kw"], "_L": L})

# lines whose audio vanished entirely / cont marking
seen = set()
for c in cues:
    L = c.pop("_L")
    if id(L) in seen:
        c["cont"] = True
        c.pop("kw", None)
    seen.add(id(L))
    if not c.get("kw"):
        c.pop("kw", None)
    c["in"], c["out"] = round(c["in"], 3), round(c["out"], 3)
for L in lines:
    if id(L) not in seen:
        print("WARN line %d '%s': all of its audio was removed - add `| keep` as 4th column if that is wrong" % (L["ln"], L["plain"]))
cues = [c for c in cues if c["out"] - c["in"] >= 0.05]
# a cue shorter than 4 frames cannot stand alone on the timeline: glue it to its line-mate
k = 0
while k < len(cues):
    c = cues[k]
    if c["out"] - c["in"] < 0.14 and len(cues) > 1:
        if c.get("cont") and k:
            cues[k - 1]["_ext"] = True
        if k + 1 < len(cues) and cues[k + 1].get("cont") and not c.get("cont"):
            cues[k + 1].pop("cont"); 
            if c.get("kw"): cues[k + 1]["kw"] = c["kw"]
        log.append("  · dropped %.2fs sliver of '%s'" % (c["out"] - c["in"], c["text"]))
        cues.pop(k); continue
    k += 1
for c in cues:
    c.pop("_ext", None)

json.dump(cues, open(a.out, "w", encoding="utf8"), ensure_ascii=False, indent=0)
for k, c in enumerate(cues):
    gap = (c["in"] - cues[k - 1]["out"]) if k and cues[k - 1]["src"] == c["src"] else None
    mark = " " if gap is not None and abs(gap) < 0.03 else ("·" if gap is not None and 0 < gap < 0.7 else "✂") if k else " "
    print("%3d %s %7.2f-%7.2f %4.1fs  %s%s" % (k, mark, c["in"], c["out"], c["out"] - c["in"],
          ("〃 " if c.get("cont") else "") + c["text"], "  *" + ",".join(c["kw"]) if c.get("kw") else ""))
print("\n".join(log))
total = sum(c["out"] - c["in"] for c in cues)
print("wrote %s: %d cues, %.1fs of speech | removed %.1fs of pauses/stutters, %d disfluencies cut" % (a.out, len(cues), total, removed, stut))
print("  ✂ = hard cut in the picture (change shot / cover with b-roll)   · = micro jump (<0.7s removed, left as is)   〃 = same subtitle continues")

# ------------------------------------------------------------------ verify: listen to the result again
if not a.no_verify and not a.no_asr and cues:
    out = []
    for c in cues:
        x = env(c["src"])[0]
        out.append(x[int(c["in"] * 16000): int(c["out"] * 16000)])
    audio = np.concatenate(out)
    if MODEL is None:      # 前面没有需要复听的地方时模型还没加载；这里不加载的话校验会误报 0%
        from faster_whisper import WhisperModel
        MODEL = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    segs, _ = MODEL.transcribe(audio, language="zh", vad_filter=False, condition_on_previous_text=False,
                               initial_prompt="以下是普通话口语的逐字记录，保留口吃和重复：我、我们这个，这个这个。") if MODEL else ([], None)
    D = "零一二三四五六七八九"
    def zh(m):
        v = m.group(0)
        if len(v) > 4 or v.startswith("0"):
            return "".join(D[int(c)] for c in v)
        n, out_ = int(v), ""
        for u, name in ((1000, "千"), (100, "百"), (10, "十"), (1, "")):
            q, n = divmod(n, u)
            if q:
                out_ += ("" if (u == 10 and q == 1 and not out_) else D[q]) + name
            elif out_ and n and not out_.endswith("零"):
                out_ += "零"
        return out_ or "零"
    norm = lambda t: py(re.sub(r"\d+", zh, re.sub(r"(\d+)%", r"百分之\1", t)))
    heard = norm("".join(s.text for s in segs))
    want = norm("".join(L["plain"] for L in lines if id(L) in seen))
    import difflib
    sm = difflib.SequenceMatcher(None, want, heard, autojunk=False)
    issues = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        ctx = " ".join(want[max(i1 - 3, 0): i1])
        if tag == "delete": issues.append("少了 [%s]（…%s 之后）: 可能剪掉了真字 → 给该行加第4列 keep" % (" ".join(want[i1:i2]), ctx))
        elif tag == "insert": issues.append("多了 [%s]（…%s 之后）: 可能残留口吃/语气词 → 检查该处，用 [ ] 标掉" % (" ".join(heard[j1:j2]), ctx))
        else: issues.append("[%s] 听成 [%s]（…%s 之后）" % (" ".join(want[i1:i2]), " ".join(heard[j1:j2]), ctx))
    print("verify: %.0f%% of the scripted syllables heard back in order" % (100 * sm.ratio()))
    for s in issues[:25]:
        print("  ? " + s)
    if not issues:
        print("  clean: tightened audio says exactly the script")
