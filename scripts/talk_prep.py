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
def wav(src, out):
    if not subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip(): sys.exit(f"这条视频里没有声音：{src}\n口播剪辑要靠声音来对字幕和剪口。请换一条带原声的原片；如果声音是单独录的，先合到视频里（ffmpeg -i 视频 -i 录音 -map 0:v -map 1:a -c:v copy 合好.mp4）。")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", out], check=True)
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
    print(f"\n画面 {w}×{h}，{fps} 帧/秒；第 3 秒截图在 {fr}（看一眼顶部有没有水印）")
    autof = os.path.join(work, "自动裁切.json")
    if st.get("line") != "wide" and fs is not None:      # 竖屏口播线：横拍竖拍都自动以人脸为准裁成 1080×1620，后面 cut 不用再写 --vf
        x, y, fw, fh = [int(v) for v in max(fs, key=lambda f: f[2] * f[3])[:4]]; cx, cy = x + fw // 2, y + fh // 2
        if w > h: ch = h; cw = int(h * 2 / 3) // 2 * 2; x0 = max(0, min(w - cw, cx - cw // 2)); y0 = 0
        else: cw = w; ch = min(h, int(w * 1.5) // 2 * 2); x0 = 0; y0 = max(0, min(h - ch, cy - int(.38 * ch)))
        k = 1080 / cw; face = {"x": int((cx - x0) * k), "y": int((cy - y0) * k), "w": int(fw * k)}; vf = f"crop={cw}:{ch}:{x0}:{y0},scale=1080:1620"
        json.dump({"vf": vf, "face": face, "landscape": w > h}, open(autof, "w", encoding="utf-8"), ensure_ascii=False)
        print(("这是横屏原片：会自动以人脸为中心裁成竖屏（画面只留中间三分之一多，清晰度会降一截；人别站太偏）。" if w > h else "竖屏原片。") + f"自动裁切：{vf}（cut 时不写 --vf 就用它）")
        print(f"裁切后的人脸：FACE = {{ x: {face['x']}, y: {face['y']}, w: {face['w']} }}（脸宽占画面 {face['w'] / 1080:.0%}，对标片约 20%）")
    elif w > h:      # 横屏原片（横屏深度解读风）：不裁成竖的，统一成 1920×1080
        if fs is not None:
            x, y, fw, fh = [int(v) for v in max(fs, key=lambda f: f[2] * f[3])[:4]]; k = 1920 / w
            print(f"横屏原片。人脸：中心 ({x + fw // 2}, {y + fh // 2})，宽 {fw}（占画面宽 {fw / w:.0%}）；转成 1920×1080 后是 FACE = {{ x: {int((x + fw / 2) * k)}, y: {int((y + fh / 2) * k)}, w: {int(fw * k)} }}")
        else: print("横屏原片，没找到人脸，请看截图手动定。")
        print("粗剪时加：--vf \"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080\"")
    elif fs is not None:
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
    vf = a.vf; autof = os.path.join(work, "自动裁切.json")
    if not vf and os.path.exists(autof): vf = json.load(open(autof, encoding="utf-8"))["vf"]; print("画面按自动裁切处理：" + vf)
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
        tk = json.load(open(os.path.join(work, "asr.json"), encoding="utf-8"))["tokens"]
        gap = [tk[i + 1]["s"] - tk[i]["s"] for i in range(len(tk) - 1)] + [9]          # 每个字到下一个字隔多久，越长越像停顿
        def split(lo, hi):                   # 把 [lo, hi) 这些字切成不超过 12 个字的行：每次在中间一段里找停顿最长的地方切
            if hi - lo <= (14 if st.get("line") == "wide" else 12): return [(lo, hi)]
            k = max(range(lo + 3, hi - 4), key=lambda i: gap[i] - 0.004 * abs(i - (lo + hi) // 2)) + 1
            return split(lo, k) + split(k, hi)
        txt = ""
        for lo, hi in split(0, len(tk)): txt += "".join(x["t"] for x in tk[lo:hi]).strip() + ("。" if gap[hi - 1] > 0.6 else "，")
        open(script, "w", encoding="utf-8").write("# 由录音转写。请校对错字；句读是按停顿加的，决定字幕在哪断行，断得不对就挪一下逗号句号（一行不超过 14 个字）\n## 全文\n" + txt + "\n"); print("没有稿子，已用转写结果生成 script.txt，校对错字后可再跑一次 cut。")
    subprocess.run([PY, os.path.join(R, "scripts", "align.py"), "--script", script, "--asr", os.path.join(work, "asr.json"), "--audio", cut, "--out-timing", os.path.join(code, "timing.json"), "--out-audio", os.path.join(R, "studio", "public", slug, "voice.wav"), "--max", "16" if st.get("line") == "wide" else "14", "--fps", str(fps)], check=True)
    print("好了：人物视频、配音、字幕时间表都已就位。")
