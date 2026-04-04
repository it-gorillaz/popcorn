import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/tab.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Tab command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('presses the Tab key', async () => {
    await execute({}, page);
    expect(popcorn.pressKey).toHaveBeenCalledWith('Tab');
    expect(popcorn.pressKey).toHaveBeenCalledOnce();
  });
});
