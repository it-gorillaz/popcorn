export default async function execute(cmd, page) {
  await page.evaluate((text) => globalThis.__popcorn.showAnnotation(text), cmd.text);
}
