import { readFile } from 'fs/promises';
import { resolve, basename, dirname } from 'path';
import { tmpdir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

import {
  parse,
  expandImports,
  ImportFileNotFoundError,
  CircularImportError,
} from '../../parser/index.js';
import { extractSettings, executeAST } from '../../renderer/executor.js';
import { launchBrowser } from '../../renderer/browser.js';
import {
  startCapture,
  compileVideo,
  createFramesDir,
  cleanupFramesDir,
} from '../../renderer/recorder.js';

import {
  parsingSpinner,
  browserSpinner,
  recordingSpinner,
  encodingSpinner,
} from '../ui/spinners.js';

export async function renderCommand(sceneFile, opts) {
  const inputPath = resolve(sceneFile);
  const outputPath = opts.output
    ? resolve(opts.output)
    : resolve(dirname(inputPath), basename(inputPath).replace(/\.pop$/, '') + '.mp4');

  const framesDir = join(tmpdir(), `popcorn-${Date.now()}`);

  // --- Step 1: Parse ---
  const parseSpinner = parsingSpinner(basename(inputPath));
  parseSpinner.start();

  let source, ast;
  try {
    source = await readFile(inputPath, 'utf8');
    ast = parse(source);
    ast = await expandImports(ast, inputPath);
    parseSpinner.succeed(chalk.cyan(`Parsed ${basename(inputPath)}`));
  } catch (err) {
    if (err instanceof ImportFileNotFoundError) {
      parseSpinner.fail(chalk.red(`Import error: ${err.message}`));
    } else if (err instanceof CircularImportError) {
      parseSpinner.fail(chalk.red(`Circular import: ${err.message}`));
    } else {
      parseSpinner.fail(chalk.red(`Parse error: ${err.message}`));
    }
    process.exit(1);
  }

  const { config, editorOptions } = extractSettings(ast.statements);
  const format = opts.format ?? 'mp4';
  const fps = config.fps;
  const width = config.width;
  const height = config.height;

  const finalOutput = outputPath.replace(/\.\w+$/, `.${format}`);

  // --- Step 2: Launch browser ---
  const launchSpinner = browserSpinner();
  launchSpinner.start();

  let browser, page;
  try {
    ({ browser, page } = await launchBrowser({ width, height }));
    launchSpinner.succeed(chalk.yellow('Projector ready'));
  } catch (err) {
    launchSpinner.fail(chalk.red(`Browser error: ${err.message}`));
    process.exit(1);
  }

  // --- Step 3: Record ---
  const recSpinner = recordingSpinner();
  recSpinner.start();

  try {
    await createFramesDir(framesDir);
    const { stop } = await startCapture(page, fps, framesDir);
    await executeAST(ast, page, config, editorOptions);
    await stop();
    recSpinner.succeed(chalk.magenta('Scene recorded'));
  } catch (err) {
    recSpinner.fail(chalk.red(`Recording error: ${err.message}`));
    await browser.close().catch(() => {});
    await cleanupFramesDir(framesDir);
    process.exit(1);
  } finally {
    await browser.close().catch(() => {});
  }

  // --- Step 4: Encode ---
  const encSpinner = encodingSpinner(basename(finalOutput));
  encSpinner.start();

  try {
    await compileVideo(framesDir, fps, format, finalOutput, width, height);
    encSpinner.succeed(chalk.green(`Encoded → ${finalOutput}`));
  } catch (err) {
    encSpinner.fail(chalk.red(`Encoding error: ${err.message}`));
    process.exit(1);
  } finally {
    await cleanupFramesDir(framesDir);
  }

  console.log('');
  console.log(chalk.bold('🍿 Your popcorn is ready!'));
  console.log(chalk.dim(`   ${finalOutput}`));
  console.log('');
}
