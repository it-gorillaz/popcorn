import { vi } from 'vitest';

/**
 * Creates a mock Playwright page whose evaluate() actually invokes the
 * provided function with its argument, so assertions on globalThis.__popcorn
 * work naturally.
 */
export function makePage() {
  return {
    evaluate: vi.fn(async (fn, arg) => fn(arg)),
  };
}

/**
 * Installs a full mock __popcorn API on globalThis and returns it.
 * Call removePopcorn() in afterEach to keep tests isolated.
 */
export function makePopcorn(overrides = {}) {
  const mock = {
    applyOptions: vi.fn(),
    hideAnnotation: vi.fn(),
    showAnnotation: vi.fn(),
    pasteText: vi.fn(),
    pressKey: vi.fn(),
    scrollToLine: vi.fn(),
    moveCursorTo: vi.fn(),
    setSelection: vi.fn(),
    openFile: vi.fn(),
    split: vi.fn(),
    unsplit: vi.fn(),
    focusFile: vi.fn(),
    typeChar: vi.fn(),
    ...overrides,
  };
  globalThis.__popcorn = mock;
  return mock;
}

export function removePopcorn() {
  delete globalThis.__popcorn;
}
