#!/usr/bin/env node
/**
 * Renders og.html at 1200x630 and writes og-image.jpg.
 *
 * The card is captured from a real page load so it uses the site's
 * actual webfonts, the actual logo mark and the same cloud textures
 * hero-cloud.js draws — an SVG approximation drifts away from the
 * site the moment either changes.
 *
 * Needs the local preview server running (paths are absolute, /assets/…):
 *   python3 .claude/preview-server.py 8899
 *   node .claude/make-og.js
 */
const path = require('path');
const PUPPETEER = process.env.PUPPETEER_PATH ||
  '/private/tmp/claude-501/-Users-jay-white-cloud/aac3b13e-e94b-4efb-9b0d-f8978c36849e/scratchpad/pptr/node_modules/puppeteer';
const puppeteer = require(PUPPETEER);

const URL = process.env.OG_URL || 'http://localhost:8899/og.html';
const OUT = path.join(__dirname, '..', 'og-image.jpg');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });

  // Wait for the webfonts and the cloud pass, not just the network.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 300));

  const card = await page.$('#card');
  await card.screenshot({ path: OUT, type: 'jpeg', quality: 88 });

  await browser.close();
  console.log('wrote', OUT);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
