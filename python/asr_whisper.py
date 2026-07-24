#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
百灵 ASR sidecar —— 本地 faster-whisper 语音识别（测试期用，零 key、可离线）。
生产期改走云端（火山/讯飞），本脚本仅作为默认兜底 provider。

用法:
    python asr_whisper.py --file audio.wav --model small --language zh
输出:
    stdout 一行 JSON: {"ok": true, "text": "...", "ms": 1234}

首次使用需安装:  pip install faster-whisper
首次运行会自动下载模型（small ~ 500MB），之后走本地缓存。
"""
import sys
import json
import time
import argparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--model", default="small")
    ap.add_argument("--language", default="zh")
    args = ap.parse_args()

    t0 = time.time()
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({
            "ok": False,
            "error": "faster-whisper 未安装，请先运行: pip install faster-whisper"
        }, ensure_ascii=False))
        sys.exit(0)

    try:
        # CPU int8 兼容性最好；有 NVIDIA GPU 可改 device="cuda", compute_type="float16"
        model = WhisperModel(args.model, device="cpu", compute_type="int8")
        segments, _info = model.transcribe(
            args.file,
            language=args.language,
            vad_filter=True,          # 自动切掉静音，等价简易 VAD
            beam_size=5,
        )
        text = "".join(seg.text for seg in segments).strip()
        print(json.dumps({
            "ok": True,
            "text": text,
            "ms": int((time.time() - t0) * 1000),
        }, ensure_ascii=False))
    except Exception as e:  # noqa
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
