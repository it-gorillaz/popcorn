import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { parse } from './index.js';

export class ImportFileNotFoundError extends Error {
  constructor(path, chain) {
    const chainStr = chain.length ? ` (imported from: ${chain.join(' → ')})` : '';
    super(`ImportScene: file not found: "${path}"${chainStr}`);
    this.name = 'ImportFileNotFoundError';
  }
}

export class CircularImportError extends Error {
  constructor(path, chain) {
    const chainStr = [...chain, path].join(' → ');
    super(`Circular ImportScene detected: ${chainStr}`);
    this.name = 'CircularImportError';
  }
}

/**
 * Recursively expands all ImportScene nodes in an AST, replacing each one
 * with the top-level statements of the referenced file (Config/Editor stripped).
 *
 * @param {object}   ast           Parsed Program node
 * @param {string}   currentFile   Absolute path of the file that produced this AST
 * @param {string[]} importChain   Ordered list of absolute paths currently open (for cycle detection)
 * @returns {Promise<object>}      New Program node with all ImportScene nodes replaced
 */
export async function expandImports(ast, currentFile, importChain = []) {
  const expanded = [];

  for (const stmt of ast.statements) {
    if (stmt.type !== 'ImportScene') {
      expanded.push(stmt);
      continue;
    }

    const importedPath = resolve(dirname(currentFile), stmt.path);

    if (importChain.includes(importedPath)) {
      throw new CircularImportError(importedPath, importChain);
    }

    let source;
    try {
      source = await readFile(importedPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new ImportFileNotFoundError(importedPath, importChain);
      }
      throw err;
    }

    let childAst;
    try {
      childAst = parse(source);
    } catch (err) {
      err.message = `in imported file "${importedPath}": ${err.message}`;
      throw err;
    }

    const expandedChild = await expandImports(childAst, importedPath, [
      ...importChain,
      importedPath,
    ]);

    const inlined = expandedChild.statements.filter(
      (s) => s.type !== 'Config' && s.type !== 'Editor',
    );
    expanded.push(...inlined);
  }

  return { ...ast, statements: expanded };
}
