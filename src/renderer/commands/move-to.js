export default async function execute(cmd, page) {
  await page.evaluate((line) => globalThis.__popcorn.moveCursorTo(line), cmd.line);
}
