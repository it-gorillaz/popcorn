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

function sceneConfig(overrides = {}) {
  return { width: 1280, height: 720, fps: 30, ...overrides };
}

function setupMocks(configOverrides = {}) {
  mockExtractSettings.mockReturnValue({
    config: sceneConfig(configOverrides),
    editorOptions: {},
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
    it('uses mp4 by default when no CLI format is given', async () => {
      setupMocks();
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'mp4', expect.stringMatching(/\.mp4$/));
    });

    it('CLI --format overrides default format', async () => {
      setupMocks();
      await renderCommand(SCENE, { format: 'gif' });
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 30, 'gif', expect.stringMatching(/\.gif$/));
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

    it('uses fps from Config block', async () => {
      setupMocks({ fps: 60 });
      await renderCommand(SCENE, {});
      expect(mockCompileVideo).toHaveBeenCalledWith(expect.any(String), 60, 'mp4', expect.any(String));
    });
  });

  describe('width / height', () => {
    it('uses 1280×720 by default', async () => {
      setupMocks();
      await renderCommand(SCENE, {});
      expect(mockLaunchBrowser).toHaveBeenCalledWith({ width: 1280, height: 720 });
    });

    it('uses dimensions from Config block', async () => {
      setupMocks({ width: 1920, height: 1080 });
      await renderCommand(SCENE, {});
      expect(mockLaunchBrowser).toHaveBeenCalledWith({ width: 1920, height: 1080 });
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

    it('uses CLI --output path when provided, with extension rewritten to match format', async () => {
      setupMocks();
      await renderCommand(SCENE, { output: '/output/result.mp4', format: 'webm' });
      const [, , , outputPath] = mockCompileVideo.mock.calls[0];
      expect(outputPath).toMatch(/result\.webm$/);
    });
  });
});
