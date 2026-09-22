#!/usr/bin/env bash
# Plainsight — stitch 5-10s beats into the full episode.
#
# Two jobs:
#   lastframe  extract the final frame of a beat, to use as the start
#              image of the next one (continuity for chained beats)
#   build      concatenate every beat into one episode file
#
# Usage:
#   ./assemble.sh lastframe b17      # -> frames/b17-last.png
#   ./assemble.sh check              # what's present, what's missing
#   ./assemble.sh build              # -> out/ep01.mp4
#   ./assemble.sh build --copy       # no re-encode (needs identical codecs)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BEATS="$HERE/prompts/ep01-beats.tsv"
CLIPS="$HERE/out"
FRAMES="$HERE/frames"
EPISODE="$CLIPS/ep01.mp4"

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Install it first."; exit 1; }

cmd="${1:-check}"; shift || true

# Last frame of a clip, for chaining into the next beat's start image.
# -sseof seeks from the end; -update 1 keeps overwriting so we land on
# the final decoded frame.
do_lastframe() {
  local id="$1"
  local src="$CLIPS/$id.mp4"
  [[ -f "$src" ]] || { echo "missing clip: $src" >&2; return 1; }
  mkdir -p "$FRAMES"
  ffmpeg -nostdin -loglevel error -y -sseof -0.25 -i "$src" \
         -update 1 -q:v 1 "$FRAMES/$id-last.png" || return 1
  echo "$FRAMES/$id-last.png"
}

# Which beats exist, which are chained and still need their predecessor.
do_check() {
  local missing=0 total=0
  echo "beat  dur  chain  clip"
  while IFS=$'\t' read -r id dur chain _; do
    [[ -z "${id:-}" || "$id" == \#* ]] && continue
    total=$((total+1))
    if [[ -f "$CLIPS/$id.mp4" ]]; then
      printf "%-5s %-4s %-6s ok\n" "$id" "$dur" "$chain"
    else
      printf "%-5s %-4s %-6s MISSING\n" "$id" "$dur" "$chain"
      missing=$((missing+1))
    fi
  done < "$BEATS"
  echo
  echo "$((total-missing))/$total present"
  [[ $missing -gt 0 ]] && return 1
  return 0
}

do_build() {
  local copy=0
  [[ "${1:-}" == "--copy" ]] && copy=1

  do_check >/dev/null || { echo "Beats are missing. Run './assemble.sh check'." >&2; exit 1; }

  local list; list="$(mktemp)"
  trap 'rm -f "$list"' RETURN

  while IFS=$'\t' read -r id _ _ _; do
    [[ -z "${id:-}" || "$id" == \#* ]] && continue
    # concat demuxer needs absolute paths, single-quoted
    printf "file '%s'\n" "$CLIPS/$id.mp4" >> "$list"
  done < "$BEATS"

  echo "concatenating $(wc -l < "$list") beats..."

  if [[ $copy -eq 1 ]]; then
    # Stream copy: instant, but every clip must share codec, resolution
    # and framerate exactly or playback breaks at the joins.
    ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i "$list" \
           -c copy "$EPISODE"
  else
    # Re-encode: slower, but survives clips that differ. Use this when
    # the clips came from a generator, since output settings drift.
    ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i "$list" \
           -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
           -r 24 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0xF4F1EA" \
           "$EPISODE"
  fi

  [[ -f "$EPISODE" ]] || { echo "build failed" >&2; exit 1; }
  echo "-> $EPISODE"
  command -v ffprobe >/dev/null 2>&1 && \
    echo "duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$EPISODE")s (target 420)"
}

case "$cmd" in
  lastframe) do_lastframe "${1:?usage: assemble.sh lastframe <beat-id>}" ;;
  check)     do_check ;;
  build)     do_build "${1:-}" ;;
  *) echo "usage: assemble.sh {check|lastframe <id>|build [--copy]}"; exit 2 ;;
esac
