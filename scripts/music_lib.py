#!/usr/bin/env python3
"""默认配乐库：按情绪分四组（light 轻快明亮 / calm 安静舒缓 / drive 有推进感 / warm 温暖），polish.py --music auto 从这里挑。
  scripts/music_lib.py build   建库：代码合成 8 首（不用署名），再从 incompetech 下载挑好的 11 首（CC BY 4.0，可商用但要署名）
  scripts/music_lib.py list    列出库里有什么、哪些要署名
库在 music/：music/<情绪>/*.mp3，清单 music/library.json，署名文字 music/CREDITS.txt。
合成的曲子文件名以「合成-」开头，进仓库；下载的曲子不进仓库（music/*/*.mp3 里非合成的），换机器后跑一遍 build 补回来。
想加自己的曲子：把有授权的文件放进对应情绪的目录就行，不用登记。
下载的 11 首是用访谈纪实风的 bgm_match.py 从约 1400 首里挑的：按情绪、速度、乐器筛，再听电平稳不稳、让不让人声。清单在下面 PICKS。"""
import sys as _sys
for _s in (_sys.stdout, _sys.stderr): getattr(_s, "reconfigure", lambda **k: None)(encoding="utf-8", errors="replace")
import json, os, subprocess, sys, urllib.parse, urllib.request
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); M = os.path.join(R, "music"); sys.path.insert(0, os.path.join(R, "scripts"))
MOODS = {"light": "轻快明亮：产品讲解、干货、日常", "calm": "安静舒缓：人物故事、理念、复盘", "drive": "有推进感：数据、增长、观点输出", "warm": "温暖：客户故事、服务、感谢"}
MP3 = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/"
PICKS = [
 {
  "mood": "light",
  "title": "Inspired",
  "remote": "Inspired.mp3",
  "bpm": 120.0,
  "src_in": 0.02,
  "instruments": "Guitar, Synths, Percussion",
  "credit": "\"Inspired\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Inspired.mp3"
 },
 {
  "mood": "light",
  "title": "Somewhere Sunny (ver 2)",
  "remote": "Somewhere_Sunny_ver_2.mp3",
  "bpm": 106.0,
  "src_in": 0.02,
  "instruments": "Guitar",
  "credit": "\"Somewhere Sunny (ver 2)\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Somewhere Sunny (ver 2).mp3"
 },
 {
  "mood": "light",
  "title": "Wallpaper",
  "remote": "Wallpaper.mp3",
  "bpm": 92.0,
  "src_in": 0.02,
  "instruments": "Synths, Drum Kit, Guitar",
  "credit": "\"Wallpaper\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Wallpaper.mp3"
 },
 {
  "mood": "calm",
  "title": "Sunshine (version 2)",
  "remote": "Sunshine_version_2.mp3",
  "bpm": 79.0,
  "src_in": 0.02,
  "instruments": "Guitar, Bass, Drum Kit, Piano",
  "credit": "\"Sunshine (version 2)\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Sunshine ver 2.mp3"
 },
 {
  "mood": "calm",
  "title": "Sunshine",
  "remote": "Sunshine.mp3",
  "bpm": 88.0,
  "src_in": 0.02,
  "instruments": "Guitar, Bass, Drum Kit, Piano",
  "credit": "\"Sunshine\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Sunshine A.mp3"
 },
 {
  "mood": "calm",
  "title": "Easy Lemon",
  "remote": "Easy_Lemon.mp3",
  "bpm": 82.0,
  "src_in": 0.02,
  "instruments": "Guitar, Bass, Drum Kit, Celesta, Marimba",
  "credit": "\"Easy Lemon\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Easy Lemon.mp3"
 },
 {
  "mood": "drive",
  "title": "Motivator",
  "remote": "Motivator.mp3",
  "bpm": 126.0,
  "src_in": 0.02,
  "instruments": "Bass, Drum Kit, Synths",
  "credit": "\"Motivator\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Motivator.mp3"
 },
 {
  "mood": "drive",
  "title": "Nonstop",
  "remote": "Nonstop.mp3",
  "bpm": 128.0,
  "src_in": 0.02,
  "instruments": "Guitar, Percussion, Synths",
  "credit": "\"Nonstop\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Nonstop.mp3"
 },
 {
  "mood": "drive",
  "title": "Raving Energy",
  "remote": "Raving_Energy.mp3",
  "bpm": 122.0,
  "src_in": 0.02,
  "instruments": "Synths, Percussion",
  "credit": "\"Raving Energy\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Raving Energy.mp3"
 },
 {
  "mood": "warm",
  "title": "Dream Culture",
  "remote": "Dream_Culture.mp3",
  "bpm": 70.0,
  "src_in": 0.02,
  "instruments": "Piano, Percussion",
  "credit": "\"Dream Culture\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Dream Culture.mp3"
 },
 {
  "mood": "warm",
  "title": "Gymnopedie No. 2",
  "remote": "Gymnopedie_No_2.mp3",
  "bpm": 77.0,
  "src_in": 0.02,
  "instruments": "Piano",
  "credit": "\"Gymnopedie No. 2\" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/",
  "filename": "Gymnopedie No 2.mp3"
 }
]
def ff(*a): subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *a], check=True)
def synth_all():
    import numpy as np, soundfile as sf
    from soundlib import SR, synth
    tmp = os.path.join(M, "_tmp.wav")
    def save(mood, name, sig, bpm):
        d = os.path.join(M, mood); os.makedirs(d, exist_ok=True); sf.write(tmp, sig, SR); out = os.path.join(d, f"合成-{name}.mp3")
        ff("-i", tmp, "-af", "loudnorm=I=-18:TP=-1.5,afade=t=in:d=0.5,afade=t=out:st=%.1f:d=2.5" % (len(sig) / SR - 2.5), "-c:a", "libmp3lame", "-b:a", "128k", out); return {"mood": mood, "file": f"{mood}/合成-{name}.mp3", "title": f"合成 · {name}", "bpm": bpm, "licence": "代码合成，没有版权问题，不用署名", "credit": None}
    def beat(total, bpm, notes, kick_amp=0.9, hat_amp=0.12, seed=1):
        n = int(SR * total); out = np.zeros(n); b = 60 / bpm
        def add(sig, at):
            i = int(at * SR); e = min(n, i + len(sig))
            if i < n: out[i:e] += sig[:e - i]
        def bass(f, dur, amp): m = int(dur * SR); t = np.arange(m) / SR; return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t * 2.4) * amp
        def kick(amp): m = int(0.35 * SR); t = np.arange(m) / SR; return np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 28)) / SR) * np.exp(-t * 9) * amp
        def hat(amp, s): m = int(0.05 * SR); return np.diff(np.random.default_rng(s).normal(0, 1, m) * np.exp(-np.arange(m) / SR * 90) * amp, prepend=0)
        def pluck(f, amp): m = int(0.5 * SR); t = np.arange(m) / SR; return np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * amp * np.minimum(1, t / 0.004)
        k = 0.0; i = 0
        while k < total - 0.3:
            bar = (i // 4) % len(notes); f = notes[bar]; add(kick(kick_amp), k); add(bass(f, b * 0.95, 0.3), k); add(hat(hat_amp, i + seed), k + b / 2); add(hat(hat_amp * 0.5, i + seed + 99), k + b / 4); add(hat(hat_amp * 0.5, i + seed + 199), k + 3 * b / 4)
            if (i // 16) % 2 == 1: add(pluck(f * 4 * [1, 1.25, 1.5, 1.25][i % 4], 0.10), k + b / 2)       # 每隔四小节加一层拨弦，免得太单调
            k += b; i += 1
        return np.tanh(out * 1.4)[:, None].repeat(2, 1) * 0.7
    rows = [save("warm", "钢琴暖", synth(96, "warm", 11), 78), save("warm", "钢琴暖二", synth(96, "warm", 23), 78), save("light", "钢琴轻快", synth(96, "bright", 12), 92), save("light", "钢琴轻快二", synth(96, "bright", 31), 92),
            save("calm", "钢琴沉稳", synth(96, "calm", 13), 66), save("calm", "钢琴沉稳二", synth(96, "calm", 37), 66),
            save("drive", "节奏脉冲", beat(96, 120, [55, 55, 65.4, 49]), 120), save("drive", "节奏快", beat(96, 132, [61.7, 55, 73.4, 65.4], seed=5), 132)]
    os.remove(tmp); return rows
def fetch_all():
    rows = []
    for p in PICKS:
        d = os.path.join(M, p["mood"]); os.makedirs(d, exist_ok=True); out = os.path.join(d, p["remote"]); raw = out + ".raw"
        if not os.path.exists(out):
            try:
                req = urllib.request.Request(MP3 + urllib.parse.quote(p["filename"]), headers={"User-Agent": "video-studio"})
                with urllib.request.urlopen(req, timeout=180) as r, open(raw, "wb") as fh: fh.write(r.read())
                ff("-ss", f"{p.get('src_in', 0):.2f}", "-t", "240", "-i", raw, "-af", "loudnorm=I=-18:TP=-1.5,afade=t=out:st=236:d=4", "-c:a", "libmp3lame", "-b:a", "128k", out); os.remove(raw)   # 从正式进入的地方起，最多留四分钟
            except Exception as e: print(f"  ✗ 没下到 {p['title']}：{str(e)[:80]}"); continue
        rows.append({"mood": p["mood"], "file": f"{p['mood']}/{p['remote']}", "title": p["title"], "bpm": p["bpm"], "instruments": p["instruments"], "licence": "CC BY 4.0：可商用，发布时必须署名", "credit": p["credit"]})
    return rows
def load(): return json.load(open(os.path.join(M, "library.json"), encoding="utf-8")) if os.path.exists(os.path.join(M, "library.json")) else {"tracks": []}
cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
if cmd == "build":
    os.makedirs(M, exist_ok=True); print("合成 8 首…"); rows = synth_all(); print("下载挑好的 11 首（CC BY 4.0）…"); rows += fetch_all()
    json.dump({"moods": MOODS, "tracks": rows}, open(os.path.join(M, "library.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    cr = [r["credit"] for r in rows if r["credit"]]
    open(os.path.join(M, "CREDITS.txt"), "w", encoding="utf-8").write("用了下面哪一首，就把对应那一行放进视频简介或片尾（CC BY 4.0 的要求）。文件名以「合成-」开头的不用署名。\n\n" + "\n".join(cr) + "\n")
    print(f"配乐库：{len(rows)} 首（合成 {sum(1 for r in rows if not r['credit'])}，要署名 {len(cr)}）→ music/")
lib = load()
for m, d in MOODS.items():
    rs = [r for r in lib["tracks"] if r["mood"] == m]; print(f"【{m}】{d}")
    for r in rs: print(f"   {'✓' if os.path.exists(os.path.join(M, r['file'])) else '✗'} {r['file']:44s} {str(r.get('bpm') or ''):>5} 拍/分  {'要署名' if r['credit'] else '不用署名'}")
