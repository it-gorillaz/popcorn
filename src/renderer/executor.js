/**
 * AST command executor.
 *
 * Walks the Program AST produced by the parser and dispatches each DSL command
 * to its dedicated handler via the command registry.
 */

import { buildTypingStrategy } from './annimations/typing.js';
import { registry } from './commands/index.js';
import { VIDEO_PRESETS } from './presets.js';

const SETTINGS_TYPES = new Set(['Config', 'Editor']);

/**
 * Extract and merge Config / Editor settings from top-level AST nodes.
 *
 * Resolution order: hard-coded defaults → VideoPreset values → explicit settings.
 * This means a VideoPreset sets sensible dimensions for the target platform, but
 * any explicit Width / Height / Fps in the Config block takes final priority.
 *
 * @param {object[]} statements
 * @returns {{ config: object, editorOptions: object }}
 */
export function extractSettings(statements) {
  const hardDefaults = { width: 1280, height: 720, fps: 30 };
  let rawSettings = {};
  let editorOptions = {};

  for (const stmt of statements) {
    if (stmt.type === 'Config') rawSettings = { ...rawSettings, ...stmt.settings };
    if (stmt.type === 'Editor') editorOptions = { ...editorOptions, ...stmt.options };
  }

  const presetValues = rawSettings.videoPreset
    ? (VIDEO_PRESETS[rawSettings.videoPreset] ?? {})
    : {};

  const config = { ...hardDefaults, ...presetValues, ...rawSettings };
  return { config, editorOptions };
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
