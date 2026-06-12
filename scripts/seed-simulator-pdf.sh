#!/bin/bash
# Copies the sample locked PDF into the booted simulator's Files app
# ("On My iPhone" local storage) so the document picker can find it.
set -euo pipefail

PDF="${1:-assets/screenshots/Invoice-2026.pdf}"
UDID=$(xcrun simctl list devices booted -j | python3 -c "
import json, sys
devs = [d for v in json.load(sys.stdin)['devices'].values() for d in v if d['state'] == 'Booted']
print(devs[0]['udid'])")

GROUPS_DIR="$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data/Containers/Shared/AppGroup"
for dir in "$GROUPS_DIR"/*/; do
  plist="$dir.com.apple.mobile_container_manager.metadata.plist"
  [[ -f "$plist" ]] || continue
  id=$(/usr/libexec/PlistBuddy -c 'Print MCMMetadataIdentifier' "$plist" 2>/dev/null || true)
  if [[ "$id" == "group.com.apple.FileProvider.LocalStorage" ]]; then
    mkdir -p "$dir/File Provider Storage"
    cp "$PDF" "$dir/File Provider Storage/"
    echo "Seeded $(basename "$PDF") into simulator $UDID local storage"
    exit 0
  fi
done
echo "Could not find FileProvider LocalStorage app group" >&2
exit 1
