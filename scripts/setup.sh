#!/bin/bash
set -e
cd /home/scarecrow/dev/Tofu

echo "=== Installing npm packages ==="
npm install

echo "=== Downloading fonts ==="
node scripts/download-fonts.mjs

echo "=== Done! ==="
