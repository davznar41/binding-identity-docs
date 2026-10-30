import { test, expect } from '@playwright/test';
import { joinBase } from '../src/lib/paths';

test('prefijos normalizados sin duplicar barras', () => {
  expect(joinBase('/', '/docs/id-validate/')).toBe('/docs/id-validate/');
  expect(joinBase('/documentacion/', '/docs/id-validate/')).toBe('/documentacion/docs/id-validate/');
  expect(joinBase('/documentacion', '/')).toBe('/documentacion/');
});

test('build con base: 21 artículos, navegación, logo y fuentes dentro del prefijo', async ({ page, request }) => {
  const prefix = '/documentacion/';
  const failures: string[] = [];
  page.on('response', (response) => { if (response.status() >= 400) failures.push(response.url()); });
  await page.goto(prefix);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toHaveText('Documentación de Binding Identity');
  await expect(page.locator('.index-list > li')).toHaveCount(15);
  await expect(page.locator('.index-group .index-children a')).toHaveCount(6);
  const paths = await page.locator('.nav-list a').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')!));
  expect(paths).toHaveLength(21);
  expect(paths.every((path) => path.startsWith(prefix+'docs/'))).toBeTruthy();
  const directoryPaths = await page.locator('.index-list a').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')!));
  expect(directoryPaths).toEqual(paths);
  for (const path of paths) expect((await request.get(path)).ok(), path).toBeTruthy();
  await expect(page.locator('.corporate-logo')).toHaveAttribute('src', prefix+'assets/logo.webp');
  expect(await page.locator('.corporate-logo').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(500);
  expect(await page.evaluate(() => document.fonts.check('16px Inter'))).toBeTruthy();
  await page.locator('.group-toggle').click();
  await page.locator('.nav-list a[href$="/group-check-in/"]').click();
  await expect(page).toHaveURL(/\/documentacion\/docs\/authority-reporting\/group-check-in\/$/);
  await expect(page.locator('.breadcrumbs a').first()).toHaveAttribute('href', prefix);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Documentación', exact: true })).toHaveAttribute('href', prefix);
  await page.getByRole('banner').getByRole('link', { name: 'Documentación', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/documentacion/$'));
  await expect(page.locator('.index-list a')).toHaveCount(21);
  await page.goto(prefix+'docs/authority-reporting/group-check-in/');
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Bi Group Check-in');
  const assets = await page.locator('link[href], img[src]').evaluateAll((elements) => elements.map((e) => e.getAttribute('href') ?? e.getAttribute('src')!));
  expect(assets.every((asset) => asset.startsWith(prefix))).toBeTruthy();
  expect(failures).toEqual([]);
});

test('subdirectorio sin JavaScript mantiene todos los destinos accesibles', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/documentacion/docs/id-validate/');
  await page.locator('#authority-children a').last().click();
  await expect(page.locator('h1')).toHaveText('Bi Off-line Group Check-in');
  await page.getByRole('banner').getByRole('link', { name: 'Documentación', exact: true }).click();
  await expect(page).toHaveURL(/\/documentacion\/$/);
  await context.close();
});
