#!/usr/bin/env python3
"""Validate Fredtalk Shots report inputs and retain the engine's machine checks."""
import argparse
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

BRAND = "Fredtalk Shots"
TOLERANCE = 0.002
BOUNDARY = (
    "Machine checks cover measured source data, local assets, report structure and "
    "prompt timing. They do not verify visual identity, action interpretation, "
    "sound understanding or continuous playback; visual review is still required."
)


def finite_number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    try:
        return math.isfinite(value)
    except (OverflowError, ValueError):
        return False


def nonblank(value):
    return isinstance(value, str) and bool(value.strip())


def within_tolerance(first, second):
    difference = abs(first - second)
    # JSON decimal timestamps may subtract to 0.0020000000000000018 in binary.
    return difference <= TOLERANCE or math.isclose(difference, TOLERANCE, rel_tol=0, abs_tol=1e-12)


def declares_cut(label):
    if not isinstance(label, str):
        return False
    label = re.sub(r"\b(?:no|not|without)\s+(?:a\s+)?(?:hard[-\s]+)?cut\b", "", label,
                   flags=re.IGNORECASE)
    label = re.sub(r"(?:无|不|非)(?:需|要|发生)?硬切", "", label)
    return bool(re.search(r"硬切|(?<![\w-])(?:hard[-\s]+)?cut(?![\w-])", label,
                          flags=re.IGNORECASE))


class Checks:
    def __init__(self, directory):
        self.directory = directory
        self.errors = []
        self.warnings = []
        self.skipped = []
        self.engine_text = ""

    def error(self, field, message):
        self.errors.append(f"{field}: {message}")

    def strings(self, obj, keys, field):
        for key in keys:
            if not nonblank(obj.get(key)):
                self.error(f"{field}.{key}", "must be a nonblank string")

    def object(self, value, field):
        if not isinstance(value, dict):
            self.error(field, "must be an object")
            return False
        return True

    def array(self, value, field, minimum=0):
        if not isinstance(value, list):
            self.error(field, "must be an array")
            return False
        if len(value) < minimum:
            self.error(field, f"must contain at least {minimum} item(s)")
        return True

    def time(self, value, field, start=0, end=None):
        if not finite_number(value):
            self.error(field, "must be a finite number, excluding booleans")
            return False
        if value < start or (end is not None and value > end):
            self.error(field, f"must be within {start}..{end}")
            return False
        return True

    def local_path(self, value, field, directory=False):
        if not nonblank(value):
            self.error(field, "must name a local asset")
            return None
        if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", value) or "\x00" in value:
            self.error(field, "must name a local asset, not a URI")
            return None
        try:
            candidate = Path(value)
            if candidate.is_absolute():
                self.error(field, "must use a bundle-relative path, not an absolute path")
                return None
            path = (self.directory / candidate).resolve()
            if not path.is_relative_to(self.directory):
                self.error(field, "must remain inside the bundle, including symlink targets")
                return None
            exists = path.is_dir() if directory else path.is_file()
            if not exists:
                self.error(field, "local directory does not exist" if directory else "local file does not exist")
                return None
            return path
        except (OSError, ValueError, RuntimeError) as exc:
            self.error(field, f"invalid local path ({type(exc).__name__})")
            return None

    def read_json(self, name):
        path = self.local_path(name, name)
        if path is None:
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ValueError) as exc:
            self.error(name, f"cannot read JSON ({type(exc).__name__}: {exc})")
            return None

    def ids(self, value, field):
        if not self.array(value, field):
            return None
        for index, item in enumerate(value):
            if not nonblank(item):
                self.error(f"{field}[{index}]", "must be a nonblank cast ID")
        valid = [item for item in value if nonblank(item)]
        if len(set(valid)) != len(valid):
            self.error(field, "cast IDs must be unique")
        return set(valid)


def validate_portrait_source(checks, value, field):
    if not checks.object(value, field):
        return
    checks.strings(value, ("coordinateBasis",), field)
    dimensions = {}
    for key in ("width", "height"):
        number = value.get(key)
        if not finite_number(number) or number <= 0:
            checks.error(f"{field}.{key}", "source dimension must be a positive finite number")
        else:
            dimensions[key] = number
    crop = value.get("crop")
    if not checks.object(crop, f"{field}.crop"):
        return
    valid_crop = True
    for key in ("x", "y", "width", "height"):
        number = crop.get(key)
        if not finite_number(number) or number < 0 or (key in ("width", "height") and number == 0):
            checks.error(f"{field}.crop.{key}", "must be finite; position >= 0 and size > 0")
            valid_crop = False
    if valid_crop and len(dimensions) == 2:
        if crop["x"] + crop["width"] > dimensions["width"] or crop["y"] + crop["height"] > dimensions["height"]:
            checks.error(f"{field}.crop", "crop extends beyond the original source dimensions")


def validate_source_identity(checks, source, doc, track):
    if not checks.object(source, "source.json"):
        return
    if source.get("brand") != BRAND:
        checks.error("source.brand", "must be Fredtalk Shots")
    checks.strings(source, ("originalFilename",), "source")
    local_source = checks.local_path(source.get("localSource"), "source.localSource")
    media = doc.get("media") if isinstance(doc, dict) else None
    if not isinstance(media, list) or not any(isinstance(asset, dict) and asset.get("src") == source.get("localSource") for asset in media):
        checks.error("source.localSource", "must appear as a src in doc.media")
    meta = doc.get("meta") if isinstance(doc, dict) else None
    if not checks.object(track, "track.json"):
        track = {}
    hashes = {"source.sha256": source.get("sha256"),
              "doc.meta.sourceSha256": meta.get("sourceSha256") if isinstance(meta, dict) else None,
              "track.sourceSha256": track.get("sourceSha256")}
    valid = {}
    for field, value in hashes.items():
        if not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", value):
            checks.error(field, "must contain a 64-character hexadecimal SHA-256")
        else:
            valid[field] = value.lower()
    if local_source is not None:
        try:
            digest = hashlib.sha256()
            with local_source.open("rb") as file:
                for chunk in iter(lambda: file.read(1024 * 1024), b""):
                    digest.update(chunk)
            actual = digest.hexdigest()
            for field, recorded in valid.items():
                if recorded != actual:
                    checks.error(field, "does not match the actual local source file")
        except OSError as exc:
            checks.error("source.localSource", f"cannot hash local source ({type(exc).__name__})")


def validate_document(checks, doc):
    if not checks.object(doc, "shots.json"):
        return None, []
    checks.strings(doc, ("title", "source"), "doc")
    meta = doc.get("meta")
    duration = None
    if checks.object(meta, "doc.meta"):
        value = meta.get("durationSeconds")
        if not finite_number(value) or value <= 0:
            checks.error("doc.meta.durationSeconds", "must be a positive finite source duration")
        else:
            duration = value
    cast_ids = set()
    cast = doc.get("cast")
    if checks.array(cast, "doc.cast"):
        for index, entity in enumerate(cast):
            field = f"doc.cast[{index}]"
            if not checks.object(entity, field):
                continue
            checks.strings(entity, ("id", "name", "note"), field)
            entity_id = entity.get("id")
            if nonblank(entity_id):
                if entity_id in cast_ids:
                    checks.error(f"{field}.id", "duplicate cast ID")
                cast_ids.add(entity_id)
            if entity.get("entityType") not in ("character", "group"):
                checks.error(f"{field}.entityType", "must be character or group")
            checks.local_path(entity.get("portrait"), f"{field}.portrait")
            checks.time(entity.get("portraitTime"), f"{field}.portraitTime", end=duration)
            if "portraitSource" in entity:
                validate_portrait_source(checks, entity["portraitSource"], f"{field}.portraitSource")
    media = doc.get("media")
    if checks.array(media, "doc.media", minimum=1):
        for index, asset in enumerate(media):
            field = f"doc.media[{index}]"
            if checks.object(asset, field):
                checks.local_path(asset.get("src"), f"{field}.src")
                checks.strings(asset, ("label",), field)
    shots = doc.get("shots")
    if not checks.array(shots, "doc.shots", minimum=1):
        return duration, []
    for index, shot in enumerate(shots):
        field = f"doc.shots[{index}]"
        if not checks.object(shot, field):
            continue
        checks.strings(shot, ("id", "title", "fight", "cameraRead", "spatial", "remake", "note"), field)
        beats = shot.get("beats")
        if checks.array(beats, f"{field}.beats", minimum=1):
            for beat_index, beat in enumerate(beats):
                if not isinstance(beat, list) or len(beat) != 2 or not all(nonblank(part) for part in beat):
                    checks.error(f"{field}.beats[{beat_index}]", "must be [timeLabel, observedAction] with two nonblank strings")
        subjects = checks.ids(shot.get("subjects"), f"{field}.subjects")
        principal = checks.ids(shot.get("principalSubjects"), f"{field}.principalSubjects")
        background = checks.ids(shot.get("backgroundSubjects"), f"{field}.backgroundSubjects")
        for key, ids in (("subjects", subjects), ("principalSubjects", principal), ("backgroundSubjects", background)):
            if ids is not None and not ids <= cast_ids:
                checks.error(f"{field}.{key}", "references unknown cast IDs")
        if all(ids is not None for ids in (subjects, principal, background)):
            if principal & background:
                checks.error(field, "principalSubjects and backgroundSubjects must be disjoint")
            if principal | background != subjects:
                checks.error(field, "principalSubjects and backgroundSubjects must partition subjects exactly")
        if "castPresence" in shot:
            presence = shot["castPresence"]
            if checks.object(presence, f"{field}.castPresence"):
                for entity_id, note in presence.items():
                    if subjects is not None and entity_id not in subjects:
                        checks.error(f"{field}.castPresence.{entity_id}", "may describe only a subject present in this shot")
                    if not nonblank(note):
                        checks.error(f"{field}.castPresence.{entity_id}", "must be a nonblank presence note")
        frames = shot.get("frames")
        if checks.object(frames, f"{field}.frames"):
            for side in ("a", "b"):
                record = frames.get(side)
                frame_field = f"{field}.frames.{side}"
                if not checks.object(record, frame_field):
                    continue
                checks.local_path(record.get("src"), f"{frame_field}.src")
                start, end = shot.get("start"), shot.get("end")
                if finite_number(start) and finite_number(end):
                    checks.time(record.get("time"), f"{frame_field}.time", start=start, end=end)
                elif not finite_number(record.get("time")):
                    checks.error(f"{frame_field}.time", "must be a finite number, excluding booleans")
                if record.get("timeBasis") not in ("requested-seek", "decoded-pts"):
                    checks.error(f"{frame_field}.timeBasis", "must be requested-seek or decoded-pts")
    return duration, shots


def validate_analysis(checks, analysis, doc, duration):
    if not checks.object(analysis, "analysis.json"):
        return
    topics = analysis.get("topics")
    if checks.array(topics, "analysis.topics", minimum=6):
        for index, topic in enumerate(topics):
            field = f"analysis.topics[{index}]"
            if not checks.object(topic, field):
                continue
            checks.strings(topic, ("title", "tag", "observed", "meaning", "apply"), field)
            times = topic.get("times")
            if checks.array(times, f"{field}.times", minimum=1):
                for time_index, time in enumerate(times):
                    checks.time(time, f"{field}.times[{time_index}]", end=duration)
    basis = analysis.get("basis")
    document_basis = doc.get("analysisBasis") if isinstance(doc, dict) else None
    methods = [analysis.get("method"), basis.get("evidence") if isinstance(basis, dict) else None,
               document_basis.get("evidence") if isinstance(document_basis, dict) else None]
    if not any(nonblank(method) for method in methods):
        checks.error("analysis", "a real method description is required in method, basis.evidence or doc.analysisBasis.evidence")
    if "method" in analysis and not nonblank(analysis["method"]):
        checks.error("analysis.method", "must be a nonblank string when supplied")
    if "basis" in analysis and checks.object(basis, "analysis.basis") and "evidence" in basis and not nonblank(basis["evidence"]):
        checks.error("analysis.basis.evidence", "must be a nonblank string")
    if isinstance(doc, dict) and "analysisBasis" in doc and checks.object(document_basis, "doc.analysisBasis"):
        if "evidence" in document_basis and not nonblank(document_basis["evidence"]):
            checks.error("doc.analysisBasis.evidence", "must be a nonblank string")
    limits = analysis.get("limits")
    if checks.array(limits, "analysis.limits", minimum=1):
        for index, limitation in enumerate(limits):
            if not nonblank(limitation):
                checks.error(f"analysis.limits[{index}]", "must be a nonblank limitation")
    for key in ("phases", "overviewPhases"):
        if key == "overviewPhases" and key not in analysis:
            continue
        phases = analysis.get(key)
        if checks.array(phases, f"analysis.{key}", minimum=1 if key == "phases" else 0):
            for index, phase in enumerate(phases):
                field = f"analysis.{key}[{index}]"
                if checks.object(phase, field):
                    checks.strings(phase, ("rangeLabel", "title", "analysis"), field)
                    checks.time(phase.get("sampleTime"), f"{field}.sampleTime", end=duration)


def validate_prompts(checks, prompts, plan):
    if not checks.array(prompts, "reverse-prompts.json", minimum=6):
        return
    timed = []
    descriptions = []
    for index, prompt in enumerate(prompts):
        field = f"prompts[{index}]"
        if not checks.object(prompt, field):
            continue
        checks.strings(prompt, ("kind", "label", "caption", "text"), field)
        if prompt.get("kind") == "timed":
            timed.append(index)
        else:
            descriptions.append(" ".join(str(prompt.get(key, "")) for key in ("kind", "label", "caption")).casefold())
    if timed != [0]:
        checks.error("prompts", "exactly one kind=timed prompt must be the first record")
    if timed == [0] and isinstance(plan, dict) and prompts[0].get("text") != plan.get("timelinePrompt"):
        checks.error("prompts[0].text", "must exactly equal camera.timelinePrompt")
    roles = {
        "shared settings": r"setup|shared|common|global|setting|共同|通用|共用|统一|设定|设置",
        "executable segments": r"segment|section|part|scene|分段|段落|场景|分镜|逐段",
        "story adaptation": r"adapt|replace|rewrite|remix|own|story|换|改编|替换|自己的|故事",
    }
    for role, pattern in roles.items():
        if not any(re.search(pattern, description) for description in descriptions):
            checks.error("prompts", f"must include identifiable {role} (kind, label or caption)")


def validate_plan(checks, plan, shots, duration):
    if not checks.object(plan, "timed-camera-prompts.json"):
        return []
    checks.strings(plan, ("timelinePrompt",), "camera")
    boundary = plan.get("designBoundary")
    if checks.object(boundary, "camera.designBoundary"):
        if not boundary:
            checks.error("camera.designBoundary", "must contain at least one design boundary")
        for key, value in boundary.items():
            if not nonblank(key) or not nonblank(value):
                checks.error("camera.designBoundary", "keys and values must be nonblank strings")
    if "totalSeconds" in plan:
        total = plan["totalSeconds"]
        if not finite_number(total) or total <= 0:
            checks.error("camera.totalSeconds", "must be a positive finite number")
        elif duration is not None and not within_tolerance(total, duration):
            checks.error("camera.totalSeconds", "must match the measured source duration within 0.002s")
    windows = plan.get("windows")
    if not checks.array(windows, "camera.windows", minimum=1):
        return []
    shot_map = {shot["id"]: shot for shot in shots if isinstance(shot, dict) and nonblank(shot.get("id"))}
    window_ids, covered = set(), set()
    previous_end, previous_shot = None, None
    for index, window in enumerate(windows):
        field = f"camera.windows[{index}]"
        if not checks.object(window, field):
            previous_end, previous_shot = None, None
            continue
        checks.strings(window, ("id", "shotId", "transitionLabel", "title", "cameraPrompt", "actionPrompt", "endState"), field)
        window_id, shot_id = window.get("id"), window.get("shotId")
        if nonblank(window_id):
            if window_id in window_ids:
                checks.error(f"{field}.id", "duplicate window ID")
            window_ids.add(window_id)
        shot = shot_map.get(shot_id) if isinstance(shot_id, str) else None
        if shot is None:
            checks.error(f"{field}.shotId", "must reference an existing source shot")
        else:
            covered.add(shot_id)
        start, end = window.get("start"), window.get("end")
        valid_times = finite_number(start) and finite_number(end)
        if not valid_times:
            checks.error(field, "start and end must be finite numbers, excluding booleans")
        else:
            if end <= start:
                checks.error(field, "end must be greater than start")
            if index == 0 and not within_tolerance(start, 0):
                checks.error(f"{field}.start", "the first window must start at 0 within 0.002s")
            if previous_end is not None and not within_tolerance(start, previous_end):
                checks.error(f"{field}.start", "windows must be contiguous within 0.002s")
            if shot is not None and finite_number(shot.get("start")) and finite_number(shot.get("end")):
                if start < shot["start"] - TOLERANCE or end > shot["end"] + TOLERANCE:
                    checks.error(field, "window must remain inside its associated source shot within 0.002s")
                if index > 0 and shot_id != previous_shot and not within_tolerance(start, shot["start"]):
                    checks.error(f"{field}.start", "a change of shot must start at the measured shot boundary")
            if index == len(windows) - 1 and duration is not None and not within_tolerance(end, duration):
                checks.error(f"{field}.end", "the final window must end at source duration within 0.002s")
        cut = declares_cut(window.get("transitionLabel"))
        if index > 0 and shot is not None:
            if shot_id == previous_shot and cut:
                checks.error(f"{field}.transitionLabel", "a window inside the same shot cannot introduce a hard cut")
            if shot_id != previous_shot and shot.get("transitionIn") == "cut" and not cut:
                checks.error(f"{field}.transitionLabel", "a source hard cut must be labelled 硬切, cut, hard cut or hard-cut")
        previous_end = end if valid_times else None
        previous_shot = shot_id
    if covered != set(shot_map):
        checks.error("camera.windows", "must cover every source shot")
    for key, expected in (("windowCount", len(windows)), ("sourceShotCount", len(shots))):
        if key in plan and (isinstance(plan[key], bool) or not isinstance(plan[key], int) or plan[key] != expected):
            checks.error(f"camera.{key}", f"must truthfully equal {expected}")
    return windows


def run_engine(checks):
    engine = Path(__file__).with_name("engine.py")
    if not engine.is_file():
        checks.error("engine", "scripts/engine.py is missing")
        return
    paths = [checks.local_path("shots.json", "engine.shots"), checks.local_path("track.json", "engine.track"),
             checks.local_path("frames", "engine.frames", directory=True)]
    if any(path is None for path in paths):
        checks.skipped.append("engine: not run because required local inputs are unavailable or unsafe")
        return
    command = [sys.executable, str(engine), "validate", str(paths[0]), "--track", str(paths[1]),
               "--frames", str(paths[2]), "--json"]
    try:
        result = subprocess.run(command, cwd=checks.directory, text=True, encoding="utf-8",
                                errors="replace", capture_output=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as exc:
        checks.error("engine", f"cannot complete machine checks ({type(exc).__name__}: {exc})")
        return
    checks.engine_text = result.stdout + ("\nEngine stderr:\n" + result.stderr if result.stderr else "")
    try:
        report = json.loads(result.stdout)
    except ValueError:
        checks.error("engine", f"returned invalid JSON (exit {result.returncode}); see validation.txt")
        return
    if not isinstance(report, dict) or not isinstance(report.get("ok"), bool):
        checks.error("engine", "returned an invalid machine-check report")
        return
    for key, destination in (("errors", checks.errors), ("warnings", checks.warnings)):
        entries = report.get(key)
        if not isinstance(entries, list) or not all(isinstance(entry, str) for entry in entries):
            checks.error("engine", f"invalid {key} in machine-check report")
        else:
            destination.extend(f"engine: {entry}" for entry in entries)
    engine_checks = report.get("checks")
    if not isinstance(engine_checks, list):
        checks.error("engine", "invalid checks in machine-check report")
    else:
        lines = []
        for item in engine_checks:
            if not isinstance(item, dict) or item.get("status") not in ("pass", "fail", "skipped") or not nonblank(item.get("name")) or not isinstance(item.get("message"), str):
                checks.error("engine", "invalid individual check in machine-check report")
                continue
            detail = f"{item['name']}: {item['message']}"
            symbol = {"pass": "✓", "fail": "✗", "skipped": "⊘"}[item["status"]]
            lines.append(f"{symbol} {detail}")
            if item["status"] == "skipped":
                checks.skipped.append(detail)
            elif item["status"] == "fail" and not report.get("errors"):
                checks.error("engine", detail)
        checks.engine_text = "\n".join(lines) + ("\nEngine stderr:\n" + result.stderr if result.stderr else "")
    if (result.returncode != 0 or not report["ok"]) and not report.get("errors"):
        checks.error("engine", f"machine validation failed (exit {result.returncode})")


def atomic_write(path, content):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=".fredtalk-validation-", delete=False) as file:
            temporary = Path(file.name)
            file.write(content)
        # Replacing a directory entry also preserves any input sharing the old inode.
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def write_outputs(checks, report):
    safe_paths = {}
    for name in ("validation.txt", "validation.json"):
        path = checks.directory / name
        try:
            if path.is_symlink():
                checks.error(name, "output must not be a symlink")
            elif path.exists() and not path.is_file():
                checks.error(name, "output must be a regular file")
            else:
                safe_paths[name] = path
        except (OSError, ValueError, RuntimeError) as exc:
            checks.error(name, f"invalid output path ({type(exc).__name__})")
    report["ok"] = not checks.errors
    lines = [f"{BRAND} bundle validation", checks.engine_text]
    lines.extend(f"✗ {error}" for error in checks.errors)
    lines.extend(f"⚠ {warning}" for warning in checks.warnings)
    lines.extend(f"⊘ {skipped}" for skipped in checks.skipped if skipped not in checks.engine_text)
    if report["ok"]:
        lines.append("✓ Extended report inputs passed")
    lines.append(BOUNDARY)
    if "validation.txt" in safe_paths:
        try:
            atomic_write(safe_paths["validation.txt"], "\n".join(line for line in lines if line) + "\n")
        except (OSError, ValueError) as exc:
            checks.error("validation.txt", f"cannot write validation result ({type(exc).__name__})")
    report["ok"] = not checks.errors
    if "validation.json" in safe_paths:
        try:
            atomic_write(safe_paths["validation.json"], json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
        except (OSError, ValueError) as exc:
            checks.error("validation.json", f"cannot write validation result ({type(exc).__name__})")
    report["ok"] = not checks.errors


def validate_bundle(directory):
    directory = Path(directory).resolve()
    checks = Checks(directory)
    duration, shots, windows = None, [], []
    if not directory.is_dir():
        checks.error("directory", "must be an existing local bundle directory")
    else:
        try:
            doc = checks.read_json("shots.json")
            analysis = checks.read_json("analysis.json")
            prompts = checks.read_json("reverse-prompts.json")
            plan = checks.read_json("timed-camera-prompts.json")
            source = checks.read_json("source.json")
            track = checks.read_json("track.json")
            duration, shots = validate_document(checks, doc)
            validate_source_identity(checks, source, doc, track)
            validate_analysis(checks, analysis, doc, duration)
            windows = validate_plan(checks, plan, shots, duration)
            validate_prompts(checks, prompts, plan)
            run_engine(checks)
        except Exception as exc:
            checks.error("bundle", f"unexpected input or validator failure ({type(exc).__name__}: {exc})")
    report = {"brand": BRAND, "ok": not checks.errors, "shotCount": len(shots), "windowCount": len(windows),
              "sourceSeconds": duration, "errors": checks.errors, "warnings": checks.warnings,
              "skippedMachineGates": checks.skipped, "visualReviewRequired": True,
              "validationBoundary": BOUNDARY}
    if directory.is_dir():
        write_outputs(checks, report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, required=True)
    args = parser.parse_args()
    try:
        result = validate_bundle(args.directory)
    except Exception as exc:
        result = {"brand": BRAND, "ok": False, "shotCount": 0, "windowCount": 0, "sourceSeconds": None,
                  "errors": [f"directory: cannot validate ({type(exc).__name__}: {exc})"], "warnings": [],
                  "skippedMachineGates": [], "visualReviewRequired": True, "validationBoundary": BOUNDARY}
    print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
