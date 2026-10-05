import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.astro/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/website/public/**',
    ],
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  // .astro pages and layouts. Its parser needs Node 24.16 or later (see .nvmrc).
  ...astro.configs['flat/recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    // the code samples of the documentation show declarations that nothing else uses
    files: ['apps/website/src/snippets/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
