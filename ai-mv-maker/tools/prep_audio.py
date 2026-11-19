"""听歌：把一首歌变成 MV 要用的数据。

  python tools/prep_audio.py transcribe projects/我的歌            听写歌词和逐字时间 → lyrics_draft.txt
  python tools/prep_audio.py import projects/我的歌 歌词.srt        没法跑听写时：用剪映导出的 SRT 或 LRC 歌词代替
  python tools/prep_audio.py build projects/我的歌                 校对完歌词后：生成 data.js、节拍表、分场建议

可选：--model medium（模型小一点，快一点，准确率低一点；默认 large-v3）
"""
import json, os, re, sys
import numpy as np

HF_MIRROR = 'https://hf-mirror.com'


def song_path(proj):
    cfg = open(os.path.join(proj, 'config.js'), encoding='utf-8').read()
    m = re.search(r"song\s*:\s*['\"]([^'\"]+)['\"]", cfg)
    p = os.path.join(proj, m.group(1) if m else 'song.mp3')
    if not os.path.exists(p):
        sys.exit(f'找不到歌：{p}\n请把歌放进项目文件夹，并在 config.js 的 song 里写对文件名。')
    return p


def load(path, sr):
    import librosa
    try:
        y, _ = librosa.load(path, sr=sr, mono=True)
        return y
    except Exception as e:  # 少数格式 soundfile 读不了：用 ffmpeg 转一下
        import subprocess, tempfile
        ff = 'ffmpeg'
        try:
            ff = subprocess.run(['node', '-e', "console.log(require('ffmpeg-static'))"], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))).stdout.strip() or 'ffmpeg'
        except Exception:
            pass
        tmp = os.path.join(tempfile.gettempdir(), 'mv_song.wav')
        subprocess.run([ff, '-v', 'error', '-y', '-i', path, '-ac', '1', '-ar', str(sr), tmp], check=True)
        y, _ = librosa.load(tmp, sr=sr, mono=True)
        return y


def model(name):
    from faster_whisper import WhisperModel
    try:
        return WhisperModel(name, device='cpu', compute_type='int8')
    except Exception as e:
        if os.environ.get('HF_ENDPOINT'):
            raise
        print(f'模型下载失败（{str(e)[:80]}），改用国内镜像 {HF_MIRROR} 重试……')
        os.environ['HF_ENDPOINT'] = HF_MIRROR
        import importlib, huggingface_hub.constants as hc
        importlib.reload(hc)
        return WhisperModel(name, device='cpu', compute_type='int8')


def transcribe(proj, name):
    y = load(song_path(proj), 16000)
    print(f'歌长 {len(y) / 16000:.1f} 秒。加载听写模型 {name}（第一次会下载，large-v3 约 3GB）……')
    m = model(name)
    print('开始听写（4 核 CPU 一首歌约 5–10 分钟）……')
    segs, _ = m.transcribe(y.astype(np.float32), language='zh', word_timestamps=True, vad_filter=False,
                           condition_on_previous_text=False, beam_size=5, temperature=[0, .2, .4], no_speech_threshold=.9)
    raw, lines = [], []
    for s in segs:
        raw.append(dict(start=s.start, end=s.end, text=s.text, words=[(w.start, w.end, w.word) for w in s.words]))
        lines.append(f'{s.start:.2f}-{s.end:.2f} {s.text.strip()}')
        print(lines[-1], flush=True)
    json.dump(raw, open(os.path.join(proj, 'lyrics_raw.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    open(os.path.join(proj, 'lyrics_draft.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'\n已写出 lyrics_draft.txt（{len(lines)} 行）。下一步：校对歌词（改错字、删掉「作词 作曲」这类幻听行），然后跑 build。')
    print('提醒：第一句真实歌词的开始秒数，决定 config.js 的 start（往前留 1–2 秒）。不要凭感觉判断前奏多长。')


def import_timed(proj, f):
    txt = open(f, encoding='utf-8-sig').read()
    out = []
    if f.lower().endswith('.srt'):
        for blk in re.split(r'\n\s*\n', txt.strip()):
            m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)\s*\n(.+)', blk, re.S)
            if not m: continue
            g = [int(x) for x in m.groups()[:8]]
            a = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000; b = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
            out.append([a, b, ' '.join(m.group(9).split())])
    else:  # LRC：[mm:ss.xx]歌词
        for m in re.finditer(r'\[(\d+):(\d+(?:\.\d+)?)\]([^\[\n]*)', txt):
            t = int(m.group(1)) * 60 + float(m.group(2)); s = m.group(3).strip()
            if s: out.append([t, None, s])
        for i, l in enumerate(out):
            l[1] = min(out[i + 1][0] - .1, l[0] + 6) if i + 1 < len(out) else l[0] + 4
    open(os.path.join(proj, 'lyrics_draft.txt'), 'w', encoding='utf-8').write(''.join(f'{a:.2f}-{b:.2f} {s}\n' for a, b, s in out))
    print(f'已从 {os.path.basename(f)} 导入 {len(out)} 行到 lyrics_draft.txt。没有逐字时间，字会在每行内平均出现。')


def build(proj):
    import librosa
    rawp = os.path.join(proj, 'lyrics_raw.json')
    words = [w for s in json.load(open(rawp, encoding='utf-8')) for w in s['words']] if os.path.exists(rawp) else []
    lines = []
    for ln in open(os.path.join(proj, 'lyrics_draft.txt'), encoding='utf-8').read().strip().split('\n'):
        ln = ln.strip()
        if not ln or ln.startswith('#'): continue
        tt, text = ln.split(' ', 1); a, b = map(float, tt.split('-'))
        chars = [c for c in text if c != ' ']
        rc = []
        for w in [w for w in words if w[0] >= a - .3 and w[1] <= b + .3]:
            cs = [c for c in w[2].strip() if c.strip() and c not in '，。,.!?！？、']
            rc += [max(a - .1, w[0] + (w[1] - w[0]) * i / max(1, len(cs))) for i in range(len(cs))]
        ct = rc if len(rc) == len(chars) else [a + (b - a) * .8 * i / len(chars) for i in range(len(chars))]
        lines.append(dict(a=a, b=b, text=text, ct=[round(float(x), 3) for x in np.maximum.accumulate(ct)]))
    y = load(song_path(proj), 22050); sr = 22050; hop = 735  # 735 = 22050/30：每个视频帧一个值
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
    def onset(x): d = np.maximum(0, np.diff(x, prepend=x[0])); return np.clip(d / (np.percentile(d, 99) + 1e-9), 0, 1)
    def decay(x, k):
        o, v = np.zeros_like(x), 0
        for i, a in enumerate(x): v = max(a, v * k); o[i] = v
        return o
    kick = decay(onset(S[fr < 140].mean(0)), .78); hat = decay(onset(S[fr > 4000].mean(0)), .6)
    env = np.convolve(rms, np.ones(45) / 45, mode='same'); env /= env.max()
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time'); tempo = float(np.atleast_1d(tempo)[0])
    r3 = lambda a: [round(float(v), 3) for v in a]
    aud = dict(kick=r3(kick), hat=r3(hat), env=r3(env), rms=r3(rms / rms.max()), beats=r3(beats), tempo=round(tempo, 1))
    open(os.path.join(proj, 'data.js'), 'w', encoding='utf-8').write('const LY=' + json.dumps(lines, ensure_ascii=False) + ';\nconst AUD=' + json.dumps(aud) + ';\n')
    # 分场建议：按歌词把相邻几句并成一场（6–15 秒），起点吸到最近的拍子上；同时标出能量高低（副歌一般是高）
    def near_beat(t):
        if not len(beats): return t
        b = beats[np.argmin(np.abs(beats - t))]
        return float(b) if abs(b - t) < .35 else t
    sug, cur = [], None
    for l in lines:
        if cur and (l['a'] - cur['a'] > 12 or (l['a'] - cur['a'] > 6 and l['a'] - cur['last'] > 1.2)):
            sug.append(cur); cur = None
        if not cur: cur = dict(a=near_beat(l['a'] - .3), lines=[], last=l['b'])
        cur['lines'].append(l['text']); cur['last'] = l['b']
    if cur: sug.append(cur)
    out = [f'# 分场建议（{len(sug)} 场，速度约 {tempo:.0f} BPM）。能量 = 这一段的平均响度，高的一般是副歌，适合放大场面。']
    for i, s in enumerate(sug):
        e = float(env[int(s['a'] * 30):int(s['last'] * 30) + 1].mean()) if s['last'] > s['a'] else 0
        out.append(f"{i + 1:2d}. {s['a']:7.2f} 秒  能量 {'█' * int(e * 10):10s} {' / '.join(s['lines'])}")
    open(os.path.join(proj, '分场建议.txt'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    first = lines[0]['a'] if lines else 0
    print(f'{len(lines)} 行歌词，速度约 {tempo:.0f} BPM，已写出 data.js 和 分场建议.txt')
    print(f'建议 config.js：start = {max(0, first - 1.8):.1f}（第一句在 {first:.2f} 秒），end = {len(y) / sr:.1f}')


if __name__ == '__main__':
    if len(sys.argv) < 3: sys.exit(__doc__)
    cmd, proj = sys.argv[1], sys.argv[2]
    name = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'large-v3'
    if cmd == 'transcribe': transcribe(proj, name)
    elif cmd == 'import': import_timed(proj, sys.argv[3])
    elif cmd == 'build': build(proj)
    else: sys.exit(__doc__)
