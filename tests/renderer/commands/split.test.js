import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/split.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Split command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('splits Right', async () => {
    await execute({ direction: 'Right' }, page);
    expect(popcorn.split).toHaveBeenCalledWith('Right');
  });

  it('splits Down', async () => {
    await execute({ direction: 'Down' }, page);
    expect(popcorn.split).toHaveBeenCalledWith('Down');
  });
});
