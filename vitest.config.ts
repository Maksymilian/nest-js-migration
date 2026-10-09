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
    include: ['**/*.spec.ts'],
    exclude: [...configDefaults.exclude, '.node_modules-root/**', 'dist/**'],
  },
});
