#!/usr/bin/env bash
# Resolves the yt-dlp binary from the Nix store dynamically, working around
# cases where the PATH hasn't been refreshed after installing the yt-dlp
# module (requires full environment restart to update PATH normally).
set -euo pipefail
BIN=$(command -v yt-dlp 2>/dev/null || true)
if [ -z "$BIN" ]; then
  BIN=$(ls -d /nix/store/*-yt-dlp-*/bin/yt-dlp 2>/dev/null | grep -v python | sort -V | tail -1)
fi
if [ -z "$BIN" ]; then
  echo "yt-dlp binary not found" >&2
  exit 127
fi
exec "$BIN" "$@"
