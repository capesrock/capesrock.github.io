#!/usr/bin/env node
// On-demand screenshot tool for local development.
// Usage:
//   node screenshot.js                   — viewport at scroll 0 (hero)
//   node screenshot.js --scroll=800      — viewport scrolled 800px down
//   node screenshot.js --section=faq     — scrolls to #faq section
//   node screenshot.js --full            — full-page screenshot

import { chromium } from 'playwright';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT = resolve(__dirname, 'screenshot.png');
const BASE_URL = 'http://localhost:4002';

const args = process.argv.slice(2);
const fullPage = args.includes('--full');
const scrollArg = args.find(a => a.startsWith('--scroll='));
const sectionArg = args.find(a => a.startsWith('--section='));
const section = sectionArg ? sectionArg.split('=')[1] : null;
const scrollY = scrollArg ? parseInt(scrollArg.split('=')[1], 10) : 0;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto(BASE_URL, { waitUntil: 'load' });
await page.waitForTimeout(400); // let fonts render

// Kill CSS transitions and animations so no mid-frame captures
await page.addStyleTag({
  content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
});

// Resolve scroll target
let targetY = scrollY;
if (section) {
  targetY = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, section);
}

// Scroll and settle the JS-driven logo animation to match scroll position
await page.evaluate((sy) => {
  const LOGO_LARGE = 280, LOGO_SMALL = 50, START_Y = 150, SCROLL_RANGE = 280;
  const nav = document.querySelector('.site-nav');
  const logoImg = document.querySelector('.nav-logo-wrap img');
  window.scrollTo(0, sy);
  const t = Math.min(sy / SCROLL_RANGE, 1);
  const size = LOGO_LARGE + (LOGO_SMALL - LOGO_LARGE) * t;
  logoImg.style.width = size + 'px';
  logoImg.style.height = size + 'px';
  logoImg.style.transform = `translateY(${Math.round(START_Y * (1 - t))}px)`;
  nav.classList.toggle('scrolled', t >= 1);
}, targetY);

// Wait one frame for layout to settle
await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

if (section) {
  const el = page.locator(`#${section}`);
  await el.screenshot({ path: OUT });
} else {
  await page.screenshot({ path: OUT, fullPage });
}
await browser.close();

console.log(`screenshot saved → ${OUT}`);
