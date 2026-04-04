function resolveRange(cmd) {
  if ('line' in cmd) {
    return { startLine: cmd.line, startCol: 1, endLine: cmd.line, endCol: Number.MAX_SAFE_INTEGER };
  }
  return {
    startLine: cmd.from.line,
    startCol: cmd.from.col,
    endLine: cmd.to.line,
    endCol: cmd.to.col,
  };
}

export default async function execute(cmd, page) {
  const sel = resolveRange(cmd);
  await page.evaluate(
    ({ startLine, startCol, endLine, endCol }) =>
      globalThis.__popcorn.setSelection(startLine, startCol, endLine, endCol),
    sel
  );
}
