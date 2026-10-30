import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import originalHashes from './fixtures/document-hashes.json' with { type: 'json' };

test('los 21 Markdown conservan contenido idéntico con EOL normalizado', () => {
  expect(Object.keys(originalHashes)).toHaveLength(21);
  for (const [path, hash] of Object.entries(originalHashes)) {
    expect(createHash('sha256').update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n')).digest('hex'), path).toBe(hash);
  }
});

test('logotipo original íntegro y cabecera limitada a identidad documental', async ({ page, request }) => {
  const response = await request.get('/assets/logo.webp');
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe('eeab0b65df9a94d983aa03eb66b0b55dd95f034c937793129fc944ca38b37880');
  await page.goto('/');
  const banner = page.getByRole('banner');
  await expect(banner.locator('img')).toHaveAttribute('alt', 'Binding Software');
  await expect(banner).toHaveText('Documentación');
  await expect(banner.locator('a')).toHaveCount(1);
  await expect(banner.getByRole('link', { name: 'Documentación', exact: true })).toHaveAttribute('href', '/');
  await expect(banner.locator('a img')).toHaveCount(0);
  await expect(banner.locator('nav, button, input')).toHaveCount(0);
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const image = await page.locator('.corporate-logo').evaluate((el: HTMLImageElement) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { loaded: el.complete, natural: [el.naturalWidth, el.naturalHeight], ratio: r.width/r.height, width: r.width, filter: s.filter, transform: s.transform };
    });
    expect(image.loaded).toBeTruthy();
    expect(image.natural).toEqual([500, 125]);
    expect(image.ratio).toBeCloseTo(4, 4);
    expect(image.width).toBeLessThanOrEqual(500);
    expect(image.filter).toBe('none');
    expect(image.transform).toBe('none');
  }
});

test('solo navegación interna y recursos propios; sin nuevas funciones', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4321/')) external.push(request.url());
  });
  for (const path of ['/', '/docs/binding-technology/', '/docs/authority-reporting/', '/docs/authority-reporting/group-check-in/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const invalid = await page.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')).filter((href) => !href?.startsWith('/') && !href?.startsWith('#')));
    expect(invalid).toEqual([]);
    await expect(page.locator('form,input,select,iframe')).toHaveCount(0);
  }
  expect(external).toEqual([]);
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Documentación de Binding Identity');
  await expect(page.locator('.home-stats, .home-hero .primary-link')).toHaveCount(0);
});

test('fuentes corporativas locales cargadas y respaldo legible', async ({ page }) => {
  await page.goto('/docs/id-validate/');
  await page.evaluate(async () => {
    // Montserrat 700 is declared but not used on this page; request both tested faces.
    await Promise.all([
      document.fonts.load('16px Inter'),
      document.fonts.load('700 32px Montserrat'),
    ]);
    await document.fonts.ready;
  });
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    title: getComputedStyle(document.querySelector('h1')!).fontFamily,
    inter: document.fonts.check('16px Inter'),
    montserrat: document.fonts.check('700 32px Montserrat'),
  }));
  expect(fonts.body).toContain('Inter');
  expect(fonts.title).toContain('Montserrat');
  expect(fonts.inter && fonts.montserrat).toBeTruthy();
  await page.route('**/*.woff2', (route) => route.abort());
  await page.reload();
  await expect(page.locator('.prose')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('objetivos de 44px y foco completo en escritorio y móvil', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/docs/authority-reporting/group-check-in/');
    if (width < 960) await page.locator('.mobile-toggle').click();
    const undersized = await page.locator('a:visible,button:visible').evaluateAll((elements) => elements.filter((el) => !el.classList.contains('skip-link')).map((el) => ({ text: el.textContent?.trim(), r: el.getBoundingClientRect() })).filter(({r}) => r.width < 44 || r.height < 44).map(({text,r}) => ({text,width:r.width,height:r.height})));
    expect(undersized).toEqual([]);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/docs/authority-reporting/group-check-in/');
  for (let i = 0; i < 35; i++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const r = el.getBoundingClientRect();
      const side = el.closest('.sidebar');
      const clip = side?.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { tag: el.tagName, text: el.textContent?.trim(), full: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth && (!clip || (r.top >= clip.top && r.bottom <= clip.bottom)), outline: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    if (result.tag !== 'A' && result.tag !== 'BUTTON') continue;
    expect(result.full, result.text).toBeTruthy();
    expect(result.outline).toBeGreaterThanOrEqual(3);
    expect(result.style).toBe('solid');
    if (result.text?.includes('Siguiente')) break;
  }
  await page.screenshot({ path: 'verification/foco-escritorio.png', fullPage: false });
});

test('contraste forzado emulado y movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/docs/authority-reporting/group-check-in/');
  await expect(page.locator('[aria-current="page"]')).toHaveCSS('text-decoration-line', 'underline');
  await page.locator('.group-toggle').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#authority-children')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(page.locator('#authority-children')).toBeVisible();
  await page.screenshot({ path: 'verification/contraste-forzado-emulado.png', fullPage: false });
});
