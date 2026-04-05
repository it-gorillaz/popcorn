import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parse } from '../../src/parser/index.js';
import {
  CircularImportError,
  ImportFileNotFoundError,
  expandImports,
} from '../../src/parser/expander.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  return readFileSync(join(__dirname, 'fixtures', `${name}.pop`), 'utf8');
}

// ---------------------------------------------------------------------------
// Grammar-level: ImportScene parses correctly
// ---------------------------------------------------------------------------

describe('ImportScene — grammar', () => {
  it('parses a bare ImportScene', () => {
    expect(parse('ImportScene "scenes/intro.pop"')).toEqual({
      type: 'Program',
      statements: [{ type: 'ImportScene', path: 'scenes/intro.pop' }],
    });
  });

  it('parses ImportScene with nested path', () => {
    expect(parse('ImportScene "a/b/c.pop"')).toEqual({
      type: 'Program',
      statements: [{ type: 'ImportScene', path: 'a/b/c.pop' }],
    });
  });

  it('appears correctly in a multi-statement sequence', () => {
    const { statements } = parse('Sleep 1s\nImportScene "x.pop"\nSleep 2s');
    expect(statements.map((s) => s.type)).toEqual(['Sleep', 'ImportScene', 'Sleep']);
  });

  it('parses the import-scene fixture', () => {
    const { statements } = parse(fixture('import-scene'));
    expect(statements).toEqual([{ type: 'ImportScene', path: 'scenes/intro.pop' }]);
  });

  it('rejects ImportScene inside a File block', () => {
    expect(() => parse('File "a.ts" { ImportScene "x.pop" }')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Expander unit tests (fs/promises mocked)
// ---------------------------------------------------------------------------

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

// Import after mock so the module picks up the mock
const { readFile } = await import('fs/promises');

const PARENT = '/project/movie.pop';
const CHILD = '/project/scenes/intro.pop';

function makeProgram(...statements) {
  return { type: 'Program', statements };
}

function importNode(path) {
  return { type: 'ImportScene', path };
}

function annotate(text) {
  return { type: 'Annotate', text };
}

function sleep(value = 1, unit = 's') {
  return { type: 'Sleep', value, unit };
}

function config() {
  return { type: 'Config', settings: {} };
}

function editor() {
  return { type: 'Editor', options: {} };
}

describe('expandImports — expander', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the AST unchanged when there are no ImportScene nodes', async () => {
    const ast = makeProgram(sleep(), annotate('hi'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([sleep(), annotate('hi')]);
  });

  it('expands a single import by inlining the child statements', async () => {
    readFile.mockResolvedValue('Annotate "Welcome!"');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([annotate('Welcome!')]);
  });

  it('resolves the import path relative to the importing file directory', async () => {
    readFile.mockResolvedValue('Sleep 1s');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    await expandImports(ast, PARENT);
    expect(readFile).toHaveBeenCalledWith(CHILD, 'utf8');
  });

  it('strips Config blocks from imported files', async () => {
    readFile.mockResolvedValue('Config { TypingSpeed 460 }\nAnnotate "hi"');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements.map((s) => s.type)).toEqual(['Annotate']);
  });

  it('strips Editor blocks from imported files', async () => {
    readFile.mockResolvedValue('Editor { "theme": "vs-dark" }\nSleep 1s');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements.map((s) => s.type)).toEqual(['Sleep']);
  });

  it('strips both Config and Editor, keeping only action statements', async () => {
    readFile.mockResolvedValue(
      'Config { TypingSpeed 460 }\nEditor { "theme": "vs-dark" }\nAnnotate "hello"',
    );
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([annotate('hello')]);
  });

  it('preserves statements before and after an ImportScene', async () => {
    readFile.mockResolvedValue('Annotate "imported"');
    const ast = makeProgram(sleep(1, 's'), importNode('scenes/intro.pop'), sleep(2, 's'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([sleep(1, 's'), annotate('imported'), sleep(2, 's')]);
  });

  it('expands nested imports recursively (A → B → C)', async () => {
    readFile
      .mockResolvedValueOnce('ImportScene "c.pop"\nAnnotate "from B"') // B
      .mockResolvedValueOnce('Annotate "from C"'); // C
    const ast = makeProgram(importNode('b.pop'));
    const result = await expandImports(ast, '/project/a.pop');
    expect(result.statements.map((s) => s.text)).toEqual(['from C', 'from B']);
  });

  it('inlines nothing when the imported file is empty', async () => {
    readFile.mockResolvedValue('');
    const ast = makeProgram(sleep(), importNode('empty.pop'), sleep(2, 's'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([sleep(), sleep(2, 's')]);
  });

  it('inlines nothing when the imported file has only Config/Editor', async () => {
    readFile.mockResolvedValue('Config { TypingSpeed 460 }\nEditor { "theme": "vs-dark" }');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const result = await expandImports(ast, PARENT);
    expect(result.statements).toEqual([]);
  });

  it('throws ImportFileNotFoundError when the file does not exist', async () => {
    const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    readFile.mockRejectedValue(enoent);
    const ast = makeProgram(importNode('scenes/missing.pop'));
    await expect(expandImports(ast, PARENT)).rejects.toThrow(ImportFileNotFoundError);
  });

  it('includes the importing file path in ImportFileNotFoundError message', async () => {
    const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    readFile.mockRejectedValue(enoent);
    const ast = makeProgram(importNode('missing.pop'));
    await expect(expandImports(ast, PARENT, [PARENT])).rejects.toThrow(PARENT);
  });

  it('throws CircularImportError when a file imports itself', async () => {
    const ast = makeProgram(importNode('movie.pop'));
    await expect(expandImports(ast, PARENT, [PARENT])).rejects.toThrow(CircularImportError);
  });

  it('throws CircularImportError on an A → B → A chain', async () => {
    readFile.mockResolvedValue('ImportScene "/project/movie.pop"');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    await expect(expandImports(ast, PARENT, [PARENT])).rejects.toThrow(CircularImportError);
  });

  it('includes the full import chain in CircularImportError message', async () => {
    const ast = makeProgram(importNode('movie.pop'));
    const err = await expandImports(ast, PARENT, [PARENT]).catch((e) => e);
    expect(err).toBeInstanceOf(CircularImportError);
    expect(err.message).toContain(PARENT);
  });

  it('re-throws a SyntaxError from an imported file with the file path in the message', async () => {
    readFile.mockResolvedValue('this is not valid pop syntax !!!');
    const ast = makeProgram(importNode('scenes/intro.pop'));
    const err = await expandImports(ast, PARENT).catch((e) => e);
    expect(err.message).toContain(CHILD);
  });
});
