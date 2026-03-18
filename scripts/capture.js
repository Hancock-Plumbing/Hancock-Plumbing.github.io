#!/usr/bin/env node
/**
 * Renders each page from the live site with Puppeteer (so bundle.js runs and
 * applies all widget styles/markup), then saves the fully-rendered DOM to _rendered/.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, '_rendered');
const BASE_URL = 'https://hancockplumbingco.com';

// Pages to capture: [url path, output filename]
const PAGES = [
  ['/',                                        'index.html'],
  ['/about-us/',                               'about-us.html'],
  ['/contact/',                                'contact.html'],
  ['/emergency-plumbing/',                     'emergency-plumbing.html'],
  ['/privacy-and-cookies-policy/',             'privacy-and-cookies-policy.html'],
  ['/services/',                               'services.html'],
  ['/services/general-plumbing/',              'general-plumbing.html'],
  ['/services/general-plumbing-repair/',       'general-plumbing-repair.html'],
  ['/services/pipe-repair/',                   'pipe-repair.html'],
  ['/services/plumbing-fixture-installation/', 'plumbing-fixture-installation.html'],
  ['/services/toilet-repair/',                 'toilet-repair.html'],
  ['/services/water-heater-repair/',           'water-heater-repair.html'],
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });

  for (const [urlPath, outFile] of PAGES) {
    const url = `${BASE_URL}${urlPath}`;
    console.log(`Capturing ${url} ...`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', () => {});
    page.on('pageerror', () => {});

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Extra wait for deferred widget init and third-party review API
    await new Promise(r => setTimeout(r, 5000));

    const html = await page.content();
    const outPath = path.join(OUT_DIR, outFile);
    fs.writeFileSync(outPath, html);
    console.log(`  -> ${outFile} (${(html.length / 1024).toFixed(0)} KB)`);

    await page.close();
  }

  await browser.close();
  console.log('\nDone. Rendered pages saved to _rendered/');
}

main().catch(err => { console.error(err); process.exit(1); });
