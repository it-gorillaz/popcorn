import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/paste.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Paste command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('calls pasteText with the provided text', async () => {
    await execute({ text: "import { foo } from 'bar';" }, page);
    expect(popcorn.pasteText).toHaveBeenCalledWith("import { foo } from 'bar';");
  });

  it('passes multi-line text through unchanged', async () => {
    const text = 'line one\nline two\nline three';
    await execute({ text }, page);
    expect(popcorn.pasteText).toHaveBeenCalledWith(text);
  });
});
