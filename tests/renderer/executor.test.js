import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeAST, extractSettings } from '../../src/renderer/executor.js';
import { makePage, makePopcorn, removePopcorn } from './helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', `${name}.json`), 'utf8'));
}

// ---------------------------------------------------------------------------
// extractSettings
// ---------------------------------------------------------------------------

describe('extractSettings', () => {
  it('returns defaults when no settings blocks are present', () => {
    const { config, editorOptions } = extractSettings([]);
    expect(config).toEqual({ width: 1280, height: 720, fps: 30 });
    expect(editorOptions).toEqual({});
  });

  it('merges Config settings', () => {
    const stmts = [{ type: 'Config', settings: { typingMode: 'Human', typingSpeed: 60 } }];
    const { config } = extractSettings(stmts);
    expect(config).toEqual({ width: 1280, height: 720, fps: 30, typingMode: 'Human', typingSpeed: 60 });
  });

  it('merges Editor options', () => {
    const stmts = [{ type: 'Editor', options: { theme: 'vs-dark', fontSize: 14 } }];
    const { editorOptions } = extractSettings(stmts);
    expect(editorOptions).toEqual({ theme: 'vs-dark', fontSize: 14 });
  });

  it('Config Width/Height/Fps override defaults', () => {
    const stmts = [{ type: 'Config', settings: { width: 1920, height: 1080 } }];
    const { config } = extractSettings(stmts);
    expect(config).toEqual({ width: 1920, height: 1080, fps: 30 });
  });

  it('ignores non-settings statement types', () => {
    const stmts = [{ type: 'Sleep', value: 1, unit: 's' }];
    const { config, editorOptions } = extractSettings(stmts);
    expect(config).toEqual({ width: 1280, height: 720, fps: 30 });
    expect(editorOptions).toEqual({});
  });

  it('extracts Config and Editor blocks from fixture', () => {
    const { statements } = fixture('ast-settings');
    const { config, editorOptions } = extractSettings(statements);
    expect(config).toEqual({ width: 1920, height: 1080, fps: 60, typingMode: 'Human', typingSpeed: 60, typingErrorChance: 0.1 });
    expect(editorOptions).toEqual({ theme: 'vs-dark', fontSize: 14 });
  });
});

// ---------------------------------------------------------------------------
// executeAST
// ---------------------------------------------------------------------------

describe('executeAST', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(() => {
    removePopcorn();
    vi.restoreAllMocks();
  });

  it('calls hideAnnotation at the end regardless of statements', async () => {
    await executeAST({ type: 'Program', statements: [] }, page, {}, {});
    expect(popcorn.hideAnnotation).toHaveBeenCalledOnce();
  });

  it('skips Config and Editor statements', async () => {
    const ast = {
      type: 'Program',
      statements: [
        { type: 'Config', settings: {} },
        { type: 'Editor', options: {} },
      ],
    };
    await executeAST(ast, page, {}, {});
    // only hideAnnotation should have been called
    expect(page.evaluate).toHaveBeenCalledTimes(1);
  });

  it('applies editor options before executing statements', async () => {
    const editorOptions = { theme: 'vs-dark' };
    await executeAST({ type: 'Program', statements: [] }, page, {}, editorOptions);
    expect(popcorn.applyOptions).toHaveBeenCalledWith({ theme: 'vs-dark' });
  });

  it('does not call applyOptions when editorOptions is empty', async () => {
    await executeAST({ type: 'Program', statements: [] }, page, {}, {});
    expect(popcorn.applyOptions).not.toHaveBeenCalled();
  });

  it('calls setAnnotateFontSize when config.annotateFontSize is set', async () => {
    await executeAST({ type: 'Program', statements: [] }, page, { annotateFontSize: 24 }, {});
    expect(popcorn.setAnnotateFontSize).toHaveBeenCalledWith(24);
  });

  it('does not call setAnnotateFontSize when annotateFontSize is absent', async () => {
    await executeAST({ type: 'Program', statements: [] }, page, {}, {});
    expect(popcorn.setAnnotateFontSize).not.toHaveBeenCalled();
  });

  it('warns and continues for unknown statement types', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ast = { type: 'Program', statements: [{ type: 'Unknown' }] };
    await executeAST(ast, page, {}, {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown'));
    expect(popcorn.hideAnnotation).toHaveBeenCalled();
  });

  it('executes all statements in the fixture program', async () => {
    const ast = fixture('ast-program');
    await executeAST(ast, page, { typingMode: 'Burst' }, { theme: 'vs-dark' });
    expect(popcorn.showAnnotation).toHaveBeenCalledWith('Hello!');
    expect(popcorn.openFile).toHaveBeenCalledWith('main.ts', 'typescript');
    expect(popcorn.pasteText).toHaveBeenCalledWith('const x = 1;');
    expect(popcorn.pressKey).toHaveBeenCalledWith('Enter');
    expect(popcorn.split).toHaveBeenCalledWith('Right');
    expect(popcorn.focusFile).toHaveBeenCalledWith('main.ts');
    expect(popcorn.unsplit).toHaveBeenCalled();
    expect(popcorn.hideAnnotation).toHaveBeenCalled();
  });
});
