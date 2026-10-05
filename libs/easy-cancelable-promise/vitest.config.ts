import { defineConfig } from 'vitest/config';
import path from 'node:path';

// The suite imports the subject under test through the package name `easy-cancelable-promise`.
// EASY_CANCELABLE_PROMISE_TEST_TARGET picks what that name resolves to:
//   - src  (default): the TypeScript source
//   - dist: the built, publishable package in ./dist (run `yarn build` first)
const target =
  process.env.EASY_CANCELABLE_PROMISE_TEST_TARGET === 'dist' ? 'dist' : 'src';

const src = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'dist');

export default defineConfig({
  test: {
    name: `easy-cancelable-promise (${target})`,
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__test__/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/*.ts'],
      // only type declarations
      exclude: ['src/types.ts'],
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias:
      target === 'dist'
        ? [
            // Deep subpaths must be listed before the bare barrel so they win for deep imports.
            {
              find: /^easy-cancelable-promise\/(.*)$/,
              replacement: `${dist}/$1.mjs`,
            },
            {
              find: /^easy-cancelable-promise$/,
              replacement: `${dist}/bundle.mjs`,
            },
          ]
        : [
            {
              find: /^easy-cancelable-promise\/(.*)$/,
              replacement: `${src}/$1`,
            },
            {
              find: /^easy-cancelable-promise$/,
              replacement: `${src}/index.ts`,
            },
          ],
  },
});
