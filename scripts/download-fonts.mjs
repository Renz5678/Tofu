#!/usr/bin/env node
/**
 * Download Tofu fonts from Google Fonts CSS API
 * Run: node scripts/download-fonts.mjs
 *
 * Uses the CSS2 API to discover current TTF URLs dynamically.
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'Accept': 'text/css,*/*',
        }
      }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          follow(res.headers.location); return;
        }
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }).on('error', reject);
    };
    follow(url);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const follow = (u) => {
      https.get(u, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          follow(res.headers.location); return;
        }
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    follow(url);
  });
}

// Google Fonts API CSS2 — this returns a CSS with src: url(...) for all variants
const FONT_QUERIES = [
  { family: 'Literata', axes: 'opsz,wght', range: '7..72,400;7..72,600;7..72,700' },
  { family: 'Hanken+Grotesk', axes: 'wght', range: '400;500;600;700' },
];

const FILE_MAP = {
  'Literata': {
    '400': 'Literata-Regular.ttf',
    '600': 'Literata-SemiBold.ttf',
    '700': 'Literata-Bold.ttf',
  },
  'Hanken Grotesk': {
    '400': 'HankenGrotesk-Regular.ttf',
    '500': 'HankenGrotesk-Medium.ttf',
    '600': 'HankenGrotesk-SemiBold.ttf',
    '700': 'HankenGrotesk-Bold.ttf',
  },
};

async function getFontUrls() {
  const urls = [];

  for (const q of FONT_QUERIES) {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${q.family}:${q.axes}@${q.range}&display=swap`;
    process.stdout.write(`Fetching CSS for ${q.family}...`);
    const { status, body } = await fetch(cssUrl);
    if (status !== 200) { console.log(` ✗ HTTP ${status}`); continue; }
    console.log(' ✓');

    // Parse src: url(https://fonts.gstatic.com/...ttf)
    const regex = /font-style:\s*(\w+).*?font-weight:\s*(\d+).*?src:.*?url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/gs;
    let m;
    while ((m = regex.exec(body)) !== null) {
      const weight = m[2];
      const url = m[3];
      const familyKey = q.family.replace('+', ' ');
      const fileName = FILE_MAP[familyKey]?.[weight];
      if (fileName) urls.push({ fileName, url, weight, family: familyKey });
    }
  }

  return urls;
}

(async () => {
  console.log('\n📥 Discovering font URLs from Google Fonts API...\n');

  let urls;
  try {
    urls = await getFontUrls();
  } catch (e) {
    console.error('Failed to fetch font metadata:', e.message);
    process.exit(1);
  }

  if (urls.length === 0) {
    console.error('No font URLs found. Check your internet connection.');
    process.exit(1);
  }

  console.log(`\n⬇ Downloading ${urls.length} font files...\n`);
  for (const { fileName, url } of urls) {
    const dest = path.join(FONTS_DIR, fileName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`✓ ${fileName} (already exists)`);
      continue;
    }
    process.stdout.write(`⬇ ${fileName}...`);
    try {
      await download(url, dest);
      console.log(' ✓');
    } catch (e) {
      console.log(` ✗ ${e.message}`);
    }
  }
  console.log('\n✅ Fonts saved to assets/fonts/\n');
})();
