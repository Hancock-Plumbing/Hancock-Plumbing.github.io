#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.on('console', () => {}); page.on('pageerror', () => {});
  
  await page.goto('https://hancockplumbingco.com/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const info = await page.evaluate(() => {
    // Get all header-layout-wrappers in main header
    const wrappers = document.querySelectorAll('.main__header .header-layout-wrapper');
    const result = [];
    for (const w of wrappers) {
      result.push({
        classes: w.className,
        display: getComputedStyle(w).display,
        width: w.getBoundingClientRect().width,
        innerHTML: w.innerHTML.substring(0, 150),
      });
    }
    
    const slogan = document.querySelector('.sloganCollapsed__wrapper');
    const sloganBurger = document.querySelector('.header__slogan.slogan');
    
    return {
      wrappers: result,
      sloganDisplay: slogan ? getComputedStyle(slogan).display : 'not found',
      sloganHeight: slogan ? slogan.getBoundingClientRect().height : 'not found',
      sloganClasses: slogan?.className,
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
