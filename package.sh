#!/bin/bash
set -e

# === Settings ===
GAME_ID="softgames_test"
VERSION="0.0.1"
DIST_DIR="dist"
OUTPUT_DIR="releases"

# === Build ===
echo "▶ Building game..."
npm run build

# === Create output folder ===
mkdir -p "$OUTPUT_DIR"

# === Package ZIP ===
ZIP_NAME="${GAME_ID}_${VERSION}.zip"
DEBUG_ZIP_NAME="${GAME_ID}_${VERSION}-dbg.zip"

echo "▶ Zipping production build -> $OUTPUT_DIR/$ZIP_NAME"
(cd "$DIST_DIR" && zip -r "../$OUTPUT_DIR/$ZIP_NAME" .)

echo "▶ Zipping debug build -> $OUTPUT_DIR/$DEBUG_ZIP_NAME"
(cd "$DIST_DIR" && zip -r "../$OUTPUT_DIR/$DEBUG_ZIP_NAME" .)

echo "✅ Done. Files ready in $OUTPUT_DIR/:"
ls -lh "$OUTPUT_DIR"
