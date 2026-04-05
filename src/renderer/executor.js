/**
 * AST command executor.
 *
 * Walks the Program AST produced by the parser and dispatches each DSL command
 * to its dedicated handler via the command registry.
 */

import { buildTypingStrategy } from './annimations/typing.js';
import { registry } from './commands/index.js';

const SETTINGS_TYPES = new Set(['Config', 'Editor', 'Output']);

/**
 * Extract and merge Config / Editor / Output settings from top-level AST nodes.
 *
 * @param {object[]} statements
 * @returns {{ config: object, editorOptions: object, output: object }}
 */
export function extractSettings(statements) {
  let config = {};
  let editorOptions = {};
  let output = { width: 1280, height: 720, fps: 30, format: 'mp4' };

  for (const stmt of statements) {
    if (stmt.type === 'Config') config = { ...config, ...stmt.settings };
    if (stmt.type === 'Editor') editorOptions = { ...editorOptions, ...stmt.options };
    if (stmt.type === 'Output') output = { ...output, ...stmt.settings };
  }

  return { config, editorOptions, output };
}

/**
 * Execute all top-level statements in the AST against the Playwright page.
 *
 * @param {object} ast            Parsed Program node
 * @param {import('playwright').Page} page
 * @param {object} config         Merged config (from extractSettings)
 * @param {object} editorOptions  Merged editor options
 */
export async function executeAST(ast, page, config, editorOptions) {
  const typingStrategy = buildTypingStrategy(config);
  const context = { typingStrategy, registry };

  if (Object.keys(editorOptions).length > 0) {
    await page.evaluate((opts) => globalThis.__popcorn.applyOptions(opts), editorOptions);
  }

  if (config.annotateFontSize != null) {
    await page.evaluate(
      (size) => globalThis.__popcorn.setAnnotateFontSize(size),
      config.annotateFontSize
    );
  }

  for (const stmt of ast.statements) {
    if (SETTINGS_TYPES.has(stmt.type)) continue;

    const handler = registry[stmt.type];
    if (!handler) {
      console.warn(`[executor] Unknown top-level statement: ${stmt.type}`);
      continue;
    }
    await handler(stmt, page, context);
  }

  await page.evaluate(() => globalThis.__popcorn.hideAnnotation());
}
