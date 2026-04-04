import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/scroll.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Scroll command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('scrolls to the specified line', async () => {
    await execute({ line: 10 }, page);
    expect(popcorn.scrollToLine).toHaveBeenCalledWith(10);
  });

  it('scrolls to line 1', async () => {
    await execute({ line: 1 }, page);
    expect(popcorn.scrollToLine).toHaveBeenCalledWith(1);
  });
});
