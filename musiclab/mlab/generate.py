"""现做配乐：曲库里没有合适的，就按这一段要的样子让 AI 生成，量过再挑。
走 ElevenLabs 音乐接口（要付费档）。云端由网络代理带钥匙；本地设环境变量 ELEVENLABS_API_KEY。
生成的曲子进曲库（source=ai），下次同类片子可以直接复用。"""
import hashlib, json, os, urllib.error, urllib.request
from . import library

API = "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192"
LICENSE = {"id": "elevenlabs-music", "commercial": True, "attribution": False, "credit": None,
           "note": "ElevenLabs 付费档生成。商用范围以账号所在套餐的条款为准（低档套餐不含影视、游戏和音乐平台发行）。"}
# 每段换一套乐器，保证相邻两段听起来不是同一首
PALETTES = [
    ("soft electric piano", "warm sub bass", 100),
    ("felt piano", "subtle string pad", 92),
    ("muted clean electric guitar", "low synth bass", 108),
    ("glassy synth keys", "airy pad", 96),
    ("marimba", "warm pad and soft bass", 104),
    ("rhodes keys", "deep bass pulse", 112),
]
MOOD = {"serious": "serious, thoughtful", "curious": "curious, inquisitive", "drive": "forward-moving, purposeful", "tech": "modern, clean, tech",
        "bright": "optimistic, bright", "calm": "calm, unhurried", "warm": "warm, reassuring", "tense": "slightly tense, suspenseful", "epic": "big, cinematic", "playful": "light, playful"}
# 对标博主的音乐长什么样：把量出来的特征翻成「要什么、不要什么」
STYLE = {
    "xiaolin": {"yes": ["minimal background underscore for voiceover", "sparse arrangement with lots of space", "long sustained chords, one chord per bar", "simple steady light drum groove with soft kick, rim click and closed hi-hat, audible throughout",
                        "mid-range keys carry the harmony", "even level from the first beat", "instrumental"],
                "no": ["vocals", "lead melody", "fast arpeggios", "busy sixteenth notes", "heavy drums", "big drum fills", "risers and impacts", "cinematic build-up", "slow fade-in intro", "distortion"]},
    "xiaolin-beat": {"yes": ["laid-back lo-fi beat underscore for voiceover", "steady soft drum loop: kick on one and three, rim click on two and four, closed hi-hats, clearly audible throughout",
                             "sparse chords, one chord per bar", "lots of space", "even level from the first beat", "instrumental"],
                     "no": ["vocals", "lead melody", "fast arpeggios", "heavy or loud drums", "big drum fills", "risers and impacts", "cinematic build-up", "slow fade-in intro", "distortion", "no drums", "ambient only"]},
    None: {"yes": ["instrumental background music for a spoken-word video", "steady and unobtrusive"], "no": ["vocals", "lead melody that competes with speech"]},
}


def plan_for(want, energy, k, style, seconds):
    """这一段的生成要求：对标风格的固定要求 + 这一段的乐器、情绪、速度。"""
    st = STYLE.get(style, STYLE[None])
    moods = [MOOD[d] for d, w in sorted(want.items(), key=lambda kv: -kv[1])[:3] if d in MOOD and w >= 0.3]
    keys, low, bpm = PALETTES[k % len(PALETTES)]
    feel = "more energy and momentum" if energy >= 0.6 else ("quiet and reflective" if energy <= 0.42 else "moderate even energy")
    local = [keys, low, f"{bpm + round((energy - 0.5) * 20)} bpm", feel] + moods
    return {"positive_global_styles": st["yes"], "negative_global_styles": st["no"],
            "sections": [{"section_name": "bed", "positive_local_styles": local, "negative_local_styles": [], "duration_ms": int(seconds * 1000), "lines": []}]}


def compose(plan):
    body = {"composition_plan": plan, "model_id": "music_v1"}
    h = {"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")}
    try:
        with urllib.request.urlopen(urllib.request.Request(API, json.dumps(body).encode(), h), timeout=600) as r:
            return r.read(), r.headers.get("Song-Id")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code} {e.read().decode(errors='replace')[:200]}")


def make(cat, plan, label):
    """生成一段并登记进曲库。返回曲目编号。"""
    audio, sid = compose(plan)
    seconds = plan["sections"][0]["duration_ms"] / 1000
    prompt = "要：" + "；".join(plan["positive_global_styles"] + plan["sections"][0]["positive_local_styles"]) + "。不要：" + "；".join(plan["negative_global_styles"])
    name = (sid or hashlib.sha1(audio[:4096]).hexdigest()[:16])
    dst = os.path.join(library.AUD, "ai", name + ".mp3")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(audio)
    tid = "ai:" + name
    cat["tracks"][tid] = {"kind": "music", "source": "ai", "title": label, "file": f"ai/{name}.mp3", "feel": [], "instruments": [], "description": prompt,
                          "vocal": False, "odd": False, "license": dict(LICENSE), "dims_tag": {}, "generated": {"by": "elevenlabs", "song_id": sid, "seconds": seconds}}
    library.ensure_analysis(cat, tid)
    return tid


def closeness(a, prof):
    """和对标博主的音乐像不像：音符疏密、鼓点轻重、占不占人声频段。0–1。"""
    import numpy as np
    on = 1 - np.clip((a.get("onset_rate", 0) - prof.get("max_onset", 3.0)) / 2, 0, 1) if a.get("onset_rate", 0) > prof.get("max_onset", 3.0) else 1.0
    pu = 1.0 if prof.get("min_punch", 0) <= a["punch"] <= prof.get("max_punch", 1) else 1 - min(1.0, min(abs(a["punch"] - prof.get("min_punch", 0)), abs(a["punch"] - prof.get("max_punch", 1))) / 0.2)
    sb = 1 - np.clip((a["speech_band"] - 0.12) / 0.2, 0, 1)
    head = np.mean(a["energy"][:3]) / 100.0                       # 开头就要有东西
    return float(0.25 * on + 0.4 * pu + 0.15 * sb + 0.2 * head)
