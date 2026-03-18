#!/usr/bin/env node
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const OUT_DIR = path.join(ROOT, '_screenshots/subpages');

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
}).listen(8767);

const PAGES = [
  ['/emergency-plumbing/', 'emergency-plumbing'],
  ['/services/general-plumbing/', 'general-plumbing'],
  ['/services/general-plumbing-repair/', 'general-plumbing-repair'],
  ['/services/pipe-repair/', 'pipe-repair'],
  ['/services/plumbing-fixture-installation/', 'plumbing-fixture-installation'],
  ['/services/toilet-repair/', 'toilet-repair'],
  ['/services/water-heater-repair/', 'water-heater-repair'],
  ['/privacy-and-cookies-policy/', 'privacy-policy'],
];

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const [urlPath, name] of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('console', () => {}); page.on('pageerror', () => {});

    console.log(`Capturing ${urlPath}...`);
    await page.goto(`http://localhost:8767${urlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, `local-${name}.png`), fullPage: true });

    await page.goto(`https://hancockplumbingco.com${urlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT_DIR, `live-${name}.png`), fullPage: true });

    await page.close();
  }
  await browser.close();
  server.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
