export default async function execute(stmt, page) {
  await page.evaluate((name) => globalThis.__popcorn.focusFile(name), stmt.name);
}
