"""曲库：一份目录 catalog.json（进仓库）+ 音频文件 library/audio/（不进仓库，用到时再下载）。
每首歌记四样东西：来源和授权、别人打的标签、我们自己听出来的数字（analysis）、统一的情绪维度（dims）。"""
import json, os, re, shutil, time, urllib.parse, urllib.request
import numpy as np
from . import audio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "library")
CAT = os.path.join(LIB, "catalog.json")
AUD = os.path.join(LIB, "audio")
RULES = json.load(open(os.path.join(ROOT, "rules", "types.json"), encoding="utf-8"))
DIMS = list(RULES["dims"])

IC_JSON = "https://incompetech.com/music/royalty-free/pieces.json"
IC_MP3 = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/"
# 来源自带的「感觉」标签 → 统一情绪维度
FEEL = {
 "Bright": {"bright": 1}, "Uplifting": {"bright": .7, "warm": .5, "drive": .3}, "Relaxed": {"calm": .8, "warm": .4}, "Calming": {"calm": 1, "warm": .3},
 "Bouncy": {"playful": .8, "bright": .4}, "Grooving": {"drive": .5, "playful": .3}, "Driving": {"drive": 1}, "Mysterious": {"curious": .7, "tense": .3, "dark": .3},
 "Intense": {"tense": .8, "drive": .5}, "Eerie": {"dark": .9, "tense": .4}, "Unnerving": {"dark": .8, "tense": .7}, "Somber": {"serious": .7, "dark": .4, "calm": .3},
 "Mystical": {"curious": .5, "calm": .3}, "Humorous": {"playful": 1}, "Epic": {"epic": 1, "serious": .4}, "Action": {"drive": .8, "tense": .6},
 "Suspenseful": {"tense": .9, "curious": .4}, "Dark": {"dark": .8, "serious": .3}, "Aggressive": {"tense": .7, "dark": .5, "drive": .6},
}
INST = [("synth", {"tech": .5}), ("electric piano", {"warm": .3}), ("piano", {"warm": .3}), ("guitar", {"warm": .3}), ("strings", {"serious": .3}), ("cello", {"serious": .3}),
        ("violin", {"serious": .2}), ("brass", {"epic": .3}), ("timpani", {"epic": .3}), ("horn", {"epic": .2}), ("marimba", {"playful": .2, "bright": .2}), ("glock", {"bright": .2}), ("bells", {"bright": .2})]
VOCAL = ["voice", "vocal", "choir", "singer"]
ODD_INST = ["accordion", "banjo", "kazoo", "tuba", "bagpipe", "organ", "sax", "trumpet", "trombone", "harpsichord", "theremin", "whistle", "ukulele", "recorder", "lute", "sitar", "didgeridoo"]
ODD_WORD = ["christmas", "halloween", "horror", "circus", "polka", "funny", "silly", "comedy", "cartoon", "spooky", "medieval", "western", "ragtime", "tango", "waltz", "march", "8-bit", "chiptune",
            "tavern", "pirate", "celtic", "reggae", "carol", "santa", "jingle", "ren faire", "klezmer", "wedding", "anthem", "hymn", "bach", "mozart", "beethoven", "satie", "tchaikovsky", "silent film"]


def load():
    if os.path.exists(CAT):
        return json.load(open(CAT, encoding="utf-8"))
    return {"version": 1, "tracks": {}}


def save(cat):
    os.makedirs(LIB, exist_ok=True)
    tmp = CAT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(cat, fh, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, CAT)


def _norm(d):
    return {k: round(min(1.0, v), 2) for k, v in d.items() if v > 0.04}


def dims_from_tags(feel, instruments):
    d = {}
    for fl in feel:
        for k, v in FEEL.get(fl, {}).items():
            d[k] = max(d.get(k, 0), v)
    low = " ".join(instruments).lower()
    for word, add in INST:
        if word in low:
            for k, v in add.items():
                d[k] = d.get(k, 0) + v
    return _norm(d)


def dims_from_audio(a):
    """没有人工标签的曲子（自己的、AI 生成的）：从听到的数字估一个情绪。粗，但够做第一轮筛选。"""
    fast = float(np.clip((a.get("onset_rate", 2.5) - 1.5) / 3.0, 0, 1))        # 不用速度：自动测的速度常差一倍
    punch = float(np.clip(a["punch"] / 0.4, 0, 1))
    bright = float(np.clip((a["brightness"] - 900) / 2000, 0, 1))
    major = 1.0 if a["mode"] == "major" else 0.0
    d = {"drive": 0.6 * fast + 0.4 * punch, "calm": (1 - fast) * (1 - punch), "bright": 0.5 * major + 0.5 * bright * major,
         "warm": major * (1 - bright) * (1 - 0.5 * punch), "serious": (1 - major) * (1 - bright) * 0.7, "tense": (1 - major) * punch * 0.8,
         "dark": (1 - major) * (1 - bright) * (1 - fast) * 0.6}
    return _norm(d)


def merge_dims(t):
    """人工标签和听到的各占一半；只有一边就用那一边。"""
    tag, heard = t.get("dims_tag") or {}, dims_from_audio(t["analysis"]) if t.get("analysis") else {}
    if tag and heard:
        return _norm({k: 0.65 * tag.get(k, 0) + 0.35 * heard.get(k, 0) for k in set(tag) | set(heard)})
    return tag or heard


def sync_incompetech(cat):
    """把 incompetech 整个目录（约 1400 首，CC BY 4.0，可商用、要署名）登记进来。只登记文字信息，不下载音频。"""
    req = urllib.request.Request(IC_JSON, headers={"User-Agent": "musiclab"})
    pieces = json.load(urllib.request.urlopen(req, timeout=60))
    n = 0
    for p in pieces:
        tid = "ic:" + re.sub(r"\.mp3$", "", p["filename"])
        feel = [x.strip() for x in (p.get("feel") or "").split(",") if x.strip()]
        inst = [x.strip() for x in (p.get("instruments") or "").split(",") if x.strip()]
        h, m, s = (int(x) for x in (p.get("length") or "0:0:0").split(":"))
        text = (p["title"] + " " + (p.get("description") or "") + " " + " ".join(feel)).lower()
        low = " ".join(inst).lower()
        t = cat["tracks"].setdefault(tid, {})
        n += "title" not in t
        t.update({
            "kind": "music", "source": "incompetech", "title": p["title"], "artist": "Kevin MacLeod", "url": IC_MP3 + urllib.parse.quote(p["filename"]),
            "file": "ic/" + p["filename"], "length": h * 3600 + m * 60 + s, "bpm_tag": float(p.get("bpm") or 0) or None,
            "feel": feel, "instruments": inst, "description": p.get("description") or "",
            "vocal": any(w in low for w in VOCAL), "odd": any(w in low for w in ODD_INST) or any(w in text for w in ODD_WORD),
            "license": {"id": "CC-BY-4.0", "commercial": True, "attribution": True,
                        "credit": f"\"{p['title']}\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/"},
            "dims_tag": dims_from_tags(feel, inst),
        })
        t["dims"] = merge_dims(t)
    return n, len(pieces)


def add_local(cat, path, title=None, license_id="own", credit=None, commercial=True, feel=(), source="local", kind="music", copy=True):
    """加一首自己的曲子（买的、自己做的、AI 生成的）。授权要说清楚：能不能商用、要不要署名。"""
    name = os.path.basename(path)
    tid = f"{source}:{os.path.splitext(name)[0]}"
    rel = f"{source}/{name}"
    dst = os.path.join(AUD, rel)
    if copy and os.path.abspath(path) != os.path.abspath(dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(path, dst)
    t = {"kind": kind, "source": source, "title": title or os.path.splitext(name)[0], "file": rel if copy else None, "path": None if copy else os.path.abspath(path),
         "feel": list(feel), "instruments": [], "description": "", "vocal": False, "odd": False,
         "license": {"id": license_id, "commercial": commercial, "attribution": bool(credit), "credit": credit}, "dims_tag": dims_from_tags(feel, [])}
    cat["tracks"][tid] = t
    ensure_analysis(cat, tid)
    return tid


def path_of(t):
    return t.get("path") or os.path.join(AUD, t["file"])


def ensure_audio(t):
    p = path_of(t)
    if os.path.exists(p) and os.path.getsize(p) > 10000:
        return p
    if not t.get("url"):
        raise FileNotFoundError(p)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    for attempt in range(3):
        try:
            req = urllib.request.Request(t["url"], headers={"User-Agent": "musiclab"})
            with urllib.request.urlopen(req, timeout=120) as r, open(p + ".part", "wb") as fh:
                shutil.copyfileobj(r, fh)
            os.replace(p + ".part", p)
            return p
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def ensure_analysis(cat, tid):
    t = cat["tracks"][tid]
    if t.get("analysis"):
        return t["analysis"]
    a = audio.analyze(ensure_audio(t))
    if a is None:
        t["analysis"] = None
        t["unusable"] = "太短或解不出来"
        return None
    t["analysis"] = a
    t["dims"] = merge_dims(t)
    return a
