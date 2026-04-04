import { beforeEach, describe, expect, it, vi } from 'vitest';

import execute from '../../../src/renderer/commands/type.js';
import { makePage } from '../helpers.js';

describe('Type command', () => {
  let page;
  let context;

  beforeEach(() => {
    page = makePage();
    context = { typingStrategy: { typeText: vi.fn() } };
  });

  it('delegates to typingStrategy.typeText with the text and page', async () => {
    await execute({ text: 'const x = 1;' }, page, context);
    expect(context.typingStrategy.typeText).toHaveBeenCalledWith('const x = 1;', page);
  });

  it('passes an empty string through to the typing strategy', async () => {
    await execute({ text: '' }, page, context);
    expect(context.typingStrategy.typeText).toHaveBeenCalledWith('', page);
  });

  it('calls typeText exactly once per execute call', async () => {
    await execute({ text: 'hello' }, page, context);
    expect(context.typingStrategy.typeText).toHaveBeenCalledOnce();
  });
});
