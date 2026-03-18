#!/usr/bin/env node
/**
 * Takes full-page screenshots AFTER scrolling through to trigger lazy loading.
 */
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, '_site');
const OUT_DIR = path.join(ROOT, '_screenshots/scrolled');
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
}).listen(8774);

async function scrollAndScreenshot(page, url, outPath) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // Scroll through the page to trigger lazy loading
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 100));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`  saved ${path.basename(outPath)}`);
}

const PAGES = [['/', 'index'], ['/about-us/', 'about-us'], ['/contact/', 'contact'], ['/services/', 'services']];

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const [urlPath, name] of PAGES) {
    console.log(`\n${urlPath}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('console', () => {}); page.on('pageerror', () => {});

    await scrollAndScreenshot(page, `http://localhost:8774${urlPath}`, path.join(OUT_DIR, `local-${name}.png`));
    await scrollAndScreenshot(page, `https://hancockplumbingco.com${urlPath}`, path.join(OUT_DIR, `live-${name}.png`));
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('\nDone');
}
main().catch(e => { console.error(e); process.exit(1); });
