"""匹配和编排：先按标签从整个曲库里筛一批，再逐首听过后打分，
并给每首算出「从哪开始放、哪里循环、怎么收尾、每一刻多大声」。"""
import bisect, json, os
import numpy as np
from . import audio, library
from .library import RULES, LIB

FEEDBACK = os.path.join(LIB, "feedback.jsonl")
USAGE = os.path.join(LIB, "usage.json")
W = {"mood": 0.45, "bpm": 0.12, "speech": 0.18, "struct": 0.25}


def profile(brief):
    p = dict(RULES["types"][brief["type"]])
    for k in ("want", "avoid", "bpm", "bed_db", "open_db", "min_gap", "hook_s", "hook_db", "max_punch", "max_steadiness"):
        if k in brief:
            p[k] = brief[k]
    return p


def mood_score(dims, want, avoid):
    sw = sum(want.values()) or 1.0
    pos = sum(w * dims.get(k, 0) for k, w in want.items()) / sw
    bad = [w * dims.get(k, 0) for k, w in avoid.items()] or [0]
    return float(np.clip(pos - 0.7 * max(bad) - 0.15 * float(np.mean(bad)), -1, 1))


def bpm_score(bpm, window):
    if not bpm:
        return 0.5
    lo, hi = window
    d = max(lo - bpm, bpm - hi, 0)
    return float(max(0.0, 1 - d / 25))


def _history():
    fb = {}
    if os.path.exists(FEEDBACK):
        for line in open(FEEDBACK, encoding="utf-8"):
            r = json.loads(line)
            fb.setdefault((r["track"], r["type"]), []).append(1 if r["verdict"] == "good" else -1)
    use = json.load(open(USAGE)) if os.path.exists(USAGE) else {}
    return fb, use


def adjust(tid, vtype, fb, use):
    """听过的人说好就加分、说不好就减分；最近用过的歌略减分，免得每条片子都是同一首。"""
    v = fb.get((tid, vtype), [])
    return float(np.clip(0.08 * sum(v), -0.3, 0.2)) - min(0.12, 0.04 * use.get(tid, 0))


def prefilter(cat, brief, prof, need_free=False, pool=10):
    """第一轮：只看文字标签，不下载。硬条件一票否决：不能商用的、有人声的、怪乐器的、太短的。"""
    fb, use = _history()
    rows = []
    speech = bool(brief.get("voice"))
    for tid, t in cat["tracks"].items():
        lic = t["license"]
        if t.get("kind", "music") != "music" or t.get("unusable") or not lic.get("commercial"):
            continue
        if need_free and lic.get("attribution"):
            continue
        if (speech and t.get("vocal")) or t.get("odd"):
            continue
        a = t.get("analysis")
        length = a["duration"] if a else t.get("length") or 0
        if length < min(brief["duration"], 45):
            continue
        dims = t.get("dims_tag") or t.get("dims") or {}      # 第一轮只用人工标签，听过没听过的曲子排名才一致
        if not dims:
            continue
        s = 0.8 * mood_score(dims, prof["want"], prof["avoid"]) + 0.2 * bpm_score(t.get("bpm_tag") or (a or {}).get("bpm"), prof["bpm"]) + adjust(tid, brief["type"], fb, use)
        rows.append((s, tid))
    rows.sort(reverse=True)
    return [tid for _, tid in rows[:pool]]


# ---------- 编排 ----------

def _beats(a):
    """从重拍表补出每一拍（按四拍子在相邻重拍之间等分）。"""
    d = a["downbeats"]
    out = []
    for x, y in zip(d[:-1], d[1:]):
        out += [x + (y - x) * k / 4 for k in range(4)]
    return out + d[-1:]


def build_pieces(a, off, T):
    """把曲子铺满 T 秒。pieces: [视频起点, 视频终点, 曲子起点]。不够长就在段落交界处循环；能的话接上曲子自己的结尾。"""
    down, secs, out = a["downbeats"], a["sections"], a["out"]
    pieces, ending = [], {"type": "fade", "dur": 2.5}
    if off + T <= out + 0.05:
        pieces = [[0.0, T, off]]
    else:
        inner = [s["start"] for s in secs[1:]]
        L0 = next((b for b in inner if b >= a["body_in"]), None) if secs and secs[0]["role"] == "intro" else next((d for d in down if d >= a["body_in"]), None)
        L1 = secs[-1]["start"] if secs and secs[-1]["role"] == "outro" else next((d for d in reversed(down) if d <= out - 2), None)
        if L0 is None or L1 is None or L1 - L0 < 16:
            L0, L1 = (down[0], down[-1]) if len(down) > 8 else (a["in"], out)
        v, s = 0.0, off if off < L1 - 4 else L0
        while v < T - 1e-6:
            n = min(T - v, L1 - s)
            pieces.append([round(v, 3), round(v + n, 3), round(s, 3)])
            v += n; s = L0
    if abs(pieces[-1][2] + (pieces[-1][1] - pieces[-1][0]) - out) < 0.8 and a["end_natural"]:
        return pieces, {"type": "natural"}
    if a["end_natural"] and len(down) > 12 and T > 25:
        # 接结尾：视频最后 L 秒换成曲子自己的最后 L 秒。接点两边都落在重拍上；为此允许音乐比视频早结束最多 1.2 秒。
        v0, v1, s0 = pieces[-1]
        beat = a.get("beat") or 0.5
        best = None
        for dt in down:
            L = out - dt
            if not 5 <= L <= 14:
                continue
            p0 = s0 + (T - L - v0)                           # 不挪的话，接点处正文播到曲子的哪里
            if T - L - v0 < 2 or p0 > dt - 4:
                continue
            i = bisect.bisect_right(down, p0 + 1e-3) - 1
            if i < 0:
                continue
            delta = p0 - down[i]
            q = 1.0
            if delta > 1.2:
                delta, q = delta % beat, 0.7                 # 退一步：只对到拍，不对到小节
            cand = (q, -delta, L, dt)
            best = max(best, cand) if best else cand
        if best:
            q, nd, L, dt = best
            vs = T + nd - L
            pieces[-1] = [v0, round(vs, 3), s0]
            pieces.append([round(vs, 3), round(T + nd, 3), round(dt, 3)])
            ending = {"type": "button", "at": round(T + nd, 2), "bar_aligned": q == 1.0}
    return pieces, ending


def src_at(pieces, v):
    for v0, v1, s0 in pieces:
        if v0 <= v < v1:
            return s0 + v - v0
    return None


def anchors(brief):
    out = []
    for m in brief.get("moments", []):
        w = {"climax": 1.0, "turn": 0.6, "chapter": 0.5}.get(m["kind"])
        if w and 2 < m["t"] < brief["duration"] - 2:
            out.append((m["t"], w, m["kind"]))
    for s in brief["segments"][1:]:
        if not any(abs(s["start"] - t) < 1.5 for t, _, _ in out):
            out.append((s["start"], 0.25, "segment"))
    return out


def want_curve(brief):
    T = int(np.ceil(brief["duration"]))
    e = np.full(T, 0.5)
    for s in brief["segments"]:
        e[int(s["start"]): int(np.ceil(s["end"]))] = s.get("energy", 0.5)
    return e


def arrange(a, brief, prof):
    T = brief["duration"]
    anc = anchors(brief)
    Ev = want_curve(brief)
    en = np.array(a["energy"]) / 100.0
    secs = a["sections"]
    bounds = [(s["start"], s["role"] == "lift" or s["energy"] > secs[i]["energy"] + 0.08) for i, s in enumerate(secs[1:])]
    down = a["downbeats"]
    cands = {round(a["body_in"], 2), round(a["in"], 2)} | {round(d, 3) for d in down if d < 60}
    cands |= {round(b - t, 3) for b, _ in bounds for t, _, _ in anc}
    long_enough = a["out"] - a["in"] >= T + 4
    if long_enough:                                    # 倒推：让曲子自己的结尾正好落在视频结尾（剪辑师常用的做法）
        cands |= {round(a["out"] - T, 3)}
    limit = a["out"] - T + 0.01 if long_enough else a["out"] - min(T, 20)
    best = None
    for off in sorted(c for c in cands if a["in"] - 0.05 <= c <= limit):
        off = max(off, a["in"])
        pieces, ending = build_pieces(a, off, T)
        Em = np.array([en[min(len(en) - 1, int(src_at(pieces, v + 0.5) or 0))] if src_at(pieces, v + 0.5) is not None else 0.0 for v in range(len(Ev))])
        c = float(np.corrcoef(Em, Ev)[0, 1]) if Ev.std() > 0.04 and Em.std() > 0.03 else 0.0
        vb = [(v0 + b - s0, lift) for v0, v1, s0 in pieces for b, lift in bounds if s0 < b < s0 + (v1 - v0)]
        hits, tot = [], 0.0
        for t, w, kind in anc:
            tot += w
            if not vb:
                continue
            bv, lift = min(vb, key=lambda x: abs(x[0] - t))
            h = max(0.0, 1 - abs(bv - t) / 1.0) * (1.0 if lift or kind != "climax" else 0.4)
            if h > 0:
                hits.append({"t": round(t, 2), "kind": kind, "music_boundary": round(bv, 2), "lift": bool(lift), "hit": round(h, 2), "w": w})
        hit = sum(h["hit"] * h["w"] for h in hits) / tot if tot else 0.0
        on_down = 1.0 if (down and min(abs(off - d) for d in down) < 0.06) or abs(off - a["in"]) < 0.06 else 0.0
        startE = float(Em[:4].mean())
        endq = {"natural": 1.0, "button": 0.9 if ending.get("bar_aligned") else 0.7, "fade": 0.4}[ending["type"]]
        score = 0.35 * hit + 0.25 * max(c, 0) + 0.12 * on_down + 0.13 * startE + 0.15 * endq
        loops = len(pieces) - 1 - (ending["type"] == "button")
        score -= 0.06 * loops                                          # 能不循环就不循环
        score -= 0.2 * any(v1 - v0 < 8 for v0, v1, _ in pieces)       # 不要几秒钟的碎片
        if not best or score > best["struct"]:
            best = {"struct": round(score, 3), "offset": round(off, 3), "pieces": pieces, "ending": ending, "hits": hits,
                    "curve_corr": round(c, 2), "music_energy": [round(float(x), 2) for x in Em]}
    return best


def envelope(brief, prof, arr, mask=None, hop=0.02, rate=100):
    """每一刻配乐比人声低多少分贝（rate 赫兹）。没人声的片子返回相对 -16 LUFS 的增减。"""
    T = brief["duration"]
    n = int(T * rate)
    t = np.arange(n) / rate
    events = []
    if mask is not None and brief.get("voice"):
        m = np.interp(t, np.arange(len(mask)) * hop, mask.astype(float)) > 0.5
        active = m.copy()
        edges = np.flatnonzero(np.diff(np.r_[1, m.astype(int), 1]))        # 填掉短于 min_gap 的空隙
        gaps = []
        for a_, b_ in zip(edges[::2], edges[1::2]):
            if (b_ - a_) / rate < prof["min_gap"]:
                active[a_:b_] = True
            else:
                gaps.append((a_ / rate, b_ / rate))
        look = int(0.15 * rate)                                            # 提前 0.15 秒让开
        active = np.r_[active[look:], np.full(look, active[-1])] | active
        target = np.where(active, prof["bed_db"], prof["open_db"]).astype(float)
        for a_, b_ in gaps:
            events.append({"t": round(a_, 2), "to": round(b_, 2), "do": "停顿处抬起", "db": prof["open_db"]})
    else:
        target = np.zeros(n)
    g = np.empty(n); cur = target[0]
    ka, kr = 1 - np.exp(-1 / (0.10 * rate)), 1 - np.exp(-1 / (0.45 * rate))  # 压下去快，抬起来慢
    for i in range(n):
        cur += (target[i] - cur) * (ka if target[i] < cur else kr)
        g[i] = cur
    for s in brief["segments"]:                                           # 按每段想要的能量微调 ±2 分贝
        g[int(s["start"] * rate): int(s["end"] * rate)] += (s.get("energy", 0.5) - 0.5) * 4
    if prof.get("hook_s"):
        hs = prof["hook_s"]
        g += np.clip((hs - t) / 1.0, 0, 1) * prof["hook_db"]
        events.append({"t": 0, "to": hs, "do": "开头钩子略响", "db": f"+{prof['hook_db']}"})

    def ramp(t0, t1, r_in, r_out):
        return np.clip((t - t0) / max(r_in, 1e-3) + 1, 0, 1) * np.clip((t1 - t) / max(r_out, 1e-3) + 1, 0, 1)
    for mo in brief.get("moments", []):
        k, mt, d = mo["kind"], mo["t"], mo.get("dur", 0)
        if k == "point":
            d = d or 2.0
            g -= 14 * ramp(mt, mt + d, 0.3, 0.6); events.append({"t": mt, "to": mt + d, "do": "重点句，音乐让开", "db": -14})
        elif k == "silence":
            d = d or 2.0
            g -= 70 * ramp(mt, mt + d, 0.25, 0.4); events.append({"t": mt, "to": mt + d, "do": "无音乐"})
        elif k == "turn":
            g -= 10 * ramp(mt - 0.45, mt - 0.03, 0.25, 0.03); events.append({"t": round(mt - 0.45, 2), "to": mt, "do": "转折前收半秒再进", "db": -10})
        elif k == "climax":
            g += 2.0 * np.clip((t - mt) / 0.3, 0, 1) * np.clip(1 - (t - mt - 3) / 3, 0, 1) * (t >= mt); events.append({"t": mt, "to": mt + 6, "do": "高点略推", "db": "+2"})
    fin = 0.25 if abs(arr["offset"] - 0) < 0.05 else 0.5
    g += 20 * np.log10(np.clip(t / fin, 1e-3, 1))
    end = arr["ending"]
    if end["type"] == "fade":
        g += 20 * np.log10(np.clip((T - t) / end["dur"], 1e-3, 1)); events.append({"t": round(T - end["dur"], 2), "to": T, "do": "淡出"})
    elif end["type"] == "button":
        g[t > end["at"]] = -90; events.append({"t": end["at"], "do": "落在曲子自己的结尾"})
    return g, sorted(events, key=lambda e: e["t"])


def score(t, brief, prof, arr, adj):
    a = t["analysis"]
    mood = mood_score(t.get("dims") or {}, prof["want"], prof["avoid"])
    bpm = bpm_score(t.get("bpm_tag") or a["bpm"], prof["bpm"])
    if brief.get("voice"):
        sp = np.mean([1 - np.clip((a["speech_band"] - 0.30) / 0.3, 0, 1), 1 - np.clip((a["punch"] - prof["max_punch"]) / 0.3, 0, 1),
                      1 - np.clip((a["steadiness_db"] - prof["max_steadiness"]) / 4, 0, 1)])
    else:
        sp = 1.0
    parts = {"mood": round(mood, 3), "bpm": round(bpm, 3), "speech": round(float(sp), 3), "struct": arr["struct"], "adjust": round(adj, 3)}
    return round(sum(W[k] * parts[k] for k in W) + adj, 4), parts


def run(cat, brief, n=3, pool=10, need_free=False, only=None, log=print):
    prof = profile(brief)
    fb, use = _history()
    ids = [only] if only else prefilter(cat, brief, prof, need_free, pool)
    out = []
    for tid in ids:
        t = cat["tracks"][tid]
        try:
            a = library.ensure_analysis(cat, tid)
        except Exception as e:
            log(f"  跳过 {t['title']}：取不到音频（{e}）"); continue
        if not a or not a["sections"]:
            continue
        arr = arrange(a, brief, prof)
        if not arr:
            continue
        total, parts = score(t, brief, prof, arr, adjust(tid, brief["type"], fb, use))
        log(f"  听过 {t['title']}：{total:.3f} {parts}")
        out.append({"track": tid, "score": total, "parts": parts, "arrangement": arr})
    library.save(cat)
    out.sort(key=lambda r: -r["score"])
    return out[:n], prof
