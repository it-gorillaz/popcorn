import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildTypingStrategy, TypingMode } from '../../src/renderer/annimations/typing.js';
import { makePage, makePopcorn, removePopcorn } from './helpers.js';


describe('buildTypingStrategy', () => {
  let page;
  let popcorn;

  beforeEach(() => {
    page = makePage();
    popcorn = makePopcorn();
  });

  afterEach(removePopcorn);

  describe('Machine mode — multi-line text', () => {
    it('presses Enter for each newline character instead of typing it', async () => {
      const strategy = buildTypingStrategy({ typingMode: TypingMode.MACHINE, typingSpeed: 9999 });
      await strategy.typeText('ab\ncd', page);

      const typeCharCalls = popcorn.typeChar.mock.calls.map((c) => c[0]);
      expect(typeCharCalls).toEqual(['a', 'b', 'c', 'd']);
      expect(popcorn.pressKey).toHaveBeenCalledWith('Enter');
      expect(popcorn.pressKey).toHaveBeenCalledTimes(1);
    });

    it('presses Enter for each newline in a multi-line block', async () => {
      const strategy = buildTypingStrategy({ typingMode: TypingMode.MACHINE, typingSpeed: 9999 });
      await strategy.typeText('line1\nline2\nline3', page);

      const typeCharCalls = popcorn.typeChar.mock.calls.map((c) => c[0]);
      expect(typeCharCalls).toEqual([...'line1', ...'line2', ...'line3']);
      expect(popcorn.pressKey).toHaveBeenCalledTimes(2);
      expect(popcorn.pressKey).toHaveBeenNthCalledWith(1, 'Enter');
      expect(popcorn.pressKey).toHaveBeenNthCalledWith(2, 'Enter');
    });

    it('does not call typeChar for newline characters', async () => {
      const strategy = buildTypingStrategy({ typingMode: TypingMode.MACHINE, typingSpeed: 9999 });
      await strategy.typeText('a\nb', page);

      const typeCharCalls = popcorn.typeChar.mock.calls.map((c) => c[0]);
      expect(typeCharCalls).not.toContain('\n');
    });
  });

  describe('Human mode — multi-line text', () => {
    it('presses Enter for newline characters', async () => {
      const strategy = buildTypingStrategy({
        typingMode: TypingMode.HUMAN,
        typingSpeed: 9999,
        typingErrorChance: 0,
      });
      await strategy.typeText('a\nb', page);

      const typeCharCalls = popcorn.typeChar.mock.calls.map((c) => c[0]);
      expect(typeCharCalls).toEqual(['a', 'b']);
      expect(popcorn.pressKey).toHaveBeenCalledWith('Enter');
    });
  });

  describe('Burst mode — multi-line text', () => {
    it('calls pasteText with the full text including newlines', async () => {
      const strategy = buildTypingStrategy({ typingMode: TypingMode.BURST });
      const text = 'line1\nline2\nline3';
      await strategy.typeText(text, page);

      expect(popcorn.pasteText).toHaveBeenCalledWith(text);
      expect(popcorn.typeChar).not.toHaveBeenCalled();
      expect(popcorn.pressKey).not.toHaveBeenCalled();
    });
  });
});
