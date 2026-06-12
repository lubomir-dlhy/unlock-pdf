#!/bin/bash
# Captures the App Store screenshot set for one appearance mode.
# Usage: ./scripts/capture-screenshots.sh light|dark
# Needs: booted iPhone 17 Pro Max simulator with the app installed,
#        Invoice-2026.pdf seeded (scripts/seed-simulator-pdf.sh), maestro on PATH.
set -euo pipefail

MODE="${1:?usage: capture-screenshots.sh light|dark}"
export PATH="$PATH:$HOME/.maestro/bin"

xcrun simctl ui booted appearance "$MODE"
xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3

maestro test -e OUT="$MODE" .maestro/screenshots.yaml

echo "Captured ${MODE} set."
