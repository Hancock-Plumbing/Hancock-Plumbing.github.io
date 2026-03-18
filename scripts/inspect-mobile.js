#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  page.on('console', () => {}); page.on('pageerror', () => {});
  
  await page.goto('https://hancockplumbingco.com/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // Get the header HTML with computed state
  const headerInfo = await page.evaluate(() => {
    const header = document.querySelector('.header_wrapper');
    const burger = document.querySelector('.burger__box');
    const nav = document.querySelector('.subheader__header');
    const topbar = document.querySelector('.topbar__header');
    const mainHeader = document.querySelector('.main__header');
    const sWrapper = document.querySelector('.s-wrapper_original');
    
    return {
      headerClasses: header?.className,
      burgerDisplay: burger ? getComputedStyle(burger).display : 'not found',
      burgerClasses: burger?.className,
      navDisplay: nav ? getComputedStyle(nav).display : 'not found',
      navClasses: nav?.className,
      topbarDisplay: topbar ? getComputedStyle(topbar).display : 'not found',
      mainHeaderClasses: mainHeader?.className,
      mainHeaderDisplay: mainHeader ? getComputedStyle(mainHeader).display : 'not found',
      sWrapperClasses: sWrapper?.className,
      // Check if s-wrapper has s-wrapper_collapsed class
      hasCollapsed: !!document.querySelector('.s-wrapper_collapsed'),
      // Template classes
      templateClasses: document.querySelector('.template')?.className?.substring(0, 100),
    };
  });
  
  console.log(JSON.stringify(headerInfo, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
