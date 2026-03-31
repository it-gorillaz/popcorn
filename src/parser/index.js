import { parse as peggyParse } from './parser.js';

export function parse(source) {
  return peggyParse(source);
}
