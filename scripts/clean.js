#!/usr/bin/env node
/**
 * Cleans rendered HTML from _rendered/:
 * - Removes bundle.js, preload.js, publish.css script/link tags
 * - Removes data-widget, data-settings, data-style, data-offset,
 *   data-editor, data-type attributes (web.com internals)
 * - Removes the svgLoader div (no longer needed)
 * - Removes the cookieNotice widget markup (replaced with simple banner)
 * - Removes JS-injected <style> blocks inserted by bundle.js at runtime
 * - Keeps all applied inline styles (these are the real layout values)
 * - Saves cleaned pages to _cleaned/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IN_DIR  = path.join(ROOT, '_rendered');
const OUT_DIR = path.join(ROOT, '_cleaned');

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(IN_DIR).filter(f => f.endsWith('.html'));

// Attributes injected by web.com that have no meaning in static HTML
const WEB_COM_ATTRS = [
  'data-widget', 'data-settings', 'data-style', 'data-offset',
  'data-editor', 'data-type', 'data-widget-id',
  'data-widget-validation-rules', 'data-widget-submit',
  'data-offset-key', 'data-text', 'contenteditable',
  'itemscope', 'itemprop', 'itemtype', 'itemprop',
];

for (const file of files) {
  const inPath  = path.join(IN_DIR, file);
  const outPath = path.join(OUT_DIR, file);
  const raw = fs.readFileSync(inPath, 'utf8');

  const dom = new JSDOM(raw);
  const doc = dom.window.document;

  // 1. Remove web.com scripts
  for (const el of doc.querySelectorAll(
    'script[src*="bundle.js"], script[src*="preload.js"], script[src*="googletagmanager"]'
  )) el.remove();

  // 2. Remove web.com CSS bundles (keep our own stylesheets)
  for (const el of doc.querySelectorAll('link[href*="publish.css"]')) el.remove();

  // 3. Remove the svgLoader div
  for (const el of doc.querySelectorAll('[data-widget="svgLoader"]')) el.remove();

  // 4. Remove the cookieNotice and modal markup
  for (const el of doc.querySelectorAll('[data-widget="cookieNotice"], [data-widget="modal"]')) el.remove();

  // 5. Remove <style> blocks injected by bundle.js at runtime
  //    (they have no id/media and appear after our known stylesheets)
  //    Our stylesheet link has id="global_styles" — keep everything before it
  //    and the known <style> tag (page-specific CSS). Remove others.
  const knownStyles = new Set();
  for (const el of doc.querySelectorAll('style')) {
    const text = el.textContent || '';
    // Keep our page-specific style block (contains UUID selectors)
    if (text.includes('#mobile_table') || text.includes('.section-')) {
      knownStyles.add(el);
    } else {
      el.remove();
    }
  }

  // 6. Remove the Google Analytics inline script block
  for (const el of doc.querySelectorAll('script:not([src])')) {
    const text = el.textContent || '';
    if (text.includes('gtag') || text.includes('dataLayer') || text.includes('__PRELOADED')) {
      el.remove();
    }
  }

  // 7a. Background images: bundle.js reads data-iesrc and sets a CSS background-image.
  //     Without bundle.js, copy data-iesrc to the empty <img> inside the picture so
  //     the browser can render it natively.
  for (const picture of doc.querySelectorAll('picture[data-iesrc]')) {
    const src = picture.getAttribute('data-iesrc');
    if (src) {
      const img = picture.querySelector('img:not([src])');
      if (img) img.setAttribute('src', src);
    }
  }

  // 7. Strip web.com-specific attributes from all elements
  const all = doc.querySelectorAll('*');
  for (const el of all) {
    for (const attr of WEB_COM_ATTRS) {
      el.removeAttribute(attr);
    }
    // Remove data-* attributes starting with 'data-sizes' (responsive image hints for widget)
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('data-sizes') ||
          attr.name.startsWith('data-src') ||
          attr.name.startsWith('data-iesrc') ||
          attr.name === 'data-icons') {
        el.removeAttribute(attr.name);
      }
    }
  }

  // 8. Remove empty class attributes
  for (const el of doc.querySelectorAll('[class=""]')) {
    el.removeAttribute('class');
  }

  // 9. Remove the js-widget class (used only by bundle.js for init)
  for (const el of doc.querySelectorAll('.js-widget')) {
    el.classList.remove('js-widget');
    if (el.classList.length === 0) el.removeAttribute('class');
  }

  // 10. Serialize
  let out = dom.serialize();

  // Tighten up: remove blank lines left by removed elements
  out = out.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(outPath, out);
  const saved = ((raw.length - out.length) / 1024).toFixed(0);
  console.log(`OK  ${file.padEnd(45)} ${(out.length/1024).toFixed(0)} KB  (-${saved} KB)`);
}

console.log(`\nCleaned ${files.length} pages → _cleaned/`);
