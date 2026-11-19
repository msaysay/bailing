#!/usr/bin/env python3
"""Quality gate. Run on the plan BEFORE rendering, and with the mp4 AFTER.

    python3 qc.py plan.json                 # lint the edit decisions
    python3 qc.py plan.json out/final.mp4   # + verify the file and write review sheets

Exit code 1 if any ERROR. Fix every ERROR; fix or consciously justify every WARN.
The thresholds come from the reference film + the client SOP (see references/style-spec.md).
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

plan = load_plan(sys.argv[1])
video = sys.argv[2] if len(sys.argv) > 2 else None
E, Wn = [], []
err, warn = E.append, Wn.append
cues, shots = plan.get("cues", []), plan.get("shots", [])
if not cues or not shots:
    die("plan needs cues and shots")
cf, body, endf = timeline(plan)
sec = lambda f: f / FPS
T = lambda i: "%.1fs" % sec(cf[i][0])

# ---------- sources exist
dur_cache = {}
def chk(p, what):
    q = rp(plan, p)
    if not os.path.exists(q):
        err("%s: file not found: %s" % (what, p)); return None
    if q not in dur_cache:
        dur_cache[q] = probe(q)
    return dur_cache[q]

# ---------- cues = subtitles
kwn = 0
nline = sum(1 for c in cues if not c.get("cont")) or 1
ldur = {}                                   # a line's time on screen incl. its "cont" pieces
for i, c in enumerate(cues):
    h = i
    while cues[h].get("cont") and h: h -= 1
    ldur[h] = ldur.get(h, 0) + c["out"] - c["in"]
for i, c in enumerate(cues):
    inf = chk(c["src"], "cue %d" % i)
    d = c["out"] - c["in"]
    if d <= 0.1: err("cue %d (%s): duration %.2fs" % (i, c.get("text"), d))
    if inf and c["out"] > inf["duration"] + 0.05: err("cue %d: out beyond source end" % i)
    t = c.get("text", "")
    if re.search(r"[，。！？、；：,.!?;:]", t): err("cue %d '%s': no punctuation in subtitles" % (i, t))
    if len(t) > STYLE["sub_max_chars"]: err("cue %d '%s': %d chars > %d, split it" % (i, t, len(t), STYLE["sub_max_chars"]))
    d = ldur.get(i, d)
    if c.get("cont"): continue
    if d > 3.2: warn("cue %d '%s': on screen %.1fs, split it (reference lines last 0.6-2.2s)" % (i, t, d))
    if len(t) and d / max(len(t), 1) > 0.45 and d > 1.5: warn("cue %d '%s': slow line (%.1fs for %d chars) - stutter or dragging left in? check cues_from_script output" % (i, t, d, len(t)))
    for k in c.get("kw", []) or []:
        if k not in t: err("cue %d: keyword '%s' not in text '%s'" % (i, k, t))
        if len(k) > 7: warn("cue %d: keyword '%s' too long - emphasise 2-5 chars" % (i, k))
    if c.get("kw"): kwn += 1
r = kwn / nline
if not 0.25 <= r <= 0.75: warn("keyword emphasis on %.0f%% of lines (reference ~50%%; keep 30-70%%)" % (r * 100))

# ---------- shots tile the cues
nxt, kinds = 0, []
breaks = {i for i in range(1, len(cues)) if jump(cues[i - 1], cues[i]) == "hard"}   # real edits (not tightened pauses)
micro = sum(1 for i in range(1, len(cues)) if jump(cues[i - 1], cues[i]) == "micro")
for si, s in enumerate(shots):
    a, b = s["cues"]
    if a != nxt or b < a or b >= len(cues):
        err("shot %d: cues %s do not continue from cue %d (shots must tile all cues in order)" % (si, s["cues"], nxt)); break
    nxt = b + 1
    d = sec(cf[b][1] - cf[a][0])
    kind = s.get("type", "aroll")
    kinds.append((kind, d, a, b, s))
    if kind == "broll":
        inf = chk(s.get("src", "?"), "shot %d" % si)
        if inf and not inf.get("still") and float(s.get("src_in", 0)) + d * float(s.get("speed", 1)) > inf["duration"] + 0.05:
            err("shot %d: b-roll %s too short for %.1fs from src_in" % (si, s["src"], d))
        if inf and not inf.get("still") and min(inf["width"], inf["height"]) < 700:
            warn("shot %d: b-roll %s is low-res (%dx%d)" % (si, s["src"], inf["width"], inf["height"]))
        if d > 4.3: err("shot %d (b-roll, %s): %.1fs - cut every 3-4s, split it" % (si, T(a), d))
        if d < 0.9: warn("shot %d (b-roll, %s): %.1fs is a flash - reference minimum ~1.0s" % (si, T(a), d))
    else:
        if d > 6.6: err("shot %d (a-roll, %s): %.1fs talking head - cover part with b-roll or change framing" % (si, T(a), d))
        elif d > 4.3 and s.get("push") is False: warn("shot %d (a-roll, %s): %.1fs with push disabled" % (si, T(a), d))
        inner = [i for i in range(a + 1, b + 1) if i in breaks]
        if inner: warn("shot %d: jump cut inside a-roll at cue %s - start a new shot there (other framing) or cover with b-roll" % (si, inner))
if nxt != len(cues) and not E: err("shots cover cues 0-%d but there are %d cues" % (nxt - 1, len(cues)))
for (k1, d1, a1, b1, s1), (k2, d2, a2, b2, s2) in zip(kinds, kinds[1:]):
    if k1 == k2 == "aroll" and s1.get("framing", "wide") == s2.get("framing", "wide") and s1.get("src") == s2.get("src") and a2 not in breaks:
        warn("shots at %s: two a-roll shots in a row with the same framing and no cut - merge or alternate wide/tight" % T(a2))
    if k1 == k2 == "broll" and s1.get("src") == s2.get("src") and abs(float(s2.get("src_in", 0)) - float(s1.get("src_in", 0)) - d1) < 0.5:
        warn("shots at %s: same b-roll clip continues - use a different clip/moment" % T(a2))
if kinds:
    if kinds[0][0] != "aroll": err("first shot must be the speaker on camera (hook), not b-roll")
    if kinds[-1][0] != "aroll": warn("last shot before the ending should return to the speaker")
    bt = sum(d for k, d, *_ in kinds if k == "broll"); tot = sec(body)
    if not 0.35 <= bt / tot <= 0.65: warn("b-roll covers %.0f%% of the talk (reference 56%%; keep 35-65%%)" % (bt / tot * 100))
    avg = tot / len(kinds)
    if not 1.8 <= avg <= 3.6: warn("average shot %.1fs (reference 2.4s; keep 1.8-3.6s)" % avg)
    run_b = 0
    for k, d, a_, *_ in kinds:
        run_b = run_b + d if k == "broll" else 0
        if run_b > 9.5: warn("b-roll run reaches %.1fs around %s - come back to the speaker (reference max 7.5s)" % (run_b, T(a_))); run_b = 0
    if not 40 <= tot <= 100: warn("talk is %.0fs (reference 61s; keep 40-100s)" % tot)

# ---------- titles
tl = plan.get("titles", [])
arange = [(a, b) for k, d, a, b, s in kinds if k == "aroll"]
if not tl: err("no titles: the reference has a title on the hook + one per key point (5 in 61s)")
else:
    if tl[0]["cues"][0] != 0: err("first title must start on cue 0 (the hook: reference opens on '十三日达')")
    if len(tl) < sec(body) / 20: warn("%d titles for %.0fs - reference has ~1 per 12s" % (len(tl), sec(body)))
    if len(tl) > sec(body) / 7: warn("%d titles is too busy (no 综艺感)" % len(tl))
for ti, t in enumerate(tl):
    a, b = t["cues"]
    if b >= len(cues): err("title %d: cue out of range" % ti); continue
    d = sec(cf[b][1] - cf[a][0]) + float(t.get("hold", 0))
    if d < 0.9: err("title %d '%s': %.1fs on screen" % (ti, t["lines"][0]["text"], d))
    elif d < 2.5 and ti > 0 and t.get("pos", "lower") == "lower": warn("title %d '%s': %.1fs - SOP asks ~3s; extend over more cues" % (ti, t["lines"][0]["text"], d))
    if not any(x <= a and b <= y for x, y in arange) and not t.get("on_broll"):
        warn("title %d '%s' is not fully over a speaker shot (reference titles sit on the speaker; set on_broll:true if intended)" % (ti, t["lines"][0]["text"]))
    if len(t["lines"]) > 3: err("title %d: max 3 lines" % ti)
    for ln in t["lines"]:
        if len(ln["text"]) > 9: err("title %d line '%s': > 9 chars" % (ti, ln["text"]))
        if re.search(r"[，。、；：,.;:]", ln["text"]): err("title %d line '%s': no punctuation (only ? allowed)" % (ti, ln["text"]))
        if "at_cue" in ln and not a <= ln["at_cue"] <= b: err("title %d: at_cue outside title range" % ti)
    spoken = "".join(cues[i].get("text", "") for i in range(a, b + 1))
    if t.get("replace_sub", t.get("pos", "lower") == "lower"):
        miss = [ln["text"] for ln in t["lines"] if ln["text"].rstrip("?？") not in spoken]
        if miss: warn("title %d replaces the subtitle but %s is not what is said ('%s') - use pos:'top' to keep the subtitle" % (ti, miss, spoken))
for (t1, t2) in zip(tl, tl[1:]):
    if t2["cues"][0] <= t1["cues"][1]: err("titles overlap at cue %d" % t2["cues"][0])

# ---------- ending / brand / bgm
e = plan.get("ending")
if not e: err("no ending: 4-5s brand shot + slogan is required")
else:
    chk(e.get("src", "?"), "ending")
    if not 3.5 <= float(e.get("dur", 0)) <= 6: err("ending dur %.1fs (reference 4.7s; keep 4-5.5s)" % float(e.get("dur", 0)))
logo = rp(plan, plan.get("brand", {}).get("logo", "$SKILL/assets/brand/logo.png"))
if not os.path.exists(logo): err("brand logo missing: %s" % logo)
if not (plan.get("bgm") or {}).get("src"): warn("no bgm - reference has a quiet music bed: run bgm_match.py or use the user's track")
elif chk(plan["bgm"]["src"], "bgm") and not -20 <= float(plan["bgm"].get("level", -13)) <= -8: warn("bgm level outside -20..-8 LU (reference about -13)")
if (plan.get("audio") or {}).get("denoise", "auto") not in ("auto", "off", "light", "strong"): err("audio.denoise must be auto|off|light|strong")
if not any(os.path.exists(os.path.join(FONTS, f)) for f in ("HarmonyOS_Sans_SC_Bold.ttf",)) and not (os.path.isdir(FONTS) and any(f.lower().startswith("sub.") for f in os.listdir(FONTS))): err("HarmonyOS Sans SC Bold not installed - run scripts/setup.sh")
if not os.path.isdir(FONTS) or not any(f.lower().startswith(("title.", "notoserifsc-light")) for f in os.listdir(FONTS)): err("title font missing - run scripts/setup.sh")

# ---------- rendered file
if video and os.path.exists(video):
    inf = probe(video)
    if (inf.get("width"), inf.get("height")) != (W, H): err("output is %sx%s, must be %dx%d" % (inf.get("width"), inf.get("height"), W, H))
    if abs(inf.get("fps", 0) - FPS) > 0.01: err("output fps %.2f" % inf.get("fps", 0))
    want = sec(body + endf)
    if abs(inf["duration"] - want) > 0.15: err("output duration %.2f != plan %.2f" % (inf["duration"], want))
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-vf", "blackdetect=d=0.2:pix_th=0.08,freezedetect=n=0.002:d=1.2",
                        "-af", "ebur128", "-f", "null", "-"], stderr=subprocess.PIPE).stderr.decode("utf8", "ignore")
    for m in re.finditer(r"black_start:([\d.]+).*?black_duration:([\d.]+)", r): err("black frames at %ss (%ss)" % m.groups())
    for m in re.finditer(r"freeze_start: ([\d.]+)", r):
        (warn if float(m.group(1)) < want - 0.1 else (lambda *_: None))("frozen picture from %ss - b-roll ran out or still without motion" % m.group(1))
    mj = base_ = os.path.splitext(video)[0] + ".mix.json"
    if os.path.exists(mj):
        mx = json.load(open(mj))
        print("sound: voice SNR %.0f dB, denoise %s" % (mx.get("snr", 0), mx.get("denoise")))
        if mx.get("snr", 99) < 25 and mx.get("denoise") != "off": warn("very noisy source (SNR %.0f dB): listen for denoise artefacts; consider audio.denoise 'light'" % mx["snr"])
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
    if m and not -18.5 <= float(m[-1]) <= -13.5: warn("loudness %s LUFS (target -16)" % m[-1])
    base = os.path.splitext(video)[0]
    subprocess.run([sys.executable, os.path.join(SKILL, "scripts", "sheet.py"), video, "-o", base + "_review.jpg", "--fps", "2", "--cols", "10", "--width", "216"])
    # full-res stills at every title and at a keyword line, for a close look
    pts = [sec(cf[t["cues"][1]][1]) - 0.2 for t in tl[:4]] + [sec(cf[i][0]) + 0.2 for i, c in enumerate(cues) if c.get("kw")][:2] + [want - 1.0]
    for k, p in enumerate(sorted(pts)[:8]):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "%.2f" % p, "-i", video, "-frames:v", "1", "-vf", "scale=540:-2", "%s_still%d.jpg" % (base, k)])
    print("review: %s_review*.jpg, %s_still*.jpg  -> LOOK at them and compare with %s/assets/reference/" % (base, base, SKILL))
elif video:
    err("video not found: " + video)

bt = sum(d for k, d, *_ in kinds if k == "broll")
print("\n%d lines, %d micro-cuts (pauses/stutters) | %d shots (avg %.1fs) | b-roll %.0f%% | %d titles | talk %.1fs + ending %.1fs"
      % (nline, micro, len(kinds), sec(body) / max(len(kinds), 1), 100 * bt / max(sec(body), 1e-9), len(tl), sec(body), sec(endf)))
for w in Wn: print("WARN  " + w)
for x in E: print("ERROR " + x)
print("QC %s (%d errors, %d warnings)" % ("FAILED" if E else "PASSED", len(E), len(Wn)))
sys.exit(1 if E else 0)
