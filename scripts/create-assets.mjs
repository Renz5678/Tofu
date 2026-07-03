#!/usr/bin/env node
/**
 * Create minimal placeholder PNG assets for Expo
 * This creates valid 1x1 pixel transparent PNGs for all required asset slots.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Standard valid 1x1 transparent PNG base64 string
const BASE64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const PNG_BUFFER = Buffer.from(BASE64_PNG, 'base64');

const ASSETS = [
  'icon.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'placeholder-cover.png',
];

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

for (const name of ASSETS) {
  const dest = path.join(ASSETS_DIR, name);
  // Always overwrite to fix previous corrupted manual PNGs
  fs.writeFileSync(dest, PNG_BUFFER);
  console.log(`✓ Created/Reset ${name}`);
}

console.log('\n✅ Valid placeholder assets created in assets/');
