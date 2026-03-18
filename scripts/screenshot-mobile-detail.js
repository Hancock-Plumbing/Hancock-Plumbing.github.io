#!/usr/bin/env node
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const OUT_DIR = path.join(ROOT, '_screenshots/mobile-detail');
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
}).listen(8769);

const SECTIONS = [
  ['header', 0, 200],
  ['hero', 200, 600],
  ['reviews-area', 3200, 600],
  ['contact-footer', 3800, 600],
];

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.on('console', () => {}); page.on('pageerror', () => {});

  // Local
  await page.goto(`http://localhost:8769/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 500));
  const localH = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Local height: ${localH}px`);
  for (const [name, y, h] of SECTIONS) {
    if (y + h > localH) continue;
    await page.screenshot({ path: path.join(OUT_DIR, `local-${name}.png`), clip: { x: 0, y, width: 390, height: h } });
  }

  // Live
  await page.goto(`https://hancockplumbingco.com/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const liveH = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Live height: ${liveH}px`);
  for (const [name, y, h] of SECTIONS) {
    if (y + h > liveH) continue;
    await page.screenshot({ path: path.join(OUT_DIR, `live-${name}.png`), clip: { x: 0, y, width: 390, height: h } });
  }

  await page.close();
  await browser.close();
  server.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
