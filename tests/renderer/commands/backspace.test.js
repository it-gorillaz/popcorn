import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/backspace.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Backspace command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('presses Backspace the specified number of times', async () => {
    await execute({ count: 3 }, page);
    expect(popcorn.pressKey).toHaveBeenCalledTimes(3);
    expect(popcorn.pressKey).toHaveBeenCalledWith('Backspace');
  });

  it('presses Backspace once when count is 1', async () => {
    await execute({ count: 1 }, page);
    expect(popcorn.pressKey).toHaveBeenCalledOnce();
  });

  it('does not press Backspace when count is 0', async () => {
    await execute({ count: 0 }, page);
    expect(popcorn.pressKey).not.toHaveBeenCalled();
  });
});
