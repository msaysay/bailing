#!/usr/bin/env python3
"""人物抠像：把一条口播视频里的人单独抠出来，得到一条「只有人、背景透明」的视频。
有了它，字、图、光就能放到人的身后（人挡住一部分），这是「字在人后面」这类效果的前提。

  python3 scripts/matte.py make <人物视频> [--out <目录>] [--from 秒 --to 秒] [--model fast|fine] [--check]
      出两样东西（默认放在视频旁边）：
        <名>-matte.mp4   黑白遮罩（白 = 人），给别的软件用
        <名>-fg.webm     只有人、背景透明（一个文件，给剪映、PR 这类软件用）
        <名>-fg/         同样的内容拆成一串帧（Remotion 里用 <Depth fg="…/<名>-fg">，渲染快）；里面的 info.json 记了脸的位置
      --from/--to  只抠要用的那几秒（抠像慢，别整条都抠）
      --model fine（默认）边缘细，头发丝也在；fast 快三倍，边缘粗一点
      --check      另出一张检查图 <名>-抠像检查.jpg：人贴在品红底上，漏抠、多抠一眼能看出来
  python3 scripts/matte.py demo <人物视频> [--from 秒] [--out 目录]
      用你自己的片子把每个「人后面」的效果各放 3.5 秒，出一条演示片和一张总览图（给用户挑效果用）
  python3 scripts/matte.py check <人物视频> <fg.webm>      只出检查图

模型第一次用会自动下载到 ~/.cache/video-studio/：
  fine = Robust Video Matting（mobilenetv3，15MB，GPL-3.0；只在本机运行，不随包分发）
  fast = PP-HumanSeg（6MB，Apache-2.0）
抠不干净的常见原因：人和背景颜色太接近、背景里有别人、手伸出画面。看检查图，不行就别用「人后面」的效果，换成字在人旁边。"""
import argparse, json, os, shutil, subprocess, sys, urllib.request
import numpy as np

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/video-studio")
URL = {"fine": ("rvm.onnx", "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx"),
       "fast": ("pphumanseg.onnx", "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/human_segmentation_pphumanseg/human_segmentation_pphumanseg_2023mar.onnx")}


def model(kind):
    try: import onnxruntime as ort
    except ImportError:                                  # 抠像才用到，第一次用时自己装
        print("安装 onnxruntime …"); subprocess.run([sys.executable, "-m", "pip", "install", "-q", "onnxruntime"], check=True); import onnxruntime as ort
    n, u = URL[kind]; p = os.path.join(CACHE, n)
    if not os.path.exists(p) or os.path.getsize(p) < 1e6:
        os.makedirs(CACHE, exist_ok=True); print("下载抠像模型 …", n); urllib.request.urlretrieve(u, p)
    o = ort.SessionOptions(); o.intra_op_num_threads = min(8, os.cpu_count() or 4)
    return ort.InferenceSession(p, o, providers=["CPUExecutionProvider"])


def probe(v):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:stream_side_data=rotation", "-of", "csv=p=0", v], capture_output=True, text=True).stdout.strip().split("\n")[0].split(",")
    w, h = int(r[0]), int(r[1]); a, b = r[2].split("/"); fps = float(a) / float(b)
    if len(r) > 3 and r[3].strip("-") in ("90", "270"): w, h = h, w
    return w, h, fps


def make(a):
    import cv2
    W, H, fps = probe(a.video); stem = os.path.splitext(os.path.basename(a.video))[0]; out = a.out or os.path.dirname(os.path.abspath(a.video)); os.makedirs(out, exist_ok=True)
    mt, fg = os.path.join(out, stem + "-matte.mp4"), os.path.join(out, stem + "-fg.webm"); cut = (["-ss", str(a.start)] if a.start else []) + (["-to", str(a.to)] if a.to else [])
    rd = subprocess.Popen(["ffmpeg", "-v", "error", *cut, "-i", a.video, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", f"{fps}", "-i", "-", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", mt], stdin=subprocess.PIPE)
    s = model(a.model); n = 0; rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4; ds = np.array([min(1.0, 384 / max(W, H))], np.float32)     # fine：模型内部缩到长边 384 左右算，再放大回来
    while True:
        b = rd.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        im = np.frombuffer(b, np.uint8).reshape(H, W, 3)
        if a.model == "fine":
            x = (im.astype(np.float32) / 255).transpose(2, 0, 1)[None]; o = s.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ds}); pha = o[1][0, 0]; rec = o[2:]
        else:
            x = cv2.resize(im, (192, 192)).astype(np.float32) / 255; x = ((x - 0.5) / 0.5).transpose(2, 0, 1)[None]; o = s.run(None, {"x": x})[0][0]; e = np.exp(o - o.max(0)); p = (e[1] / e.sum(0)).astype(np.float32)
            p = cv2.resize(p, (W, H), interpolation=cv2.INTER_LINEAR); g = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
            pha = cv2.ximgproc.guidedFilter(g, p, 12, 1e-3) if hasattr(cv2, "ximgproc") else cv2.GaussianBlur(p, (0, 0), 3); pha = np.clip((pha - 0.25) / 0.5, 0, 1)
        wr.stdin.write((np.clip(pha, 0, 1) * 255).astype(np.uint8).tobytes()); n += 1
        if n % 60 == 0: print(f"  已抠 {n / fps:.1f} 秒", flush=True)
    wr.stdin.close(); wr.wait(); rd.wait()
    if not n: sys.exit("没读到画面，检查视频路径和 --from/--to")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *cut, "-i", a.video, "-i", mt, "-filter_complex", "[1:v]format=gray[m];[0:v][m]alphamerge", "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-cpu-used", "4", "-auto-alt-ref", "0", fg], check=True)
    seq = os.path.join(out, stem + "-fg"); os.makedirs(seq, exist_ok=True)
    for f in os.listdir(seq):
        if f.endswith(".webp"): os.remove(os.path.join(seq, f))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", fg, "-c:v", "libwebp", "-q:v", "82", "-compression_level", "2", "-start_number", "1", os.path.join(seq, "%05d.webp")], check=True)
    hd = head_of(a.video, a.start or 0, W, H); json.dump({"from": a.start or 0, "seconds": round(n / fps, 3), "frames": n, "fps": fps, "w": W, "h": H, "head": hd}, open(os.path.join(seq, "info.json"), "w"), indent=1)
    print(f"抠了 {n / fps:.1f} 秒（{n} 帧）\n  遮罩：{mt}\n  透明人像（一个文件，渲染慢）：{fg}\n  透明人像（一串帧，渲染快，Remotion 用这个）：{seq}/\n  脸的位置 head = {hd}")
    if a.check: check(a.video, fg, a.start or 0)


def head_of(video, at, W, H):
    """脸在画面里的位置（给 <Depth head=…>）：x、y 是脸中心占宽高的比例，r 是脸的半高占画面高的比例。找不到脸就给竖屏口播的常见位置。"""
    try:
        import cv2
        m = os.path.join(CACHE, "yunet.onnx"); fr = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(at + 0.5), "-i", video, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
        im = np.frombuffer(fr, np.uint8).reshape(H, W, 3); d = cv2.FaceDetectorYN.create(m, "", (W, H), 0.6); _, fs = d.detect(im); f = max(fs, key=lambda b: b[2] * b[3])
        return {"x": round(float(f[0] + f[2] / 2) / W, 3), "y": round(float(f[1] + f[3] / 2) / H, 3), "r": round(float(f[3]) / 2 / H, 3)}
    except Exception: return {"x": 0.5, "y": 0.3, "r": 0.09}


def demo(a):
    """用你自己的片子把每个「人后面」的效果各放 3.5 秒，出一条演示片和一张总览图。"""
    S = os.path.join(R, "studio"); pub = os.path.join(S, "public", "depth-demo"); shutil.rmtree(pub, ignore_errors=True); os.makedirs(pub); st = a.start or 0
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(st), "-t", "3.6", "-i", a.video, "-c:v", "libx264", "-crf", "18", "-an", os.path.join(pub, "person.mp4")], check=True)
    a.video = os.path.join(pub, "person.mp4"); a.out = pub; a.start = None; a.to = None; a.check = True; make(a); info = json.load(open(os.path.join(pub, "person-fg", "info.json")))
    props = os.path.join(pub, "props.json"); json.dump({"base": "depth-demo/person.mp4", "fg": "depth-demo/person-fg", "w": info["w"], "h": info["h"], "head": info["head"], "clip": 3.5}, open(props, "w"))
    out = os.path.abspath(a.demo_out or os.path.join(R, "out")); os.makedirs(out, exist_ok=True); mp4 = os.path.join(out, "人后面效果-演示.mp4"); br = chrome()
    subprocess.run(["npx", "remotion", "render", "src/index.tsx", "DEPTH-DEMO", mp4, "--props=" + props, "--concurrency=4", "--log=error"] + (["--browser-executable=" + br] if br else []), cwd=S, check=True)
    sheet = os.path.join(out, "人后面效果-总览.jpg"); subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf", "select='eq(mod(n\\,105)\\,70)',scale=270:-2,tile=7x2", "-frames:v", "1", "-q:v", "3", sheet], check=True); print("演示片：" + mp4 + "\n总览图：" + sheet)


def chrome():
    import glob
    for p in [os.environ.get("CHROME_PATH")] + sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")):
        if p and os.path.exists(p): return p
    return None


def check(video, fg, start=0):
    """五个时刻，人贴在品红底上；右边是原画面。品红里露出背景 = 多抠了；人身上透出品红 = 漏抠了。"""
    W, H, _ = probe(fg); d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fg], capture_output=True, text=True).stdout or 1)
    o = os.path.splitext(fg)[0].replace("-fg", "") + "-抠像检查.jpg"; ts = [d * k / 5 + d / 10 for k in range(5)]; parts = []; ins = []
    for i, t in enumerate(ts):
        ins += ["-ss", f"{t:.2f}", "-c:v", "libvpx-vp9", "-i", fg]; parts.append(f"color=c=0xFF00C8:s={W}x{H}[b{i}];[b{i}][{i}:v]overlay=shortest=1,scale=-2:540[v{i}]")
    fc = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(5)) + "hstack=5"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-frames:v", "1", "-q:v", "3", o], check=True); print("  检查图：" + o); return o


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("make"); p.add_argument("video"); p.add_argument("--out"); p.add_argument("--from", dest="start", type=float); p.add_argument("--to", type=float); p.add_argument("--model", choices=["fine", "fast"], default="fine"); p.add_argument("--check", action="store_true")
    p = sub.add_parser("demo"); p.add_argument("video"); p.add_argument("--from", dest="start", type=float); p.add_argument("--model", choices=["fine", "fast"], default="fine"); p.add_argument("--out", dest="demo_out")
    p = sub.add_parser("check"); p.add_argument("video"); p.add_argument("fg")
    a = ap.parse_args(); {"make": make, "demo": demo}.get(a.cmd, lambda a: check(a.video, a.fg))(a)
