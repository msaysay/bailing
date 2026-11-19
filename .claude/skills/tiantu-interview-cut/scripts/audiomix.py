"""Voice clean-up (denoise, level) and the voice + music mix. Shared by render.py and swap_bgm.py."""
import os, re, subprocess
import numpy as np
from common import SKILL, SR, run

RNN = os.path.join(SKILL, "assets", "rnnoise", "sh.rnnn")


def snr_db(pcm):
    """Rough speech-to-noise ratio of float32 stereo PCM: loud 95th percentile vs quiet 5th percentile."""
    m = pcm.mean(1)
    n = len(m) // 480
    if n < 50:
        return 99.0
    e = 20 * np.log10(np.sqrt((m[: n * 480].reshape(n, 480) ** 2).mean(1)) + 1e-3)
    return float(np.percentile(e, 95) - np.percentile(e, 5))


def denoise_chain(mode, snr):
    """ffmpeg filters for the chosen strength. auto: decide from the measured SNR."""
    if mode in (None, "auto"):
        mode = "off" if snr >= 45 else "light" if snr >= 32 else "strong"
    if mode == "off":
        return mode, []
    rnn = os.path.exists(RNN)
    esc = RNN.replace("\\", "/").replace(":", "\\:")
    if mode == "light":      # hiss / air-con: about -14 dB of noise, room stays natural
        return mode, (["arnndn=m='%s':mix=0.8" % esc] if rnn else ["afftdn=nr=20:nf=-35:tn=1"])
    # strong: warehouse hum, fans, traffic: about -20 dB (measured -41 -> -61 dB floor on the test clip)
    return mode, ["afftdn=nr=20:nf=-35:tn=1"] + (["arnndn=m='%s':mix=0.95" % esc] if rnn else ["anlmdn=s=7:p=0.002:r=0.006"])


def loudness(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + \
          ["-i", path, "-vn", "-af", "ebur128", "-f", "null", "-"]
    r = subprocess.run(cmd, stderr=subprocess.PIPE).stderr.decode("utf8", "ignore")
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
    return float(m[-1]) if m else -23.0


def clean_voice(raw_s16le, out_wav, mode="auto", talk_seconds=None):
    """raw stereo s16le @48k -> processed voice stem (wav). Returns (mode_used, snr, lufs)."""
    pcm = np.fromfile(raw_s16le, dtype=np.int16).reshape(-1, 2).astype(np.float32)
    if talk_seconds:
        pcm = pcm[: int(talk_seconds * SR)]
    snr = snr_db(pcm)
    mode, dn = denoise_chain(mode, snr)
    chain = ["highpass=f=80"] + dn + ["acompressor=threshold=-22dB:ratio=3:attack=5:release=150:makeup=2",
                                      "deesser=i=0.3", "alimiter=limit=0.9"]
    run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", raw_s16le,
         "-af", ",".join(chain), "-ar", str(SR), "-c:a", "pcm_s16le", out_wav])
    return mode, snr, loudness(out_wav, 0, talk_seconds)


def mix(voice_wav, voice_lufs, bgm, total, end_dur, out_m4a):
    """voice stem + optional music bed -> AAC. The bed sits `level` LU under the voice
    (reference film: about -13), rises 6 dB on the voiceless ending, fades out over 1.5 s."""
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", voice_wav]
    if bgm and bgm.get("src"):
        src_in = float(bgm.get("src_in", 0))
        if "gain_db" in bgm:
            g = float(bgm["gain_db"])
        else:
            g = (voice_lufs + float(bgm.get("level", -13))) - loudness(bgm["src"], src_in, 60)
        tail = max(total - end_dur, 0)
        cmd += ["-stream_loop", "-1", "-i", bgm["src"]]
        fc = ("[1:a]atrim=start=%.2f,asetpts=PTS-STARTPTS,aformat=sample_rates=%d:channel_layouts=stereo,"
              "volume='if(gte(t,%.2f),%.4f,%.4f)':eval=frame,afade=t=in:d=0.4,afade=t=out:st=%.2f:d=1.5[bg];"
              "[0:a][bg]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
              % (src_in, SR, tail, 10 ** ((g + 6) / 20), 10 ** (g / 20), max(total - 1.5, 0)))
    else:
        fc = "[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]"
    cmd += ["-filter_complex", fc, "-map", "[a]", "-t", "%.3f" % total, "-ar", str(SR), "-c:a", "aac", "-b:a", "192k", out_m4a]
    run(cmd)
