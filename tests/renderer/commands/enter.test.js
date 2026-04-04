import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/enter.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Enter command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('presses the Enter key', async () => {
    await execute({}, page);
    expect(popcorn.pressKey).toHaveBeenCalledWith('Enter');
    expect(popcorn.pressKey).toHaveBeenCalledOnce();
  });
});
