export default async function execute(_stmt, page) {
  await page.evaluate(() => globalThis.__popcorn.unsplit());
}
