#!/usr/bin/env python3
"""Black-box Fredtalk Shots bundle checks; all fixtures live in temporary directories."""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
SCRIPTS = Path(__file__).resolve().parent
SOURCE_PLACEHOLDER = b"temporary local source placeholder for the isolated extended validator"
FIXTURE_HASH = hashlib.sha256(SOURCE_PLACEHOLDER).hexdigest()
STUB_ENGINE = '''import json, sys
from pathlib import Path
root = Path(sys.argv[2]).parent
(root / "engine-call.json").write_text(json.dumps(sys.argv[1:]), encoding="utf-8")
config = json.loads((root / "engine-result.json").read_text(encoding="utf-8"))
print(config.get("rawOutput", json.dumps(config["report"], ensure_ascii=False)))
sys.exit(config.get("exitCode", 0))
'''


def inputs():
    cast = [
        {"id": "A", "name": "人物甲", "note": "白色上衣，蓝色裤子", "entityType": "character",
         "portrait": "portraits/A.ppm", "portraitTime": 0.3,
         "portraitSource": {"width": 96, "height": 64, "coordinateBasis": "source pixels without auto rotation",
                            "crop": {"x": 10, "y": 8, "width": 30, "height": 40}}},
        {"id": "B", "name": "背景观察者", "note": "穿黑色外套的两位观察者", "entityType": "group",
         "portrait": "portraits/B.ppm", "portraitTime": 1.5},
    ]
    shots = []
    for index in range(2):
        shot_id = f"S{index + 1:02}"
        shots.append({"id": shot_id, "start": index, "end": index + 1, "seconds": 1,
                      "title": f"动作阶段 {index + 1}", "size": "medium", "category": "subject", "camera": "static",
                      "frame": "白衣人物站在画面左侧，抬起右臂后转身面对门口。" if index == 0 else
                               "白衣人物走向门口，黑衣观察者在右侧背景保持站立。",
                      "fight": "人物甲抬手后转向门口，观察者保持原位。", "beats": [["本镜中段", "人物甲转身"]],
                      "cameraRead": "稳定背景没有显著位移，机位保持固定。", "spatial": "人物甲位于左侧，门口在右侧。",
                      "remake": "保持固定中景，以身体朝向变化传递转向门口的意图。", "note": "只记录画面可见动作。",
                      "audio": "本测试使用无音频的人工视频。", "motion": 0, "transitionIn": "cut",
                      "subjects": ["A"] if index == 0 else ["A", "B"], "principalSubjects": ["A"],
                      "backgroundSubjects": [] if index == 0 else ["B"], "castPresence": {"A": "前景主要行为者"},
                      "frames": {side: {"src": f"frames/{shot_id}{side}.jpg", "time": index + fraction,
                                        "timeBasis": "requested-seek"} for side, fraction in (("a", .15), ("b", .85))}})
    doc = {"title": "人工两镜测试", "source": "source.mkv", "meta": {"durationSeconds": 2, "fps": 25,
            "width": 96, "height": 64, "hasAudio": False, "codec": "ffv1", "sourceSha256": FIXTURE_HASH}, "cast": cast, "shots": shots,
           "media": [{"src": "source.mkv", "label": "本地原片"}], "seedCuts": [1], "manualCuts": [], "removedCuts": []}
    analysis = {"method": "连续观看本地人工片段并逐镜核对前后代表帧。", "topics": [
        {"title": title, "tag": str(index + 1), "observed": "人物甲先转身，然后走向门口。", "meaning": "动作方向传递离开的意图。",
         "apply": "使转身与迈步形成明确的先后关系。", "times": [.3, 1.5]}
        for index, title in enumerate(("动作因果", "空间调度", "摄影剪辑", "节奏", "人物状态", "连续性"))],
        "limits": ["不能由机器结构检查证明视觉判断正确。"],
        "phases": [{"sampleTime": .3, "rangeLabel": "0–1秒", "title": "转向", "analysis": "转身建立朝门口行动的方向。"}]}
    windows = []
    for index, (start, end, shot_id, transition) in enumerate(((0, .4, "S01", "开始"), (.4, 1, "S01", "镜内连续"), (1, 2, "S02", "hard-cut"))):
        windows.append({"id": f"W{index + 1}", "start": start, "end": end, "shotId": shot_id,
                        "transitionLabel": transition, "title": f"动作窗 {index + 1}", "cameraPrompt": "固定中景，保持人物与门口的相对位置。",
                        "actionPrompt": "人物甲转向门口，迈步离开，背景观察者保持原位。", "endState": "人物甲面向门口，身体重心前移。"})
    plan = {"windows": windows, "timelinePrompt": "0–0.4秒开始转身；0.4–1秒镜内连续；1–2秒硬切后走向门口。",
            "totalSeconds": 2, "windowCount": 3, "sourceShotCount": 2,
            "designBoundary": {"camera": "机位高度为重新制作建议。", "action": "只复用可确认的转身与行走关系。"}}
    prompts = [{"kind": kind, "label": label, "caption": label, "text": plan["timelinePrompt"] if kind == "timed" else
                "保持人物外观与位置连续，执行已经确认的动作阶段。"}
               for kind, label in (("timed", "完整时间轴"), ("setup", "共同设定"), ("segment", "第一执行段"),
                                   ("segment", "第二执行段"), ("segment", "第三执行段"), ("adaptation", "换自己的故事"))]
    return {"shots.json": doc, "analysis.json": analysis, "reverse-prompts.json": prompts,
            "timed-camera-prompts.json": plan, "track.json": {"sourceSha256": FIXTURE_HASH},
            "source.json": {"brand": "Fredtalk Shots", "sha256": FIXTURE_HASH,
                            "localSource": "source.mkv", "originalFilename": "generated-test-source.mkv"}}


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="fredtalk-bundle-selftest-")
        self.root = Path(self.temporary.name).resolve()
        self.bundle = self.root / "bundle"
        self.bundle.mkdir()
        scripts = self.root / "scripts"
        scripts.mkdir()
        self.validator = scripts / "validate_bundle.py"
        shutil.copyfile(SCRIPTS / "validate_bundle.py", self.validator)
        (scripts / "engine.py").write_text(STUB_ENGINE, encoding="utf-8")
        for folder in ("portraits", "frames"):
            (self.bundle / folder).mkdir()
        pixels = b"P6\n2 2\n255\n" + bytes((127, 127, 127)) * 4
        for name in ("portraits/A.ppm", "portraits/B.ppm", "frames/S01a.jpg", "frames/S01b.jpg", "frames/S02a.jpg", "frames/S02b.jpg"):
            (self.bundle / name).write_bytes(pixels)
        (self.bundle / "source.mkv").write_bytes(SOURCE_PLACEHOLDER)
        self.payload = inputs()
        self.engine = {"report": {"ok": True, "errors": [], "warnings": [], "checks": [
            {"name": "source", "status": "pass", "message": "temporary isolated fixture"}]}}
        self.write()

    def tearDown(self):
        self.temporary.cleanup()

    def write(self):
        for name, value in self.payload.items():
            (self.bundle / name).write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")
        (self.bundle / "engine-result.json").write_text(json.dumps(self.engine), encoding="utf-8")

    def run_validator(self, directory=None):
        result = subprocess.run([sys.executable, str(self.validator), "--directory", str(directory or self.bundle)],
                                text=True, capture_output=True, timeout=15)
        self.assertNotIn("Traceback", result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(result.returncode, 0 if report["ok"] else 1, result.stderr)
        if directory is None:
            persisted = self.bundle / "validation.json"
            if persisted.is_file() and not persisted.is_symlink():
                self.assertEqual(report, json.loads(persisted.read_text(encoding="utf-8")))
        return report

    def assert_failure(self, message):
        self.write()
        report = self.run_validator()
        self.assertFalse(report["ok"], report)
        self.assertTrue(any(message in error for error in report["errors"]), report["errors"])
        self.assertFalse(any("unexpected input" in error for error in report["errors"]), report["errors"])
        return report

    def test_complete_bundle_and_machine_boundary(self):
        before = {name: (self.bundle / name).read_bytes() for name in self.payload}
        report = self.run_validator()
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual((report["shotCount"], report["windowCount"], report["sourceSeconds"]), (2, 3, 2))
        self.assertEqual(report["brand"], "Fredtalk Shots")
        self.assertTrue(report["visualReviewRequired"])
        self.assertIn("visual review", report["validationBoundary"])
        self.assertIn("✓ source", (self.bundle / "validation.txt").read_text(encoding="utf-8"))
        command = json.loads((self.bundle / "engine-call.json").read_text(encoding="utf-8"))
        self.assertEqual(command[0], "validate")
        self.assertEqual(command[2:], ["--track", str(self.bundle / "track.json"), "--frames", str(self.bundle / "frames"), "--json"])
        self.assertEqual(before, {name: (self.bundle / name).read_bytes() for name in self.payload})

    def test_wrong_top_level_shapes_are_structured_failures(self):
        for name, value in (("shots.json", []), ("analysis.json", None), ("reverse-prompts.json", {}), ("timed-camera-prompts.json", "bad")):
            with self.subTest(name=name):
                self.payload = inputs()
                self.payload[name] = value
                self.assert_failure(name)

    def test_nested_shapes_never_dereference_wrong_types(self):
        cases = [
            ("shots.json", ("meta",), []), ("shots.json", ("cast",), {}), ("shots.json", ("cast", 0), None),
            ("shots.json", ("cast", 0, "portraitSource"), []), ("shots.json", ("cast", 0, "portraitSource", "crop"), None),
            ("shots.json", ("media",), {}), ("shots.json", ("media", 0), []), ("shots.json", ("shots",), {}),
            ("shots.json", ("shots", 0), []), ("shots.json", ("shots", 0, "beats"), {}),
            ("shots.json", ("shots", 0, "subjects"), {}), ("shots.json", ("shots", 0, "subjects"), [[]]),
            ("shots.json", ("shots", 0, "principalSubjects"), None), ("shots.json", ("shots", 0, "backgroundSubjects"), 2),
            ("shots.json", ("shots", 0, "castPresence"), []), ("shots.json", ("shots", 0, "frames"), []),
            ("shots.json", ("shots", 0, "frames", "a"), None), ("analysis.json", ("topics",), {}),
            ("analysis.json", ("topics", 0), None), ("analysis.json", ("topics", 0, "times"), {}),
            ("analysis.json", ("limits",), None), ("analysis.json", ("phases",), {}), ("analysis.json", ("phases", 0), []),
            ("analysis.json", ("basis",), []), ("reverse-prompts.json", (1,), []),
            ("timed-camera-prompts.json", ("designBoundary",), []), ("timed-camera-prompts.json", ("windows",), {}),
            ("timed-camera-prompts.json", ("windows", 0), None), ("timed-camera-prompts.json", ("windows", 0, "shotId"), []),
        ]
        for name, keys, value in cases:
            with self.subTest(name=name, keys=keys):
                self.payload = inputs()
                target = self.payload[name]
                for key in keys[:-1]:
                    target = target[key]
                target[keys[-1]] = value
                self.write()
                report = self.run_validator()
                self.assertFalse(report["ok"])
                self.assertFalse(any("unexpected input" in error for error in report["errors"]), report["errors"])

    def test_nonfinite_and_boolean_source_duration(self):
        for value in (True, False, float("nan"), float("inf"), -1, 0, "2", 10 ** 1000):
            with self.subTest(value=str(value)[:20]):
                self.payload = inputs()
                self.payload["shots.json"]["meta"]["durationSeconds"] = value
                self.assert_failure("durationSeconds")

    def test_cast_fields_uniqueness_and_entities(self):
        for key in ("id", "name", "note", "entityType"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["shots.json"]["cast"][0].pop(key)
                self.assert_failure(key)
        self.payload = inputs()
        self.payload["shots.json"]["cast"][1]["id"] = "A"
        self.assert_failure("duplicate cast ID")
        self.payload = inputs()
        self.payload["shots.json"]["cast"][0]["entityType"] = "animal"
        self.assert_failure("entityType")

    def test_portrait_times_and_crop_geometry(self):
        for value in (True, float("nan"), -.01, 2.01):
            with self.subTest(time=value):
                self.payload = inputs()
                self.payload["shots.json"]["cast"][0]["portraitTime"] = value
                self.assert_failure("portraitTime")
        cases = (("width", 0), ("height", True), ("coordinateBasis", " "), ("crop", {}))
        for key, value in cases:
            with self.subTest(source_key=key):
                self.payload = inputs()
                self.payload["shots.json"]["cast"][0]["portraitSource"][key] = value
                self.assert_failure("portraitSource")
        for key, value in (("x", -1), ("y", float("inf")), ("width", True), ("height", 0), ("width", 97)):
            with self.subTest(crop_key=key):
                self.payload = inputs()
                self.payload["shots.json"]["cast"][0]["portraitSource"]["crop"][key] = value
                self.assert_failure("crop")

    def test_every_asset_must_be_local_contained_and_existing(self):
        for key, field in (("portrait", "portrait"), ("media", "media"), ("frame", "frames")):
            for path in ("missing.jpg", "frames", "https://example.invalid/image.jpg", "../outside.ppm"):
                with self.subTest(asset=key, path=path):
                    self.payload = inputs()
                    doc = self.payload["shots.json"]
                    if key == "portrait":
                        doc["cast"][0]["portrait"] = path
                    elif key == "media":
                        doc["media"][0]["src"] = path
                    else:
                        doc["shots"][0]["frames"]["a"]["src"] = path
                    (self.root / "outside.ppm").write_bytes(b"outside")
                    self.assert_failure(field)
        self.payload = inputs()
        doc = self.payload["shots.json"]
        doc["media"][0]["src"] = str(self.bundle / "source.mkv")
        self.assert_failure("bundle-relative path")

    def test_symlink_escape_cannot_be_read_or_overwritten(self):
        sentinel = self.root / "sentinel"
        sentinel.write_text("preserve", encoding="utf-8")
        (self.bundle / "escaped.ppm").symlink_to(sentinel)
        self.payload["shots.json"]["cast"][0]["portrait"] = "escaped.ppm"
        self.assert_failure("symlink targets")
        self.payload = inputs()
        self.write()
        (self.bundle / "analysis.json").unlink()
        (self.bundle / "analysis.json").symlink_to(sentinel)
        self.assertFalse(self.run_validator()["ok"])
        (self.bundle / "analysis.json").unlink()
        self.write()
        (self.bundle / "validation.txt").unlink()
        (self.bundle / "validation.txt").symlink_to(sentinel)
        self.assertFalse(self.run_validator()["ok"])
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "preserve")

    def test_internal_output_symlinks_cannot_overwrite_source_or_inputs(self):
        for output, target in (("validation.txt", "source.mkv"), ("validation.json", "shots.json")):
            with self.subTest(output=output, target=target):
                for artifact in ("validation.txt", "validation.json"):
                    if (self.bundle / artifact).is_symlink():
                        (self.bundle / artifact).unlink()
                (self.bundle / "source.mkv").write_bytes(SOURCE_PLACEHOLDER)
                self.write()
                path = self.bundle / output
                if path.is_symlink() or path.exists():
                    path.unlink()
                protected = (self.bundle / target).read_bytes()
                path.symlink_to(target)
                report = self.run_validator()
                self.assertFalse(report["ok"])
                self.assertTrue(any(output in error and "symlink" in error for error in report["errors"]), report["errors"])
                self.assertEqual((self.bundle / target).read_bytes(), protected)
                path.unlink()

    def test_atomic_outputs_preserve_hardlinked_source_and_inputs(self):
        for output, target in (("validation.txt", "source.mkv"), ("validation.json", "shots.json")):
            with self.subTest(output=output, target=target):
                path = self.bundle / output
                if path.exists():
                    path.unlink()
                protected = (self.bundle / target).read_bytes()
                os.link(self.bundle / target, path)
                self.assertTrue(os.path.samefile(path, self.bundle / target))
                self.assertTrue(self.run_validator()["ok"])
                self.assertEqual((self.bundle / target).read_bytes(), protected)
                self.assertFalse(os.path.samefile(path, self.bundle / target))
        self.assertFalse(list(self.bundle.glob(".fredtalk-validation-*")))

    def test_subject_partition_and_presence(self):
        cases = (("subjects", ["unknown"]), ("subjects", ["A", "A"]), ("principalSubjects", []),
                 ("backgroundSubjects", ["A"]), ("castPresence", {"B": "not in this shot"}), ("castPresence", {"A": " "}))
        for key, value in cases:
            with self.subTest(key=key, value=value):
                self.payload = inputs()
                self.payload["shots.json"]["shots"][0][key] = value
                self.assert_failure("doc.shots[0]")

    def test_shot_analysis_and_beats_are_not_optional(self):
        for key in ("title", "fight", "cameraRead", "spatial", "remake", "note"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["shots.json"]["shots"][0][key] = " "
                self.assert_failure(key)
        for beats in ([], [["only one"]], [["time", "action", "extra"]], [["time", False]], [[" ", "action"]]):
            with self.subTest(beats=beats):
                self.payload = inputs()
                self.payload["shots.json"]["shots"][0]["beats"] = beats
                self.assert_failure("beats")

    def test_frame_records_times_and_basis(self):
        for value in (True, float("nan"), -.001, 1.001):
            with self.subTest(time=value):
                self.payload = inputs()
                self.payload["shots.json"]["shots"][0]["frames"]["a"]["time"] = value
                self.assert_failure("frames.a.time")
        for key in ("src", "time", "timeBasis"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["shots.json"]["shots"][0]["frames"]["b"].pop(key)
                self.assert_failure(f"frames.b.{key}")
        self.payload = inputs()
        self.payload["shots.json"]["shots"][1]["frames"]["a"]["time"] = .9
        self.assert_failure("frames.a.time")

    def test_six_analysis_topics_with_replay_evidence(self):
        self.payload["analysis.json"]["topics"].pop()
        self.assert_failure("at least 6")
        for key in ("title", "tag", "observed", "meaning", "apply", "times"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["analysis.json"]["topics"][0].pop(key)
                self.assert_failure(key)
        for value in (True, float("nan"), -1, 2.01):
            with self.subTest(time=value):
                self.payload = inputs()
                self.payload["analysis.json"]["topics"][0]["times"] = [value]
                self.assert_failure("times")

    def test_method_alternatives_and_limits_and_phases(self):
        for field in ("analysis", "doc"):
            with self.subTest(method=field):
                self.payload = inputs()
                self.payload["analysis.json"].pop("method")
                if field == "analysis":
                    self.payload["analysis.json"]["basis"] = {"evidence": "逐镜与连续播放的核对记录。"}
                else:
                    self.payload["shots.json"]["analysisBasis"] = {"evidence": "逐镜与连续播放的核对记录。"}
                self.write()
                self.assertTrue(self.run_validator()["ok"])
        self.payload = inputs()
        self.payload["analysis.json"].pop("method")
        self.assert_failure("method description")
        for key, value in (("limits", []), ("limits", [" "]), ("phases", []), ("phases", [{"sampleTime": True}])):
            with self.subTest(key=key, value=value):
                self.payload = inputs()
                self.payload["analysis.json"][key] = value
                self.assert_failure(key)
        for key in ("rangeLabel", "title", "analysis", "sampleTime"):
            with self.subTest(phase_key=key):
                self.payload = inputs()
                self.payload["analysis.json"]["phases"][0].pop(key)
                self.assert_failure(key)

    def test_timed_prompt_is_unique_first_and_exact(self):
        for operation in ("duplicate", "move", "change"):
            with self.subTest(operation=operation):
                self.payload = inputs()
                prompts = self.payload["reverse-prompts.json"]
                if operation == "duplicate":
                    prompts[1]["kind"] = "timed"
                elif operation == "move":
                    prompts[0], prompts[1] = prompts[1], prompts[0]
                else:
                    prompts[0]["text"] += " "
                self.assert_failure("prompts")
        self.payload = inputs()
        self.payload["reverse-prompts.json"].pop()
        self.assert_failure("at least 6")
        for key in ("kind", "label", "caption", "text"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["reverse-prompts.json"][1][key] = " "
                self.assert_failure(key)

    def test_prompt_roles_accept_labels_without_fixed_kind_enums(self):
        prompts = self.payload["reverse-prompts.json"]
        for record in prompts[1:]:
            record["kind"] = "custom"
        prompts[1].update(label="Shared settings", caption="Person, scene and continuity")
        prompts[2].update(label="Executable segment", caption="First section")
        prompts[-1].update(label="Adapt my own story", caption="Replacement")
        self.write()
        self.assertTrue(self.run_validator()["ok"])
        for role, index in (("shared settings", 1), ("story adaptation", 5)):
            with self.subTest(role=role):
                self.payload = inputs()
                self.payload["reverse-prompts.json"][index].update(kind="custom", label="custom", caption="custom")
                self.assert_failure(role)
        self.payload = inputs()
        for record in self.payload["reverse-prompts.json"][2:5]:
            record.update(kind="custom", label="custom", caption="custom")
        self.assert_failure("executable segments")

    def test_window_required_fields_and_unique_known_ids(self):
        for key in ("id", "shotId", "transitionLabel", "title", "cameraPrompt", "actionPrompt", "endState"):
            with self.subTest(key=key):
                self.payload = inputs()
                self.payload["timed-camera-prompts.json"]["windows"][0].pop(key)
                self.assert_failure(key)
        self.payload = inputs()
        self.payload["timed-camera-prompts.json"]["windows"][1]["id"] = "W1"
        self.assert_failure("duplicate window ID")
        self.payload = inputs()
        self.payload["timed-camera-prompts.json"]["windows"][2]["shotId"] = "absent"
        self.assert_failure("existing source shot")

    def test_window_timing_contiguity_shot_alignment_and_coverage(self):
        cases = ((0, "start", .01), (0, "end", 0), (1, "start", .405), (1, "start", .395),
                 (1, "end", 1.01), (2, "start", 1.01), (2, "end", 1.9), (0, "start", True),
                 (1, "end", float("nan")), (2, "end", float("inf")))
        for index, key, value in cases:
            with self.subTest(index=index, key=key, value=value):
                self.payload = inputs()
                self.payload["timed-camera-prompts.json"]["windows"][index][key] = value
                self.assert_failure("camera.windows")
        self.payload = inputs()
        plan = self.payload["timed-camera-prompts.json"]
        plan["windows"] = plan["windows"][:2]
        plan["windowCount"] = 2
        self.assert_failure("every source shot")

    def test_exact_two_millisecond_tolerance_is_inclusive(self):
        plan = self.payload["timed-camera-prompts.json"]
        plan["windows"][1]["end"] = 1.002
        plan["windows"][2]["start"] = 1.002
        plan["totalSeconds"] = 2.002
        self.write()
        self.assertTrue(self.run_validator()["ok"])

    def test_hard_cuts_only_at_source_cut_boundaries(self):
        for label in ("硬切", "cut", "hard cut", "hard-cut", "CUT TO NEXT"):
            with self.subTest(label=label):
                self.payload = inputs()
                self.payload["timed-camera-prompts.json"]["windows"][2]["transitionLabel"] = label
                self.write()
                self.assertTrue(self.run_validator()["ok"])
                self.payload["timed-camera-prompts.json"]["windows"][1]["transitionLabel"] = label
                self.assert_failure("same shot")
        self.payload = inputs()
        self.payload["timed-camera-prompts.json"]["windows"][1]["transitionLabel"] = "continuous, no hard cut"
        self.write()
        self.assertTrue(self.run_validator()["ok"])
        self.payload["timed-camera-prompts.json"]["windows"][2]["transitionLabel"] = "镜内连续"
        self.assert_failure("source hard cut")
        self.payload["shots.json"]["shots"][1]["transitionIn"] = "dissolve"
        self.write()
        self.assertTrue(self.run_validator()["ok"])

    def test_plan_design_boundary_duration_and_declared_counts(self):
        for key, value in (("designBoundary", {}), ("designBoundary", {"camera": " "}),
                           ("totalSeconds", 2.01), ("totalSeconds", True), ("windowCount", 2),
                           ("windowCount", 3.0), ("sourceShotCount", True), ("sourceShotCount", 5)):
            with self.subTest(key=key, value=value):
                self.payload = inputs()
                self.payload["timed-camera-prompts.json"][key] = value
                self.assert_failure(key)
        self.payload = inputs()
        for key in ("totalSeconds", "windowCount", "sourceShotCount"):
            self.payload["timed-camera-prompts.json"].pop(key)
        self.write()
        self.assertTrue(self.run_validator()["ok"])

    def test_engine_warnings_and_skipped_gates_remain_visible(self):
        self.engine["report"]["warnings"] = ["static scene motion needs review"]
        self.engine["report"]["checks"].append({"name": "provenance", "status": "skipped", "message": "source hash absent"})
        self.write()
        report = self.run_validator()
        self.assertTrue(report["ok"])
        self.assertEqual(report["warnings"], ["engine: static scene motion needs review"])
        self.assertEqual(report["skippedMachineGates"], ["provenance: source hash absent"])
        self.assertIn("⊘ provenance", (self.bundle / "validation.txt").read_text(encoding="utf-8"))

    def test_engine_failures_and_broken_reports_cannot_pass(self):
        cases = [
            {"report": {"ok": False, "errors": ["incorrect source motion"], "warnings": [], "checks": []}, "exitCode": 1},
            {"report": {"ok": True, "errors": [], "warnings": [], "checks": []}, "exitCode": 2},
            {"report": {}, "rawOutput": "not JSON", "exitCode": 1},
            {"report": {"ok": True, "errors": [], "warnings": [], "checks": [{"name": "frame", "status": "fail", "message": "missing file"}]}},
            {"report": {"ok": True, "errors": {}, "warnings": [], "checks": []}},
        ]
        for config in cases:
            with self.subTest(config=config):
                self.engine = config
                self.assert_failure("engine")

    def test_missing_engine_inputs_are_failures_and_skips_are_explicit(self):
        (self.bundle / "track.json").unlink()
        report = self.run_validator()
        self.assertFalse(report["ok"])
        self.assertTrue(report["skippedMachineGates"])
        self.assertFalse((self.bundle / "engine-call.json").exists())

    def test_invalid_json_missing_files_and_directory_do_not_traceback(self):
        (self.bundle / "analysis.json").write_text("{broken", encoding="utf-8")
        self.assertFalse(self.run_validator()["ok"])
        (self.bundle / "analysis.json").unlink()
        self.assertFalse(self.run_validator()["ok"])
        report = self.run_validator(self.root / "does-not-exist")
        self.assertFalse(report["ok"])
        self.assertIn("directory", report["errors"][0])

    def test_source_record_is_required_and_has_traceable_identity(self):
        (self.bundle / "source.json").unlink()
        report = self.run_validator()
        self.assertFalse(report["ok"])
        self.assertTrue(any("source.json" in error for error in report["errors"]))
        for key, value in (("brand", "other"), ("brand", None), ("sha256", "not a hash"),
                           ("sha256", True), ("originalFilename", " "), ("localSource", "missing.mkv"),
                           ("localSource", str(self.bundle / "source.mkv"))):
            with self.subTest(key=key, value=value):
                self.payload = inputs()
                self.payload["source.json"][key] = value
                self.assert_failure(f"source.{key}")
        self.payload = inputs()
        self.payload["source.json"] = []
        self.assert_failure("source.json")

    def test_all_recorded_source_hashes_must_match_actual_file(self):
        cases = (("source.json", ("sha256",)), ("shots.json", ("meta", "sourceSha256")),
                 ("track.json", ("sourceSha256",)))
        for name, keys in cases:
            for value in (None, "0" * 64, "abc", True):
                with self.subTest(name=name, value=value):
                    self.payload = inputs()
                    target = self.payload[name]
                    for key in keys[:-1]:
                        target = target[key]
                    if value is None:
                        target.pop(keys[-1])
                    else:
                        target[keys[-1]] = value
                    self.assert_failure("sha256" if name == "source.json" else "sourceSha256")

    def test_source_asset_must_appear_in_media_and_cannot_escape(self):
        self.payload["shots.json"]["media"] = [{"src": "portraits/A.ppm", "label": "unrelated existing local file"}]
        self.assert_failure("must appear as a src")
        outside = self.root / "outside-source.mkv"
        outside.write_bytes(SOURCE_PLACEHOLDER)
        (self.bundle / "source-link.mkv").symlink_to(outside)
        self.payload = inputs()
        self.payload["source.json"]["localSource"] = "source-link.mkv"
        self.payload["shots.json"]["media"][0]["src"] = "source-link.mkv"
        self.assert_failure("symlink targets")

    def test_replacing_local_source_file_invalidates_unmodified_records(self):
        self.run_validator()
        original_records = {name: (self.bundle / name).read_bytes() for name in self.payload}
        (self.bundle / "source.mkv").write_bytes(b"a different local file with otherwise unchanged metadata")
        report = self.run_validator()
        self.assertFalse(report["ok"])
        for field in ("source.sha256", "doc.meta.sourceSha256", "track.sourceSha256"):
            self.assertTrue(any(field in error and "actual local source" in error for error in report["errors"]), report["errors"])
        self.assertEqual(original_records, {name: (self.bundle / name).read_bytes() for name in self.payload})

    def test_real_engine_checks_generated_media_and_measured_track(self):
        ffmpeg = shutil.which("ffmpeg")
        self.assertIsNotNone(ffmpeg, "ffmpeg is required for the real engine integration test")
        source = self.bundle / "source.mkv"
        generated = subprocess.run([ffmpeg, "-v", "error", "-nostdin", "-y", "-f", "lavfi", "-i",
                                    "color=c=gray:s=96x64:r=25:d=2", "-c:v", "ffv1", str(source)],
                                   text=True, capture_output=True, timeout=20)
        self.assertEqual(generated.returncode, 0, generated.stderr)
        doc = self.payload["shots.json"]
        doc["cast"] = []
        actual_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        doc["meta"]["sourceSha256"] = actual_hash
        self.payload["source.json"]["sha256"] = actual_hash
        descriptions = ("画面中央是一块均匀的灰色平面，边界位置在前半段保持稳定。",
                        "灰色平面继续覆盖整个画框，背景亮度在后半段保持不变。")
        for index, shot in enumerate(doc["shots"]):
            shot.update(category="product", subjects=[], principalSubjects=[], backgroundSubjects=[],
                        castPresence={}, frame=descriptions[index])
            for record in shot["frames"].values():
                extracted = subprocess.run([ffmpeg, "-v", "error", "-nostdin", "-y", "-ss", str(record["time"]),
                                            "-i", str(source), "-frames:v", "1", str(self.bundle / record["src"])],
                                           text=True, capture_output=True, timeout=20)
                self.assertEqual(extracted.returncode, 0, extracted.stderr)
        track = {"schemaVersion": 2, "method": "fredtalk-luma-delta-v2", "hz": 8,
                 "times": [index / 8 for index in range(16)], "values": [0] * 16,
                 "durationSeconds": 2, "sourceSha256": actual_hash}
        self.payload["track.json"] = track
        self.write()
        self.validator = SCRIPTS / "validate_bundle.py"
        report = self.run_validator()
        self.assertTrue(report["ok"], report["errors"])
        self.assertEqual(report["skippedMachineGates"], [])
        self.assertTrue(report["visualReviewRequired"])
        track["values"] = [0] + [120] * 15
        (self.bundle / "track.json").write_text(json.dumps(track), encoding="utf-8")
        report = self.run_validator()
        self.assertFalse(report["ok"])
        self.assertTrue(any("engine:" in error for error in report["errors"]), report["errors"])
        track["values"] = [0] * 16
        track["sourceSha256"] = "0" * 64
        (self.bundle / "track.json").write_text(json.dumps(track), encoding="utf-8")
        report = self.run_validator()
        self.assertFalse(report["ok"])
        self.assertTrue(any("engine:" in error for error in report["errors"]), report["errors"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
