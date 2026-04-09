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
  let inFlight = null;       // promise for the current screenshot
  let screenshotBusy = false; // guard against concurrent screenshot calls

  async function captureFrame() {
    // Drop the frame if a screenshot is already in progress. This prevents
    // concurrent page.screenshot() calls that pile up when 2× frames take
    // longer to capture than the interval (e.g. 3840×2160 at 30 fps).
    if (!capturing || screenshotBusy) return;

    screenshotBusy = true;
    const path = join(framesDir, `frame-${String(frameIndex++).padStart(6, '0')}.png`);
    try {
      inFlight = page.screenshot({ path });
      await inFlight;
    } finally {
      inFlight = null;
      screenshotBusy = false;
    }
  }

  // Capture the first frame immediately so the video doesn't start blank.
  await captureFrame();

  const timer = setInterval(() => {
    captureFrame().catch((err) => {
      // Ignore errors after stop() has been called (browser may be closing).
      if (capturing) console.error('[recorder] screenshot failed:', err?.message ?? err);
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
 * Compile the captured PNG frames into an MP4, GIF, or WebM.
 *
 * width/height are the target output dimensions. Because the browser renders
 * at deviceScaleFactor: 2, the raw frames are 2× the viewport size — these
 * values tell ffmpeg to scale back down to the intended resolution using the
 * lanczos filter, which produces sharp, well anti-aliased text.
 *
 * @param {string} framesDir   Directory containing frame-000001.png …
 * @param {number} fps
 * @param {string} format      'mp4' | 'gif' | 'webm'
 * @param {string} outputPath  Absolute path for the output file
 * @param {number} width       Target output width in pixels
 * @param {number} height      Target output height in pixels
 */
export async function compileVideo(framesDir, fps, format, outputPath, width, height) {
  const inputPattern = join(framesDir, 'frame-%06d.png');

  if (format === 'gif') {
    await compileGif(inputPattern, fps, outputPath, width, height);
  } else if (format === 'webm') {
    await compileWebm(inputPattern, fps, outputPath, width, height);
  } else {
    await compileMp4(inputPattern, fps, outputPath, width, height);
  }
}

async function compileMp4(inputPattern, fps, outputPath, width, height) {
  await execa(ffmpegPath, [
    '-y',                        // overwrite output without asking
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `scale=${width}:${height}:flags=lanczos`, // downscale 2× frames to target res
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',       // max compatibility (QuickTime, browsers)
    '-crf', '18',                // high quality (0 = lossless, 51 = worst)
    outputPath,
  ]);
}

async function compileWebm(inputPattern, fps, outputPath, width, height) {
  await execa(ffmpegPath, [
    '-y',                        // overwrite output without asking
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `scale=${width}:${height}:flags=lanczos`, // downscale 2× frames to target res
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',      // VP9 with alpha channel support
    '-crf', '31',                // constant quality (0 = lossless, 63 = worst)
    '-b:v', '0',                 // required for constant-quality mode in VP9
    outputPath,
  ]);
}

async function compileGif(inputPattern, fps, outputPath, width, height) {
  // GIF quality requires a two-pass palette approach.
  // Pass 1: generate palette
  const palettePath = outputPath.replace(/\.gif$/, '-palette.png');
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen`, // downscale 2× frames
    palettePath,
  ]);

  // Pass 2: render GIF using the palette
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
    '-i', palettePath,
    '-filter_complex', `fps=${fps},scale=${width}:${height}:flags=lanczos[x];[x][1:v]paletteuse`, // downscale 2× frames
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
