import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const env = { ...process.env, DOCS_BASE: '/documentacion/', DOCS_OUT_DIR: './.base-check/dist', ASTRO_TELEMETRY_DISABLED: '1', DOCS_BASE_CHECK: '1' };
const run = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Falló ${args.join(' ')} (${code})`)));
});
await run(['node_modules/astro/bin/astro.mjs', 'build']);
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', '4322', '--ignore-lock'], { env, stdio: 'inherit' });
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try { ready = (await globalThis.fetch('http://127.0.0.1:4322/documentacion/')).ok; } catch { /* Server is starting. */ }
    if (ready) break;
    if (server.exitCode !== null) throw new Error('El servidor del subdirectorio terminó durante el arranque.');
    await delay(250);
  }
  if (!ready) throw new Error('El servidor del subdirectorio no respondió.');
  await run(['node_modules/@playwright/test/cli.js', 'test']);
} finally {
  server.kill();
}
