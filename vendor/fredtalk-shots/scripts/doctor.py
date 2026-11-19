#!/usr/bin/env python3
"""Verify Fredtalk Shots runtime availability and exact portable-package integrity."""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
REQUIRED = (
    'SKILL.md', 'LICENSE', 'NOTICE', 'agents/openai.yaml',
    'scripts/engine.py', 'scripts/engine_selftest.py', 'scripts/bundle_selftest.py', 'scripts/report_selftest.py',
    'scripts/build_report.py', 'scripts/validate_bundle.py', 'scripts/prepare.py',
    'scripts/sample.py', 'scripts/crop_portrait.py', 'scripts/serve_report.py',
    'assets/report.css', 'assets/report.js', 'references/analysis-method.md',
    'references/prompt-method.md', 'references/engine-method.md',
    'references/report-input.schema.json',
)


def inspect_package(with_manifest=False):
    failures, runtimes = [], []
    if sys.version_info < (3, 10):
        failures.append('Python 3.10 or newer is required')
    for binary in ('python3', 'ffmpeg', 'ffprobe'):
        path = shutil.which(binary)
        if path is None:
            failures.append(f'Missing executable: {binary}')
            continue
        try:
            result = subprocess.run([path, '--version' if binary == 'python3' else '-version'],
                                    capture_output=True, text=True, check=True, timeout=15)
            runtimes.append({'name': binary, 'path': path,
                             'version': (result.stdout or result.stderr).splitlines()[0]})
        except (subprocess.SubprocessError, IndexError) as exc:
            failures.append(f'Runtime check failed for {binary}: {exc}')
    for relative in REQUIRED:
        if not (PACKAGE / relative).is_file():
            failures.append(f'Missing file: {relative}')
    actual = {}
    for path in PACKAGE.rglob('*'):
        relative = path.relative_to(PACKAGE).as_posix()
        if path.is_symlink():
            failures.append(f'Package contains a symbolic link: {relative}')
        if path.name == '__pycache__' or path.suffix == '.pyc' or path.name == '.DS_Store':
            failures.append(f'Generated residue in package: {relative}')
        if path.is_file() and relative != 'assets/manifest.json':
            actual[relative] = path
    if with_manifest:
        try:
            manifest = json.loads((PACKAGE / 'assets/manifest.json').read_text())
            records = manifest['files']
            if manifest.get('brand') != 'Fredtalk Shots' or manifest.get('version') != '2.0.0':
                failures.append('Manifest identity does not match this release')
            expected = {}
            if not isinstance(records, list):
                raise ValueError('files must be an array')
            for record in records:
                relative = record['path']
                if not isinstance(relative, str) or Path(relative).is_absolute() or '..' in Path(relative).parts:
                    raise ValueError('manifest paths must stay within package')
                if relative in expected:
                    raise ValueError(f'duplicate manifest file: {relative}')
                expected[relative] = record
            for relative in sorted(set(expected) - set(actual)):
                failures.append(f'Manifest file missing: {relative}')
            for relative in sorted(set(actual) - set(expected)):
                failures.append(f'Unlisted package file: {relative}')
            for relative in sorted(set(actual) & set(expected)):
                content = actual[relative].read_bytes()
                record = expected[relative]
                if hashlib.sha256(content).hexdigest() != record['sha256'] or len(content) != record['bytes']:
                    failures.append(f'Manifest checksum/size mismatch: {relative}')
        except (OSError, ValueError, TypeError, KeyError) as exc:
            failures.append(f'Invalid manifest: {exc}')
    return {'brand': 'Fredtalk Shots', 'version': '2.0.0', 'ok': not failures,
            'runtimes': runtimes, 'fileCount': len(actual) + int((PACKAGE / 'assets/manifest.json').is_file()),
            'failures': failures}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-manifest', action='store_true')
    result = inspect_package(parser.parse_args().verify_manifest)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(not result['ok'])


if __name__ == '__main__':
    raise SystemExit(main())
