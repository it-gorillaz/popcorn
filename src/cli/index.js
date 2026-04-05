import { Command } from 'commander';
import { renderCommand } from './commands/render.js';

const program = new Command();

program
  .name('popcorn')
  .description('Script code, render cinema, grab your popcorn.')
  .version('0.1.0');

program
  .command('render <scene>')
  .description('Render a .pop scene file into a video')
  .option('-o, --output <file>', 'output file path')
  .option('-f, --format <format>', 'output format: mp4, gif, or webm')
  .action(renderCommand);

export { program };
