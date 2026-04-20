#!/usr/bin/env bash
#
# deploy-phase-a.sh — publish the public showcase of the London Cuts app to
# Cloudflare Pages.
#
# The build output is a filtered copy of `app/` so we don't accidentally ship:
#   - local-config.js (contains a live OpenAI key on the author's machine)
#   - any tsbuildinfo, .DS_Store, or editor cruft
#   - the archive/ folder (has historical placeholder `sk-proj-...` strings)
#
# Pre-flight blocks deploy if a live-looking API key sneaks into the staged dir.
#
# Prereqs (once):
#   npm install -g wrangler
#   wrangler login
#   wrangler pages project create london-cuts   # only the first time
#
# Usage:
#   ./scripts/deploy-phase-a.sh                 # dry-run: stage + check, no upload
#   ./scripts/deploy-phase-a.sh --publish       # stage + check + upload

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/app"
STAGE_DIR="$(mktemp -d -t london-cuts-deploy-XXXXXX)"
PROJECT_NAME="london-cuts"
DO_PUBLISH=0

for arg in "$@"; do
  case "$arg" in
    --publish) DO_PUBLISH=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

echo "→ Staging $SRC_DIR into $STAGE_DIR"
rsync -a \
  --exclude='local-config.js' \
  --exclude='.DS_Store' \
  --exclude='*.tsbuildinfo' \
  --exclude='*.swp' \
  --exclude='*.bak' \
  "$SRC_DIR/" "$STAGE_DIR/"

echo "→ Pre-flight: scanning staged dir for secrets and required assets"

# 1. No live-looking OpenAI key anywhere in the staged dir. The
#    `local-config.example.js` file is allowed — it holds the literal
#    placeholder `sk-proj-REPLACE_ME`, which is not a real key shape.
LEAKED="$(grep -rlE 'sk-(proj|live)-[A-Za-z0-9_-]{30,}' "$STAGE_DIR" 2>/dev/null \
          | grep -v 'local-config.example.js' || true)"
if [ -n "$LEAKED" ]; then
  echo "✗ ABORT: live-looking API key detected in staged files:" >&2
  echo "$LEAKED" >&2
  exit 1
fi

# 2. local-config.js must not have made it through the rsync exclude.
if [ -f "$STAGE_DIR/local-config.js" ]; then
  echo "✗ ABORT: $STAGE_DIR/local-config.js exists; exclude pattern failed." >&2
  exit 1
fi

# 3. generated-images must have a real manifest, otherwise the demo opens empty.
MANIFEST="$STAGE_DIR/generated-images/manifest.json"
if [ ! -f "$MANIFEST" ]; then
  echo "✗ ABORT: $MANIFEST missing. Export the snapshot first:" >&2
  echo "    1. python3 -m http.server 8000 --directory $SRC_DIR" >&2
  echo "    2. Open http://localhost:8000, load London Memories, wait for pre-gen to finish." >&2
  echo "    3. Click the 📦 Snapshot button (bottom-left)." >&2
  echo "    4. Extract the zip into $SRC_DIR/generated-images/" >&2
  exit 1
fi

ENTRY_COUNT="$(grep -c '"file":' "$MANIFEST" || echo 0)"
PNG_COUNT="$(find "$STAGE_DIR/generated-images" -name '*.png' | wc -l | tr -d ' ')"
echo "  manifest has $ENTRY_COUNT entries · $PNG_COUNT PNGs staged"

# 4. Files we must keep.
for required in index.html src/app.jsx src/snapshot.jsx styles/base.css; do
  if [ ! -f "$STAGE_DIR/$required" ]; then
    echo "✗ ABORT: missing required file $required" >&2
    exit 1
  fi
done

echo "✓ Pre-flight passed."
echo "  staged dir: $STAGE_DIR"

if [ "$DO_PUBLISH" -eq 0 ]; then
  echo ""
  echo "Dry run only. Inspect the staged dir above, then re-run with --publish."
  exit 0
fi

echo "→ Deploying to Cloudflare Pages project \"$PROJECT_NAME\""
wrangler pages deploy "$STAGE_DIR" --project-name "$PROJECT_NAME" --commit-dirty=true

echo "✓ Deployed."
echo "  Next step: open the preview URL wrangler printed above."
echo "  Smoke-test checklist is in ~/.claude/plans/api-flickering-wozniak.md"
