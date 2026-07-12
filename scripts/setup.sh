#!/usr/bin/env bash
# YTOUDown — pre-flight dependency check
# Run with: pnpm setup  OR  bash scripts/setup.sh
set -euo pipefail

HAS_ERROR=0
SEP="──────────────────────────────────────────"

echo ""
echo "  YTOUDown — Dependency Check"
echo "$SEP"

check() {
  local name="$1"
  local cmd="$2"
  local hint="$3"

  if command -v "$cmd" &>/dev/null; then
    local ver
    ver=$(${4:-"$cmd --version"} 2>&1 | head -1)
    echo "  ✅  $name: $ver"
  else
    echo "  ❌  $name not found on PATH"
    echo "      $hint"
    HAS_ERROR=1
  fi
}

echo ""

# Node.js
check "Node.js" "node" "Install from https://nodejs.org or via nvm / fnm" "node --version"

# pnpm
check "pnpm" "pnpm" "npm install -g pnpm   OR   corepack enable && corepack prepare pnpm@latest --activate" "pnpm --version"

# yt-dlp
if [ -n "${YT_DLP_PATH:-}" ]; then
  if [ -x "$YT_DLP_PATH" ]; then
    ver=$("$YT_DLP_PATH" --version 2>/dev/null || echo "found at $YT_DLP_PATH")
    echo "  ✅  yt-dlp (from YT_DLP_PATH): $ver"
  else
    echo "  ❌  YT_DLP_PATH is set to '$YT_DLP_PATH' but the file is not executable or doesn't exist"
    HAS_ERROR=1
  fi
else
  check "yt-dlp" "yt-dlp" \
    "pip install yt-dlp  OR  brew install yt-dlp  OR  see https://github.com/yt-dlp/yt-dlp#installation" \
    "yt-dlp --version"
fi

# ffmpeg
if [ -n "${FFMPEG_PATH:-}" ]; then
  if [ -x "$FFMPEG_PATH" ]; then
    ver=$("$FFMPEG_PATH" -version 2>&1 | head -1)
    echo "  ✅  ffmpeg (from FFMPEG_PATH): $ver"
  else
    echo "  ❌  FFMPEG_PATH is set to '$FFMPEG_PATH' but the file is not executable or doesn't exist"
    HAS_ERROR=1
  fi
else
  check "ffmpeg" "ffmpeg" \
    "brew install ffmpeg  OR  sudo apt install ffmpeg  OR  see https://ffmpeg.org/download.html" \
    "ffmpeg -version"
fi

echo ""
echo "$SEP"

if [ "$HAS_ERROR" -eq 1 ]; then
  echo ""
  echo "  ⚠️   One or more required dependencies are missing."
  echo "       Install them, then run 'pnpm setup' again."
  echo ""
  echo "  Tip: You can override binary paths with environment variables:"
  echo "       YT_DLP_PATH=/path/to/yt-dlp"
  echo "       FFMPEG_PATH=/path/to/ffmpeg"
  echo ""
  exit 1
fi

echo ""
echo "  ✅  All dependencies are present."
echo ""
echo "  Start the app:"
echo "    pnpm dev              # both frontend + backend"
echo "    pnpm dev:frontend     # Vite dev server only"
echo "    pnpm dev:backend      # Express API only"
echo ""
