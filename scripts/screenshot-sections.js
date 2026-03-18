#!/usr/bin/env node
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const OUT_DIR = path.join(ROOT, '_screenshots/sections');
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
}).listen(8773);

async function getPageHeight(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  return page.evaluate(() => document.body.scrollHeight);
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('console', () => {}); page.on('pageerror', () => {});

  // Desktop index
  const localH = await getPageHeight(page, 'http://localhost:8773/');
  console.log('Local index height:', localH);
  
  const liveH = await getPageHeight(page, 'https://hancockplumbingco.com/');
  console.log('Live index height:', liveH);

  // Take crops every 500px for both
  const maxH = Math.max(localH, liveH);
  for (let y = 0; y < maxH; y += 500) {
    const h = Math.min(500, maxH - y);
    
    await page.goto('http://localhost:8773/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
    if (y < localH) {
      await page.screenshot({ path: path.join(OUT_DIR, `local-${y}.png`), clip: { x: 0, y, width: 1440, height: h } });
    }
    
    await page.goto('https://hancockplumbingco.com/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    if (y < liveH) {
      await page.screenshot({ path: path.join(OUT_DIR, `live-${y}.png`), clip: { x: 0, y, width: 1440, height: h } });
    }
  }

  await page.close();
  await browser.close();
  server.close();
  console.log('Done');
}
main().catch(e => { console.error(e); process.exit(1); });
