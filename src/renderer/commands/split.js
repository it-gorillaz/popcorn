export default async function execute(stmt, page) {
  await page.evaluate((dir) => globalThis.__popcorn.split(dir), stmt.direction);
}
