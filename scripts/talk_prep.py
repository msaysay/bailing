#!/usr/bin/env python3
"""口播粗剪一条龙。
  scripts/talk_prep.py <期名> transcribe
      转写 01_输入素材/口播原片.mp4，打印逐字时间（找口误用），并量出人脸位置和画面顶部有没有水印。
      同时自动找重录、结巴、语气词（scripts/retakes.py），结果存 03_制作过程/重录检测.json。
  scripts/talk_prep.py <期名> cut --drop "7.55-10.48,70.8-71.72" [--vf "delogo=...,crop=1080:1620:0:240"]
                                  [--auto-drop] [--grade] [--beauty 0.3] [--denoise auto|light|strong]
      剪掉口误和长停顿、去水印裁切 → 对剪好的片子再转写 → 和稿子对齐（没有稿子就用转写结果当稿子）。
      可选项：--auto-drop 把重录检测里「自动删」的那些一起剪掉（先看过 transcribe 打印的清单再用）；
              --grade 自动调光（--beauty 是轻磨皮），对比图存 03_制作过程/调光对比.jpg；
              --denoise 人声降噪加修音（剪完之后、对齐之前做，不改时长）。
      输出 studio/public/<代号>/person.mp4、voice.wav，studio/src/episodes/<代号>/timing.json、cuts.json。"""
import argparse, json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PY = sys.executable
ap = argparse.ArgumentParser(); ap.add_argument("ep"); ap.add_argument("cmd", choices=["transcribe", "cut"]); ap.add_argument("--drop", default=""); ap.add_argument("--vf", default="")
ap.add_argument("--auto-drop", action="store_true"); ap.add_argument("--grade", action="store_true"); ap.add_argument("--beauty", type=float, default=0.0); ap.add_argument("--denoise", default="off", choices=["off", "auto", "light", "strong"]); a = ap.parse_args()
E = os.path.join(R, "episodes", a.ep); st = json.load(open(os.path.join(E, "进度.json"), encoding="utf-8")); slug = st["slug"]
raw = os.path.join(E, "01_输入素材", "口播原片.mp4"); work = os.path.join(E, "03_制作过程"); tmp = os.path.join(work, "_tmp"); os.makedirs(tmp, exist_ok=True)
if not os.path.exists(raw): sys.exit("找不到口播原片：" + raw)
fps = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", raw], capture_output=True, text=True).stdout.strip().split("/")
fps = round(int(fps[0]) / int(fps[1])) if len(fps) == 2 else 30
def wav(src, out): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", out], check=True)
if a.cmd == "transcribe":
    wav(raw, os.path.join(tmp, "raw.wav")); subprocess.run([PY, os.path.join(R, "scripts", "asr.py"), os.path.join(tmp, "raw.wav"), os.path.join(work, "asr-原片.json")], check=True, capture_output=True)
    tk = json.load(open(os.path.join(work, "asr-原片.json")))["tokens"]; line, t0 = [], None
    print("逐字时间（每行约 10 个字，方括号是起点秒）：")
    for x in tk:
        if t0 is None: t0 = x["s"]
        line.append(f"{x['t']}{x['s']:.2f}" if len(line) % 4 == 0 else x["t"])
        if len(line) >= 10: print(f"[{t0:6.2f}] " + " ".join(line)); line, t0 = [], None
    if line: print(f"[{t0:6.2f}] " + " ".join(line))
    print("\n重录、结巴、语气词（机器找的，逐条看过再用；确认没问题，cut 时加 --auto-drop）：")
    subprocess.run([PY, os.path.join(R, "scripts", "retakes.py"), os.path.join(work, "asr-原片.json"), "--out", os.path.join(work, "重录检测.json")])
    fr = os.path.join(tmp, "f.png"); subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", "3", "-i", raw, "-frames:v", "1", fr], check=True)
    import cv2
    im = cv2.imread(fr); h, w = im.shape[:2]; det = cv2.FaceDetectorYN.create(os.path.expanduser("~/.cache/video-studio/yunet.onnx"), "", (w, h), .6, .3, 50); _, fs = det.detect(im)
    print(f"\\n画面 {w}×{h}，{fps} 帧/秒；第 3 秒截图在 {fr}（看一眼顶部有没有水印）")
    if fs is not None:
        x, y, fw, fh = [int(v) for v in max(fs, key=lambda f: f[2] * f[3])[:4]]; cy = y + fh // 2
        top = max(0, min(h - 1620 * w // 1080, cy - int(.38 * 1620 * w / 1080)))
        print(f"人脸：中心 ({x + fw // 2}, {cy})，宽 {fw}（占画面宽 {fw / w:.0%}）。建议裁切：crop={w}:{1620 * w // 1080}:0:{top}")
    else: print("没找到人脸，请看截图手动定裁切。")
else:
    cut = os.path.join(R, "studio", "public", slug, "person.mp4"); os.makedirs(os.path.dirname(cut), exist_ok=True)
    asr0 = os.path.join(work, "asr-原片.json")
    if not os.path.exists(asr0): sys.exit("先运行 transcribe")
    cmd = [PY, os.path.join(R, "scripts", "roughcut.py"), raw, asr0, "--out", cut, "--cuts", os.path.join(work, "cuts.json"), "--fps", str(fps)]
    drop = a.drop
    if a.auto_drop:
        rj = os.path.join(work, "重录检测.json")
        if not os.path.exists(rj): subprocess.run([PY, os.path.join(R, "scripts", "retakes.py"), asr0, "--out", rj], check=True, capture_output=True)
        auto = json.load(open(rj, encoding="utf-8")).get("drop", ""); drop = ",".join(x for x in (drop, auto) if x)
        print("自动剪掉的重录、结巴、语气词：" + (auto or "没有"))
    vf = a.vf
    if a.grade or a.beauty > 0:
        g = subprocess.run([PY, os.path.join(R, "scripts", "grade.py"), raw, os.path.join(work, "调光.json"), "--beauty", str(a.beauty), "--preview", os.path.join(work, "调光对比.jpg")], capture_output=True, text=True)
        if g.returncode == 0 and g.stdout.strip(): vf = ",".join(x for x in (g.stdout.strip().splitlines()[-1], vf) if x); print("调光：" + g.stderr.strip() + "；对比图 03_制作过程/调光对比.jpg（左原片右调后，肤色不自然就去掉 --grade 重跑）")
        else: print("调光没算出来，这次不调：" + g.stderr.strip()[-200:])
    if drop: cmd += ["--drop", drop]
    if vf: cmd += ["--vf", vf]
    subprocess.run(cmd, check=True)
    if a.denoise != "off": subprocess.run([PY, os.path.join(R, "scripts", "polish.py"), cut, "--inplace", "--denoise", a.denoise], check=True)
    code = os.path.join(R, "studio", "src", "episodes", slug); os.makedirs(code, exist_ok=True)
    subprocess.run(["cp", os.path.join(work, "cuts.json"), os.path.join(code, "cuts.json")], check=True)
    wav(cut, os.path.join(tmp, "cut.wav")); subprocess.run([PY, os.path.join(R, "scripts", "asr.py"), os.path.join(tmp, "cut.wav"), os.path.join(work, "asr.json")], check=True, capture_output=True)
    script = os.path.join(work, "script.txt")
    if not os.path.exists(script):
        txt = "".join(x["t"] for x in json.load(open(os.path.join(work, "asr.json")))["tokens"])
        open(script, "w", encoding="utf-8").write("# 由录音转写，请校对错字\\n## 全文\\n" + txt + "\\n"); print("没有稿子，已用转写结果生成 script.txt，校对错字后可再跑一次 cut。")
    subprocess.run([PY, os.path.join(R, "scripts", "align.py"), "--script", script, "--asr", os.path.join(work, "asr.json"), "--audio", cut, "--out-timing", os.path.join(code, "timing.json"), "--out-audio", os.path.join(R, "studio", "public", slug, "voice.wav"), "--max", "14", "--fps", str(fps)], check=True)
    print("好了：人物视频、配音、字幕时间表都已就位。")
