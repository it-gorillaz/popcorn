/**
 * Typing mode animation helpers.
 *
 * Converts Config settings into a per-character delay function and an error
 * injection strategy used by executor.js when handling Type commands.
 *
 * Modes
 * -----
 * Machine  – fixed delay derived from typingSpeed (WPM)
 * Human    – Gaussian-jittered delay ± 30 %, random typos + backspace
 * Burst    – zero delay, all chars inserted instantly
 */

export const TypingMode = Object.freeze({
  MACHINE: 'Machine',
  HUMAN: 'Human',
  BURST: 'Burst',
});

const CHARS_PER_WORD = 5; // standard WPM measure

/**
 * Convert words-per-minute to milliseconds per character.
 * @param {number} wpm
 */
function wpmToMsPerChar(wpm) {
  return Math.round(60_000 / (wpm * CHARS_PER_WORD));
}

/**
 * Box-Muller transform: returns a normally-distributed random number
 * with mean 0 and std dev 1.
 */
function gaussianRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Sleep for `ms` milliseconds.
 * @param {number} ms
 */
export function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a typing strategy from parsed Config settings.
 *
 * @param {{ typingMode?: string, typingSpeed?: number, typingErrorChance?: number }} config
 * @returns {{ typeText: (text: string, page: import('playwright').Page) => Promise<void> }}
 */
export function buildTypingStrategy(config) {
  const mode = config.typingMode ?? TypingMode.MACHINE;
  const wpm = config.typingSpeed ?? 80;
  const errorChance = config.typingErrorChance ?? 0;
  const baseDelay = wpmToMsPerChar(wpm);

  // Characters that can be accidentally typed (adjacent keys on QWERTY)
  const ADJACENTS = 'qwertyuiopasdfghjklzxcvbnm';

  function randomAdjacentChar(char) {
    const lower = char.toLowerCase();
    const idx = ADJACENTS.indexOf(lower);
    if (idx === -1) return char; // non-alpha: no typo
    const offset = Math.random() < 0.5 ? -1 : 1;
    const adjacent = ADJACENTS[Math.max(0, Math.min(ADJACENTS.length - 1, idx + offset))];
    return char === char.toUpperCase() ? adjacent.toUpperCase() : adjacent;
  }

  async function typeText(text, page) {
    if (mode === TypingMode.BURST) {
      // Insert entire text at once via pasteText (no animation)
      await page.evaluate((t) => globalThis.__popcorn.pasteText(t), text);
      return;
    }

    for (const char of text) {
      // --- Human mode: maybe inject a typo ---
      if (mode === TypingMode.HUMAN && errorChance > 0 && Math.random() < errorChance) {
        const typo = randomAdjacentChar(char);
        await page.evaluate((c) => globalThis.__popcorn.typeChar(c), typo);
        const typoDelay = baseDelay * (1 + Math.abs(gaussianRandom()) * 0.3);
        await sleep(typoDelay);
        // Correct the typo
        await page.evaluate(() => globalThis.__popcorn.pressKey('Backspace'));
        await sleep(baseDelay * 0.5);
      }

      await page.evaluate((c) => globalThis.__popcorn.typeChar(c), char);

      // --- Delay ---
      let delay;
      if (mode === TypingMode.HUMAN) {
        // ± 30 % Gaussian jitter, floored at 10 ms
        delay = Math.max(10, baseDelay + gaussianRandom() * baseDelay * 0.3);
      } else {
        // Machine: fixed
        delay = baseDelay;
      }
      await sleep(delay);
    }
  }

  return { typeText };
}
