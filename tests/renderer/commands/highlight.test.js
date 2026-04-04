import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/highlight.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Highlight / Select command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('selects a whole line when only a line number is given', async () => {
    await execute({ type: 'Highlight', line: 3 }, page);
    expect(popcorn.setSelection).toHaveBeenCalledWith(3, 1, 3, Number.MAX_SAFE_INTEGER);
  });

  it('selects a column range on a single line', async () => {
    await execute({ type: 'Highlight', from: { line: 2, col: 5 }, to: { line: 2, col: 15 } }, page);
    expect(popcorn.setSelection).toHaveBeenCalledWith(2, 5, 2, 15);
  });

  it('selects a multi-line range', async () => {
    await execute({ type: 'Highlight', from: { line: 1, col: 1 }, to: { line: 3, col: 10 } }, page);
    expect(popcorn.setSelection).toHaveBeenCalledWith(1, 1, 3, 10);
  });

  it('works identically for the Select type', async () => {
    await execute({ type: 'Select', from: { line: 7, col: 1 }, to: { line: 9, col: 1 } }, page);
    expect(popcorn.setSelection).toHaveBeenCalledWith(7, 1, 9, 1);
  });
});
