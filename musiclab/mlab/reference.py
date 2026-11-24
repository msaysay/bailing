"""参考画像：把头部博主的成片当标准答案。
抓他们的视频 → 把人声和配乐拆开 → 量出他们实际怎么配的 → 按方向汇总。
同一把尺子（measure）也用来量我们自己的成片，差在哪直接对比，不靠人听。
抓来的音频只在本机缓存（reference/cache，不进仓库），进仓库的只有量出来的数字。"""
import json, os, subprocess, sys, urllib.request
import numpy as np
from . import audio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "reference")
CACHE = os.path.join(REF, "cache")
DATA = os.path.join(REF, "measured.json")
PROFILES = os.path.join(REF, "profiles.json")
SEARCH = "https://api.tikhub.io/api/v1/douyin/search/fetch_video_search_v2"
UA = {"User-Agent": "video-studio/0.1"}


def _load(p, default):
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else default


def _save(p, obj):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(obj, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def _walk(o):
    if isinstance(o, dict):
        if "aweme_id" in o and "author" in o:
            yield o
        for v in o.values():
            yield from _walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from _walk(v)


def search(creator, pages=2, dur="1-5"):
    """按博主名搜抖音，只留这个博主自己发的，按点赞排。云端由网络代理带钥匙；本地读环境变量 TIKHUB_TOKEN。"""
    h = dict(UA, **{"Content-Type": "application/json"})
    if os.environ.get("TIKHUB_TOKEN"):
        h["Authorization"] = "Bearer " + os.environ["TIKHUB_TOKEN"]
    rows, cursor, sid = {}, 0, ""
    for _ in range(pages):
        body = {"keyword": creator, "cursor": cursor, "sort_type": "1", "publish_time": "0", "filter_duration": dur, "content_type": "1", "search_id": sid, "backtrace": ""}
        with urllib.request.urlopen(urllib.request.Request(SEARCH, json.dumps(body).encode(), h), timeout=120) as r:
            d = json.load(r)
        for a in _walk(d):
            if a["author"].get("nickname") != creator:
                continue
            v = a.get("video") or {}
            urls = ((v.get("play_addr") or {}).get("url_list")) or []
            if urls:
                rows[a["aweme_id"]] = {"id": a["aweme_id"], "creator": creator, "desc": (a.get("desc") or "")[:60], "likes": (a.get("statistics") or {}).get("digg_count", 0),
                                       "dur": round((v.get("duration") or 0) / 1000), "music_title": (a.get("music") or {}).get("title"), "urls": urls}
        inner = d.get("data") or {}
        cursor = inner.get("cursor") or (inner.get("data") or {}).get("cursor") if isinstance(inner, dict) else 0
        if not cursor:
            break
    return sorted(rows.values(), key=lambda r: -r["likes"])


POSTS = "https://api.tikhub.io/api/v1/douyin/app/v3/fetch_user_post_videos"


def user_posts(creator, pages=3):
    """博主主页的作品列表（搜索每次只给几条，不够用）。先用搜索拿到博主的编号，再翻主页。每翻一页计一次费。"""
    import urllib.parse
    h = dict(UA)
    if os.environ.get("TIKHUB_TOKEN"):
        h["Authorization"] = "Bearer " + os.environ["TIKHUB_TOKEN"]
    body = {"keyword": creator, "cursor": 0, "sort_type": "0", "publish_time": "0", "filter_duration": "0", "content_type": "1", "search_id": "", "backtrace": ""}
    with urllib.request.urlopen(urllib.request.Request(SEARCH, json.dumps(body).encode(), dict(h, **{"Content-Type": "application/json"})), timeout=120) as r:
        sec = next((a["author"].get("sec_uid") for a in _walk(json.load(r)) if a["author"].get("nickname") == creator), None)
    if not sec:
        return []
    rows, cur = {}, 0
    for _ in range(pages):
        q = urllib.parse.urlencode({"sec_user_id": sec, "max_cursor": cur, "count": 20})
        try:
            with urllib.request.urlopen(urllib.request.Request(POSTS + "?" + q, headers=h), timeout=120) as r:
                d = (json.load(r).get("data") or {})
        except Exception:
            break                                   # 后面的页偶尔取不到：有多少用多少
        for a in d.get("aweme_list") or []:
            v = a.get("video") or {}
            urls = ((v.get("play_addr") or {}).get("url_list")) or []
            if urls:
                rows[a["aweme_id"]] = {"id": a["aweme_id"], "creator": creator, "desc": (a.get("desc") or "")[:60], "likes": (a.get("statistics") or {}).get("digg_count", 0),
                                       "dur": round((v.get("duration") or 0) / 1000), "music_title": (a.get("music") or {}).get("title"), "urls": urls}
        cur = d.get("max_cursor")
        if not d.get("has_more") or not cur:
            break
    return sorted(rows.values(), key=lambda r: -r["likes"])


def fetch_audio(row):
    """只留声音：下视频、抽出音轨、删掉视频。"""
    os.makedirs(CACHE, exist_ok=True)
    wav = os.path.join(CACHE, row["id"] + ".wav")
    if os.path.exists(wav):
        return wav
    mp4 = os.path.join(CACHE, row["id"] + ".mp4")
    for u in row["urls"]:
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"}), timeout=180) as r, open(mp4, "wb") as fh:
                fh.write(r.read())
            if os.path.getsize(mp4) > 50000:
                break
        except Exception:
            continue
    else:
        return None
    ok = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", mp4, "-vn", "-ac", "2", "-ar", "44100", wav]).returncode == 0
    os.remove(mp4)
    return wav if ok else None


def separate(wav):
    """把一条成片的声音拆成人声和其余（配乐、音效）。用 demucs，纯 CPU 大约和片长一样久。"""
    name = os.path.splitext(os.path.basename(wav))[0]
    out = os.path.join(CACHE, "sep", "htdemucs", name)
    v, m = os.path.join(out, "vocals.wav"), os.path.join(out, "no_vocals.wav")
    if not (os.path.exists(v) and os.path.exists(m)):
        r = subprocess.run([sys.executable, "-m", "demucs", "--two-stems", "vocals", "-n", "htdemucs", "-o", os.path.join(CACHE, "sep"), wav], capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError(r.stderr[-300:])
    return v, m


def _db(x):
    return 10 * np.log10(np.mean(x) + 1e-12)


def measure(voice_path, music_path):
    """量一条片子的配乐做法。voice / music 是分开的两条轨（博主的是拆出来的，我们自己的本来就分开）。
    所有「比人声低多少」都以说话时的人声电平为零点。"""
    hop_s = 0.05
    hop = int(audio.SR * hop_s)
    v = audio.decode(voice_path); m = audio.decode(music_path)
    n = min(len(v), len(m)) // hop
    T = n * hop_s
    pv = (v[: n * hop].reshape(n, hop) ** 2).mean(1); pm = (m[: n * hop].reshape(n, hop) ** 2).mean(1)
    mask20, h20 = audio.speech_mask(v)
    sp = np.interp(np.arange(n) * hop_s, np.arange(len(mask20)) * h20, mask20.astype(float)) > 0.5
    if sp.mean() < 0.05:
        return {"duration": round(T, 1), "speech_ratio": round(float(sp.mean()), 2), "note": "几乎没有人声，不计入"}
    Lv = _db(pv[sp])                                              # 说话时的人声电平 = 零点
    md = 10 * np.log10(pm + 1e-12) - Lv
    present = md > -42                                            # 拆分会漏一点人声到配乐轨，低于这个当作没有音乐
    k = int(1.0 / hop_s)
    present = np.convolve(present.astype(float), np.ones(k) / k, "same") > 0.5
    cover = float(present.mean())
    out = {"duration": round(T, 1), "speech_ratio": round(float(sp.mean()), 2), "music_coverage": round(cover, 2)}
    if cover < 0.15:
        out["note"] = "基本没有配乐"
        return out
    idx = np.where(present)[0]
    t_in, t_out = idx[0] * hop_s, (idx[-1] + 1) * hop_s
    gap = np.zeros(n, bool)                                       # 0.8 秒以上没人说话的地方
    for a, b in audio.runs(sp, hop_s, False, 0.8):
        gap[int(a / hop_s) + 4: int(b / hop_s) - 4] = True
    under = np.median(md[sp & present])                          # 用中位数：插进来的原声片段、音效不会把数字带偏
    out["under_speech_db"] = round(float(under), 1)              # 说话时配乐比人声低多少
    if (gap & present).sum() > 20:
        out["open_db"] = round(float(np.median(md[gap & present])), 1)   # 没人说话时
        out["gap_lift_db"] = round(out["open_db"] - out["under_speech_db"], 1)
    body = sp & present & (np.arange(n) * hop_s > 6)
    head = present & (np.arange(n) * hop_s < 3)
    if head.sum() > 10 and body.sum() > 10:
        out["hook_db"] = round(float(np.median(md[head]) - np.median(md[body])), 1)  # 开头 3 秒比正文响多少
    out["music_in_s"] = round(float(t_in), 1)
    out["music_ends_before_end_s"] = round(float(T - t_out), 1)
    sec = np.array([_db(pm[i: i + k]) - Lv for i in range(0, n - k, k)])
    ps = np.array([present[i: i + k].mean() > 0.5 for i in range(0, n - k, k)])
    out["level_sd_db"] = round(float(np.std(sec[ps])), 1) if ps.sum() > 3 else None   # 配乐音量起伏
    holes = [(a, b) for a, b in audio.runs(present, hop_s, False, 1.0) if a > t_in and b < t_out]
    out["breaks_per_min"] = round(len(holes) / (T / 60), 2)      # 中间留白（音乐停掉）的次数
    out["break_total_s"] = round(float(sum(b - a for a, b in holes)), 1)
    tail = md[max(0, int((t_out - 4) / hop_s)): int(t_out / hop_s)]
    if len(tail) > 40:
        q = len(tail) // 4
        drop = float(np.median(tail[:q]) - np.median(tail[-q:]))
        out["ending"] = "fade" if drop > 8 else ("cut" if T - t_out < 0.6 else "button")
    a = audio.analyze(music_path)
    if a:
        out.update({"bpm": a["bpm"], "onset_rate": a["onset_rate"], "punch": a["punch"], "brightness": a["brightness"], "mode": a["mode"],
                    "speech_band": a["speech_band"], "sections_per_min": round(len(a["sections"]) / (T / 60), 1)})
    return out


NUM = ["music_coverage", "under_speech_db", "open_db", "gap_lift_db", "hook_db", "music_in_s", "music_ends_before_end_s", "level_sd_db", "breaks_per_min", "bpm", "onset_rate", "punch", "speech_band"]


def build_profiles():
    """按方向汇总：每个数字给中位数和中间一半的范围。"""
    data = _load(DATA, {})
    by = {}
    for r in data.values():
        by.setdefault(r["type"], []).append(r)
        by.setdefault("@" + r["creator"], []).append(r)        # 每个博主单独一份：对标要落到具体的人
    prof = {}
    for t, rows in by.items():
        used = [r for r in rows if "under_speech_db" in r["m"]]
        p = {"videos": len(rows), "with_music": len(used), "creators": sorted({r["creator"] for r in rows}), "metrics": {}}
        for k in NUM:
            vals = [r["m"][k] for r in used if r["m"].get(k) is not None]
            if len(vals) >= 3:
                q = np.percentile(vals, [25, 50, 75])
                p["metrics"][k] = {"p25": round(float(q[0]), 2), "median": round(float(q[1]), 2), "p75": round(float(q[2]), 2), "n": len(vals)}
        for k in ("ending",):
            vals = [r["m"][k] for r in used if r["m"].get(k)]
            p[k] = {x: vals.count(x) for x in sorted(set(vals))}
        prof[t] = p
    _save(PROFILES, prof)
    return prof


def compare(m, prof):
    """我们的一条成片对照参考画像：每项落在大 V 的中间一半范围内算合格。返回 (合格比例, 明细)。"""
    rows, ok = [], 0
    for k, ref in prof["metrics"].items():
        if m.get(k) is None or k in ("bpm", "hook_db"):      # 速度量不准；开头那项会被「先说一句再进音乐」的开场带偏
            continue
        span = max(ref["p75"] - ref["p25"], 1e-6)
        pad = 0.25 * span
        good = ref["p25"] - pad <= m[k] <= ref["p75"] + pad
        ok += good
        rows.append({"metric": k, "ours": m[k], "ref_median": ref["median"], "ref_range": [ref["p25"], ref["p75"]], "ok": bool(good)})
    return (ok / len(rows) if rows else 0.0), rows


def run_creator(vtype, creator, n=3, log=print):
    """抓一个博主点赞最高的 n 条，拆分、测量、记下来。量过的不重复量。"""
    data = _load(DATA, {})
    rows = [r for r in (user_posts(creator) or search(creator)) if 45 <= r["dur"] <= 420]
    done = 0
    for r in rows:
        if done >= n:
            break
        if r["id"] in data:
            done += 1; continue
        try:
            wav = fetch_audio(r)
            if not wav:
                log(f"  下不到 {r['id']}"); continue
            v, m = separate(wav)
            met = measure(v, m)
        except Exception as e:
            log(f"  {r['id']} 失败：{str(e)[:120]}"); continue
        data[r["id"]] = {"type": vtype, "creator": creator, "desc": r["desc"], "likes": r["likes"], "m": met}
        _save(DATA, data); done += 1
        log(f"  {creator} {r['id']} {met.get('duration')}秒 覆盖{met.get('music_coverage')} 说话时{met.get('under_speech_db')} 空档{met.get('open_db')} 收尾{met.get('ending')} {met.get('note','')}")
    return done
