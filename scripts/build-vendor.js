import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const src = resolve(root, 'node_modules/monaco-editor/min/vs');
const dest = resolve(root, 'src/templates/vendor/monaco/vs');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log('vendor: monaco-editor copied to src/templates/vendor/monaco/vs');
