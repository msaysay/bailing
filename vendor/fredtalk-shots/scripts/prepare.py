#!/usr/bin/env python3
"""Prepare measured source data and local media for Fredtalk Shots."""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import math
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]


def run(args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


def digest(path):
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(block)
    return hasher.hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--output-dir', required=True, type=Path)
    parser.add_argument('--title', required=True)
    parser.add_argument('--threshold', type=float, default=0.3)
    parser.add_argument('--no-preview', action='store_true')
    args = parser.parse_args()
    if not math.isfinite(args.threshold) or not 0 < args.threshold < 1:
        parser.error('Threshold must be finite and between zero and one.')
    for binary in ['ffmpeg', 'ffprobe']:
        if shutil.which(binary) is None:
            parser.error(f'Required executable not found: {binary}')
    source = args.video.resolve(strict=True)
    out = args.output_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    protected = ['shots.json', 'track.json', 'source.json', 'preview-h264.mp4', 'frames', 'sheets']
    existing = [name for name in protected if (out / name).exists()]
    if existing:
        parser.error(f'Output artifacts already exist: {existing}; choose a new output directory.')
    original = out / ('source-original' + source.suffix.lower())
    source_hash = digest(source)
    if original.exists():
        if digest(original) != source_hash:
            parser.error(f'Different media already exists: {original}')
    else:
        shutil.copy2(source, original)
    engine = str(BASE / 'scripts/engine.py')
    seed = run([sys.executable, engine, 'seed', str(original), '--track', 'track.json',
                '--title', args.title, '--threshold', str(args.threshold)],
               cwd=out, capture_output=True)
    print(seed.stderr.strip())
    doc = json.loads(seed.stdout)
    doc['source'] = original.name
    doc['report'] = {'title': args.title, 'actionLabel': '具体动作内容'}
    meta = doc['meta']
    doc['media'] = [{'src': original.name, 'label': f"原片 · {meta['width']}×{meta['height']} · {meta.get('codec', 'video')}"}]
    if not args.no_preview:
        preview = out / 'preview-h264.mp4'
        if preview.exists():
            parser.error('preview-h264.mp4 already exists; use --no-preview or a new directory.')
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-n', '-i', str(original),
             '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=min(1920\\,iw):-2',
             '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-pix_fmt', 'yuv420p',
             '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(preview)])
        doc['media'].append({'src': preview.name, 'label': '兼容预览 · H.264 / AAC'})
    for shot in doc['shots']:
        for field in ['title', 'fight', 'cameraRead', 'spatial', 'remake']:
            shot[field] = ''
        shot.update(beats=[], principalSubjects=[], backgroundSubjects=[], castPresence={})
    write_json(out / 'shots.json', doc)
    write_json(out / 'source.json', {'brand': 'Fredtalk Shots', 'originalFilename': source.name,
                                    'sha256': source_hash, 'localSource': original.name,
                                    'previewPolicy': 'H.264/AAC compatibility derivative; original unchanged'})
    run([sys.executable, engine, 'frames', 'shots.json', '--video', str(original)], cwd=out, capture_output=True)
    for pick in ['a', 'b']:
        run([sys.executable, engine, 'sheet', 'shots.json', '--cols', '4', '--rows', '6', '--pick', pick], cwd=out, capture_output=True)
    print(json.dumps({'outputDirectory': str(out), 'shots': len(doc['shots']),
                      'status': 'Measured draft prepared; visual annotation still required.'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
