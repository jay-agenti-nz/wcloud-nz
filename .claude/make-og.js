#!/usr/bin/env node
/**
 * Renders the social cards in og-cards.html at 2x (2400x1260):
 *   #og-main   -> og-image.jpg   (homepage)
 *   #og-site   -> og-site.jpg    (every other page)
 *   #og-intake -> og-intake.jpg  (intake form)
 *
 * Single-card sources (og-shoot.html) still work: set OG_URL and OG_OUT
 * and the page's #card is captured to that file.
 *
 * Needs the local preview server running (paths are absolute, /assets/...):
 *   python3 .claude/preview-server.py 8899
 *   node .claude/make-og.js
 * Uses playwright-core; set CHROME to a Chromium binary if it is not
 * at the default path.
 */
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright-core')); }
catch (e) { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); }

const URL = process.env.OG_URL || 'http://localhost:8899/og-cards.html';
const CARDS = process.env.OG_OUT
  ? { card: process.env.OG_OUT }
  : { 'og-main': 'og-image.jpg', 'og-site': 'og-site.jpg', 'og-intake': 'og-intake.jpg' };

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: ['--no-sandbox', '--font-render-hinting=none']
  });
  const page = await browser.newPage({ viewport: { width: 1300, height: 2200 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 10000 });
  await page.waitForTimeout(300);
  for (const [id, file] of Object.entries(CARDS)) {
    const out = path.join(__dirname, '..', file);
    await page.locator('#' + id).screenshot({ path: out, type: 'jpeg', quality: 88 });
    console.log('wrote', out);
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
