import { parse as peggyParse } from './parser.js';

export function parse(source) {
  return peggyParse(source);
}

export { expandImports } from './expander.js';
export { ImportFileNotFoundError, CircularImportError } from './expander.js';
