import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/**', '.astro/**', '.base-check/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'verification/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  { files: ['**/*.astro', '**/*.ts'], rules: { 'no-undef': 'off' } },
];
