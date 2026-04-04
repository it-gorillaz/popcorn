import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/move-to.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('MoveTo command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('moves the cursor to the specified line', async () => {
    await execute({ line: 5 }, page);
    expect(popcorn.moveCursorTo).toHaveBeenCalledWith(5);
  });

  it('moves the cursor to line 1', async () => {
    await execute({ line: 1 }, page);
    expect(popcorn.moveCursorTo).toHaveBeenCalledWith(1);
  });
});
