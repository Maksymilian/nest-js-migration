import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The `@app/*` aliases that `nest generate library` adds to tsconfig.json, for Vitest, which
 * doesn't read tsconfig paths in files no tsconfig includes, such as spec files (recipes/swc.md).
 */
export function tsconfigAliases() {
  const { compilerOptions } = JSON.parse(readFileSync(resolve(import.meta.dirname, 'tsconfig.json'), 'utf8')) as {
    compilerOptions: { paths: Record<string, string[]> };
  };
  return Object.entries(compilerOptions.paths).map(([alias, [target]]) => ({
    find: new RegExp(`^${alias.replace('/*', '/(.*)')}$`),
    replacement: resolve(import.meta.dirname, target.replace('*', '$1')),
  }));
}
