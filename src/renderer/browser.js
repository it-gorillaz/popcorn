import { dirname, join } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '..', 'templates', 'editor.html');
const MONACO_READY_TIMEOUT = 30_000;

/**
 * Launch a headless Chromium browser, load the Monaco template, and wait for
 * window.__popcornReady. Returns { browser, page }.
 *
 * @param {{ width: number, height: number }} viewport
 */
export async function launchBrowser({ width = 1280, height = 720 } = {}) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width, height });

  page.on('pageerror', (err) => console.error('[browser error]', err.message));

  await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'domcontentloaded' });

  await page.waitForFunction('window.__popcornReady === true', {
    timeout: MONACO_READY_TIMEOUT,
  });

  return { browser, page };
}
