---
name: yt-dlp --ffmpeg-location must be a directory
description: MP3/audio extraction fails silently if --ffmpeg-location is a bare command name
---

yt-dlp's `--ffmpeg-location` flag derives the ffprobe path by taking the *directory* of whatever value is passed. If you pass a bare command name like `"ffmpeg"` (relying on PATH, no path separator), yt-dlp can't compute a directory, its ffprobe lookup silently becomes `None`, and any postprocessor step (`--extract-audio`, MP3 conversion, etc.) fails with a cryptic Python error: `expected str, bytes or os.PathLike object, not NoneType`. The raw video download itself still succeeds — only the ffmpeg postprocessing step breaks.

**Why:** Discovered when MP3 conversion jobs failed even though `ffmpeg -version` succeeded fine (the availability check spawns the binary directly, not through yt-dlp's postprocessor path resolution).

**How to apply:** Resolve an absolute path to the ffmpeg binary (e.g. via `which ffmpeg`) for direct spawning/availability checks, but pass `--ffmpeg-location` as the *containing directory* of that binary, not the binary path itself and never a bare command name.
