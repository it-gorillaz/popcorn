/**
 * Frame capture and video compilation.
 *
 * startCapture() launches a setInterval that screenshots the Playwright page
 * at the target FPS into a temp directory. The returned stop() function halts
 * the timer and resolves once any in-flight screenshot finishes.
 *
 * compileVideo() stitches the captured frames into an MP4 or GIF using the
 * ffmpeg-static binary invoked via execa. No deprecated fluent-ffmpeg wrapper.
 */

import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';

/**
 * Start capturing frames at `fps` into `framesDir`.
 * Returns a stop() function — call it when all commands have finished.
 *
 * @param {import('playwright').Page} page
 * @param {number} fps
 * @param {string} framesDir  Absolute path to an existing (empty) directory
 * @returns {Promise<{ stop: () => Promise<void> }>}
 */
export async function startCapture(page, fps, framesDir) {
  const interval = Math.round(1000 / fps);
  let frameIndex = 0;
  let capturing = true;
  let inFlight = null; // promise for the current screenshot

  async function captureFrame() {
    if (!capturing) return;
    const path = join(framesDir, `frame-${String(frameIndex++).padStart(6, '0')}.png`);
    inFlight = page.screenshot({ path });
    await inFlight;
    inFlight = null;
  }

  // Capture the first frame immediately so the video doesn't start blank.
  await captureFrame();

  const timer = setInterval(() => {
    captureFrame().catch(() => {
      // Silently ignore errors after stop() has been called (browser may be closing).
      if (capturing) console.error('[recorder] screenshot failed');
    });
  }, interval);

  async function stop() {
    capturing = false;
    clearInterval(timer);
    // Wait for any in-flight screenshot to complete before returning.
    if (inFlight) await inFlight.catch(() => {});
  }

  return { stop, getFrameCount: () => frameIndex };
}

/**
 * Compile the captured PNG frames into an MP4 or GIF.
 *
 * @param {string} framesDir   Directory containing frame-000001.png …
 * @param {number} fps
 * @param {string} format      'mp4' | 'gif'
 * @param {string} outputPath  Absolute path for the output file
 */
export async function compileVideo(framesDir, fps, format, outputPath) {
  const inputPattern = join(framesDir, 'frame-%06d.png');

  if (format === 'gif') {
    await compileGif(inputPattern, fps, outputPath);
  } else {
    await compileMp4(inputPattern, fps, outputPath);
  }
}

async function compileMp4(inputPattern, fps, outputPath) {
  await execa(ffmpegPath, [
    '-y',                        // overwrite output without asking
    '-framerate', String(fps),
    '-i', inputPattern,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',       // max compatibility (QuickTime, browsers)
    '-crf', '18',                // high quality (0 = lossless, 51 = worst)
    outputPath,
  ]);
}

async function compileGif(inputPattern, fps, outputPath) {
  // GIF quality requires a two-pass palette approach.
  // Pass 1: generate palette
  const palettePath = outputPath.replace(/\.gif$/, '-palette.png');
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `fps=${fps},scale=trunc(iw/2)*2:-1:flags=lanczos,palettegen`,
    palettePath,
  ]);

  // Pass 2: render GIF using the palette
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-i', palettePath,
    '-filter_complex', `fps=${fps},scale=trunc(iw/2)*2:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    outputPath,
  ]);

  // Clean up palette
  await rm(palettePath, { force: true });
}

/**
 * Create a fresh temporary directory for frames.
 * @param {string} dir
 */
export async function createFramesDir(dir) {
  await mkdir(dir, { recursive: true });
}

/**
 * Remove the frames directory.
 * @param {string} dir
 */
export async function cleanupFramesDir(dir) {
  await rm(dir, { recursive: true, force: true });
}
