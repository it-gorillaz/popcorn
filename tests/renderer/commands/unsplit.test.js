import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/unsplit.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Unsplit command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('calls unsplit on the popcorn API', async () => {
    await execute({}, page);
    expect(popcorn.unsplit).toHaveBeenCalledOnce();
  });
});
