import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import execute from '../../../src/renderer/commands/sleep.js';

describe('Sleep command', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sleeps for the exact number of milliseconds', async () => {
    const promise = execute({ value: 500, unit: 'ms' });
    await vi.advanceTimersByTimeAsync(500);
    await promise;
  });

  it('converts seconds to milliseconds', async () => {
    const promise = execute({ value: 2, unit: 's' });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;
  });

  it('rounds fractional seconds to the nearest millisecond', async () => {
    const promise = execute({ value: 1.5, unit: 's' });
    await vi.advanceTimersByTimeAsync(1500);
    await promise;
  });

  it('resolves immediately when value is 0', async () => {
    await execute({ value: 0, unit: 'ms' });
  });
});
