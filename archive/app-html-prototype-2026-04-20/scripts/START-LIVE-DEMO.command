#!/bin/bash
# Double-click to launch the London Cuts live pitch deck in your default browser.
# Keep this Terminal window open for the duration of the demo. Ctrl+C or close it when done.

cd "$(dirname "$0")/pitch-deck" || exit 1

PORT=8911
URL="http://localhost:${PORT}/slides/pitch.html"

# Kill anything already on this port (harmless if nothing is there)
lsof -ti:${PORT} | xargs -r kill 2>/dev/null

echo "  London Cuts · live pitch deck"
echo "  ─────────────────────────────"
echo "  serving from: $(pwd)"
echo "  url:          ${URL}"
echo ""
echo "  keyboard:  ← / →  navigate    space  next    esc  exit"
echo ""
echo "  leave this window open during the demo."
echo "  press Ctrl+C here to stop the server."
echo ""

# Open browser after a short delay
( sleep 1; open "${URL}" ) &

# Run server in foreground
python3 -m http.server ${PORT}
