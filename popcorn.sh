#!/usr/bin/env bash
# popcorn – wrapper script that runs the Docker image without manual volume mapping.
#
# Usage:
#   ./popcorn.sh render scene.pop
#   ./popcorn.sh render scene.pop -f gif
#   ./popcorn.sh render scene.pop -f mp4 -o /path/to/output.mp4
#
# The current working directory is automatically mounted as /workspace inside
# the container, so relative paths resolve correctly on both sides.
# Absolute paths must point to locations within the current working directory.

set -eo pipefail

IMAGE="${POPCORN_IMAGE:-itgorillaz/popcorn}"

# Attach a pseudo-TTY when running interactively so progress spinners render.
TTY_FLAGS=()
if [ -t 0 ] && [ -t 1 ]; then TTY_FLAGS=("-it"); fi

exec docker run --rm \
  "${TTY_FLAGS[@]}" \
  -v "$(pwd):/workspace" \
  -w /workspace \
  "$IMAGE" \
  "$@"
