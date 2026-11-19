#!/usr/bin/env python3
"""Independent black-box acceptance tests for Fredtalk Shots 2.0.0.

Only the public CLI and documented data contract are exercised. All source media,
JSON documents, tracks and image outputs live in automatically removed temporary
directories. No user media, prior engine, or upstream examples are used.
"""

from __future__ import annotations

import copy
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import statistics
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True


ENGINE = Path(__file__).resolve().with_name("engine.py")
WIDTH, HEIGHT, FPS, HZ = 96, 64, 25, 8
SCENE_TEXT = [
    "装配台中央的银色底座保持朝上，两枚螺钉整齐放在右侧。",
    "透明外壳已经扣入底座边缘，蓝色指示灯映在桌面的左侧。",
    "完成的控制盒沿标尺缓慢前移，背后的测试夹具仍停在原位。",
    "红色拨杆推到终点后停住，旁边的连接线留下清晰弧形。",
    "机械臂放下最后一枚垫片，收回的夹爪露出已锁紧的螺帽。",
]


def product_doc(source: Path, duration: float = 2.0,
                cuts: tuple[float, ...] = (1.0,)) -> dict:
    """Original fictional product-assembly annotations in the public schema."""
    edges = [0.0, *cuts, duration]
    shots = []
    for index, (start, end) in enumerate(zip(edges, edges[1:]), 1):
        shot_id = f"S{index:02d}"
        span = end - start
        shots.append({
            "id": shot_id, "title": f"装配动作 {index}",
            "start": start, "end": end, "seconds": span,
            "size": "close", "category": "product", "camera": "static",
            "transitionIn": "cut", "subjects": [],
            "principalSubjects": [], "backgroundSubjects": [],
            "frame": SCENE_TEXT[(index - 1) % len(SCENE_TEXT)],
            "fight": "零件沿夹具导轨接近，接口完全贴合后停止。",
            "beats": [["可见动作", "接口贴合后保持稳定状态。"]],
            "cameraRead": "桌面标尺的位置稳定，变化来自被摄零件。",
            "spatial": "控制盒在中央，备用螺钉留在画面右侧。",
            "remake": "复刻建议：用相同夹具复现接口贴合过程。",
            "note": "虚构测试标注，仅用于结构和关系验证。",
            "audio": "静音测试源，没有可听对白。", "motion": 0.0,
            "frames": {
                "a": {"src": f"frames/{shot_id}a.jpg",
                      "time": round(start + span * .15, 2),
                      "timeBasis": "requested-seek"},
                "b": {"src": f"frames/{shot_id}b.jpg",
                      "time": round(start + span * .85, 2),
                      "timeBasis": "requested-seek"},
            },
        })
    return {
        "title": "Fredtalk 虚构产品装配实验", "source": str(source),
        "meta": {"durationSeconds": duration, "fps": float(FPS),
                 "width": WIDTH, "height": HEIGHT, "hasAudio": False,
                 "codec": "ffv1"},
        "seedCuts": list(cuts), "manualCuts": [], "removedCuts": [],
        "cast": [], "shots": shots,
    }


def track_doc(source: Path, duration: float = 2.0,
              values: list[float] | None = None) -> dict:
    count = math.ceil(duration * HZ)
    return {
        "schemaVersion": 2, "method": "fredtalk-luma-delta-v2", "hz": HZ,
        "times": [i / HZ for i in range(count)],
        "values": [0.0] * count if values is None else values,
        "durationSeconds": duration,
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    }


class EngineContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ffmpeg = shutil.which("ffmpeg")
        cls.ffprobe = shutil.which("ffprobe")
        if not cls.ffmpeg or not cls.ffprobe:
            raise RuntimeError("ffmpeg and ffprobe are required for CLI acceptance tests")
        cls.fixture_dir = tempfile.TemporaryDirectory(prefix="fredtalk-shots-v2-fixtures-")
        cls.addClassCleanup(cls.fixture_dir.cleanup)
        cls.fixture_root = Path(cls.fixture_dir.name)
        cls.constant = cls.make_media("assembly-constant", [96] * 50)
        cls.one_frame = cls.make_media("assembly-single-frame", [130])
        cls.hard_cut = cls.make_media("assembly-two-color", [0] * 25 + [255] * 25)
        cls.repeated = cls.make_media("assembly-repeated-color", [0] * 25 + [255] * 25 + [0] * 25)
        cls.changing = cls.make_media("assembly-light-sweep", [i * 4 for i in range(50)])
        cls.audio = cls.fixture_root / "assembly-tone.mkv"
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-nostdin", "-y", "-i", str(cls.constant),
            "-f", "lavfi", "-i", "sine=frequency=550:sample_rate=48000",
            "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
            "-c:a", "pcm_s16le", "-t", "2", str(cls.audio),
        ])
        cls.vfr = cls.fixture_root / "assembly-variable-cadence.mkv"
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-nostdin", "-y", "-i", str(cls.hard_cut),
            "-vf", "setpts=if(lt(N\\,25)\\,N/25/TB\\,(1+(N-25)/10)/TB)",
            "-fps_mode", "vfr", "-c:v", "ffv1", str(cls.vfr),
        ])
        flash = cls.make_media("assembly-single-bright-frame", [0] * 25 + [255] + [0] * 24)
        cls.vfr_flash = cls.fixture_root / "assembly-short-bright-shot.mkv"
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-nostdin", "-y", "-i", str(flash),
            "-vf", "setpts=if(lt(N\\,26)\\,N/25/TB\\,(N/25+0.08)/TB)",
            "-fps_mode", "vfr", "-c:v", "ffv1", str(cls.vfr_flash),
        ])
        cls.shifted = cls.fixture_root / "assembly-shifted-start.mkv"
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-nostdin", "-y", "-itsoffset", "5",
            "-i", str(cls.constant), "-map", "0:v:0", "-c:v", "copy", str(cls.shifted),
        ])
        cls.shifted_audio = cls.fixture_root / "assembly-shifted-video-with-tone.mkv"
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-nostdin", "-y", "-i", str(cls.shifted),
            "-f", "lavfi", "-i", "sine=frequency=650:sample_rate=48000",
            "-map", "0:v:0", "-map", "1:a:0", "-copyts", "-c:v", "copy",
            "-c:a", "pcm_s16le", "-t", "7", str(cls.shifted_audio),
        ])

    @classmethod
    def run_tool(cls, args: list[str], input_bytes: bytes | None = None):
        result = subprocess.run(args, input=input_bytes, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=40)
        if result.returncode:
            raise RuntimeError(f"Fixture/tool command failed ({result.returncode}): "
                               f"{result.stderr.decode(errors='replace')}")
        return result

    @classmethod
    def make_media(cls, name: str, luminance: list[int]) -> Path:
        path = cls.fixture_root / f"{name}.mkv"
        raw = b"".join(bytes([value]) * (WIDTH * HEIGHT) for value in luminance)
        cls.run_tool([
            cls.ffmpeg, "-v", "error", "-y", "-f", "rawvideo",
            "-pixel_format", "gray", "-video_size", f"{WIDTH}x{HEIGHT}",
            "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "ffv1",
            str(path),
        ], raw)
        return path

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(dir=self.fixture_root, prefix="case-")
        self.addCleanup(self.temp_dir.cleanup)
        self.root = Path(self.temp_dir.name)
        self.input = self.root / "assembly.json"
        self.track = self.root / "luma-track.json"

    def save(self, path: Path, value) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, ensure_ascii=False, allow_nan=True), encoding="utf-8")
        return path

    def load(self, path: Path):
        return json.loads(path.read_text(encoding="utf-8"))

    def cli(self, *args: object, ok: bool = True):
        result = subprocess.run([sys.executable, str(ENGINE), *map(str, args)],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, encoding="utf-8", timeout=45)
        detail = f"CLI {args!r}\nstdout: {result.stdout[:3000]}\nstderr: {result.stderr[:3000]}"
        if ok:
            self.assertEqual(result.returncode, 0, detail)
        else:
            self.assertNotEqual(result.returncode, 0, detail)
            self.assertTrue((result.stdout + result.stderr).strip(), detail)
            self.assertNotIn("Traceback (most recent call last)", result.stdout + result.stderr, detail)
        return result

    def json_cli(self, *args: object):
        result = self.cli(*args)
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            self.fail(f"CLI must emit JSON: {exc}\n{result.stdout}\n{result.stderr}")

    def seed(self, source: Path | None = None, *args: object):
        return self.json_cli("seed", source or self.hard_cut, "--track", self.track,
                             "--title", "Fredtalk 装配验证", "--threshold", ".3", *args)

    def valid_fixture(self, *, duration: float = 2.0,
                      cuts: tuple[float, ...] = (1.0,), source: Path | None = None):
        source = source or self.hard_cut
        doc = product_doc(source, duration, cuts)
        self.save(self.input, doc)
        self.save(self.track, track_doc(source, duration))
        return doc

    def validation(self, doc=None, track=None, *, frames: Path | None = None,
                   ok: bool = True, include_track: bool = True):
        if doc is not None:
            self.save(self.input, doc)
        if track is not None:
            self.save(self.track, track)
        args = ["validate", self.input, "--json"]
        if include_track:
            args += ["--track", self.track]
        if frames is not None:
            args += ["--frames", frames]
        result = self.cli(*args, ok=ok)
        try:
            payload = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            self.fail(f"validate --json must emit structured JSON: {exc}\n{result.stdout}")
        self.assertIsInstance(payload, dict)
        for key in ("ok", "errors", "warnings", "checks"):
            self.assertIn(key, payload)
        self.assertIs(payload["ok"], ok)
        self.assertIsInstance(payload["errors"], list)
        self.assertIsInstance(payload["warnings"], list)
        if ok:
            self.assertEqual(payload["errors"], [])
        else:
            self.assertTrue(payload["errors"], "invalid documents must explain their failure")
        return payload

    def assert_timeline(self, doc, cuts, duration):
        self.assertEqual(len(doc["shots"]), len(cuts) + 1)
        edges = [0.0, *cuts, duration]
        for shot, start, end in zip(doc["shots"], edges, edges[1:]):
            self.assertAlmostEqual(shot["start"], start, delta=.002)
            self.assertAlmostEqual(shot["end"], end, delta=.002)
            self.assertAlmostEqual(shot["seconds"], end - start, delta=.002)

    def assert_image(self, path: Path):
        self.assertTrue(path.is_file(), f"Missing image {path}")
        self.assertGreater(path.stat().st_size, 0)
        result = self.run_tool([
            self.ffprobe, "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "json", str(path),
        ])
        stream = json.loads(result.stdout)["streams"][0]
        self.assertGreater(stream["width"], 0)
        self.assertGreater(stream["height"], 0)
        self.run_tool([self.ffmpeg, "-v", "error", "-nostdin", "-i", str(path),
                       "-f", "null", "-"])
        return stream

    def test_version_identifies_v2(self):
        result = self.cli("--version")
        self.assertRegex(result.stdout.strip(), r"^Fredtalk Shots\s?2\.0\.0$")

    def test_seed_detects_known_one_second_hard_cut(self):
        doc = self.seed()
        self.assertEqual(doc["title"], "Fredtalk 装配验证")
        self.assertEqual(len(doc["seedCuts"]), 1)
        self.assertAlmostEqual(doc["seedCuts"][0], 1.0, delta=1 / FPS)
        self.assertEqual(doc["manualCuts"], [])
        self.assertEqual(doc["removedCuts"], [])
        self.assertEqual(doc["cast"], [])
        self.assert_timeline(doc, [1.0], 2.0)
        self.assertEqual(doc["meta"]["width"], WIDTH)
        self.assertEqual(doc["meta"]["height"], HEIGHT)
        self.assertAlmostEqual(doc["meta"]["fps"], FPS)
        self.assertIs(doc["meta"]["hasAudio"], False)
        for shot in doc["shots"]:
            self.assertEqual(shot["frame"], "", "seed must not fabricate semantic observations")

    def test_seed_constant_source_has_no_cut_or_motion(self):
        doc = self.seed(self.constant)
        self.assertEqual(doc["seedCuts"], [])
        self.assert_timeline(doc, [], 2.0)
        self.assertEqual(doc["shots"][0]["motion"], 0.0)
        self.assertTrue(all(v == 0 for v in self.load(self.track)["values"]))

    def test_seed_repeated_color_detects_both_cuts(self):
        doc = self.seed(self.repeated)
        self.assertEqual(len(doc["seedCuts"]), 2)
        for actual, expected in zip(doc["seedCuts"], [1.0, 2.0]):
            self.assertAlmostEqual(actual, expected, delta=1 / FPS)
        self.assert_timeline(doc, [1.0, 2.0], 3.0)

    def test_seed_variable_cadence_uses_decoded_cut_pts(self):
        doc = self.seed(self.vfr)
        self.assertEqual(len(doc["seedCuts"]), 1)
        self.assertAlmostEqual(doc["seedCuts"][0], 1.0, delta=.002)
        self.assertGreater(doc["meta"]["durationSeconds"], 3.0)

    def test_seed_track_schema_grid_range_and_source_hash(self):
        self.seed(self.hard_cut, "--hz", "8")
        track = self.load(self.track)
        self.assertEqual(track["schemaVersion"], 2)
        self.assertEqual(track["method"], "fredtalk-luma-delta-v2")
        self.assertEqual(track["hz"], 8)
        self.assertEqual(track["times"], [i / 8 for i in range(16)])
        self.assertEqual(len(track["times"]), len(track["values"]))
        self.assertEqual(track["values"][0], 0)
        self.assertTrue(all(math.isfinite(v) and 0 <= v <= 255 for v in track["values"]))
        self.assertAlmostEqual(track["durationSeconds"], 2.0, delta=.002)
        self.assertEqual(track["sourceSha256"], hashlib.sha256(self.hard_cut.read_bytes()).hexdigest())
        self.assertGreater(max(track["values"]), 200, "the black-to-white delta must be measured")

    def test_seed_changing_motion_matches_independent_median(self):
        doc = self.seed(self.changing)
        track = self.load(self.track)
        self.assertGreater(max(track["values"]), 0)
        for shot in doc["shots"]:
            values = [v for t, v in zip(track["times"], track["values"])
                      if shot["start"] + .5 / HZ <= t < shot["end"] - .5 / HZ]
            expected = round(statistics.median(values), 3) if values else None
            self.assertEqual(shot["motion"], expected)

    def test_seed_audio_metadata_is_measured(self):
        doc = self.seed(self.audio)
        self.assertIs(doc["meta"]["hasAudio"], True)
        self.assertAlmostEqual(doc["meta"]["durationSeconds"], 2.0, delta=.01)

    def test_seed_rejects_bad_media_and_missing_input(self):
        fake = self.root / "broken-media.mkv"
        fake.write_text("This is not media.", encoding="utf-8")
        for path in (fake, self.root / "missing.mkv", self.root):
            with self.subTest(path=path):
                self.cli("seed", path, "--track", self.track, "--title", "装配测试", ok=False)

    def test_seed_rejects_bad_thresholds_and_rates(self):
        for value in ("-0.1", "1.1", "nan", "inf", "unknown"):
            with self.subTest(threshold=value):
                self.cli("seed", self.constant, "--track", self.track,
                         "--threshold", value, ok=False)
        for value in ("0", "-8", "nan", "unknown"):
            with self.subTest(hz=value):
                self.cli("seed", self.constant, "--track", self.track, "--hz", value, ok=False)

    def test_recut_preserves_untouched_intervals_and_resets_changed_intervals(self):
        doc = self.valid_fixture(duration=3.0, cuts=(1.0, 2.0), source=self.repeated)
        doc["shots"][1]["customEvidence"] = {"fixture": "夹具编号可读"}
        self.save(self.input, doc)
        before = self.input.read_bytes()
        revised = self.json_cli("recut", self.input, "--track", self.track, "--split", ".5")
        self.assertEqual(self.input.read_bytes(), before, "recut must return a new document")
        self.assertEqual(revised["seedCuts"], [1.0, 2.0])
        self.assertEqual(revised["manualCuts"], [.5])
        self.assertEqual(revised["removedCuts"], [])
        self.assert_timeline(revised, [.5, 1.0, 2.0], 3.0)
        preserved = next(s for s in revised["shots"] if s["start"] == 1.0 and s["end"] == 2.0)
        for key, value in doc["shots"][1].items():
            if key not in {"id", "start", "end", "seconds", "motion"}:
                self.assertEqual(preserved[key], value, key)
        for shot in revised["shots"][:2]:
            for key in ("frame", "fight", "cameraRead", "spatial", "remake", "note", "audio", "rhythmNote"):
                self.assertIn(shot.get(key), (None, ""), key)
            for key in ("subjects", "principalSubjects", "backgroundSubjects", "beats"):
                self.assertEqual(shot.get(key), [], key)
            self.assertEqual(shot["frames"], {})
            self.assertEqual((shot["size"], shot["category"], shot["camera"]),
                             ("none", "subject", "static"))

    def test_recut_merge_records_removed_seed_without_mutating_seed_cuts(self):
        doc = self.valid_fixture(duration=3.0, cuts=(1.0, 2.0), source=self.repeated)
        revised = self.json_cli("recut", self.input, "--track", self.track, "--merge", "1")
        self.assertEqual(revised["seedCuts"], doc["seedCuts"])
        self.assertEqual(revised["removedCuts"], [1.0])
        self.assertEqual(revised["manualCuts"], [])
        self.assert_timeline(revised, [2.0], 3.0)
        self.assertEqual(revised["shots"][0]["frame"], "")
        self.assertEqual(revised["shots"][1]["frame"], doc["shots"][2]["frame"])

    def test_recut_repeated_split_flags_and_manual_merge(self):
        self.valid_fixture()
        revised = self.json_cli("recut", self.input, "--track", self.track,
                                "--split", ".25", "--split", "1.5")
        self.assert_timeline(revised, [.25, 1.0, 1.5], 2.0)
        self.assertEqual(revised["manualCuts"], [.25, 1.5])
        self.save(self.input, revised)
        merged = self.json_cli("recut", self.input, "--track", self.track,
                               "--merge", ".25", "--merge", "1.5")
        self.assertEqual(merged["seedCuts"], [1.0])
        self.assertEqual(merged["manualCuts"], [])
        self.assertEqual(merged["removedCuts"], [])
        self.assert_timeline(merged, [1.0], 2.0)

    def test_recut_can_restore_removed_seed_boundary(self):
        self.valid_fixture()
        merged = self.json_cli("recut", self.input, "--track", self.track, "--merge", "1")
        self.save(self.input, merged)
        restored = self.json_cli("recut", self.input, "--track", self.track, "--split", "1")
        self.assertEqual(restored["seedCuts"], [1.0])
        self.assertEqual(restored["removedCuts"], [])
        self.assertEqual(restored["manualCuts"], [])
        self.assert_timeline(restored, [1.0], 2.0)

    def test_recut_motion_excludes_boundary_samples_and_rounds_median(self):
        self.valid_fixture(cuts=(), source=self.constant)
        values = [0.0] + [round(i * 7.12345, 5) for i in range(1, 16)]
        self.save(self.track, track_doc(self.constant, values=values))
        revised = self.json_cli("recut", self.input, "--track", self.track, "--split", "1")
        self.assertEqual(revised["shots"][0]["motion"], round(statistics.median(values[1:8]), 3))
        self.assertEqual(revised["shots"][1]["motion"], round(statistics.median(values[9:16]), 3))

    def test_recut_empty_motion_window_is_null(self):
        self.valid_fixture(cuts=(), source=self.constant)
        revised = self.json_cli("recut", self.input, "--track", self.track, "--split", ".03")
        self.assertIsNone(revised["shots"][0]["motion"])
        self.assertEqual(revised["shots"][1]["motion"], 0)

    def test_recut_rejects_bad_splits_without_changing_input(self):
        self.valid_fixture()
        before = self.input.read_bytes()
        for value in ("0", "2", "-1", "3", "1", "nan", "inf", "unknown"):
            with self.subTest(split=value):
                self.cli("recut", self.input, "--track", self.track, "--split", value, ok=False)
                self.assertEqual(self.input.read_bytes(), before)
        self.cli("recut", self.input, "--track", self.track,
                 "--split", ".5", "--split", ".5", ok=False)

    def test_recut_rejects_bad_merges_and_conflicting_operations(self):
        self.valid_fixture()
        for value in ("0", "2", ".5", "-1", "nan", "unknown"):
            with self.subTest(merge=value):
                self.cli("recut", self.input, "--track", self.track, "--merge", value, ok=False)
        self.cli("recut", self.input, "--track", self.track,
                 "--merge", "1", "--merge", "1", ok=False)
        self.cli("recut", self.input, "--track", self.track,
                 "--split", ".5", "--merge", ".5", ok=False)

    def test_recut_rejects_track_from_different_source(self):
        doc = self.seed()
        self.assertEqual(doc["meta"]["sourceSha256"],
                         hashlib.sha256(self.hard_cut.read_bytes()).hexdigest())
        self.save(self.input, doc)
        track = self.load(self.track)
        track["sourceSha256"] = hashlib.sha256(self.constant.read_bytes()).hexdigest()
        self.save(self.track, track)
        before = self.input.read_bytes()
        self.cli("recut", self.input, "--track", self.track, "--split", ".5", ok=False)
        self.assertEqual(self.input.read_bytes(), before)

    def test_validate_accepts_complete_fictional_fixture(self):
        self.valid_fixture()
        self.validation()

    def test_validate_human_output_and_optional_checks(self):
        self.valid_fixture()
        result = self.cli("validate", self.input)
        self.assertTrue(result.stdout.strip())
        self.assertNotIn("Traceback", result.stdout)
        payload = self.validation(include_track=False)
        self.assertTrue(payload["checks"], "checks must describe performed or skipped work")

    def test_validate_rejects_missing_supplied_paths(self):
        self.valid_fixture()
        self.cli("validate", self.input, "--track", self.root / "missing.json", ok=False)
        self.cli("validate", self.input, "--frames", self.root / "missing-frames", ok=False)

    def test_validate_rejects_nonfinite_or_nonpositive_metadata(self):
        baseline = self.valid_fixture()
        for key, bad in (("durationSeconds", 0), ("durationSeconds", float("nan")),
                         ("fps", 0), ("fps", float("inf")), ("width", -1),
                         ("height", 0), ("width", True), ("hasAudio", "false")):
            with self.subTest(field=key, value=bad):
                doc = copy.deepcopy(baseline)
                doc["meta"][key] = bad
                self.validation(doc, ok=False)

    def test_validate_rejects_gaps_overlaps_duration_errors_and_nonfinite_times(self):
        baseline = self.valid_fixture()
        mutations = [
            (0, "start", .01), (0, "end", .95), (1, "start", .95),
            (1, "end", 2.01), (0, "seconds", .8), (0, "end", 0),
            (0, "start", float("nan")), (1, "seconds", float("inf")),
        ]
        for index, key, value in mutations:
            with self.subTest(shot=index, field=key, value=value):
                doc = copy.deepcopy(baseline)
                doc["shots"][index][key] = value
                self.validation(doc, ok=False)

    def test_validate_timeline_tolerance_accepts_small_rounding(self):
        doc = self.valid_fixture()
        doc["shots"][0]["end"] = 1.0005
        doc["shots"][0]["seconds"] = 1.0005
        doc["shots"][1]["start"] = 1.0005
        doc["shots"][1]["seconds"] = .9995
        self.validation(doc)

    def test_validate_rejects_duplicate_or_empty_ids(self):
        baseline = self.valid_fixture()
        for value in ("S01", "", None, 42):
            with self.subTest(id=value):
                doc = copy.deepcopy(baseline)
                doc["shots"][1]["id"] = value
                self.validation(doc, ok=False)

    def test_validate_rejects_unknown_enums(self):
        baseline = self.valid_fixture()
        for key, value in (("size", "macro-ish"), ("category", "advertorial"),
                           ("camera", "super-pan"), ("transitionIn", "jump-flash"),
                           ("rhythm", "urgent")):
            with self.subTest(field=key):
                doc = copy.deepcopy(baseline)
                doc["shots"][0][key] = value
                self.validation(doc, ok=False)

    def test_validate_description_language_lengths_and_consecutive_uniqueness(self):
        baseline = self.valid_fixture()
        for text in ("零件靠近", "The assembly box stops.", "", 15):
            with self.subTest(frame=text):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["frame"] = text
                self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["frame"] = "The silver assembly box settles beside three screws on the marked workbench."
        self.validation(doc)
        doc = copy.deepcopy(baseline)
        doc["shots"][1]["frame"] = doc["shots"][0]["frame"]
        self.validation(doc, ok=False)

    def test_validate_cast_relations_are_known_and_consistent(self):
        baseline = self.valid_fixture()
        person = {"id": "C01", "name": "蓝袖装配员", "note": "左袖有可见黄色条纹。",
                  "entityType": "character", "portrait": "frames/S01a.jpg", "portraitTime": .15}
        baseline["cast"] = [person]
        baseline["shots"][0]["subjects"] = ["C01"]
        baseline["shots"][0]["principalSubjects"] = ["C01"]
        self.validation(baseline)
        cases = [
            ("subjects", ["C99"]), ("principalSubjects", ["C99"]),
            ("backgroundSubjects", ["C99"]), ("castPresence", {"C99": "screen-left"}),
            ("subjects", ["C01", "C01"]), ("backgroundSubjects", ["C01"]),
        ]
        for key, value in cases:
            with self.subTest(field=key, value=value):
                doc = copy.deepcopy(baseline)
                doc["shots"][0][key] = value
                self.validation(doc, ok=False)
        for bad in ({**person, "entityType": "robot"}, {**person, "id": ""}):
            doc = copy.deepcopy(baseline)
            doc["cast"][0] = bad
            self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["cast"].append(copy.deepcopy(person))
        self.validation(doc, ok=False)

    def test_validate_category_requires_appropriate_evidence(self):
        baseline = self.valid_fixture()
        for category in ("dialogue", "reaction", "text-card", "pov", "archive"):
            with self.subTest(category=category):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["category"] = category
                doc["shots"][0]["audio"] = ""
                doc["shots"][0]["note"] = ""
                self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["cast"] = [{"id": "C01", "name": "蓝袖装配员", "note": "左袖有黄色条纹。",
                        "entityType": "character", "portrait": "frames/S01a.jpg", "portraitTime": .15}]
        doc["shots"][0]["category"] = "empty"
        doc["shots"][0]["subjects"] = ["C01"]
        self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["category"] = "text-card"
        doc["shots"][0]["onscreenText"] = "装配完成：接口已锁定"
        self.validation(doc)
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["category"] = "dialogue"
        doc["shots"][0]["audio"] = "画面字幕：‘接口已锁定’；仅按可见字幕记录。"
        self.validation(doc)
        for category, note in (
                ("pov", "装配员眼睛所在高度与夹具视线吻合，前镜可见其向下观察。"),
                ("archive", "左上角画中画引用先前的夹具测试片段，边框标注回放。")):
            with self.subTest(evidence=category):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["category"] = category
                doc["shots"][0]["note"] = note
                self.validation(doc)

    def test_validate_rhythm_is_all_or_none_with_meaningful_notes(self):
        baseline = self.valid_fixture()
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["rhythm"] = "setup"
        doc["shots"][0]["rhythmNote"] = "零件位置先完整展示，为后续接口贴合建立空间关系。"
        self.validation(doc, ok=False)
        doc["shots"][1]["rhythm"] = "payoff"
        doc["shots"][1]["rhythmNote"] = "外壳扣紧的可见结果兑现装配目标，指示灯让结果可读。"
        self.validation(doc)
        for bad in ("", "N/A", "TODO", None):
            with self.subTest(note=bad):
                changed = copy.deepcopy(doc)
                changed["shots"][1]["rhythmNote"] = bad
                self.validation(changed, ok=False)
        # A structural validator cannot infer semantic quality from a length cutoff.
        short_note = copy.deepcopy(doc)
        short_note["shots"][1]["rhythmNote"] = "好"
        self.validation(short_note)

    def test_validate_reconstructs_boundaries_from_provenance(self):
        baseline = self.valid_fixture()
        for key, value in (("seedCuts", []), ("seedCuts", [1, 1]),
                           ("manualCuts", [.5]), ("removedCuts", [1]),
                           ("removedCuts", [.5]), ("seedCuts", [0]),
                           ("manualCuts", [2]), ("manualCuts", [float("nan")])):
            with self.subTest(field=key, value=value):
                doc = copy.deepcopy(baseline)
                doc[key] = value
                self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["seedCuts"] = [.5, 1]
        doc["removedCuts"] = [.5]
        self.validation(doc)
        doc["seedCuts"] = [.5]
        doc["manualCuts"] = [1]
        self.validation(doc)

    def test_validate_rejects_boundary_drift_even_with_consistent_durations(self):
        doc = self.valid_fixture()
        doc["shots"][0]["end"] = 1.015
        doc["shots"][0]["seconds"] = 1.015
        doc["shots"][1]["start"] = 1.015
        doc["shots"][1]["seconds"] = .985
        self.validation(doc, ok=False)

    def test_validate_motion_matches_track_with_tolerance(self):
        baseline = self.valid_fixture()
        for bad in (.01, -1, 300, "zero", float("nan"), None):
            with self.subTest(motion=bad):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["motion"] = bad
                self.validation(doc, ok=False)
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["motion"] = .001
        self.validation(doc)

    def test_validate_track_schema_method_rate_and_duration(self):
        self.valid_fixture()
        baseline = self.load(self.track)
        for key, bad in (("schemaVersion", 1), ("method", "legacy-motion"),
                         ("hz", 0), ("hz", float("nan")), ("hz", "8"),
                         ("durationSeconds", 1.8), ("durationSeconds", float("inf")),
                         ("sourceSha256", "not-a-sha256")):
            with self.subTest(field=key, value=bad):
                track = copy.deepcopy(baseline)
                track[key] = bad
                self.validation(track=track, ok=False)

    def test_validate_track_rejects_empty_count_grid_order_and_coverage(self):
        self.valid_fixture()
        baseline = self.load(self.track)
        cases = []
        empty = copy.deepcopy(baseline); empty["times"] = []; empty["values"] = []; cases.append(("empty", empty))
        count = copy.deepcopy(baseline); count["values"].pop(); cases.append(("count", count))
        coverage = copy.deepcopy(baseline); coverage["times"] = coverage["times"][:-2]; coverage["values"] = coverage["values"][:-2]; cases.append(("coverage", coverage))
        origin = copy.deepcopy(baseline); origin["times"][0] = .01; cases.append(("origin", origin))
        grid = copy.deepcopy(baseline); grid["times"][5] += .01; cases.append(("grid", grid))
        duplicate = copy.deepcopy(baseline); duplicate["times"][5] = duplicate["times"][4]; cases.append(("duplicate", duplicate))
        nan_time = copy.deepcopy(baseline); nan_time["times"][5] = float("nan"); cases.append(("nonfinite", nan_time))
        extra = copy.deepcopy(baseline); extra["times"].append(2.0); extra["values"].append(0); cases.append(("past-end", extra))
        for name, track in cases:
            with self.subTest(case=name):
                self.validation(track=track, ok=False)

    def test_validate_track_rejects_bad_value_ranges_and_first_delta(self):
        self.valid_fixture()
        baseline = self.load(self.track)
        for index, bad in ((0, 1), (5, -1), (5, 256), (5, float("nan")),
                           (5, float("inf")), (5, "0"), (5, True)):
            with self.subTest(index=index, value=bad):
                track = copy.deepcopy(baseline)
                track["values"][index] = bad
                self.validation(track=track, ok=False)

    def test_frames_default_samples_are_readable_and_validate(self):
        self.valid_fixture()
        self.cli("frames", self.input, "--video", self.hard_cut)
        doc = self.load(self.input)
        for shot in doc["shots"]:
            for pick, fraction in (("a", .15), ("b", .85)):
                frame = shot["frames"][pick]
                self.assertEqual(frame["src"], f"frames/{shot['id']}{pick}.jpg")
                self.assertEqual(frame["timeBasis"], "requested-seek")
                self.assertAlmostEqual(frame["time"], round(shot["start"] + shot["seconds"] * fraction, 2))
                dimensions = self.assert_image(self.root / frame["src"])
                self.assertEqual((dimensions["width"], dimensions["height"]), (WIDTH, HEIGHT))
        self.validation(frames=self.root / "frames")

    def test_frames_reject_video_different_from_measured_source(self):
        doc = self.seed()
        self.save(self.input, doc)
        before = self.input.read_bytes()
        self.cli("frames", self.input, "--video", self.constant, ok=False)
        self.assertEqual(self.input.read_bytes(), before)
        self.assertFalse((self.root / "frames").exists())

    def test_frames_fill_empty_declarations_at_fifteen_and_eighty_five_percent(self):
        doc = self.valid_fixture()
        for shot in doc["shots"]:
            shot["frames"] = {}
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.hard_cut)
        revised = self.load(self.input)
        self.assertEqual(revised["shots"][0]["frames"]["a"]["time"], .15)
        self.assertEqual(revised["shots"][0]["frames"]["b"]["time"], .85)
        self.assertEqual(revised["shots"][1]["frames"]["a"]["time"], 1.15)
        self.assertEqual(revised["shots"][1]["frames"]["b"]["time"], 1.85)

    def test_frames_respect_declared_safe_local_paths_and_times(self):
        doc = self.valid_fixture()
        doc["shots"][0]["frames"]["a"] = {
            "src": "frames/detail/assembly-a.jpg", "time": .25, "timeBasis": "requested-seek"}
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.hard_cut)
        revised = self.load(self.input)
        self.assertEqual(revised["shots"][0]["frames"]["a"]["time"], .25)
        self.assertEqual(revised["shots"][0]["frames"]["a"]["src"], "frames/detail/assembly-a.jpg")
        self.assert_image(self.root / "frames/detail/assembly-a.jpg")

    def test_single_frame_short_source_has_two_images_and_replayable_seek_times(self):
        doc = self.valid_fixture(duration=1 / FPS, cuts=(), source=self.one_frame)
        doc["shots"][0]["motion"] = None
        doc["shots"][0]["frames"] = {}
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.one_frame)
        revised = self.load(self.input)
        for pick in ("a", "b"):
            frame = revised["shots"][0]["frames"][pick]
            self.assertGreaterEqual(frame["time"], 0)
            self.assertLess(frame["time"], 1 / FPS)
            self.assertEqual(frame["timeBasis"], "requested-seek")
            self.assert_image(self.root / frame["src"])
            replay = self.root / f"short-source-replay-{pick}.jpg"
            self.run_tool([
                self.ffmpeg, "-v", "error", "-nostdin", "-y", "-ss", str(frame["time"]),
                "-i", str(self.one_frame), "-frames:v", "1", str(replay),
            ])
            self.assert_image(replay)
        self.validation(frames=self.root / "frames")

    def test_decoded_pts_requires_actual_decode_evidence(self):
        self.valid_fixture()
        self.cli("frames", self.input, "--video", self.hard_cut)
        baseline = self.load(self.input)
        doc = copy.deepcopy(baseline)
        frame = doc["shots"][0]["frames"]["a"]
        frame["time"] = .16
        frame["timeBasis"] = "decoded-pts"
        frame.pop("decodedEvidence", None)
        self.validation(doc, frames=self.root / "frames", ok=False)
        result = subprocess.run([
            self.ffmpeg, "-v", "info", "-nostdin", "-i", str(self.hard_cut),
            "-vf", "select=eq(n\\,4),showinfo", "-frames:v", "1", "-f", "null", "-",
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)
        evidence = next((line for line in result.stderr.splitlines()
                         if "showinfo" in line and "pts_time:0.16" in line), None)
        self.assertIsNotNone(evidence, result.stderr)
        frame["decodedEvidence"] = {
            "method": "ffmpeg-showinfo", "ptsTime": .16, "log": evidence,
        }
        self.validation(doc, frames=self.root / "frames")
        frame["decodedEvidence"]["ptsTime"] = .20
        self.validation(doc, frames=self.root / "frames", ok=False)

    def test_vfr_single_bright_shot_never_extracts_next_black_shot(self):
        doc = self.seed(self.vfr_flash)
        self.assertAlmostEqual(doc["meta"]["durationSeconds"], 2.08, delta=.002)
        self.assertEqual(doc["seedCuts"], [1.0])
        self.save(self.input, doc)
        doc = self.json_cli("recut", self.input, "--track", self.track, "--split", "1.12")
        self.assert_timeline(doc, [1.0, 1.12], 2.08)
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.vfr_flash)
        bright = self.load(self.input)["shots"][1]
        for pick in ("a", "b"):
            frame = bright["frames"][pick]
            self.assertAlmostEqual(frame["decodedEvidence"]["ptsTime"], 1.0, delta=1e-6)
            pixels = self.run_tool([
                self.ffmpeg, "-v", "error", "-nostdin", "-i", str(self.root / frame["src"]),
                "-frames:v", "1", "-pix_fmt", "gray", "-f", "rawvideo", "pipe:1",
            ]).stdout
            self.assertTrue(pixels)
            self.assertGreaterEqual(statistics.mean(pixels), 250, "the decoded frame must be white")

    def test_no_fresh_frame_request_keeps_existing_json_and_all_images(self):
        doc = self.seed(self.vfr_flash)
        self.save(self.input, doc)
        doc = self.json_cli("recut", self.input, "--track", self.track, "--split", "1.12")
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.vfr_flash)
        doc = self.load(self.input)
        doc["shots"][-1]["frames"]["b"]["time"] = 2.079
        self.save(self.input, doc)
        before_json = self.input.read_bytes()
        before_images = {path: hashlib.sha256(path.read_bytes()).hexdigest()
                         for path in (self.root / "frames").glob("*.jpg")}
        result = self.cli("frames", self.input, "--video", self.vfr_flash, ok=False)
        self.assertIn("No fresh decoded frame", result.stderr)
        self.assertEqual(self.input.read_bytes(), before_json)
        self.assertEqual({path: hashlib.sha256(path.read_bytes()).hexdigest()
                          for path in (self.root / "frames").glob("*.jpg")}, before_images)

    def test_frame_hardlink_is_replaced_without_changing_source(self):
        source = self.root / "protected-source.mkv"
        shutil.copyfile(self.hard_cut, source)
        doc = self.seed(source)
        self.save(self.input, doc)
        target = self.root / "frames/S01a.jpg"
        target.parent.mkdir()
        os.link(source, target)
        before = source.read_bytes()
        self.assertEqual(source.stat().st_ino, target.stat().st_ino)
        self.cli("frames", self.input, "--video", source)
        self.assertEqual(source.read_bytes(), before)
        self.assertNotEqual(source.stat().st_ino, target.stat().st_ino)
        self.assert_image(target)

    def test_nonzero_source_pts_normalizes_duration_track_and_frame_evidence(self):
        seed = self.seed(self.shifted)
        self.assert_timeline(seed, [], 2.0)
        self.assertEqual(len(self.load(self.track)["times"]), 16)
        doc = product_doc(self.shifted, 2.0, ())
        doc["meta"] = seed["meta"]
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.shifted)
        revised = self.load(self.input)
        for frame in revised["shots"][0]["frames"].values():
            evidence = frame["decodedEvidence"]
            self.assertEqual(evidence["sourceStartPtsTime"], 5.0)
            self.assertGreaterEqual(evidence["ptsTime"], 0)
            self.assertLess(evidence["ptsTime"], 2.0)
            raw_time = evidence["pts"] * evidence["timeBase"]["num"] / evidence["timeBase"]["den"]
            self.assertAlmostEqual(raw_time, evidence["ptsTime"] + 5.0, delta=1e-6)
            self.assert_image(self.root / frame["src"])
        self.validation(frames=self.root / "frames")

    def test_video_start_offset_from_audio_uses_correct_input_seek(self):
        seed = self.seed(self.shifted_audio)
        self.assert_timeline(seed, [], 2.0)
        self.assertIs(seed["meta"]["hasAudio"], True)
        self.assertEqual(len(self.load(self.track)["times"]), 16)
        doc = product_doc(self.shifted_audio, 2.0, ())
        doc["meta"] = seed["meta"]
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.shifted_audio)
        frame = self.load(self.input)["shots"][0]["frames"]["a"]
        evidence = frame["decodedEvidence"]
        self.assertEqual(evidence["sourceStartPtsTime"], 5.0)
        self.assertAlmostEqual(evidence["inputSeekTime"], frame["time"] + 5.0, delta=1e-6)
        self.assertGreaterEqual(evidence["ptsTime"], frame["time"])
        self.assertLess(evidence["ptsTime"], frame["time"] + 1 / FPS + 1e-6)
        self.validation(frames=self.root / "frames")

    def test_frames_and_validate_reject_outside_timestamps(self):
        self.valid_fixture()
        self.cli("frames", self.input, "--video", self.hard_cut)
        baseline = self.load(self.input)
        for bad in (-.1, 1.0, 1.5, float("nan"), "0.2"):
            with self.subTest(time=bad):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["frames"]["a"]["time"] = bad
                self.validation(doc, frames=self.root / "frames", ok=False)
                self.cli("frames", self.input, "--video", self.hard_cut, ok=False)

    def test_frames_and_validate_reject_traversal_and_absolute_paths(self):
        self.valid_fixture()
        self.cli("frames", self.input, "--video", self.hard_cut)
        baseline = self.load(self.input)
        outside = self.root.parent / f"{self.root.name}-escaped.jpg"
        for bad in ("../escaped.jpg", "frames/../../escaped.jpg", str(outside),
                    "https://example.invalid/frame.jpg", "frames\\..\\escaped.jpg"):
            with self.subTest(path=bad):
                doc = copy.deepcopy(baseline)
                doc["shots"][0]["frames"]["a"]["src"] = bad
                self.validation(doc, frames=self.root / "frames", ok=False)
                self.cli("frames", self.input, "--video", self.hard_cut, ok=False)
                self.assertFalse(outside.exists())

    def test_validate_rejects_missing_frame_files_and_invalid_time_basis(self):
        baseline = self.valid_fixture()
        frame_root = self.root / "frames"
        frame_root.mkdir()
        self.validation(frames=frame_root, ok=False)
        self.save(self.input, baseline)
        self.cli("frames", self.input, "--video", self.hard_cut)
        doc = copy.deepcopy(baseline)
        doc["shots"][0]["frames"]["a"]["timeBasis"] = "guessed-pts"
        self.validation(doc, frames=frame_root, ok=False)

    def test_sheet_paginates_both_frame_selections(self):
        doc = self.valid_fixture(cuts=(.4, .8, 1.2, 1.6))
        doc["seedCuts"] = []
        doc["manualCuts"] = [.4, .8, 1.2, 1.6]
        self.save(self.input, doc)
        self.cli("frames", self.input, "--video", self.hard_cut)
        for pick in ("a", "b"):
            with self.subTest(pick=pick):
                self.cli("sheet", self.input, "--cols", "2", "--rows", "2", "--pick", pick)
                pages = sorted((self.root / "sheets").glob(f"{pick}-*.jpg"))
                self.assertEqual([p.name for p in pages], [f"{pick}-01.jpg", f"{pick}-02.jpg"])
                for page in pages:
                    self.assert_image(page)

    def test_sheet_rejects_bad_geometry_pick_and_missing_frames(self):
        self.valid_fixture()
        for flags in (("--cols", "0"), ("--rows", "-1"), ("--pick", "c"),
                      ("--cols", "two")):
            with self.subTest(flags=flags):
                self.cli("sheet", self.input, *flags, ok=False)
        self.cli("sheet", self.input, "--pick", "a", ok=False)

    def test_cli_rejects_malformed_json_and_unexpected_types_cleanly(self):
        for value in (None, [], "assembly", 42, {"meta": [], "shots": {}},
                      {"meta": {}, "shots": [None]}):
            with self.subTest(value=value):
                self.save(self.input, value)
                for command in ("validate", "recut", "frames", "sheet"):
                    extra = ["--video", self.hard_cut] if command == "frames" else []
                    self.cli(command, self.input, *extra, ok=False)
        self.input.write_text('{"meta":', encoding="utf-8")
        for command in ("validate", "recut", "frames", "sheet"):
            self.cli(command, self.input, ok=False)
        self.valid_fixture()
        for value in (None, [], {"times": {}, "values": []}):
            self.save(self.track, value)
            self.validation(ok=False)
        self.track.write_text("{broken", encoding="utf-8")
        self.validation(ok=False)

    def test_cli_rejects_unknown_commands_options_and_missing_required_arguments(self):
        for args in ((), ("unknown",), ("seed",), ("frames",),
                     ("seed", self.constant, "--unexpected-option"),
                     ("validate", self.input, "--unexpected-option"),
                     ("recut", self.input, "--split")):
            with self.subTest(args=args):
                self.cli(*args, ok=False)


if __name__ == "__main__":
    unittest.main(verbosity=2)
