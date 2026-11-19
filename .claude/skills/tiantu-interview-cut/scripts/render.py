#!/usr/bin/env python3
"""Render plan.json -> 1080x1920 30fps mp4, in the reference film's exact style.

    python3 render.py plan.json -o out/final.mp4 [--draft] [--keep]

The speech track is the spine: cues are cut out of the A-roll and butted
together; every shot is laid on top of a cue range; text and logo go last.
"""
import argparse, os, shutil, sys, tempfile
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import ass as assmod
import audiomix, json

SPF = SR // FPS  # audio samples per video frame


def cover_chain(info, zoom, fx, fy, face_to=None, push=0.0, nframes=1, speed=1.0, draft=False):
    """Filter chain: cover-crop a source to 9:16, optional slow push-in.

    zoom  : static zoom on top of 'cover' (1.0 = fill the frame exactly)
    fx,fy : focus point in the source (0..1), e.g. the face centre
    face_to: where on the output (0..1 of height) the focus should sit
    push  : total relative zoom added over the shot (0.08 = 8% push-in)
    """
    sw, sh = info["width"], info["height"]
    k = 2 if (push and not draft) else 1          # supersample pushes to hide zoompan jitter
    cw, ch = W * k, H * k
    s = max(cw / sw, ch / sh) * zoom
    tw, th = int(round(sw * s / 2)) * 2, int(round(sh * s / 2)) * 2
    tw, th = max(tw, cw), max(th, ch)
    x = min(max(fx * tw - cw / 2, 0), tw - cw)
    ty = (face_to if face_to is not None else 0.5) * ch
    y = min(max(fy * th - ty, 0), th - ch)
    f = []
    if speed != 1.0:
        f.append("setpts=PTS/%.4f" % speed)
    f += ["fps=%d" % FPS, "scale=%d:%d:flags=bicubic" % (tw, th), "crop=%d:%d:%d:%d" % (cw, ch, int(x), int(y))]
    if push:
        px = (fx * tw - x) / cw                      # focus inside the crop
        py = (fy * th - y) / ch
        px, py = min(max(px, 0.2), 0.8), min(max(py, 0.2), 0.8)
        z = "1+%.5f*on/%d" % (push, max(nframes - 1, 1))
        f.append("zoompan=z='%s':x='(iw-iw/zoom)*%.4f':y='(ih-ih/zoom)*%.4f':d=1:s=%dx%d:fps=%d"
                 % (z, px, py, W, H, FPS))
    f += ["setsar=1", "format=yuv420p"]
    return ",".join(f)


def render_seg(src, t_in, nframes, vf, out, draft, still=False):
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if still:
        cmd += ["-loop", "1", "-framerate", str(FPS), "-i", src]
    else:
        cmd += ["-ss", "%.3f" % max(t_in, 0), "-i", src]
    cmd += ["-frames:v", str(nframes), "-vf", vf, "-an", "-c:v", "libx264",
            "-preset", "ultrafast" if draft else "veryfast", "-crf", "20" if draft else "14",
            "-pix_fmt", "yuv420p", "-video_track_timescale", "15360", out]
    run(cmd)
    got = int(run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0",
                   "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", out]).decode().strip() or 0)
    if got < nframes:   # source ran out: freeze the last frame so sync never drifts
        pad = out + ".pad.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", out, "-vf", "tpad=stop_mode=clone:stop=%d" % (nframes - got),
             "-frames:v", str(nframes), "-c:v", "libx264", "-preset", "veryfast", "-crf", "14",
             "-pix_fmt", "yuv420p", "-video_track_timescale", "15360", pad])
        os.replace(pad, out)
        print("  ! %s too short, froze %d frames" % (os.path.basename(src), nframes - got))


def pcm(src, t_in, nsamp):
    raw = run(["ffmpeg", "-v", "error", "-ss", "%.3f" % t_in, "-i", src, "-t", "%.3f" % (nsamp / SR + 0.2),
               "-vn", "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"])
    a = np.frombuffer(raw, dtype=np.int16).reshape(-1, 2).astype(np.float32)
    if len(a) < nsamp:
        a = np.vstack([a, np.zeros((nsamp - len(a), 2), np.float32)])
    a = a[:nsamp].copy()
    n = min(int(0.008 * SR), nsamp // 2)          # 8 ms edge fades: no clicks at cuts
    ramp = np.linspace(0, 1, n, dtype=np.float32)[:, None]
    a[:n] *= ramp
    a[-n:] *= ramp[::-1]
    return a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("-o", "--out", default="out/final.mp4")
    ap.add_argument("--draft", action="store_true", help="fast low-quality pass for review")
    ap.add_argument("--keep", action="store_true", help="keep the temp dir")
    a = ap.parse_args()

    plan = load_plan(a.plan)
    cues = plan["cues"]
    cf, body, endf = timeline(plan)
    srcs = plan.get("sources", {})
    tmp = tempfile.mkdtemp(prefix="tic_")
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    info_cache = {}

    def info(p):
        if p not in info_cache:
            info_cache[p] = probe(p)
        return info_cache[p]

    # ------------------------------------------------------------ audio spine
    chunks = []
    for src, t0, t1, c0, c1 in runs(plan):
        n = (cf[c1][1] - cf[c0][0]) * SPF
        chunks.append(pcm(rp(plan, src), t0, n))
    voice = np.vstack(chunks) if chunks else np.zeros((0, 2), np.float32)
    voice = np.vstack([voice, np.zeros((endf * SPF, 2), np.float32)])
    vpath = os.path.join(tmp, "voice.raw")
    np.clip(voice, -32768, 32767).astype(np.int16).tofile(vpath)

    # ------------------------------------------------------------ video segments
    segs, idx = [], 0
    for sh, c0, c1 in shot_ranges(plan):
        f0, f1 = cf[c0][0], cf[c1][1]
        kind = sh.get("type", "aroll")
        if kind == "aroll":
            # one sub-clip per contiguous source run so the lips always match the voice
            parts, i = [], c0
            while i <= c1:
                j = i
                while j < c1 and cues[j + 1]["src"] == cues[j]["src"] and abs(cues[j + 1]["in"] - cues[j]["out"]) < 0.03:
                    j += 1
                parts.append((i, j))
                i = j + 1
            pi = 0
            for (i, j) in parts:
                if i > c0 and jump(cues[i - 1], cues[i]) == "hard":
                    pi += 1                                    # micro jumps (tightened pauses) keep the framing
                main_src = cues[i]["src"]
                src = sh.get("src", main_src)                 # optional second camera
                off = float(sh.get("offset", 0.0))            # camB_time = main_time + offset
                sc = dict(srcs.get(src, srcs.get(main_src, {})))
                p = rp(plan, src)
                inf = info(p)
                tight = sh.get("framing", "wide") == "tight"
                zoom = float(sh.get("zoom", sc.get("tight_zoom", 1.35) if tight else sc.get("zoom", 1.0)))
                if pi % 2 == 1:
                    zoom *= 1.12                               # hide a jump cut with a punch-in
                n = cf[j][1] - cf[i][0]
                dur = n / FPS
                push = sh.get("push")
                if push is None:
                    push = dur >= 3.0                          # SOP: >3s single shot -> slow push
                pz = min(0.10, 0.03 * dur) if push else 0.0    # ~3%/s, capped at 10%
                vf = cover_chain(inf, zoom, float(sh.get("focus_x", sc.get("focus_x", 0.5))),
                                 float(sh.get("focus_y", sc.get("focus_y", 0.4))),
                                 face_to=float(sc.get("face_to", 0.36)), push=pz, nframes=n, draft=a.draft)
                out = os.path.join(tmp, "seg%04d.mp4" % idx); idx += 1
                render_seg(p, float(cues[i]["in"]) + off, n, vf, out, a.draft)
                segs.append(out)
        else:
            p = rp(plan, sh["src"])
            inf = info(p)
            n = f1 - f0
            speed = float(sh.get("speed", 1.0))
            pz = sh.get("push", 0.06 if inf.get("still") else 0.0)
            pz = 0.06 if pz is True else float(pz or 0)
            vf = cover_chain(inf, float(sh.get("zoom", 1.0)), float(sh.get("focus_x", 0.5)),
                             float(sh.get("focus_y", 0.5)), push=pz, nframes=n, speed=speed, draft=a.draft)
            out = os.path.join(tmp, "seg%04d.mp4" % idx); idx += 1
            render_seg(p, float(sh.get("src_in", 0)), n, vf, out, a.draft, still=inf.get("still"))
            segs.append(out)
        print("shot %-5s cues %d-%d  %.2fs" % (kind, c0, c1, (f1 - f0) / FPS))

    e = plan.get("ending")
    if e:
        p = rp(plan, e["src"])
        inf = info(p)
        vf = cover_chain(inf, float(e.get("zoom", 1.0)), float(e.get("focus_x", 0.5)), float(e.get("focus_y", 0.5)),
                         push=float(e.get("push", 0.0)), nframes=endf, speed=float(e.get("speed", 1.0)), draft=a.draft)
        out = os.path.join(tmp, "seg_end.mp4")
        render_seg(p, float(e.get("src_in", 0)), endf, vf, out, a.draft, still=inf.get("still"))
        segs.append(out)

    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines("file '%s'\n" % s for s in segs)

    # ------------------------------------------------------------ overlays + mix
    asspath = os.path.join(tmp, "overlay.ass")
    with open(asspath, "w", encoding="utf8") as f:
        f.write(assmod.build(plan))
    total = (body + endf) / FPS
    logo = rp(plan, plan.get("brand", {}).get("logo", "$SKILL/assets/brand/logo.png"))
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst]
    fc, vlast = [], "0:v"
    nin = 1
    if logo and os.path.exists(logo):
        cmd += ["-i", logo]
        fc.append("[%d:v]scale=%d:-1:flags=lanczos[lg];[0:v][lg]overlay=%d:%d[v1]"
                  % (nin, STYLE["logo_w"], STYLE["logo_x"], STYLE["logo_y"]))
        vlast, nin = "v1", nin + 1
    else:
        print("WARNING: logo not found (%s) -- the logo is mandatory in the final film" % logo)
    esc = lambda s: s.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")
    fc.append("[%s]ass='%s':fontsdir='%s'[vout]" % (vlast, esc(asspath), esc(FONTS)))
    cmd += ["-filter_complex", ";".join(fc), "-map", "[vout]", "-an", "-t", "%.3f" % total,
            "-c:v", "libx264", "-preset", "ultrafast" if a.draft else "medium", "-crf", "26" if a.draft else "18",
            "-pix_fmt", "yuv420p", "-r", str(FPS), os.path.join(tmp, "picture.mp4")]
    run(cmd)
    # ---- sound: clean the voice (denoise), keep it as a stem, then lay the music under it
    base = os.path.splitext(a.out)[0]
    stem = base + ".voice.wav"
    mode, snr, vl = audiomix.clean_voice(vpath, stem, (plan.get("audio") or {}).get("denoise", "auto"), body / FPS)
    print("voice: SNR %.0f dB -> denoise %s, %.1f LUFS" % (snr, mode, vl))
    bgm = dict(plan.get("bgm") or {})
    if bgm.get("src"):
        bgm["src"] = rp(plan, bgm["src"])
    else:
        print("WARNING: no bgm in plan -- run bgm_match.py (the reference film has a quiet music bed)")
    audiomix.mix(stem, vl, bgm, total, endf / FPS, os.path.join(tmp, "sound.m4a"))
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "picture.mp4"), "-i", os.path.join(tmp, "sound.m4a"),
         "-c", "copy", "-movflags", "+faststart", a.out])
    json.dump({"voice_lufs": vl, "total": total, "ending": endf / FPS, "denoise": mode, "snr": snr},
              open(base + ".mix.json", "w"))
    shutil.copy(asspath, os.path.splitext(a.out)[0] + ".ass")
    if a.keep:
        print("temp kept:", tmp)
    else:
        shutil.rmtree(tmp, ignore_errors=True)
    print("OK %s  %.2fs  (%d cues, %d shots)" % (a.out, total, len(cues), len(plan["shots"])))


if __name__ == "__main__":
    main()
