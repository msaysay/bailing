#!/usr/bin/env python3
"""Exercise Fredtalk Shots report exports in disposable local directories."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
from bundle_selftest import inputs, SOURCE_PLACEHOLDER

OUTPUT_NAMES = ('shots-report.html', 'shots.md', 'analysis.md', 'reverse-prompts.md', 'timed-camera-prompts.md',
                'shots.json', 'analysis.json', 'reverse-prompts.json', 'timed-camera-prompts.json',
                'validation.txt', 'track.json', 'source.json', 'validation.json')


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='fredtalk-report-selftest-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        self.source = self.root / 'input'
        self.output = self.root / 'output'
        self.source.mkdir()
        self.payload = inputs()
        self.reset_source()

    def reset_source(self):
        for name, data in self.payload.items():
            (self.source / name).write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        (self.source / 'source.mkv').write_bytes(SOURCE_PLACEHOLDER)
        (self.source / 'validation.txt').write_text('✓ temporary machine fixture\nVisual review remains required.\n', encoding='utf-8')
        (self.source / 'validation.json').write_text('{"brand":"Fredtalk Shots","ok":true}', encoding='utf-8')
        pixels = b'P6\n2 2\n255\n' + bytes([127]) * 12
        for name in ('portraits/A.ppm', 'portraits/B.ppm', 'frames/S01a.jpg', 'frames/S01b.jpg', 'frames/S02a.jpg', 'frames/S02b.jpg'):
            target = self.source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(pixels)

    def build(self, output=None, input_path=None):
        result = subprocess.run([sys.executable, '-B', str(SCRIPTS / 'build_report.py'),
                                 '--input', str(input_path or self.source / 'shots.json'),
                                 '--analysis', str(self.source / 'analysis.json'),
                                 '--prompts', str(self.source / 'reverse-prompts.json'),
                                 '--camera', str(self.source / 'timed-camera-prompts.json'),
                                 '--validation', str(self.source / 'validation.txt'),
                                 '--output-dir', str(output or self.output)], text=True, capture_output=True, timeout=20)
        self.assertNotIn('Traceback', result.stderr)
        return result

    def snapshot(self):
        return {path.relative_to(self.source).as_posix(): path.read_bytes()
                for path in self.source.rglob('*') if path.is_file()}

    def test_normal_export_is_portable_and_preserves_all_inputs(self):
        before = self.snapshot()
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report['status'], 'built')
        for name in OUTPUT_NAMES:
            self.assertTrue((self.output / name).is_file(), name)
        self.assertEqual((self.output / 'source.mkv').read_bytes(), SOURCE_PLACEHOLDER)
        self.assertEqual(before, self.snapshot())
        self.assertIn('Fredtalk Shots', (self.output / 'shots-report.html').read_text(encoding='utf-8'))
        exported = json.loads((self.output / 'shots.json').read_text(encoding='utf-8'))
        self.assertEqual(exported['media'][0]['src'], 'source.mkv')
        self.assertFalse(list(self.output.glob('.fredtalk-*')))

    def test_same_directory_build_keeps_normal_source_asset(self):
        original = (self.source / 'source.mkv').read_bytes()
        result = self.build(output=self.source)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.source / 'source.mkv').read_bytes(), original)

    def test_negated_hard_cut_labels_are_continuous_inside_same_shot(self):
        for label in ('镜内连续，无硬切', '镜内连续，非硬切', 'continuous, no hard cut', 'continuous without cut'):
            with self.subTest(label=label):
                self.payload = inputs()
                self.payload['timed-camera-prompts.json']['windows'][1]['transitionLabel'] = label
                self.reset_source()
                result = self.build()
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_negated_hard_cut_does_not_satisfy_actual_source_cut(self):
        for label in ('无硬切', '非硬切', 'not cut', 'no hard cut'):
            with self.subTest(label=label):
                self.payload = inputs()
                self.payload['timed-camera-prompts.json']['windows'][2]['transitionLabel'] = label
                self.reset_source()
                result = self.build()
                self.assertEqual(result.returncode, 1)
                self.assertIn('transition', result.stderr)

    def test_exact_two_millisecond_camera_tolerance_matches_validator(self):
        plan = self.payload['timed-camera-prompts.json']
        plan['windows'][1]['end'] = 1.002
        plan['windows'][2]['start'] = 1.002
        self.reset_source()
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_every_output_symlink_is_rejected_before_any_export(self):
        for name in OUTPUT_NAMES:
            with self.subTest(output=name):
                if self.output.exists():
                    shutil.rmtree(self.output)
                self.output.mkdir()
                self.reset_source()
                before = self.snapshot()
                (self.output / name).symlink_to(self.source / ('shots.json' if name.endswith('.json') else 'source.mkv'))
                result = self.build()
                self.assertEqual(result.returncode, 1)
                self.assertIn('symlink', result.stderr)
                self.assertEqual(before, self.snapshot())
                self.assertEqual([path.name for path in self.output.iterdir()], [name])

    def test_every_asset_copy_symlink_is_rejected_before_writes(self):
        for name in ('source.mkv', 'frames/S01a.jpg', 'portraits/A.ppm'):
            with self.subTest(asset=name):
                if self.output.exists():
                    shutil.rmtree(self.output)
                self.output.mkdir()
                self.reset_source()
                before = self.snapshot()
                target = self.output / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(self.source / 'shots.json')
                result = self.build()
                self.assertEqual(result.returncode, 1)
                self.assertIn('symlink', result.stderr)
                self.assertEqual(before, self.snapshot())
                self.assertFalse((self.output / 'shots-report.html').exists())

    def test_output_parent_symlink_is_rejected(self):
        self.output.mkdir()
        (self.output / 'frames').symlink_to(self.source / 'frames', target_is_directory=True)
        before = self.snapshot()
        result = self.build()
        self.assertEqual(result.returncode, 1)
        self.assertIn('symlink', result.stderr)
        self.assertEqual(before, self.snapshot())

    def test_text_json_asset_and_evidence_hardlinks_preserve_inputs(self):
        for name, original in (('shots-report.html', 'source.mkv'), ('shots.md', 'shots.json'),
                               ('shots.json', 'shots.json'), ('frames/S01a.jpg', 'shots.json'),
                               ('track.json', 'source.mkv')):
            with self.subTest(output=name, input=original):
                if self.output.exists():
                    shutil.rmtree(self.output)
                self.output.mkdir()
                self.reset_source()
                before = self.snapshot()
                target = self.output / name
                target.parent.mkdir(parents=True, exist_ok=True)
                os.link(self.source / original, target)
                result = self.build()
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(before, self.snapshot())
                self.assertFalse(os.path.samefile(target, self.source / original))
                self.assertFalse(list(self.output.rglob('.fredtalk-*')))

    def test_resource_cannot_collide_with_reserved_report_output(self):
        (self.source / 'shots-report.html').write_bytes(SOURCE_PLACEHOLDER)
        self.payload['shots.json']['media'][0]['src'] = 'shots-report.html'
        self.reset_source()
        before = self.snapshot()
        result = self.build()
        self.assertEqual(result.returncode, 1)
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.output / 'shots-report.html').exists())

    def test_cross_role_output_cannot_overwrite_an_input_json(self):
        custom = self.source / 'analysis.md'
        custom.write_text(json.dumps(self.payload['shots.json'], ensure_ascii=False), encoding='utf-8')
        original = custom.read_bytes()
        result = self.build(output=self.source, input_path=custom)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(custom.read_bytes(), original)
        self.assertFalse((self.source / 'shots-report.html').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
