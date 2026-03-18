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
    const template = document.querySelector('.template');
    const header = document.querySelector('.header_wrapper');
    const mainHeader = document.querySelector('.main__header');
    const topbar = document.querySelector('.topbar__header');
    const subheader = document.querySelector('.subheader__header');
    const burger = document.querySelector('.burger__box');
    const sWrapper = document.querySelector('.header .s-wrapper_original');
    
    return {
      templatePaddingTop: template?.style?.paddingTop,
      headerHeight: header ? header.getBoundingClientRect().height : null,
      mainHeaderHeight: mainHeader ? mainHeader.getBoundingClientRect().height : null,
      mainHeaderStyle: mainHeader?.getAttribute('style'),
      topbarVisible: topbar ? getComputedStyle(topbar).display !== 'none' : false,
      subheaderVisible: subheader ? getComputedStyle(subheader).display !== 'none' : false,
      burgerVisible: burger ? getComputedStyle(burger).display !== 'none' : false,
      burgerClass: burger?.className,
      sWrapperClasses: sWrapper?.className,
      headerNavHTML: document.querySelector('.main__header .header__wrap')?.innerHTML?.substring(0, 500),
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
