#!/usr/bin/env python3
"""Independent Fredtalk Shots 2.0.0 media and validation engine.

Cuts are selected during a complete FFmpeg decode with ``gt(scene, threshold)``
and retain the selected decoded presentation time (six decimal places). Motion
is a separate measurement: normalize the source clock to zero, resample with
FFmpeg ``fps=hz:start_time=0:round=up:eof_action=pass``, resize with area sampling
to 96x54, and convert to gray. At grid time i/hz, report the mean absolute byte
difference from the previous sampled image, with the first value zero. Only
two images are held in memory. The grid is a resampling clock, not source PTS.
A shot's motion is the median of samples start+.5/hz <= t < end-.5/hz, rounded
to three decimals; an empty interval is null. These pixels never assign visual
categories, camera movements, people, actions, or narrative interpretations.

JPEG extraction records the performed source-relative seek separately from
integer decoded PTS/time-base evidence, normalized by the first video PTS.
Generated representative requests retry at shot start if decode would cross
the boundary; explicit invalid requests fail. Fresh temporary images are
checked before replacement, so absent output cannot reuse a stale JPEG.
"""
from __future__ import annotations

import argparse
from bisect import bisect_left
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import re
import statistics
import subprocess
import sys
import tempfile

VERSION = "Fredtalk Shots 2.0.0"
TRACK_METHOD = "fredtalk-luma-delta-v2"
TIME_TOL = 0.002
SIZE = {"none", "extreme-wide", "wide", "medium-wide", "medium", "medium-close", "close", "extreme-close"}
CATEGORY = {"establishing", "subject", "dialogue", "reaction", "insert", "pov", "empty", "product", "text-card", "transition", "archive"}
CAMERA = {"static", "push-in", "pull-out", "zoom-in", "zoom-out", "pan-left", "pan-right", "tilt-up", "tilt-down", "truck-left", "truck-right", "pedestal-up", "pedestal-down", "tracking", "arc", "whip-pan", "handheld", "shake", "rack-focus", "micro-push", "roll", "drone"}
TRANSITION = {"cut", "dissolve", "fade-in", "fade-out", "whip", "match-cut", "wipe", "morph"}
RHYTHM = {"hook", "setup", "build", "beat", "turn", "payoff", "breath", "close"}
LABELS = {"size": "景别", "category": "类别", "camera": "运镜", "transitionIn": "入点转场", "rhythm": "节奏", "frame": "画面", "fight": "具体动作", "cameraRead": "镜头依据", "spatial": "空间关系", "audio": "声音", "onscreenText": "画面文字", "remake": "复刻建议", "note": "复核记录", "rhythmNote": "节奏依据"}


class EngineError(ValueError):
    """A clean, actionable input or media error."""


def finite(value):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)


def number(value, label, positive=False):
    if not finite(value) or (positive and value <= 0):
        raise EngineError(f"{label} must be a finite {'positive ' if positive else ''}number")
    return float(value)


def read_json(path):
    try:
        value = json.loads(Path(path).read_text(encoding="utf-8"),
                           parse_constant=lambda item: (_ for _ in ()).throw(ValueError(f"Invalid JSON number: {item}")))
    except (OSError, UnicodeError, ValueError) as exc:
        raise EngineError(f"Cannot read JSON {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise EngineError(f"JSON root must be an object: {path}")
    return value


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent,
                                         prefix=".shots-", suffix=".json", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(dump(value))
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def run_media(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=False)
    except OSError as exc:
        raise EngineError(f"Cannot run {command[0]}: {exc}") from exc
    if result.returncode:
        raise EngineError(f"{command[0]} failed (exit {result.returncode}): {result.stderr.strip()[-3000:]}")
    return result


def rate(text):
    try:
        numerator, denominator = str(text).split("/")
        result = float(numerator) / float(denominator)
    except (ValueError, ZeroDivisionError):
        try:
            result = float(text)
        except (TypeError, ValueError):
            return 0.0
    return result if math.isfinite(result) and result > 0 else 0.0


def probe(video):
    result = run_media(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)])
    try:
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        stream = next(item for item in streams if item.get("codec_type") == "video")
    except (ValueError, StopIteration, AttributeError, TypeError) as exc:
        raise EngineError("ffprobe found no usable video stream") from exc
    durations = [stream.get("duration"), data.get("format", {}).get("duration")]
    try:
        stream_start = float(stream.get("start_time", 0))
    except (ValueError, TypeError):
        stream_start = 0.0
    if not math.isfinite(stream_start):
        stream_start = 0.0
    duration = 0.0
    for index, candidate in enumerate(durations):
        try:
            duration = float(candidate)
        except (ValueError, TypeError):
            continue
        # Matroska's format fallback can be an absolute timeline end (e.g.
        # start=5, duration=7 for a two-second stream). Normalize that fallback
        # to the same zero-origin video clock used by cuts and sampled motion.
        if index == 1 and stream_start > 0 and duration > stream_start:
            duration -= stream_start
        if math.isfinite(duration) and duration > 0:
            break
    fps = rate(stream.get("avg_frame_rate")) or rate(stream.get("r_frame_rate"))
    width, height = stream.get("width"), stream.get("height")
    number(duration, "Video duration", True)
    number(fps, "Video fps", True)
    if not isinstance(width, int) or isinstance(width, bool) or width <= 0 or not isinstance(height, int) or isinstance(height, bool) or height <= 0:
        raise EngineError("Video dimensions must be positive integers")
    return {"durationSeconds": round(duration, 6), "fps": fps, "width": width,
            "height": height, "aspect": round(width / height, 6),
            "codec": str(stream.get("codec_name", "unknown")),
            "hasAudio": any(item.get("codec_type") == "audio" for item in streams)}


def detect_cuts(video, threshold, meta):
    expression = f"setpts=PTS-STARTPTS,select=gt(scene\\,{threshold:.12g}),showinfo"
    command = ["ffmpeg", "-hide_banner", "-loglevel", "info", "-xerror", "-i", str(video),
               "-map", "0:v:0", "-an", "-vf", expression, "-fps_mode", "passthrough", "-f", "null", "-"]
    tail, candidates, time_base = [], [], None
    try:
        process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    except OSError as exc:
        raise EngineError(f"Cannot run ffmpeg: {exc}") from exc
    try:
        assert process.stderr is not None
        for line in process.stderr:
            tail = (tail + [line.strip()])[-12:]
            if "showinfo" in line:
                clock = re.search(r"config in time_base:\s*(\d+)/(\d+)", line)
                if clock and int(clock.group(2)):
                    time_base = int(clock.group(1)) / int(clock.group(2))
                match = re.search(r"\bpts_time:([\d.eE+-]+)", line)
                if match:
                    ticks = re.search(r"\bpts:\s*(-?\d+)", line)
                    value = int(ticks.group(1)) * time_base if ticks and time_base is not None else float(match.group(1))
                    if math.isfinite(value):
                        candidates.append(round(value, 6))
        result = process.wait()
    except BaseException:
        process.kill()
        process.wait()
        raise
    finally:
        if process.stderr:
            process.stderr.close()
    if result:
        raise EngineError(f"FFmpeg scene decode failed (exit {result}): {' '.join(tail)[-2500:]}")
    margin = max(1 / meta["fps"], 0.02)
    return sorted({value for value in candidates if margin < value < meta["durationSeconds"] - margin})


def sample_track(video, hz, duration):
    frame_bytes = 96 * 54
    expression = (f"setpts=PTS-STARTPTS,fps=fps={hz:.12g}:start_time=0:round=up:eof_action=pass,"
                  "scale=96:54:flags=area,format=gray")
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-xerror", "-i", str(video),
               "-map", "0:v:0", "-an", "-vf", expression, "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    times, values, previous, count = [], [], None, 0
    with tempfile.TemporaryFile() as error_stream:
        try:
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=error_stream)
        except OSError as exc:
            raise EngineError(f"Cannot run ffmpeg: {exc}") from exc
        try:
            assert process.stdout is not None
            while True:
                frame = bytearray()
                while len(frame) < frame_bytes:
                    block = process.stdout.read(frame_bytes - len(frame))
                    if not block:
                        break
                    frame.extend(block)
                if not frame:
                    break
                if len(frame) != frame_bytes:
                    raise EngineError("FFmpeg returned a partial grayscale sample")
                time = count / hz
                if time < duration - 1e-9:
                    times.append(round(time, 9))
                    values.append(0.0 if previous is None else round(sum(abs(a - b) for a, b in zip(frame, previous)) / frame_bytes, 6))
                previous = frame
                count += 1
            result = process.wait()
        except BaseException:
            process.kill()
            process.wait()
            raise
        finally:
            if process.stdout:
                process.stdout.close()
        if result:
            error_stream.seek(0, os.SEEK_END)
            error_stream.seek(max(0, error_stream.tell() - 3000))
            detail = error_stream.read().decode("utf-8", "replace").strip()
            raise EngineError(f"FFmpeg sample decode failed (exit {result}): {detail}")
    expected = math.ceil(duration * hz - 1e-9)
    if len(values) != expected or not values:
        raise EngineError(f"Sample count {len(values)} does not cover the measured {duration:g}s at {hz:g}Hz (expected {expected})")
    return {"schemaVersion": 2, "method": TRACK_METHOD, "hz": hz, "times": times,
            "values": values, "durationSeconds": duration, "sourceSha256": digest(video)}


def load_track(path, duration):
    track = read_json(path)
    if track.get("schemaVersion") != 2 or isinstance(track.get("schemaVersion"), bool):
        raise EngineError("Track schemaVersion must be 2")
    if track.get("method") != TRACK_METHOD:
        raise EngineError(f"Track method must be {TRACK_METHOD}")
    hz = number(track.get("hz"), "Track hz", True)
    track_duration = number(track.get("durationSeconds"), "Track durationSeconds", True)
    if abs(track_duration - duration) > TIME_TOL:
        raise EngineError("Track durationSeconds disagrees with source duration")
    times, values = track.get("times"), track.get("values")
    if not isinstance(times, list) or not isinstance(values, list) or not values or len(times) != len(values):
        raise EngineError("Track times and nonempty values must be arrays with equal length")
    if len(times) != math.ceil(track_duration * hz - 1e-9):
        raise EngineError("Track sample count does not cover its complete duration")
    previous = -1.0
    for index, (time, value) in enumerate(zip(times, values)):
        number(time, f"Track times[{index}]")
        number(value, f"Track values[{index}]")
        if time < 0 or time >= track_duration or time <= previous or abs(time - index / hz) > 1e-7:
            raise EngineError(f"Track times[{index}] is outside the strictly ordered i/hz sample grid")
        if value < 0 or value > 255:
            raise EngineError(f"Track values[{index}] must be between 0 and 255")
        previous = time
    if abs(values[0]) > 1e-9:
        raise EngineError("Track first value must be zero")
    if not isinstance(track.get("sourceSha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", track["sourceSha256"]):
        raise EngineError("Track sourceSha256 must be a SHA-256 hexadecimal digest")
    return track


def measure(track, start, end):
    margin = 0.5 / track["hz"]
    first = bisect_left(track["times"], start + margin)
    stop = bisect_left(track["times"], end - margin)
    selected = track["values"][first:stop]
    return round(statistics.median(selected), 3) if selected else None


def blank_shot(index, start, end, track):
    return {"id": f"S{index:02d}", "title": "", "start": start, "end": end,
            "seconds": round(end - start, 6), "motion": measure(track, start, end),
            "size": "none", "category": "subject", "camera": "static", "transitionIn": "cut",
            "subjects": [], "principalSubjects": [], "backgroundSubjects": [], "castPresence": {},
            "frame": "", "fight": "", "beats": [], "cameraRead": "", "spatial": "", "audio": "",
            "onscreenText": "", "remake": "", "note": "", "rhythm": None, "rhythmNote": "", "frames": {}}


def metadata(doc):
    meta = doc.get("meta")
    if not isinstance(meta, dict):
        raise EngineError("meta must be an object")
    duration = number(meta.get("durationSeconds"), "meta.durationSeconds", True)
    fps = number(meta.get("fps"), "meta.fps", True)
    for key in ("width", "height"):
        value = meta.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise EngineError(f"meta.{key} must be a positive integer")
    if not isinstance(meta.get("hasAudio"), bool):
        raise EngineError("meta.hasAudio must be a boolean")
    if "aspect" in meta:
        number(meta["aspect"], "meta.aspect", True)
    if "sourceSha256" in meta:
        require(isinstance(meta["sourceSha256"], str) and bool(re.fullmatch(r"[0-9a-f]{64}", meta["sourceSha256"])),
                "meta.sourceSha256 must be a SHA-256 hexadecimal digest")
    return duration, fps


def intervals(doc, duration):
    shots = doc.get("shots")
    if not isinstance(shots, list) or not shots:
        raise EngineError("shots must be a nonempty array")
    previous, result = 0.0, []
    for index, shot in enumerate(shots):
        if not isinstance(shot, dict):
            raise EngineError(f"shots[{index}] must be an object")
        start = number(shot.get("start"), f"shots[{index}].start")
        end = number(shot.get("end"), f"shots[{index}].end")
        if start < 0 or abs(start - previous) > TIME_TOL or end <= start or end > duration + TIME_TOL:
            raise EngineError(f"shots[{index}] is noncontiguous or outside the source timeline")
        seconds = number(shot.get("seconds"), f"shots[{index}].seconds", True)
        if abs(seconds - (end - start)) > TIME_TOL:
            raise EngineError(f"shots[{index}].seconds disagrees with end-start")
        result.append((start, end))
        previous = end
    if abs(previous - duration) > TIME_TOL:
        raise EngineError("shots do not cover the complete source duration")
    return result


def cut_arrays(doc, duration):
    result = {}
    for name in ("seedCuts", "manualCuts", "removedCuts"):
        values = doc.get(name)
        if not isinstance(values, list):
            raise EngineError(f"{name} must be an array")
        previous = -1.0
        for index, value in enumerate(values):
            number(value, f"{name}[{index}]")
            if value <= 0 or value >= duration or value <= previous:
                raise EngineError(f"{name} must contain ordered unique boundaries strictly inside the source")
            previous = value
        result[name] = list(values)
    for value in result["removedCuts"]:
        if not any(abs(value - cut) <= 1e-6 for cut in result["seedCuts"]):
            raise EngineError("removedCuts contains a boundary absent from seedCuts")
    for value in result["manualCuts"]:
        if any(abs(value - cut) <= 1e-6 for cut in result["seedCuts"]):
            raise EngineError("manualCuts duplicates an original seed boundary")
    return result


def reconstructed(cuts):
    return sorted([cut for cut in cuts["seedCuts"] if not any(abs(cut - removed) <= 1e-6 for removed in cuts["removedCuts"])] + cuts["manualCuts"])


def check_boundaries(doc, duration, fps, times):
    cuts = cut_arrays(doc, duration)
    expected, actual = reconstructed(cuts), [end for _, end in times[:-1]]
    if len(expected) != len(actual) or any(abs(a - b) > TIME_TOL + 1e-9 for a, b in zip(expected, actual)):
        raise EngineError("Shot boundaries do not reconstruct seedCuts - removedCuts + manualCuts")
    return cuts


def seed(args):
    threshold = number(args.threshold, "threshold")
    if not 0 < threshold < 1:
        raise EngineError("threshold must satisfy 0 < threshold < 1")
    hz = number(args.hz, "hz", True)
    video = args.video.resolve(strict=True)
    if not video.is_file():
        raise EngineError("Video must be a file")
    if args.track.resolve() == video:
        raise EngineError("Track path must not overwrite the source video")
    meta = probe(video)
    cuts = detect_cuts(video, threshold, meta)
    track = sample_track(video, hz, meta["durationSeconds"])
    meta["sourceSha256"] = track["sourceSha256"]
    points = [0.0] + cuts + [meta["durationSeconds"]]
    doc = {"source": str(video), "title": args.title, "lang": "zh-CN", "meta": meta,
           "params": {"threshold": threshold, "hz": hz, "cutMethod": "ffmpeg-scene",
                      "motionMethod": TRACK_METHOD}, "seedCuts": cuts, "manualCuts": [], "removedCuts": [],
           "cast": [], "shots": [blank_shot(index + 1, start, end, track)
                                  for index, (start, end) in enumerate(zip(points, points[1:]))]}
    write_json(args.track, track)
    print(dump(doc), end="")


def recut(args):
    doc = read_json(args.input)
    duration, fps = metadata(doc)
    old_intervals = intervals(doc, duration)
    cuts = check_boundaries(doc, duration, fps, old_intervals)
    track = load_track(args.track, duration)
    if doc["meta"].get("sourceSha256"):
        require(doc["meta"]["sourceSha256"] == track["sourceSha256"], "Track sourceSha256 disagrees with source metadata")
    # Validate all requested times before applying any edit.
    edits = [(kind, number(value, f"{kind} time")) for kind, values in (("split", args.split), ("merge", args.merge)) for value in values]
    for kind, value in edits:
        if not 0 < value < duration:
            raise EngineError(f"{kind} time must be strictly inside the source duration")
    if any(abs(split - merge) <= max(1 / fps, 0.02) for split in args.split for merge in args.merge):
        raise EngineError("Split and merge requests conflict at the same boundary")
    for kind, value in edits:
        current = reconstructed(cuts)
        if kind == "split":
            value = round(value, 6)
            if value <= 0 or value >= duration or any(abs(value - cut) <= 1e-6 for cut in current):
                raise EngineError("Split must create a new interior boundary")
            original = next((cut for cut in cuts["seedCuts"] if abs(value - cut) <= 1e-6), None)
            if original is not None:
                cuts["removedCuts"] = [cut for cut in cuts["removedCuts"] if abs(cut - original) > 1e-6]
            else:
                cuts["manualCuts"].append(value)
                cuts["manualCuts"].sort()
        else:
            if not current:
                raise EngineError("Merge requires an existing interior boundary")
            nearest = min(current, key=lambda cut: abs(cut - value))
            if abs(nearest - value) > max(1 / fps, 0.02) + 1e-9:
                raise EngineError("Merge time has no boundary within max(1/fps, 0.02) seconds")
            if any(abs(nearest - cut) <= 1e-6 for cut in cuts["manualCuts"]):
                cuts["manualCuts"] = [cut for cut in cuts["manualCuts"] if abs(cut - nearest) > 1e-6]
            else:
                cuts["removedCuts"].append(nearest)
                cuts["removedCuts"].sort()
    revised = []
    points = [0.0] + reconstructed(cuts) + [duration]
    for index, (start, end) in enumerate(zip(points, points[1:]), 1):
        old = next((shot for shot, (a, b) in zip(doc["shots"], old_intervals)
                    if abs(a - start) <= 1e-6 and abs(b - end) <= 1e-6), None)
        shot = copy.deepcopy(old) if old is not None else blank_shot(index, start, end, track)
        shot.update(id=f"S{index:02d}", start=start, end=end, seconds=round(end - start, 6), motion=measure(track, start, end))
        revised.append(shot)
    doc.update(cuts)
    doc["shots"] = revised
    print(dump(doc), end="")


def contained(base, relative, label):
    if not isinstance(relative, str) or not relative.strip():
        raise EngineError(f"{label} must be a nonempty relative path")
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts or "\\" in relative or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", relative):
        raise EngineError(f"{label} must be a safe contained relative path")
    target = (base / path).resolve()
    if not target.is_relative_to(base.resolve()):
        raise EngineError(f"{label} escapes the input directory")
    return target


def decoded_records(log):
    """Read integer PTS evidence rather than showinfo's rounded pts_time text."""
    result, clock = [], None
    for line in log.splitlines():
        if "showinfo" not in line:
            continue
        match = re.search(r"config in time_base:\s*(\d+)/(\d+)", line)
        if match and int(match.group(2)):
            clock = (int(match.group(1)), int(match.group(2)))
        ticks = re.search(r"\bpts:\s*(-?\d+)", line)
        if ticks and clock:
            pts = int(ticks.group(1))
            result.append({"pts": pts, "timeBase": {"num": clock[0], "den": clock[1]},
                           "sourcePtsTime": pts * clock[0] / clock[1], "log": line})
    return result


def source_first_pts(video):
    output = run_media(["ffmpeg", "-hide_banner", "-loglevel", "info", "-xerror", "-copyts",
                        "-i", str(video), "-map", "0:v:0", "-an", "-vf", "showinfo",
                        "-frames:v", "1", "-fps_mode", "passthrough", "-f", "null", "-"])
    records = decoded_records(output.stderr)
    require(bool(records), "Could not prove the first decoded source presentation time")
    return records[0]["sourcePtsTime"]


def source_format_start(video):
    output = run_media(["ffprobe", "-v", "error", "-show_entries", "format=start_time", "-of", "json", str(video)])
    try:
        value = float(json.loads(output.stdout).get("format", {}).get("start_time", 0))
    except (ValueError, TypeError, AttributeError):
        value = 0.0
    return value if math.isfinite(value) else 0.0


def frames(args):
    doc = read_json(args.input)
    duration, _ = metadata(doc)
    times = intervals(doc, duration)
    video = args.video.resolve(strict=True)
    if not video.is_file():
        raise EngineError("Video must be a file")
    video_hash = digest(video)
    if doc["meta"].get("sourceSha256"):
        require(video_hash == doc["meta"]["sourceSha256"], "Video sourceSha256 disagrees with measured source metadata")
    base = args.input.resolve().parent
    jobs = []
    for index, (shot, (start, end)) in enumerate(zip(doc["shots"], times), 1):
        frame_info = shot.get("frames", {})
        if not isinstance(frame_info, dict):
            raise EngineError(f"shots[{index - 1}].frames must be an object")
        for pick, fraction in (("a", 0.15), ("b", 0.85)):
            frame = frame_info.get(pick, {})
            if not isinstance(frame, dict):
                raise EngineError(f"{shot.get('id', index)} frame {pick} must be an object")
            frame = copy.deepcopy(frame)
            frame.setdefault("src", f"frames/{shot.get('id', f'S{index:02d}')}{pick}.jpg")
            generated = "time" not in frame
            requested = number(frame.get("time", round(start + (end - start) * fraction, 2)), f"frame {pick} time")
            # Very short shots cannot safely use centisecond rounding.
            if generated and not start <= requested < end:
                requested = round(start + (end - start) * fraction, 6)
            if not start <= requested < end:
                raise EngineError(f"{shot.get('id', index)} frame {pick} time must be inside its shot")
            target = contained(base, frame["src"], "Frame src")
            if target == video or target == args.input.resolve():
                raise EngineError("Frame path must not overwrite the source or input JSON")
            if target.suffix.lower() not in (".jpg", ".jpeg"):
                raise EngineError("Frame output path must use .jpg or .jpeg")
            frame.update(time=requested, timeBasis="requested-seek")
            frame.pop("decodedEvidence", None)
            jobs.append((frame_info, pick, frame, target, generated, start, end))
    if len({job[3] for job in jobs}) != len(jobs):
        raise EngineError("Frame output paths must be unique")
    first_pts = source_first_pts(video)
    seek_offset = first_pts - source_format_start(video)
    # A fresh temporary JPEG is mandatory: FFmpeg can exit 0 without producing
    # a frame, and an existing destination must never turn that into success.
    with tempfile.TemporaryDirectory(prefix=".shots-frames-", dir=base) as directory:
        completed = []
        for index, (frame_info, pick, frame, target, generated, start, end) in enumerate(jobs):
            temporary = Path(directory) / f"sample-{index:06d}.jpg"
            attempts = [frame["time"]]
            if generated and abs(frame["time"] - start) > 1e-9:
                attempts.append(start)
            evidence = None
            for requested in attempts:
                temporary.unlink(missing_ok=True)
                output = run_media(["ffmpeg", "-hide_banner", "-loglevel", "info", "-xerror", "-y",
                                    "-ss", f"{seek_offset + requested:.12f}", "-copyts",
                                    "-i", str(video), "-map", "0:v:0", "-an", "-vf", "showinfo",
                                    "-frames:v", "1", "-fps_mode", "passthrough", "-pix_fmt", "yuvj444p", "-q:v", "2", "-update", "1", str(temporary)])
                records = decoded_records(output.stderr)
                if not temporary.is_file() or temporary.stat().st_size == 0 or not records:
                    continue
                actual = records[0]["sourcePtsTime"] - first_pts
                # Cut times use six decimal places; apply the same precision to
                # exact decoded PTS only for this boundary membership comparison.
                if not start <= round(actual, 6) < end:
                    continue
                evidence = records[0]
                evidence.update(method="ffmpeg-showinfo", ptsTime=round(actual, 9), sourceStartPtsTime=first_pts,
                                inputSeekTime=round(seek_offset + requested, 9), sourceSha256=video_hash)
                frame.update(time=requested, timeBasis="requested-seek", decodedEvidence=evidence)
                break
            if evidence is None:
                raise EngineError(f"No fresh decoded frame inside [{start:g}, {end:g}) for {target.name} at requested seek {frame['time']:g}; choose another in-shot time")
            completed.append((temporary, target))
        # Commit only after every requested image has produced fresh, in-shot data.
        for temporary, target in completed:
            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(temporary, target)
    # Attach previously absent dictionaries after every preflight check succeeded.
    offset = 0
    for shot in doc["shots"]:
        shot["frames"] = {pick: jobs[offset + index][2] for index, pick in enumerate(("a", "b"))}
        offset += 2
    write_json(args.input, doc)
    print(dump(doc), end="")


def sheet(args):
    doc = read_json(args.input)
    if args.cols <= 0 or args.rows <= 0:
        raise EngineError("Sheet cols and rows must be positive integers")
    shots = doc.get("shots")
    if not isinstance(shots, list) or not shots:
        raise EngineError("shots must be a nonempty array")
    base = args.input.resolve().parent
    images = []
    for index, shot in enumerate(shots):
        try:
            path = contained(base, shot["frames"][args.pick]["src"], f"shots[{index}] frame src")
        except (KeyError, TypeError) as exc:
            raise EngineError(f"shots[{index}] has no frame {args.pick}") from exc
        if not path.is_file():
            raise EngineError(f"Frame image does not exist: {path}")
        images.append(path)
    output = contained(base, "sheets", "Sheet directory")
    output.mkdir(parents=True, exist_ok=True)
    pages, capacity = [], args.cols * args.rows
    source = doc.get("source")
    source_path = None
    if isinstance(source, str) and source.strip() and not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", source):
        source_path = Path(source)
        source_path = (source_path if source_path.is_absolute() else base / source_path).resolve()
    for index, offset in enumerate(range(0, len(images), capacity), 1):
        page_images = images[offset:offset + capacity]
        target = contained(base, f"sheets/{args.pick}-{index:02d}.jpg", "Sheet output")
        if target in images or target == args.input.resolve() or target == source_path:
            raise EngineError("Sheet output must not overwrite an input frame, source, or input JSON")
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", prefix=".shots-sheet-", suffix=".txt", dir=base, delete=False) as listing:
            list_path = Path(listing.name)
            for image in page_images:
                escaped = str(image).replace("'", "'\\''")
                listing.write(f"file '{escaped}'\nduration 1\n")
        try:
            expression = (f"scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2:color=black,"
                          f"tile={args.cols}x{args.rows}:nb_frames={len(page_images)}:padding=2:margin=2:color=black")
            run_media(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
                       "-vf", expression, "-frames:v", "1", "-q:v", "3", "-update", "1", str(target)])
            if not target.is_file() or target.stat().st_size == 0:
                raise EngineError(f"FFmpeg did not generate {target}")
        finally:
            list_path.unlink(missing_ok=True)
        pages.append(str(target.relative_to(base)))
    print(dump({"sheets": pages, "pick": args.pick, "cols": args.cols, "rows": args.rows}), end="")


class Validation:
    def __init__(self):
        self.errors, self.warnings, self.checks = [], [], []

    def check(self, name, function):
        try:
            function()
        except (EngineError, OSError, KeyError, TypeError, ValueError, OverflowError) as exc:
            self.errors.append(f"{name}: {exc}")
            self.checks.append({"name": name, "status": "fail", "message": str(exc)})
        else:
            self.checks.append({"name": name, "status": "pass", "message": "通过"})

    def skip(self, name, message):
        self.checks.append({"name": name, "status": "skipped", "message": message})

    def report(self):
        return {"ok": not self.errors, "errors": self.errors, "warnings": self.warnings, "checks": self.checks}


def require(condition, message):
    if not condition:
        raise EngineError(message)


def taxonomy_check(doc):
    shots = doc.get("shots")
    require(isinstance(shots, list) and bool(shots), "shots must be a nonempty array")
    seen = set()
    for index, shot in enumerate(shots, 1):
        require(isinstance(shot, dict), f"shots[{index - 1}] must be an object")
        identifier = shot.get("id")
        require(isinstance(identifier, str) and identifier == f"S{index:02d}" and identifier not in seen, "Shot ids must be unique and sequential S01, S02, ...")
        seen.add(identifier)
        for field, choices in (("size", SIZE), ("category", CATEGORY), ("camera", CAMERA), ("transitionIn", TRANSITION)):
            require(isinstance(shot.get(field), str) and shot[field] in choices, f"{identifier}.{field} has an unknown taxonomy value")
        require(shot.get("rhythm") in (None, "") or isinstance(shot.get("rhythm"), str) and shot["rhythm"] in RHYTHM, f"{identifier}.rhythm has an unknown taxonomy value")


def cast_check(doc):
    cast = doc.get("cast")
    require(isinstance(cast, list), "cast must be an array")
    ids = set()
    for actor in cast:
        require(isinstance(actor, dict), "Each cast entry must be an object")
        identifier = actor.get("id")
        require(isinstance(identifier, str) and bool(identifier.strip()), "Cast ids must be nonempty strings")
        require(identifier not in ids, f"Duplicate cast id: {identifier}")
        require("entityType" not in actor or actor["entityType"] in ("character", "group"), "cast.entityType must be character or group")
        ids.add(identifier)
    shots = doc.get("shots")
    require(isinstance(shots, list), "shots must be an array")
    for index, shot in enumerate(shots):
        require(isinstance(shot, dict), f"shots[{index}] must be an object")
        subjects = shot.get("subjects")
        require(isinstance(subjects, list), f"shots[{index}].subjects must be an array")
        require(all(isinstance(value, str) and value in ids for value in subjects), f"shots[{index}] references an unknown cast subject")
        require(len(subjects) == len(set(subjects)), f"shots[{index}] repeats a subject")
        for key in ("principalSubjects", "backgroundSubjects"):
            if key in shot:
                require(isinstance(shot[key], list) and all(isinstance(value, str) and value in subjects for value in shot[key]), f"shots[{index}].{key} must reference visible subjects")
                require(len(shot[key]) == len(set(shot[key])), f"shots[{index}].{key} repeats a subject")
        require(not set(shot.get("principalSubjects", [])) & set(shot.get("backgroundSubjects", [])),
                f"shots[{index}] principalSubjects and backgroundSubjects overlap")
        if "castPresence" in shot:
            require(isinstance(shot["castPresence"], dict), f"shots[{index}].castPresence must be an object")
            require(all(identifier in subjects and isinstance(text, str) and bool(text.strip())
                        for identifier, text in shot["castPresence"].items()),
                    f"shots[{index}].castPresence must describe visible subjects")
        if shot.get("category") == "empty":
            require(not subjects, f"shots[{index}] empty category must have no subjects")
        if shot.get("category") == "reaction":
            require(bool(subjects), f"shots[{index}] reaction category requires a visible subject")
        if shot.get("category") == "dialogue":
            require(isinstance(shot.get("audio"), str) and bool(shot["audio"].strip()), f"shots[{index}] dialogue category requires audio evidence")
        if shot.get("category") == "text-card":
            require(isinstance(shot.get("onscreenText"), str) and bool(shot["onscreenText"].strip()), f"shots[{index}] text-card category requires onscreenText")
        if shot.get("category") in ("pov", "archive"):
            require(isinstance(shot.get("note"), str) and bool(shot["note"].strip()),
                    f"shots[{index}] {shot['category']} category requires a note stating its evidence")


def description_check(doc):
    previous = None
    require(isinstance(doc.get("shots"), list), "shots must be an array")
    for index, shot in enumerate(doc["shots"]):
        require(isinstance(shot, dict), f"shots[{index}] must be an object")
        text = shot.get("frame")
        require(isinstance(text, str) and bool(text.strip()), f"shots[{index}].frame needs reviewed description")
        chinese = len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff]", text))
        words = re.findall(r"[A-Za-z]+(?:['’-][A-Za-z]+)*", text)
        require(chinese >= 12 or len(words) >= 8, f"shots[{index}].frame needs at least 12 Chinese characters or 8 English words")
        normalized = re.sub(r"[\W_]+", "", text, flags=re.UNICODE).casefold()
        require(normalized != previous, f"shots[{index}].frame repeats the consecutive description")
        require(not re.fullmatch(r"(.)\1+", normalized), f"shots[{index}].frame is not a meaningful description")
        previous = normalized


def rhythm_check(doc):
    require(isinstance(doc.get("shots"), list), "shots must be an array")
    marked = []
    for index, shot in enumerate(doc["shots"]):
        require(isinstance(shot, dict), f"shots[{index}] must be an object")
        marked.append(shot.get("rhythm") not in (None, ""))
        if marked[-1]:
            require(isinstance(shot.get("rhythm"), str) and shot["rhythm"] in RHYTHM, f"shots[{index}].rhythm has an unknown value")
            require(isinstance(shot.get("rhythmNote"), str) and bool(shot["rhythmNote"].strip()), f"shots[{index}].rhythmNote needs reviewed notes")
            note = re.sub(r"[\s.。!！?？:：_\-]+", "", shot["rhythmNote"]).casefold()
            require(note not in {"n/a", "na", "todo", "tbd", "none", "null", "待补充", "待填写", "待标注", "未填写", "无"},
                    f"shots[{index}].rhythmNote must not be a placeholder")
    require(not any(marked) or all(marked), "rhythm must be annotated for all shots or for none")


def measured_check(doc, track):
    for index, shot in enumerate(doc["shots"]):
        expected = measure(track, shot["start"], shot["end"])
        actual = shot.get("motion")
        if expected is None:
            require(actual is None, f"shots[{index}].motion must be null when no interior samples exist")
        else:
            require(finite(actual) and abs(actual - expected) <= TIME_TOL, f"shots[{index}].motion disagrees with measured interval median")


def decoded_evidence(frame, start, end):
    evidence = frame.get("decodedEvidence")
    require(isinstance(evidence, dict) and evidence.get("method") == "ffmpeg-showinfo", "Decoded frame evidence needs the actual ffmpeg-showinfo record")
    actual = number(evidence.get("ptsTime"), "decodedEvidence.ptsTime")
    log = evidence.get("log")
    require(isinstance(log, str), "decodedEvidence.log must contain the decoded showinfo record")
    if "pts" in evidence or "timeBase" in evidence:
        ticks, clock = evidence.get("pts"), evidence.get("timeBase")
        require(isinstance(ticks, int) and not isinstance(ticks, bool), "decodedEvidence.pts must be integer source ticks")
        require(isinstance(clock, dict), "decodedEvidence.timeBase must be an object")
        numerator = number(clock.get("num"), "decodedEvidence.timeBase.num", True)
        denominator = number(clock.get("den"), "decodedEvidence.timeBase.den", True)
        origin = number(evidence.get("sourceStartPtsTime"), "decodedEvidence.sourceStartPtsTime")
        require(abs(ticks * numerator / denominator - origin - actual) <= 1e-6, "decodedEvidence integer PTS disagrees with its source-normalized time")
        recorded = re.search(r"\bpts:\s*(-?\d+)", log)
        require(recorded is not None and int(recorded.group(1)) == ticks, "decodedEvidence.log disagrees with integer PTS")
    else:
        records = re.findall(r"\bpts_time:([\d.eE+-]+)", log)
        require(any(abs(float(item) - actual) <= 1e-6 for item in records), "decodedEvidence time disagrees with its decoded showinfo record")
    require(start <= round(actual, 6) < end, "The actual decoded frame lies outside its shot")
    if frame.get("timeBasis") == "decoded-pts":
        require(abs(actual - frame["time"]) <= 1e-6, "decoded-pts time disagrees with its decoded showinfo record")


def frame_check(doc, input_path, frame_dir):
    base, root = input_path.resolve().parent, frame_dir.resolve()
    require(root.is_dir(), f"Provided frames directory does not exist: {root}")
    for index, shot in enumerate(doc["shots"]):
        require(isinstance(shot.get("frames"), dict), f"shots[{index}].frames must be an object")
        for pick in ("a", "b"):
            frame = shot["frames"].get(pick)
            require(isinstance(frame, dict), f"shots[{index}].frames.{pick} must be an object")
            path = contained(base, frame.get("src"), f"shots[{index}].frames.{pick}.src")
            require(path.is_relative_to(root), f"shots[{index}].frames.{pick}.src escapes the provided frames directory")
            require(path.is_file() and path.stat().st_size > 0, f"Missing frame image: {path}")
            time = number(frame.get("time"), f"shots[{index}].frames.{pick}.time")
            require(shot["start"] <= time < shot["end"], f"shots[{index}].frames.{pick}.time is outside its shot")
            basis = frame.get("timeBasis")
            require(basis in ("requested-seek", "decoded-pts"), f"shots[{index}].frames.{pick}.timeBasis is unrecorded or unknown")
            if basis == "decoded-pts" or "decodedEvidence" in frame:
                decoded_evidence(frame, shot["start"], shot["end"])
                if isinstance(doc.get("meta"), dict) and doc["meta"].get("sourceSha256") and frame["decodedEvidence"].get("sourceSha256"):
                    require(frame["decodedEvidence"]["sourceSha256"] == doc["meta"]["sourceSha256"], "Frame decodedEvidence sourceSha256 disagrees with source metadata")


def validate(args):
    result = Validation()
    try:
        doc = read_json(args.input)
    except EngineError as exc:
        result.check("JSON", lambda: (_ for _ in ()).throw(exc))
        doc = None
    if doc is not None:
        result.check("metadata", lambda: metadata(doc))
        meta = doc.get("meta") if isinstance(doc.get("meta"), dict) else {}
        duration, fps = meta.get("durationSeconds"), meta.get("fps")
        usable_meta = finite(duration) and duration > 0 and finite(fps) and fps > 0
        if usable_meta:
            result.check("timeline", lambda: intervals(doc, duration))
            result.check("cut provenance", lambda: check_boundaries(doc, duration, fps, intervals(doc, duration)))
        else:
            result.skip("timeline", "无法检查：源时长或帧率无效")
            result.skip("cut provenance", "无法检查：源时长或帧率无效")
        result.check("taxonomy and ids", lambda: taxonomy_check(doc))
        result.check("cast and categories", lambda: cast_check(doc))
        result.check("frame descriptions", lambda: description_check(doc))
        result.check("rhythm", lambda: rhythm_check(doc))
        if args.track:
            track_box = []
            def check_track():
                require(usable_meta, "Cannot compare track without valid source duration")
                track = load_track(args.track, duration)
                if meta.get("sourceSha256"):
                    require(meta["sourceSha256"] == track["sourceSha256"], "Track sourceSha256 disagrees with source metadata")
                track_box.append(track)
            result.check("measurement track", check_track)
            if track_box:
                result.check("measured motion", lambda: measured_check(doc, track_box[0]))
                for index, shot in enumerate(doc.get("shots", []) if isinstance(doc.get("shots"), list) else []):
                    if isinstance(shot, dict) and shot.get("camera") == "static" and finite(shot.get("motion")) and shot["motion"] >= 20:
                        result.warnings.append(f"S{index + 1:02d}: 固定机位标注的画面差分较高；复核稳定背景与主体运动。")
            else:
                result.skip("measured motion", "无法检查：测量轨道无效")
        else:
            result.skip("measurement track", "未提供 --track；未核验测量轨道")
            result.skip("measured motion", "未提供 --track；未核验逐镜运动测量")
        if args.frames:
            result.check("frame images and timestamps", lambda: frame_check(doc, args.input, args.frames))
        else:
            result.skip("frame images and timestamps", "未提供 --frames；未核验关键帧文件与时间依据")
    report = result.report()
    if args.json:
        print(dump(report), end="")
    else:
        symbols = {"pass": "✓", "fail": "✗", "skipped": "⊘"}
        for check in result.checks:
            print(f"{symbols[check['status']]} {check['name']}: {check['message']}")
        for warning in result.warnings:
            print(f"✓ warning: {warning}")
        print("✓ scope: 源数据与结构检查不能证明人物、动作、运镜或叙事解释已完成视觉复核。")
    return 0 if report["ok"] else 1


def stats(args):
    doc = read_json(args.input)
    duration, _ = metadata(doc)
    intervals(doc, duration)
    lengths = [shot["end"] - shot["start"] for shot in doc["shots"]]
    distributions = {}
    for field in ("size", "category", "camera", "rhythm"):
        counts = {}
        for shot, seconds in zip(doc["shots"], lengths):
            value = shot.get(field)
            require(isinstance(value, str) or value is None, f"{field} must be a string or null")
            key = value or "unannotated"
            counts[key] = counts.get(key, 0.0) + seconds
        distributions[field] = {key: {"seconds": round(seconds, 6), "percent": round(seconds / duration * 100, 3)}
                                for key, seconds in sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))}
    print(dump({"duration": duration, "count": len(lengths), "mean": round(statistics.mean(lengths), 6),
                "median": round(statistics.median(lengths), 6), "min": round(min(lengths), 6),
                "max": round(max(lengths), 6), "distributions": distributions}), end="")


def md(args):
    doc = read_json(args.input)
    duration, _ = metadata(doc)
    intervals(doc, duration)
    title = doc.get("title", "逐镜拉片")
    lines = [f"# Fredtalk Shots · {title}", "", f"原片：{doc.get('source', '')}", "",
             f"全片 {duration:.3f} 秒，共 {len(doc['shots'])} 镜。测量数据与视觉解释分别记录。", ""]
    for shot in doc["shots"]:
        lines += [f"## {shot.get('id', '')} · {shot.get('title') or '待标注'}", "",
                  f"时间：{shot['start']:.3f}–{shot['end']:.3f} 秒 · 时长 {shot['seconds']:.3f} 秒", "",
                  f"画内主体：{'、'.join(shot.get('subjects', [])) or '未标注'}", "",
                  f"运动测量：{shot.get('motion') if shot.get('motion') is not None else '无可用内部样本'}", ""]
        for key, label in LABELS.items():
            lines += [f"{label}：{shot.get(key) or '待标注'}", ""]
        beats = shot.get("beats", [])
        require(isinstance(beats, list), "beats must be an array")
        if beats:
            lines += ["动作分段：", ""]
            for beat in beats:
                require(isinstance(beat, list) and len(beat) == 2, "Each beat must contain timestamp and text")
                lines.append(f"- {beat[0]}：{beat[1]}")
            lines.append("")
    print("\n".join(lines))


def parser():
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--version", action="version", version=VERSION)
    commands = root.add_subparsers(dest="command", required=True)
    item = commands.add_parser("seed", help="Decode source, detect candidate cuts, and measure a v2 track")
    item.add_argument("video", type=Path)
    item.add_argument("--track", type=Path, required=True)
    item.add_argument("--title", required=True)
    item.add_argument("--threshold", type=float, default=0.3)
    item.add_argument("--hz", type=float, default=8.0)
    item.set_defaults(function=seed)
    item = commands.add_parser("recut", help="Revise boundaries while retaining annotations only on unchanged intervals")
    item.add_argument("input", type=Path)
    item.add_argument("--track", type=Path, required=True)
    item.add_argument("--split", type=float, action="append", default=[])
    item.add_argument("--merge", type=float, action="append", default=[])
    item.set_defaults(function=recut)
    item = commands.add_parser("frames", help="Extract a/b sample JPEGs and save requested seek timestamps")
    item.add_argument("input", type=Path)
    item.add_argument("--video", type=Path, required=True)
    item.set_defaults(function=frames)
    item = commands.add_parser("sheet", help="Create paginated FFmpeg contact sheets from extracted frames")
    item.add_argument("input", type=Path)
    item.add_argument("--cols", type=int, default=4)
    item.add_argument("--rows", type=int, default=6)
    item.add_argument("--pick", choices=("a", "b"), default="a")
    item.set_defaults(function=sheet)
    item = commands.add_parser("validate", help="Validate timeline, reviewed fields, measured motion, and frame evidence")
    item.add_argument("input", type=Path)
    item.add_argument("--track", type=Path)
    item.add_argument("--frames", type=Path)
    item.add_argument("--json", action="store_true")
    item.set_defaults(function=validate)
    for name, function in (("md", md), ("stats", stats)):
        item = commands.add_parser(name)
        item.add_argument("input", type=Path)
        item.set_defaults(function=function)
    return root


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        return args.function(args) or 0
    except (EngineError, OSError, UnicodeError, KeyError, TypeError, ValueError, OverflowError) as exc:
        print(f"Fredtalk Shots: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
