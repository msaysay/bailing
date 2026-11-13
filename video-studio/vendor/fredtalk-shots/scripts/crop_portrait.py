#!/usr/bin/env python3
"""Crop a verified character region from the source video without inventing a portrait."""
import argparse
import json
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--time', type=float, required=True)
    parser.add_argument('--box', type=int, nargs=4, metavar=('X', 'Y', 'WIDTH', 'HEIGHT'), required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source = args.video.resolve(strict=True)
    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                                     '-of', 'json', str(source)], check=True, text=True,
                                    capture_output=True).stdout)
    stream = next(s for s in info['streams'] if s['codec_type'] == 'video')
    width, height = stream['width'], stream['height']
    x, y, crop_width, crop_height = args.box
    if args.time < 0 or args.time >= float(info['format']['duration']):
        parser.error('Portrait time outside source duration')
    if min(x, y) < 0 or min(crop_width, crop_height) < 1 or x + crop_width > width or y + crop_height > height:
        parser.error('Crop box outside source pixel dimensions')
    if args.output.exists():
        parser.error('Portrait already exists; choose a new path to preserve the existing crop')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-n', '-noautorotate',
                    '-ss', str(args.time), '-i', str(source), '-frames:v', '1',
                    '-vf', f'crop={crop_width}:{crop_height}:{x}:{y}:exact=1,scale=640:-2',
                    '-q:v', '2', str(args.output)], check=True)
    print(json.dumps({'portrait': args.output.as_posix(), 'portraitTime': args.time,
                      'portraitSource': {'width': width, 'height': height,
                                         'coordinateBasis': 'source pixels without auto rotation',
                                         'crop': {'x': x, 'y': y, 'width': crop_width, 'height': crop_height}}},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
