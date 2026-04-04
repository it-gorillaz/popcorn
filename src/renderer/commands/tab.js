export default async function execute(_cmd, page) {
  await page.evaluate(() => globalThis.__popcorn.pressKey('Tab'));
}
