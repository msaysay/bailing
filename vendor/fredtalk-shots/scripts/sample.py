#!/usr/bin/env python3
"""Extract visible review frames with decoded PTS, including dense action ranges."""
import argparse
import json
import re
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--start', type=float, default=0)
    parser.add_argument('--end', type=float, required=True)
    parser.add_argument('--interval', type=float, default=0.5,
                        help='Seconds between frames; 0 selects every source frame in range.')
    parser.add_argument('--width', type=int, default=1280)
    args = parser.parse_args()
    if args.start < 0 or args.end <= args.start or args.interval < 0 or args.width < 16:
        parser.error('Invalid time range, interval, or image width.')
    out = args.output_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    if list(out.glob('frame-*.jpg')) or (out / 'frame-map.json').exists():
        parser.error('Review frames already exist; choose a new directory.')
    selection = f'gte(t,{args.start})*lt(t,{args.end})'
    if args.interval:
        selection += f'*if(isnan(prev_selected_t),1,gte(t-prev_selected_t,{args.interval - 0.000001}))'
    vf = f"select='{selection}',showinfo,scale={args.width}:-2"
    proc = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'info', '-n',
                           '-i', str(args.video.resolve(strict=True)), '-an',
                           '-vf', vf, '-fps_mode', 'vfr', '-q:v', '3', str(out / 'frame-%05d.jpg')],
                          text=True, capture_output=True)
    (out / 'extract.log').write_text(proc.stderr)
    if proc.returncode:
        raise SystemExit(f'Frame extraction failed; see {out / "extract.log"}')
    stamps = [float(t) for t in re.findall(r'\bn:\s*\d+.*?\bpts_time:([\d.eE+-]+)', proc.stderr)]
    files = sorted(out.glob('frame-*.jpg'))
    if len(stamps) != len(files) or not files:
        raise SystemExit(f'PTS/frame mismatch: {len(stamps)} timestamps, {len(files)} frames.')
    data = {'source': args.video.name, 'start': args.start, 'end': args.end,
            'interval': args.interval, 'timestampBasis': 'decoded source PTS from FFmpeg showinfo',
            'frames': [{'file': p.name, 'time': t} for p, t in zip(files, stamps)]}
    (out / 'frame-map.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'frameCount': len(files), 'firstPTS': stamps[0], 'lastPTS': stamps[-1],
                      'mapping': str(out / 'frame-map.json')}))


if __name__ == '__main__':
    main()
