#!/usr/bin/env python3
"""Record portable Fredtalk Shots package files after a verified update."""
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]


def main():
    records = []
    for path in sorted(BASE.rglob('*')):
        if not path.is_file() or path.is_symlink() or path.name in ['manifest.json', '.DS_Store'] or '__pycache__' in path.parts or path.suffix == '.pyc':
            continue
        records.append({'path': path.relative_to(BASE).as_posix(), 'bytes': path.stat().st_size,
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    data = {'brand': 'Fredtalk Shots', 'version': '2.0.0', 'files': records,
            'runtimeDependencies': {'python3': '>=3.10', 'ffmpeg': 'on PATH', 'ffprobe': 'on PATH'},
            'internalDependencies': 'All workflow scripts, report assets and references are inside this package.'}
    target = BASE / 'assets/manifest.json'
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'manifest': str(target), 'fileCount': len(records)}))


if __name__ == '__main__':
    main()
