#!/usr/bin/env bash
# Plainsight — Episode 01 shot generation via Higgsfield CLI.
#
# Two stages per shot:
#   1. gpt_image_2_5  -> a still keyframe (locks the flat-vector style)
#   2. seedance_2_5   -> animates that keyframe into a clip
#
# Generating the still first is what keeps 19 clips looking like one
# episode instead of 19 unrelated videos.
#
# UNTESTED AGAINST THE LIVE API. It was written in an environment where
# every Higgsfield host is blocked at the network layer, so it has never
# been run end to end. Treat the first shot as a smoke test.
#
# Usage:
#   ./generate.sh --probe          # s01 and s08b only, the style test
#   ./generate.sh                  # everything in prompts/ep01.tsv
#   ./generate.sh --only s06       # one shot
#   ./generate.sh --stills-only    # keyframes, no video (cheap review pass)
#   ./generate.sh --vertical       # 9:16 for Shorts
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPTS="$HERE/prompts/ep01.tsv"
OUT="$HERE/out"
ASPECT="16:9"
ONLY=""
STILLS_ONLY=0
PROBE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)        ONLY="$2"; shift 2 ;;
    --stills-only) STILLS_ONLY=1; shift ;;
    --vertical)    ASPECT="9:16"; OUT="$HERE/out-vertical"; shift ;;
    --probe)       PROBE=1; shift ;;
    -h|--help)     sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

# The style clause is prepended verbatim to every prompt. That repetition
# is the whole reason the episode looks coherent -- do not vary it.
STYLE="Flat 2D vector animation still, warm off-white background #F4F1EA, \
charcoal #1F1F1F line work, single accent orange #E2572B, clean uniform \
line weight with a slight hand-drawn wobble, simple faceless charcoal \
silhouettes for people, minimal and museum-like, no text, no lettering, \
no watermark, no logo."

command -v higgsfield >/dev/null 2>&1 || {
  echo "higgsfield CLI not found. Install:"
  echo "  npm i -g @higgsfield/cli"
  exit 1
}

higgsfield account status >/dev/null 2>&1 || {
  echo "Not authenticated. Run 'higgsfield auth login' first."
  echo "It opens a browser and needs a reachable localhost callback,"
  echo "so it must be run on your own machine, not in a remote container."
  exit 1
}

mkdir -p "$OUT"
MANIFEST="$OUT/manifest.tsv"
[[ -f "$MANIFEST" ]] || printf 'shot\tkind\turl\n' > "$MANIFEST"

# The CLI's exact JSON shape isn't pinned here, so pull the first media
# URL out of the response rather than assuming a field name.
extract_url() {
  grep -oE 'https?://[^"[:space:]]+\.(png|jpg|jpeg|webp|mp4|mov|webm)' \
    | head -1
}

run_shot() {
  local id="$1" dur="$2" prompt="$3"
  local still="$OUT/$id.png"

  echo "--- $id (${dur}s) ---"

  if [[ -f "$still" ]]; then
    echo "  keyframe exists, skipping"
  else
    echo "  [1/2] keyframe..."
    local img_url
    img_url=$(higgsfield generate create gpt_image_2_5 \
      --prompt "$STYLE $prompt" \
      --aspect_ratio "$ASPECT" \
      --resolution 2k \
      --wait --json 2>&1 | extract_url)

    if [[ -z "$img_url" ]]; then
      echo "  FAILED: no keyframe URL returned" >&2
      return 1
    fi
    curl -fsSL "$img_url" -o "$still" || { echo "  download failed" >&2; return 1; }
    printf '%s\tstill\t%s\n' "$id" "$img_url" >> "$MANIFEST"
    echo "  -> $still"
  fi

  [[ $STILLS_ONLY -eq 1 ]] && return 0

  echo "  [2/2] animating (${dur}s)..."
  local vid_url
  vid_url=$(higgsfield generate create seedance_2_5 \
    --prompt "$prompt Slow deliberate motion, locked-off camera unless a drift is described. No zoom, no camera shake." \
    --start-image "$still" \
    --duration "$dur" \
    --resolution 1080p \
    --aspect_ratio "$ASPECT" \
    --wait --wait-timeout 20m --json 2>&1 | extract_url)

  if [[ -z "$vid_url" ]]; then
    echo "  FAILED: no video URL returned" >&2
    return 1
  fi
  curl -fsSL "$vid_url" -o "$OUT/$id.mp4" || { echo "  download failed" >&2; return 1; }
  printf '%s\tvideo\t%s\n' "$id" "$vid_url" >> "$MANIFEST"
  echo "  -> $OUT/$id.mp4"
}

# Shot durations are capped at 30s, the seedance_2_5 ceiling. Script
# sections longer than that are split into 'a'/'b' takes and joined in
# the edit.
failed=()
while IFS=$'\t' read -r id dur prompt; do
  [[ -z "${id:-}" || "$id" == \#* ]] && continue
  if [[ $PROBE -eq 1 && "$id" != "s01" && "$id" != "s08b" ]]; then continue; fi
  if [[ -n "$ONLY" && "$id" != "$ONLY" ]]; then continue; fi
  run_shot "$id" "$dur" "$prompt" || failed+=("$id")
done < "$PROMPTS"

echo
echo "=================================="
echo "output:   $OUT"
echo "manifest: $MANIFEST"
if [[ ${#failed[@]} -gt 0 ]]; then
  echo "FAILED:   ${failed[*]}"
  echo "Re-run individually with: ./generate.sh --only <shot>"
  exit 1
fi
echo "all shots complete"
