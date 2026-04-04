import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import execute from '../../../src/renderer/commands/annotate.js';
import { makePage, makePopcorn, removePopcorn } from '../helpers.js';

describe('Annotate command', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  it('calls showAnnotation with the provided text', async () => {
    await execute({ text: 'Hello, world!' }, page);
    expect(popcorn.showAnnotation).toHaveBeenCalledWith('Hello, world!');
  });

  it('passes an empty string through unchanged', async () => {
    await execute({ text: '' }, page);
    expect(popcorn.showAnnotation).toHaveBeenCalledWith('');
  });
});
