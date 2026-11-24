"""配乐需求单：一条视频想要什么样的音乐、哪些时间点要对上。
draft() 自动出一份初稿（分段、说话区间、停顿、每段能量），情绪和关键节点由看过内容的人或 AI 再补。"""
import json, os, subprocess
import numpy as np
from . import audio
from .library import RULES

MOMENT_KINDS = {
 "climax": "全片最高点：对齐音乐抬起来的段落，音量略推",
 "turn": "转折：对齐音乐段落交界，之前收半秒",
 "chapter": "换章节或换场景：对齐音乐段落交界",
 "point": "重点句：这句话期间把音乐压到几乎听不见（给 dur 秒数）",
 "silence": "这里不要音乐（给 dur 秒数）",
}


def draft(src, vtype, out_dir, timing=None):
    os.makedirs(out_dir, exist_ok=True)
    prof = RULES["types"][vtype]
    T = audio.duration(src)
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=codec_type", "-of", "csv=p=0", src], stdout=subprocess.PIPE).stdout.decode().strip()
    voice = os.path.join(out_dir, "voice.wav")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "2", "-ar", "44100", voice], check=True)
    x = audio.decode(voice)
    mask, hop = audio.speech_mask(x)
    ratio = float(mask.mean())
    has_speech = ratio > 0.15
    pauses = audio.runs(mask, hop, False, min_s=0.8)
    db = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(441) / 441, "same")[:: int(audio.SR * hop)][: len(mask)]) + 1e-6)

    segs = []
    if timing:
        tj = json.load(open(timing, encoding="utf-8"))
        lines = tj.get("lines", [])
        for s in tj["segments"]:
            text = "".join(l["text"] for l in lines if l.get("seg") == s["id"])
            segs.append({"start": round(s["start"], 2), "end": round(s["end"], 2), "name": s.get("name", ""), "text": text})
        T = max(T, segs[-1]["end"]) if not T else T
    else:                                             # 没有逐字稿：每 18 秒左右找一个停顿切一段
        cuts, last = [0.0], 0.0
        gaps = [((a + b) / 2, b - a) for a, b in audio.runs(mask, hop, False, min_s=0.35) if 3 < (a + b) / 2 < T - 3]
        while T - last > 28:
            near = [g for g in gaps if 12 <= g[0] - last <= 26]
            cut = max(near, key=lambda g: g[1])[0] if near else last + 18
            cuts.append(round(cut, 2)); last = cut
        cuts.append(round(T, 2))
        segs = [{"start": a, "end": b, "name": "", "text": ""} for a, b in zip(cuts[:-1], cuts[1:])]

    stats = []
    for s in segs:
        i, j = int(s["start"] / hop), max(int(s["start"] / hop) + 1, int(s["end"] / hop))
        m = mask[i:j]
        dens = float(m.mean()) if len(m) else 0.0
        loud = float(db[i:j][m].mean()) if m.any() else -60.0
        pace = len(s["text"]) / max(0.1, (s["end"] - s["start"])) if s["text"] else None
        stats.append((dens, loud, pace))
    def z(v):
        v = np.array(v, float); sd = v.std()
        return (v - v.mean()) / sd if sd > 1e-6 else np.zeros_like(v)
    e = 0.5 + 0.08 * z([s[0] for s in stats]) + 0.08 * z([s[1] for s in stats])
    if all(s[2] for s in stats):
        e = e + 0.08 * z([s[2] for s in stats])
    for k, s in enumerate(segs):
        s["energy"] = round(float(np.clip(e[k], 0.25, 0.8)), 2)
        s["speech"] = round(stats[k][0], 2)
        s["role"] = "hook" if k == 0 else ("close" if k == len(segs) - 1 else "body")
    if segs and prof.get("hook_s"):
        segs[0]["energy"] = round(min(0.85, segs[0]["energy"] + 0.1), 2)

    brief = {
        "type": vtype, "type_name": prof["name"], "source": os.path.abspath(src), "video": os.path.abspath(src) if probe else None,
        "voice": os.path.abspath(voice) if has_speech else None, "duration": round(T, 2), "speech_ratio": round(ratio, 2),
        "want": dict(prof["want"]), "avoid": dict(prof["avoid"]), "bpm": list(prof["bpm"]),
        "segments": segs, "moments": [], "pauses": [list(p) for p in pauses],
        "_怎么填": {
            "want/avoid": "情绪维度权重 0–1，可用的维度：" + "、".join(f"{k}({v})" for k, v in RULES["dims"].items()),
            "segments[].energy": "这一段想要的音乐能量 0–1。初稿是按说话密度和音量猜的，请按内容改",
            "moments": "关键节点，格式 {\"t\": 秒, \"kind\": 类型, \"dur\": 秒(可选), \"note\": 说明}。类型：" + "；".join(f"{k}={v}" for k, v in MOMENT_KINDS.items()),
            "pauses": "自动找到的 0.8 秒以上停顿，供定节点时参考，不用改",
        },
    }
    out = os.path.join(out_dir, "brief.json")
    json.dump(brief, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return out, brief
