export default async function execute(cmd, page) {
  await page.evaluate((line) => globalThis.__popcorn.scrollToLine(line), cmd.line);
}
