import { defineConfig } from 'astro/config';
import process from 'node:process';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  base: process.env.DOCS_BASE ?? '/',
  outDir: process.env.DOCS_OUT_DIR ?? './dist',
});
