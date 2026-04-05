import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderCommand } from '../../src/cli/commands/render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('../../src/parser/index.js', () => ({
  parse: vi.fn().mockReturnValue({ type: 'Program', statements: [] }),
}));

const mockExtractSettings = vi.fn();
vi.mock('../../src/renderer/executor.js', () => ({
  extractSettings: (...args) => mockExtractSettings(...args),
  executeAST: vi.fn().mockResolvedValue(undefined),
}));

const mockLaunchBrowser = vi.fn();
vi.mock('../../src/renderer/browser.js', () => ({
  launchBrowser: (...args) => mockLaunchBrowser(...args),
}));

const mockCompileVideo = vi.fn();
vi.mock('../../src/renderer/recorder.js', () => ({
  startCapture: vi.fn().mockResolvedValue({ stop: vi.fn().mockResolvedValue(undefined) }),
  compileVideo: (...args) => mockCompileVideo(...args),
  createFramesDir: vi.fn().mockResolvedValue(undefined),
  cleanupFramesDir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cli/ui/spinners.js', () => {
  const spinner = () => ({ start: vi.fn(), succeed: vi.fn(), fail: vi.fn() });
  return {
    parsingSpinner: spinner,
    browserSpinner: spinner,
    recordingSpinner: spinner,
    encodingSpinner: spinner,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCENE = '/project/demo.pop';

function sceneOutput(overrides = {}) {
  return { width: 1280, height: 720, fps: 30, format: 'mp4', ...overrides };
}

function setupMocks(outputOverrides = {}) {
  mockExtractSettings.mockReturnValue({
    config: {},
    editorOptions: {},
    output: sceneOutput(outputOverrides),
  });
  mockLaunchBrowser.mockResolvedValue({
    browser: { close: vi.fn().mockResolvedValue(undefined) },
    page: {},
  });
  mockCompileVideo.mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderCommand — option resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('format', () => {
    it('uses mp4 by default when neither CLI nor scene specifies a format', async () => {
      setupMocks();
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'mp4', expect.stringMatching(/\.mp4$/));
    });

    it('uses scene format when no CLI format is given', async () => {
      setupMocks({ format: 'gif' });
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'gif', expect.stringMatching(/\.gif$/));
    });

    it('CLI --format overrides scene format', async () => {
      setupMocks({ format: 'gif' });
      await renderCommand(SCENE, { format: 'mp4' });
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'mp4', expect.stringMatching(/\.mp4$/));
    });

    it('CLI --format webm passes webm to compileVideo', async () => {
      setupMocks();
      await renderCommand(SCENE, { format: 'webm' });
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'webm', expect.any(String));
    });

    it('CLI --format webm produces a .webm output path', async () => {
      setupMocks();
      await renderCommand(SCENE, { format: 'webm' });
      const [, , , outputPath] = mockCompileVideo.mock.calls[0];
      expect(outputPath).toMatch(/\.webm$/);
    });
  });

  describe('fps', () => {
    it('uses 30 fps by default', async () => {
      setupMocks();
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'mp4', expect.any(String));
    });

    it('uses scene fps when no CLI fps is given', async () => {
      setupMocks({ fps: 60 });
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 60, 'mp4', expect.any(String));
    });

    it('CLI --fps overrides scene fps', async () => {
      setupMocks({ fps: 60 });
      await renderCommand(SCENE, { fps: '24' });
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 24, 'mp4', expect.any(String));
    });

    it('coerces CLI --fps string to number', async () => {
      setupMocks();
      await renderCommand(SCENE, { fps: '15' });
      const [, fps] = mockCompileVideo.mock.calls[0];
      expect(fps).toBe(15);
      expect(typeof fps).toBe('number');
    });
  });

  describe('width / height', () => {
    it('uses 1280×720 by default', async () => {
      setupMocks();
      await renderCommand(SCENE, {});
      expect(mockLaunchBrowser).toHaveBeenCalledWith({ width: 1280, height: 720 });
    });

    it('uses scene dimensions when no CLI dimensions are given', async () => {
      setupMocks({ width: 1920, height: 1080 });
      await renderCommand(SCENE, {});
      expect(mockLaunchBrowser).toHaveBeenCalledWith({ width: 1920, height: 1080 });
    });

    it('CLI --width/--height override scene dimensions', async () => {
      setupMocks({ width: 1920, height: 1080 });
      await renderCommand(SCENE, { width: '800', height: '600' });
      expect(mockLaunchBrowser).toHaveBeenCalledWith({ width: 800, height: 600 });
    });

    it('coerces CLI --width/--height strings to numbers', async () => {
      setupMocks();
      await renderCommand(SCENE, { width: '640', height: '480' });
      const { width, height } = mockLaunchBrowser.mock.calls[0][0];
      expect(typeof width).toBe('number');
      expect(typeof height).toBe('number');
    });
  });

  describe('output path', () => {
    it('derives default output path from scene filename with correct extension', async () => {
      setupMocks();
      await renderCommand('/project/my-scene.pop', {});
      const [, , , outputPath] = mockCompileVideo.mock.calls[0];
      expect(outputPath).toMatch(/my-scene\.mp4$/);
    });

    it('rewrites output extension to match format', async () => {
      setupMocks();
      await renderCommand('/project/demo.pop', { format: 'gif' });
      const [, , , outputPath] = mockCompileVideo.mock.calls[0];
      expect(outputPath).toMatch(/\.gif$/);
    });

    it('uses CLI --output path when provided, with extension rewritten', async () => {
      setupMocks({ format: 'webm' });
      await renderCommand(SCENE, { output: '/output/result.mp4' });
      const [, , , outputPath] = mockCompileVideo.mock.calls[0];
      expect(outputPath).toMatch(/result\.webm$/);
    });
  });
});
