#!/usr/bin/env node
/**
 * Takes cropped screenshots of specific sections for detailed comparison.
 */

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = '/Users/albertvolkman/Sites/hancockplumbingco.com/_site';
const OUT_DIR = '/Users/albertvolkman/Sites/hancockplumbingco.com/_screenshots/detail';

fs.mkdirSync(OUT_DIR, { recursive: true });

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  for (const fp of [path.join(SITE_DIR, urlPath), path.join(SITE_DIR, urlPath, 'index.html')]) {
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
      return;
    }
  }
  res.writeHead(404); res.end('Not found');
}).listen(8766);

const SECTIONS = [
  // [page, name, yStart, height]
  ['/', 'index', 'header', 0, 120],
  ['/', 'index', 'hero', 120, 500],
  ['/', 'index', 'services-strip', 620, 200],
  ['/', 'index', 'reliable-section', 820, 500],
  ['/', 'index', 'dependable', 1320, 300],
  ['/', 'index', 'choose-us', 1620, 400],
  ['/', 'index', 'reviews', 2020, 400],
  ['/', 'index', 'contact', 2420, 400],
  ['/', 'index', 'footer', 2820, 300],
];

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', () => {}); page.on('pageerror', () => {});

  // Load local first
  await page.goto(`http://localhost:8766/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  const localHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ path: path.join(OUT_DIR, 'local-index-full.png'), fullPage: true });

  // Load live
  await page.goto(`https://hancockplumbingco.com/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const liveHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ path: path.join(OUT_DIR, 'live-index-full.png'), fullPage: true });

  console.log(`Local page height: ${localHeight}px, Live page height: ${liveHeight}px`);

  // Take section crops of local
  await page.goto(`http://localhost:8766/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  for (const [, , name, y, h] of SECTIONS) {
    await page.screenshot({
      path: path.join(OUT_DIR, `local-${name}.png`),
      clip: { x: 0, y, width: 1440, height: h }
    });
  }

  // Take section crops of live
  await page.goto(`https://hancockplumbingco.com/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  for (const [, , name, y, h] of SECTIONS) {
    await page.screenshot({
      path: path.join(OUT_DIR, `live-${name}.png`),
      clip: { x: 0, y, width: 1440, height: h }
    });
  }

  await browser.close();
  server.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
