"""把一首歌变成 MV 用的两份数据：歌词逐字时间（lyrics.json）和节拍/响度（audio.json），再拼成 data.js。

用法（在 template 目录里跑）：
  pip install faster-whisper librosa soundfile numpy
  python3 prep_audio.py transcribe song.mp3          # 第一步：听写歌词 → lyrics_raw.json、lyrics_draft.txt
  # 人工或让 AI 校对 lyrics_draft.txt：每行「开始-结束 歌词」，改错字、删掉作词作曲等杂行
  python3 prep_audio.py build song.mp3 lyrics_draft.txt   # 第二步：生成 lyrics.json、audio.json、data.js

说明：
- 听写用 Whisper large-v3（CPU 可跑，4 核约 5 分钟一首）。音乐伴奏会干扰识别，常见错字要人工对一遍。
- 不要给 Whisper 加 initial_prompt：它会把前奏「幻听」成作词作曲的循环。
- 每行歌词的逐字时间优先取 Whisper 的词时间；字数对不上时按行内均分兜底。
"""
import json, sys
import numpy as np


def transcribe(song):
    import soundfile as sf, subprocess
    from faster_whisper import WhisperModel
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', song, '-ac', '1', '-ar', '16000', 'song16.wav'], check=True)
    aud, _ = sf.read('song16.wav', dtype='float32')
    m = WhisperModel('large-v3', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(aud, language='zh', word_timestamps=True, vad_filter=False,
                           condition_on_previous_text=False, beam_size=5, temperature=[0, .2, .4], no_speech_threshold=.9)
    out, lines = [], []
    for s in segs:
        out.append(dict(start=s.start, end=s.end, text=s.text, words=[(w.start, w.end, w.word) for w in s.words]))
        lines.append(f'{s.start:.2f}-{s.end:.2f} {s.text.strip()}')
        print(lines[-1], flush=True)
    json.dump(out, open('lyrics_raw.json', 'w'), ensure_ascii=False)
    open('lyrics_draft.txt', 'w').write('\n'.join(lines) + '\n')
    print('\n已写出 lyrics_draft.txt：请校对歌词后跑 build。第一句人声从哪一秒开始，决定 MV 从哪里切。')


def build(song, draft):
    import librosa
    raw = json.load(open('lyrics_raw.json'))
    words = [w for s in raw for w in s['words']]
    lines = []
    for ln in open(draft).read().strip().split('\n'):
        tt, text = ln.split(' ', 1); a, b = map(float, tt.split('-'))
        chars = [c for c in text if c != ' ']
        rc = []
        for w in [w for w in words if w[0] >= a - .3 and w[1] <= b + .3]:
            cs = [c for c in w[2].strip() if c.strip()]
            rc += [max(a - .1, w[0] + (w[1] - w[0]) * i / max(1, len(cs))) for i in range(len(cs))]
        ct = rc if len(rc) == len(chars) else [a + (b - a) * .8 * i / len(chars) for i in range(len(chars))]
        lines.append(dict(a=a, b=b, text=text, ct=[round(float(x), 3) for x in np.maximum.accumulate(ct)]))
    json.dump(lines, open('lyrics.json', 'w'), ensure_ascii=False)

    y, sr = librosa.load(song, sr=22050, mono=True); hop = 735  # 735 = 22050/30，一帧一个值
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); fr = librosa.fft_frequencies(sr=sr, n_fft=2048)
    def onset(x): d = np.maximum(0, np.diff(x, prepend=x[0])); return np.clip(d / (np.percentile(d, 99) + 1e-9), 0, 1)
    def decay(x, k):
        o, v = np.zeros_like(x), 0
        for i, a in enumerate(x): v = max(a, v * k); o[i] = v
        return o
    kick = decay(onset(S[fr < 140].mean(0)), .78); hat = decay(onset(S[fr > 4000].mean(0)), .6)
    env = np.convolve(rms, np.ones(45) / 45, mode='same'); env /= env.max()
    _, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
    r3 = lambda a: [round(float(v), 3) for v in a]
    json.dump(dict(kick=r3(kick), hat=r3(hat), env=r3(env), rms=r3(rms / rms.max()), beats=r3(beats)), open('audio.json', 'w'))
    open('data.js', 'w').write('const LY=' + open('lyrics.json').read() + ';\nconst AUD=' + open('audio.json').read() + ';')
    print(f'{len(lines)} 行歌词，{len(rms)} 帧音频特征，已写出 data.js')


if __name__ == '__main__':
    if sys.argv[1] == 'transcribe': transcribe(sys.argv[2])
    else: build(sys.argv[2], sys.argv[3])
