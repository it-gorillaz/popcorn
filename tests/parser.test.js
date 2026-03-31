import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { parse } from '../src/parser/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  return readFileSync(join(__dirname, 'fixtures', `${name}.pop`), 'utf8');
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

describe('Config block', () => {
  it('parses all settings', () => {
    expect(parse(fixture('config'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'Config',
          settings: {
            typingMode: 'Human',
            typingSpeed: 80,
            typingErrorChance: 0.2,
          },
        },
      ],
    });
  });
});

describe('Editor block', () => {
  it('parses free-form JSON options including nested objects', () => {
    expect(parse(fixture('editor'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'Editor',
          options: {
            language: 'typescript',
            theme: 'vs-dark',
            fontSize: 16,
            minimap: { enabled: false },
            lineNumbers: 'on',
          },
        },
      ],
    });
  });
});

describe('Output block', () => {
  it('parses width, height, fps and format', () => {
    expect(parse(fixture('output'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'Output',
          settings: {
            width: 1920,
            height: 1080,
            fps: 30,
            format: 'mp4',
          },
        },
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// Top-level commands
// ---------------------------------------------------------------------------

describe('Sleep', () => {
  it('parses seconds, milliseconds and float durations', () => {
    expect(parse(fixture('sleep'))).toEqual({
      type: 'Program',
      statements: [
        { type: 'Sleep', value: 1, unit: 's' },
        { type: 'Sleep', value: 500, unit: 'ms' },
        { type: 'Sleep', value: 1.5, unit: 's' },
      ],
    });
  });
});

describe('Annotate', () => {
  it('parses the message string', () => {
    expect(parse(fixture('annotate'))).toEqual({
      type: 'Program',
      statements: [{ type: 'Annotate', text: 'Hello, world!' }],
    });
  });
});

describe('Split', () => {
  it('parses Right and Down directions', () => {
    expect(parse(fixture('split'))).toEqual({
      type: 'Program',
      statements: [
        { type: 'Split', direction: 'Right' },
        { type: 'Split', direction: 'Down' },
      ],
    });
  });
});

describe('Unsplit', () => {
  it('parses correctly', () => {
    expect(parse(fixture('unsplit'))).toEqual({
      type: 'Program',
      statements: [{ type: 'Unsplit' }],
    });
  });
});

describe('Focus', () => {
  it('parses the filename', () => {
    expect(parse(fixture('focus'))).toEqual({
      type: 'Program',
      statements: [{ type: 'Focus', name: 'app.ts' }],
    });
  });
});

// ---------------------------------------------------------------------------
// File-level commands
// ---------------------------------------------------------------------------

describe('Type', () => {
  it('parses the text string inside a File block', () => {
    expect(parse(fixture('type'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Type', text: 'const x = 1;' }],
        },
      ],
    });
  });
});

describe('Paste', () => {
  it('parses the text string inside a File block', () => {
    expect(parse(fixture('paste'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Paste', text: "import { foo } from 'bar';" }],
        },
      ],
    });
  });
});

describe('Enter', () => {
  it('parses correctly inside a File block', () => {
    expect(parse(fixture('enter'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Enter' }],
        },
      ],
    });
  });
});

describe('Tab', () => {
  it('parses correctly inside a File block', () => {
    expect(parse(fixture('tab'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Tab' }],
        },
      ],
    });
  });
});

describe('Backspace', () => {
  it('parses the count', () => {
    expect(parse(fixture('backspace'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Backspace', count: 5 }],
        },
      ],
    });
  });
});

describe('Scroll', () => {
  it('parses the target line number', () => {
    expect(parse(fixture('scroll'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'Scroll', line: 10 }],
        },
      ],
    });
  });
});

describe('MoveTo', () => {
  it('parses the target line number', () => {
    expect(parse(fixture('moveto'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [{ type: 'MoveTo', line: 5 }],
        },
      ],
    });
  });
});

describe('Highlight', () => {
  it('parses a whole-line highlight', () => {
    const { statements } = parse(fixture('highlight'));
    expect(statements[0].commands[0]).toEqual({ type: 'Highlight', line: 3 });
  });

  it('parses a same-line column range', () => {
    const { statements } = parse(fixture('highlight'));
    expect(statements[0].commands[1]).toEqual({
      type: 'Highlight',
      from: { line: 2, col: 5 },
      to: { line: 2, col: 15 },
    });
  });

  it('parses a multi-line column range', () => {
    const { statements } = parse(fixture('highlight'));
    expect(statements[0].commands[2]).toEqual({
      type: 'Highlight',
      from: { line: 1, col: 1 },
      to: { line: 3, col: 10 },
    });
  });
});

describe('Select', () => {
  it('parses a multi-line selection range', () => {
    expect(parse(fixture('select'))).toEqual({
      type: 'Program',
      statements: [
        {
          type: 'File',
          name: 'main.ts',
          commands: [
            {
              type: 'Select',
              from: { line: 1, col: 1 },
              to: { line: 3, col: 10 },
            },
          ],
        },
      ],
    });
  });
});

// ---------------------------------------------------------------------------
// Full scene
// ---------------------------------------------------------------------------

describe('full scene', () => {
  it('parses the complete example without errors', () => {
    const ast = parse(fixture('full-scene'));
    expect(ast.type).toBe('Program');
    expect(ast.statements.length).toBeGreaterThan(0);
  });

  it('produces the correct top-level statement sequence', () => {
    const { statements } = parse(fixture('full-scene'));
    const types = statements.map((s) => s.type);
    expect(types).toEqual([
      'Config',
      'Editor',
      'Output',
      'Sleep',
      'Annotate',
      'Sleep',
      'File',
      'Sleep',
      'Split',
      'File',
      'Unsplit',
      'Sleep',
      'Focus',
      'Annotate',
      'Sleep',
      'File',
      'Sleep',
      'Annotate',
      'Sleep',
    ]);
  });
});
