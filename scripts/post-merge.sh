#!/usr/bin/env bash
# Runs automatically after a task agent's changes are merged into main.
# Keeps the workspace consistent after dependency/schema changes.
set -euo pipefail

echo "Running post-merge setup..."
pnpm install
echo "post-merge setup complete."
