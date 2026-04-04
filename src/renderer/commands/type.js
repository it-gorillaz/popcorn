export default async function execute(cmd, page, { typingStrategy }) {
  await typingStrategy.typeText(cmd.text, page);
}
