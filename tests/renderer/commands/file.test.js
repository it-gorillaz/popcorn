import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import execute from '../../../src/renderer/commands/file.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

function makeContext(handlers = {}) {
  return {
    typingStrategy: { typeText: vi.fn() },
    registry: handlers,
  };
}

describe('File command — language inference', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it.each([
    ['main.ts', 'typescript'],
    ['app.tsx', 'typescript'],
    ['index.js', 'javascript'],
    ['component.jsx', 'javascript'],
    ['data.json', 'json'],
    ['styles.css', 'css'],
    ['styles.scss', 'scss'],
    ['styles.less', 'less'],
    ['index.html', 'html'],
    ['readme.md', 'markdown'],
    ['main.py', 'python'],
    ['app.rb', 'ruby'],
    ['main.go', 'go'],
    ['lib.rs', 'rust'],
    ['Main.java', 'java'],
    ['main.cpp', 'cpp'],
    ['main.c', 'cpp'],
    ['Program.cs', 'csharp'],
    ['script.sh', 'shell'],
    ['config.yaml', 'yaml'],
    ['config.yml', 'yaml'],
    ['config.toml', 'ini'],
    ['query.sql', 'sql'],
    ['data.xml', 'xml'],
    ['main.kt', 'kotlin'],
    ['app.swift', 'swift'],
    ['main.dart', 'dart'],
    ['index.php', 'php'],
    ['script.lua', 'lua'],
    ['main.go', 'go'],
    ['schema.graphql', 'graphql'],
    ['main.tf', 'hcl'],
    ['proto.proto', 'protobuf'],
    ['contract.sol', 'solidity'],
    ['unknown.xyz', 'plaintext'],
  ])('infers %s → %s', async (filename, expectedLang) => {
    await execute({ name: filename, commands: [] }, page, makeContext());
    expect(popcorn.openFile).toHaveBeenCalledWith(filename, expectedLang);
  });
});

describe('File command — sub-command dispatch', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('dispatches each sub-command to its registry handler', async () => {
    const pasteHandler = vi.fn();
    const enterHandler = vi.fn();
    const context = makeContext({ Paste: pasteHandler, Enter: enterHandler });

    const pasteCmd = { type: 'Paste', text: 'hello' };
    const enterCmd = { type: 'Enter' };

    await execute({ name: 'main.ts', commands: [pasteCmd, enterCmd] }, page, context);

    expect(pasteHandler).toHaveBeenCalledWith(pasteCmd, page, context);
    expect(enterHandler).toHaveBeenCalledWith(enterCmd, page, context);
  });

  it('opens the file before executing sub-commands', async () => {
    const callOrder = [];
    const context = makeContext({
      Paste: vi.fn(() => callOrder.push('paste')),
    });
    page.evaluate.mockImplementation(async (fn, arg) => {
      callOrder.push('openFile');
      return fn(arg);
    });

    await execute({ name: 'main.ts', commands: [{ type: 'Paste', text: 'x' }] }, page, context);

    expect(callOrder).toEqual(['openFile', 'paste']);
  });

  it('warns and skips unknown sub-command types', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const context = makeContext({});

    await execute({ name: 'main.ts', commands: [{ type: 'Unknown' }] }, page, context);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown'));
  });

  it('executes no sub-commands for an empty commands array', async () => {
    const context = makeContext({});
    await execute({ name: 'main.ts', commands: [] }, page, context);
    expect(popcorn.openFile).toHaveBeenCalledOnce();
  });
});
