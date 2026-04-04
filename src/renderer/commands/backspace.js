export default async function execute(cmd, page) {
  for (let i = 0; i < cmd.count; i++) {
    await page.evaluate(() => globalThis.__popcorn.pressKey('Backspace'));
  }
}
