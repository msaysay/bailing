#!/usr/bin/env python3
"""Pick background music that matches the film: catalogue search -> download -> listen (analysis) -> rank.

    python3 bgm_match.py -o bgm [--mood light] [-n 3] [--bpm 90-125]
    python3 bgm_match.py -o bgm --synth          # offline fallback: generate a neutral ambient bed

Source: incompetech.com (Kevin MacLeod), ~1400 instrumental tracks, licence CC BY 4.0 = free for
commercial use WITH CREDIT. The credit line is written to bgm/candidates.json and bgm/CREDITS.txt and
must go into the delivery notes (video description) - or the user swaps in their own licensed track:
    python3 swap_bgm.py plan.json out/final.mp4 --bgm their.mp3 -o out/final_own.mp4

Moods (pick by the content; default `light` = the reference film: light, steady, mid-tempo, positive):
    light    企业叙事/产品讲解：明亮、轻快、稳定
    calm     人物故事/理念/复盘：安静、舒缓
    drive    数据/增长/实力展示：更有推进感
    warm     客户故事/服务/感谢：温暖
"""
import argparse, json, os, re, subprocess, sys, urllib.parse, urllib.request
import numpy as np

CAT = "https://incompetech.com/music/royalty-free/pieces.json"
MP3 = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/"
MOODS = {  # feel weights, bpm window
    "light": ({"Bright": 2, "Uplifting": 2, "Relaxed": 1.5, "Calming": 1, "Grooving": 0.5, "Bouncy": 0.3}, (88, 128)),
    "calm": ({"Calming": 2.5, "Relaxed": 2, "Bright": 0.8, "Uplifting": 0.8}, (60, 100)),
    "drive": ({"Driving": 2, "Uplifting": 2, "Bright": 1.5, "Grooving": 1, "Epic": 0.3}, (100, 140)),
    "warm": ({"Uplifting": 2, "Relaxed": 2, "Calming": 1.5, "Bright": 1}, (70, 110)),
}
BAD_FEEL = {"Dark", "Eerie", "Unnerving", "Humorous", "Aggressive", "Suspenseful", "Somber", "Mysterious", "Mystical", "Intense", "Action"}
GOOD_INST = ["piano", "guitar", "strings", "synth", "marimba", "bells", "glock", "vibraphone", "harp", "pad", "kalimba", "percussion"]
BAD_INST = ["vocal", "voice", "choir", "accordion", "banjo", "kazoo", "tuba", "bagpipe", "organ", "sax", "trumpet", "trombone", "harpsichord", "theremin", "whistle", "ukulele"]
BAD_WORD = ["christmas", "halloween", "horror", "circus", "polka", "funny", "silly", "comedy", "cartoon", "spooky", "medieval", "western", "jazz", "blues",
            "ragtime", "latin", "tango", "waltz", "march", "disco", "funk", "metal", "8-bit", "chiptune", "tavern", "pirate", "celtic", "bossa", "reggae", "swing", "carol", "santa", "jingle"]

ap = argparse.ArgumentParser()
ap.add_argument("-o", "--out", default="bgm")
ap.add_argument("--mood", default="light", choices=list(MOODS))
ap.add_argument("-n", type=int, default=3)
ap.add_argument("--bpm", default="")
ap.add_argument("--pool", type=int, default=7, help="how many catalogue hits to download and listen to")
ap.add_argument("--synth", action="store_true")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)


def decode(path, dur=75):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-t", str(dur), "-i", path, "-vn", "-ac", "1", "-ar", "22050", "-f", "s16le", "-"],
                         stdout=subprocess.PIPE).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def listen(path):
    """What matters for a bed under speech: starts quickly, level stays even, leaves the speech band free."""
    x = decode(path)
    if len(x) < 22050 * 20:
        return None
    hop = 512
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    e = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-5)
    lvl = np.percentile(e, 80)
    on = np.where(e > lvl - 14)[0]
    start = float(on[0] * hop / 22050) if len(on) else 0.0                 # skip a slow fade-in
    body = e[on[0]:] if len(on) else e
    sec = body[: len(body) // 43 * 43].reshape(-1, 43).mean(1)             # ~1 s loudness
    steadiness = float(np.std(sec))                                         # dB; low = no drops / build-ups
    S = np.abs(np.fft.rfft(fr * np.hanning(hop), axis=1)) ** 2
    f = np.fft.rfftfreq(hop, 1 / 22050)
    speech = float(S[:, (f > 700) & (f < 3500)].sum() / (S.sum() + 1e-9))   # share of energy where consonants live
    flux = np.maximum(np.diff(np.log(S + 1e-6), axis=0), 0).sum(1)
    flux = flux - flux.mean()
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    lags = np.arange(len(ac)) * hop / 22050
    m = (lags > 0.33) & (lags < 1.0)                                        # 60-180 bpm
    bpm = float(60 / lags[m][np.argmax(ac[m])]) if m.any() else 0
    punch = float(np.percentile(flux, 98) / (np.std(flux) + 1e-9))          # spiky = busy drums
    return {"start": round(start, 2), "steadiness_db": round(steadiness, 2), "speech_band": round(speech, 3),
            "bpm_heard": round(bpm), "punch": round(punch, 2)}


def synth(path, bpm=96, dur=100, seed=7):
    """Offline fallback: soft pad + plucked arpeggio, I-V-vi-IV. Neutral, never clashes, not a hit either."""
    sr = 44100
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    t = np.arange(int(sr * dur)) / sr
    out = np.zeros_like(t)
    chords = [[57, 61, 64], [52, 56, 59], [54, 57, 61], [50, 54, 57]]       # A  E  F#m  D
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = beat * 4
    for b in range(int(dur / bar) + 1):
        ch = chords[b % 4]
        s0, s1 = int(b * bar * sr), min(int((b + 1) * bar * sr), len(t))
        if s0 >= len(t):
            break
        tt = t[s0:s1] - b * bar
        envp = np.minimum(tt / 0.6, 1) * np.minimum((bar - tt) / 0.6, 1)
        for m in ch:
            for det in (-0.3, 0.3):
                out[s0:s1] += 0.045 * envp * np.sin(2 * np.pi * (hz(m) + det) * tt)
        out[s0:s1] += 0.06 * envp * np.sin(2 * np.pi * hz(ch[0] - 12) * tt)
        for k in range(8):                                                   # eighth-note pluck
            p0 = int((b * bar + k * beat / 2) * sr)
            if p0 >= len(t):
                break
            m = ch[[0, 1, 2, 1, 2, 1, 0, 2][k]] + 12
            n = min(int(0.9 * sr), len(t) - p0)
            pt = np.arange(n) / sr
            out[p0:p0 + n] += 0.07 * np.exp(-pt * 5) * (np.sin(2 * np.pi * hz(m) * pt) + 0.3 * np.sin(4 * np.pi * hz(m) * pt))
    out = out / (np.abs(out).max() + 1e-9) * 0.7
    d = int(0.33 * sr)                                                       # cheap stereo echo for width
    L, R = out.copy(), out.copy()
    L[d:] += 0.25 * out[:-d]
    R[d * 2:] += 0.2 * out[:-d * 2]
    pcm = (np.stack([L, R], 1) / 1.3 * 32767).astype(np.int16)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "2", "-i", "-", "-af", "lowpass=f=6000",
                    "-b:a", "192k", path], input=pcm.tobytes(), check=True)


if a.synth:
    p = os.path.join(a.out, "synth_bed.mp3")
    synth(p)
    res = [{"file": p, "title": "generated ambient bed", "licence": "generated by this skill, no rights attached", "credit": "",
            "src_in": 0, "score": 0}]
    json.dump(res, open(os.path.join(a.out, "candidates.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print('wrote %s\nplan:  "bgm": {"src": "%s"}' % (p, p))
    sys.exit(0)

weights, (b0, b1) = MOODS[a.mood]
if a.bpm:
    b0, b1 = map(int, a.bpm.split("-"))
try:
    req = urllib.request.Request(CAT, headers={"User-Agent": "Mozilla/5.0"})
    cat = json.load(urllib.request.urlopen(req, timeout=60))
except Exception as ex:
    sys.exit("catalogue not reachable (%s). Allow incompetech.com in the network settings, use the user's own track, "
             "or run with --synth for a generated bed." % ex)
cands = []
for t in cat:
    feel = {f.strip() for f in str(t.get("feel") or "").split(",") if f.strip()}
    inst = str(t.get("instruments") or "").lower()
    desc = (str(t.get("description") or "") + " " + str(t.get("title") or "")).lower()
    try:
        bpm = float(t.get("bpm") or 0)
        h, m_, s_ = [int(v) for v in str(t.get("length") or "0:0:0").split(":")]
        length = h * 3600 + m_ * 60 + s_
    except Exception:
        continue
    if feel & BAD_FEEL or length < 80 or any(w in inst for w in BAD_INST) or any(w in desc for w in BAD_WORD):
        continue
    sc = sum(weights.get(f, 0) for f in feel)
    if sc < 2:
        continue
    eff = bpm / 2 if bpm > 150 else bpm                                      # half-time feel
    sc += 1.5 if b0 <= eff <= b1 else -min(abs(eff - (b0 + b1) / 2) / 25, 2)
    sc += 0.3 * min(sum(w in inst for w in GOOD_INST), 3)
    cands.append((sc, t, sorted(feel), bpm))
cands.sort(key=lambda c: -c[0])
print("%d catalogue matches for mood '%s' (bpm %d-%d); listening to the top %d" % (len(cands), a.mood, b0, b1, a.pool))
res = []
for sc, t, feel, bpm in cands[: a.pool]:
    fn = re.sub(r"[^\w]+", "_", t["title"]).strip("_") + ".mp3"
    dst = os.path.join(a.out, fn)
    if not os.path.exists(dst) or os.path.getsize(dst) < 100000:
        r = subprocess.run(["curl", "-fsSL", "-m", "120", "-A", "Mozilla/5.0", "-o", dst, MP3 + urllib.parse.quote(t["filename"])])
        if r.returncode != 0:
            print("  download failed:", t["title"])
            continue
    h = listen(dst)
    if not h:
        continue
    # under speech: even level and a free speech band matter more than the tag score
    final = sc - 0.35 * max(h["steadiness_db"] - 2.0, 0) - 6 * max(h["speech_band"] - 0.12, 0) - 0.15 * max(h["punch"] - 6, 0)
    res.append({"file": dst, "title": t["title"], "feel": feel, "bpm": bpm, "instruments": t.get("instruments"),
                "description": t.get("description"), "src_in": h["start"], "score": round(final, 2), "listen": h,
                "licence": "CC BY 4.0", "credit": '"%s" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/' % t["title"]})
res.sort(key=lambda r_: -r_["score"])
keep = res[: a.n]
for r_ in res[a.n:]:
    os.remove(r_["file"])
json.dump(keep, open(os.path.join(a.out, "candidates.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
open(os.path.join(a.out, "CREDITS.txt"), "w", encoding="utf8").write("\n".join(r_["credit"] for r_ in keep) + "\n")
for k, r_ in enumerate(keep):
    print("%s %-28s %3.0f bpm  %-28s score %.1f  even %.1f dB  speech-band %.0f%%  start %.1fs" % (
        "ABC"[k] if k < 3 else str(k), r_["title"][:28], r_["bpm"], ",".join(r_["feel"])[:28], r_["score"],
        r_["listen"]["steadiness_db"], 100 * r_["listen"]["speech_band"], r_["src_in"]))
if keep:
    print('plan:  "bgm": {"src": "%s", "src_in": %s}      (level defaults to -13 LU under the voice)' % (keep[0]["file"], keep[0]["src_in"]))
    print("credit required (CC BY 4.0) -> see %s" % os.path.join(a.out, "CREDITS.txt"))
else:
    print("nothing usable - try another --mood, or --synth")
