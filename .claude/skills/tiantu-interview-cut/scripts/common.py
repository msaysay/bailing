"""Shared helpers: plan loading, timeline maths, style constants.

All style numbers are measured from the reference film (576x1024) and scaled
to the 1080x1920 canvas. Do not change them per project -- they ARE the brand.
"""
import json, os, subprocess, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(SKILL, "assets", "fonts")
W, H, FPS = 1080, 1920, 30
SR = 48000

STYLE = {
    # --- regular subtitle (剪映 鸿蒙体粗 11号) / keyword (15号) ---
    "sub_font": "HarmonyOS Sans SC",
    "sub_fs": 71,            # ASS font size -> Han glyph ~49px tall on 1080 canvas
    "kw_fs": 94,             # ~15/11 * sub_fs (measured 1.3x)
    "sub_y": 1417,           # bottom anchor of the line => text centre at 72% of height
    "sub_max_chars": 12,
    # --- title / 小标题 (剪映 瑞意宋) ---
    "title_font": "Noto Serif SC Light",   # replaced by 瑞意宋 if assets/fonts/title.* exists
    "title_x": 144,          # left edge for lower titles
    "title_lower_y": {1: 1390, 2: 1404, 3: 1345},   # anchor of the FIRST line, by line count
    "title_top_y": 413,      # anchor of the first line for top titles
    "title_fade": 300,       # ms, 渐显/渐隐
    # --- shadow: 黑 83% / 模糊 6% / 距离 5 / 角度 -45 ---
    "shadow_alpha": 0x2B,    # ASS alpha (00 opaque) => 83% opacity
    "shadow_dx": 3, "shadow_dy": 3, "shadow_blur": 3,
    # --- logo: top-left, 37% frame width ---
    "logo_x": 58, "logo_y": 60, "logo_w": 408,
    # --- ending slogan (剪映 24/18/22) ---
    "end_x": 72, "end_y1": 1331, "end_y2": 1498,
    "end_fs": (218, 165, 211),   # = 剪映 24 / 18 / 22 号
}

SIZES = {"xl": 290, "l": 210, "m": 160, "s": 140}   # title ASS font sizes (s = 剪映 16号)


def die(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def run(cmd, **kw):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kw)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode("utf8", "ignore")[-3000:])
        die("command failed: " + " ".join(map(str, cmd))[:400])
    return r.stdout


def probe(path):
    out = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path])
    d = json.loads(out)
    v = next((s for s in d["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    info = {"duration": float(d["format"].get("duration", 0)), "has_audio": a is not None}
    if v:
        w, h = int(v["width"]), int(v["height"])
        rot = 0
        for sd in v.get("side_data_list", []):
            if "rotation" in sd:
                rot = int(sd["rotation"])
        if abs(rot) in (90, 270):
            w, h = h, w
        num, den = v.get("avg_frame_rate", "0/1").split("/")
        info.update(width=w, height=h, fps=(float(num) / float(den)) if float(den) else 0,
                    vcodec=v.get("codec_name"), still=v.get("codec_name") in ("png", "mjpeg", "webp", "bmp"))
    return info


def load_plan(path):
    with open(path, encoding="utf8") as f:
        plan = json.load(f)
    base = os.path.dirname(os.path.abspath(path))
    plan["_base"] = base
    return plan


def rp(plan, p):
    """Resolve a path from the plan (relative to the plan file; $SKILL expands)."""
    if p is None:
        return None
    p = p.replace("$SKILL", SKILL)
    return p if os.path.isabs(p) else os.path.normpath(os.path.join(plan["_base"], p))


def timeline(plan):
    """Frame-quantised output timeline. Returns (cue_frames, body_frames, end_frames).

    cue_frames[i] = (start_frame, end_frame) of cue i on the output timeline.
    """
    t, fr = 0.0, []
    for c in plan["cues"]:
        a = round(t * FPS)
        t += float(c["out"]) - float(c["in"])
        fr.append((a, round(t * FPS)))
    body = fr[-1][1] if fr else 0
    end = round(float(plan.get("ending", {}).get("dur", 0)) * FPS) if plan.get("ending") else 0
    return fr, body, end


def runs(plan):
    """Group cues into contiguous source runs: [(src, in, out, first_cue, last_cue)]."""
    out = []
    for i, c in enumerate(plan["cues"]):
        if out and out[-1][0] == c["src"] and abs(float(c["in"]) - out[-1][2]) < 0.03:
            s, a, _, f, _ = out[-1]
            out[-1] = (s, a, float(c["out"]), f, i)
        else:
            out.append((c["src"], float(c["in"]), float(c["out"]), i, i))
    return out


def shot_ranges(plan):
    """[(shot, first_cue, last_cue)] -- shots must tile the cue list in order."""
    res = []
    for s in plan["shots"]:
        a, b = s["cues"]
        res.append((s, int(a), int(b)))
    return res
