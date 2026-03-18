#!/usr/bin/env node
/**
 * Takes full-page screenshots of the local _site/ and live site for comparison.
 */

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const OUT_DIR = path.join(ROOT, '_screenshots');

const PAGES = [
  ['/', 'index'],
  ['/about-us/', 'about-us'],
  ['/contact/', 'contact'],
  ['/services/', 'services'],
];

function serveStatic(dir, port) {
  const mime = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
    '.woff': 'font/woff', '.ico': 'image/x-icon',
  };
  return http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    for (const fp of [path.join(dir, urlPath), path.join(dir, urlPath, 'index.html')]) {
      if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
        res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
        fs.createReadStream(fp).pipe(res);
        return;
      }
    }
    res.writeHead(404); res.end('Not found');
  }).listen(port);
}

async function screenshot(page, url, outPath) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`  saved ${path.basename(outPath)}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const PORT = 8766;
  const server = serveStatic(SITE_DIR, PORT);
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const [urlPath, name] of PAGES) {
    console.log(`\n${urlPath}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('console', () => {}); page.on('pageerror', () => {});

    await screenshot(page, `http://localhost:${PORT}${urlPath}`, path.join(OUT_DIR, `local-${name}.png`));
    await screenshot(page, `https://hancockplumbingco.com${urlPath}`, path.join(OUT_DIR, `live-${name}.png`));

    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`\nScreenshots saved to _screenshots/`);
}

main().catch(err => { console.error(err); process.exit(1); });
