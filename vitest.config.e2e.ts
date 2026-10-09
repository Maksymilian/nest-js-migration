import swc from 'unplugin-swc';
import { configDefaults, defineConfig } from 'vitest/config';
import { tsconfigAliases } from './vitest.aliases.js';

export default defineConfig({
  // Builds the test files with SWC, which emits the decorator metadata Nest's DI needs (recipes/swc.md).
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: { alias: tsconfigAliases() },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    exclude: [...configDefaults.exclude, '.node_modules-root/**', 'dist/**'],
    // Each e2e file starts its own in-process PostgreSQL (PGlite): give it time to boot.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
