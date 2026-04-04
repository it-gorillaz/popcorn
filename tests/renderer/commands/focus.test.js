import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/focus.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Focus command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('focuses the specified file', async () => {
    await execute({ name: 'app.ts' }, page);
    expect(popcorn.focusFile).toHaveBeenCalledWith('app.ts');
  });

  it('passes the exact filename including path separators', async () => {
    await execute({ name: 'src/components/Button.tsx' }, page);
    expect(popcorn.focusFile).toHaveBeenCalledWith('src/components/Button.tsx');
  });
});
