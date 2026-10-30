import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import expected from './fixtures/documents.json' with { type: 'json' };

const child = '/docs/authority-reporting/group-check-in/';
const parent = '/docs/authority-reporting/';
const tags = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const checkAxe = async (page: Page) => {
  const result = await new AxeBuilder({ page }).withTags(tags).analyze();
  test.info().annotations.push({ type: 'axe', description: JSON.stringify({ url: page.url(), version: result.testEngine.version, violations: result.violations.length, passes: result.passes.length, incomplete: result.incomplete.map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) })) }) });
  expect(result.violations).toEqual([]);
};
const noOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= window.innerWidth,
    elements: [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).map((el) => ({ element: el.tagName+'.'+el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).slice(0,8),
  }));
  expect(overflow.fits, JSON.stringify(overflow.elements)).toBeTruthy();
};

test('contrato editorial: 15 entradas, seis hijos y 21 páginas en el orden facilitado', async ({ page, request }) => {
  await page.goto('/');
  const nav = page.locator('#documentation-navigation');
  await expect(nav.locator('.nav-list > li')).toHaveCount(15);
  await expect(nav.locator('.has-children')).toHaveCount(1);
  await expect(nav.locator('.nav-list > li').last()).toHaveClass(/has-children/);
  await expect(nav.locator('#authority-children > li')).toHaveCount(6);
  const links = await nav.locator('a').evaluateAll((anchors) => anchors.map((a) => ({
    path: a.getAttribute('href'), title: a.textContent?.replace(/\s+/g, ' ').trim(),
  })));
  expect(links).toEqual(expected.map((item) => ({ path: `/docs/${item.id}/`, title: item.title })));
  for (const item of expected) {
    await expect(nav.getByRole('link', { name: item.title, exact: true, includeHidden: true })).toHaveAttribute('href', `/docs/${item.id}/`);
  }
  for (const link of await page.locator('a[href]').evaluateAll((anchors) => [...new Set(anchors.map((a) => a.getAttribute('href')!))])) {
    if (link.startsWith('#')) continue;
    expect((await request.get(link)).ok(), link).toBeTruthy();
  }
});

for (const doc of expected) {
  test(`artículo ${doc.number}: contenido, URL, recarga y axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    expect((await page.goto(`/docs/${doc.id}/`))?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(doc.title);
    await expect(page.locator('.article-meta, .article-position, .documentation-article .eyebrow, .related-number')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('Guía de funcionalidades');
    await expect(page.locator('main')).not.toContainText(/Artículo\s+\d+\s*\/\s*21/);
    await expect(page.locator('.prose')).toHaveText(doc.description);
    if (doc.example) await expect(page.locator('.example p')).toHaveText(doc.example);
    await expect(page).toHaveTitle(`${doc.title} | Binding Identity · Documentación`);
    await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('[aria-current="page"]')).toHaveAttribute('href', `/docs/${doc.id}/`);
    await expect(page.locator('.breadcrumbs li').last()).toHaveText(doc.title);
    if (doc.id.includes('/')) {
      await expect(page.locator('.group-toggle')).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.breadcrumbs a').last()).toHaveAttribute('href', parent);
    }
    await page.reload();
    await expect(page.locator('h1')).toHaveText(doc.title);
    await checkAxe(page);
    expect(errors).toEqual([]);
  });
}

test('botón y enlace del apartado 15 independientes; teclado y foco oculto', async ({ page }) => {
  await page.goto(parent);
  const toggle = page.locator('.group-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(new URL(page.url()).pathname).toBe(parent);
  await checkAxe(page);
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#authority-children')).toBeHidden();
  await page.keyboard.press('Tab');
  expect(await page.locator('#authority-children').evaluate((el) => el.contains(document.activeElement))).toBeFalsy();
  await checkAxe(page);
  await toggle.click();
  await page.locator('#authority-children a').filter({ hasText: 'Bi Group Check-in' }).click();
  await expect(page).toHaveURL(child);
  await page.getByRole('navigation', { name: 'Documentación de funcionalidades' }).getByRole('link', { name: 'Bi Authority Reporting', exact: false }).click();
  await expect(page).toHaveURL(parent);
});

test('navegación por menú, anterior/siguiente y atrás/adelante', async ({ page }) => {
  await page.goto('/docs/id-electronic-reading/');
  await page.getByRole('navigation', { name: 'Documentación de funcionalidades' }).getByRole('link', { name: 'ID Validate', exact: true }).click();
  await expect(page).toHaveURL('/docs/id-validate/');
  await page.goBack();
  await expect(page).toHaveURL('/docs/id-electronic-reading/');
  await page.goForward();
  await expect(page).toHaveURL('/docs/id-validate/');
  await page.locator('.previous-next .next').click();
  await expect(page).toHaveURL('/docs/customizable-paperless-regcard/');
});

test('salto, orden de tabulación, foco visible y salida de la navegación', async ({ page }) => {
  await page.goto('/docs/binding-technology/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.goto(child);
  const traversed: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return { text: el.textContent?.trim() ?? '', tag: el.tagName, visible: rect.bottom > 0 && rect.top < innerHeight, outline: css.outlineStyle };
    });
    traversed.push(state.text);
    if (state.tag === 'A' || state.tag === 'BUTTON') {
      expect(state.visible).toBeTruthy();
      expect(state.outline).not.toBe('none');
    }
    if (state.text.includes('Anterior')) break;
  }
  expect(traversed.some((text) => text.includes('Bi Off-line Group Check-in'))).toBeTruthy();
  expect(traversed.some((text) => text.includes('Anterior'))).toBeTruthy();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.breadcrumbs a').last()).toBeFocused();
});

test('menú móvil: apertura, cierre con Escape, foco y navegación', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(child);
  const toggle = page.locator('.mobile-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#documentation-navigation')).toBeHidden();
  await checkAxe(page);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.group-toggle')).toHaveAttribute('aria-expanded', 'true');
  await checkAxe(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.nav-list a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#documentation-navigation')).toBeHidden();
  await page.keyboard.press('Space');
  await page.locator('#authority-children a').first().click();
  await expect(page).toHaveURL('/docs/authority-reporting/pre-check-in/');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.locator('[aria-current="page"]')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('#documentation-navigation')).toBeVisible();
});

for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
  test(`redistribución y títulos completos a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', ...expected.map((doc) => `/docs/${doc.id}/`)]) {
      await page.goto(path);
      await noOverflow(page);
      if (width < 960) await page.locator('.mobile-toggle').click();
      await noOverflow(page);
      const clipped = await page.locator('.nav-list a, h1').evaluateAll((elements) => elements.some((el) => el.scrollWidth > el.clientWidth + 1));
      expect(clipped, path).toBeFalsy();
    }
  });
}

test('contenido sin JavaScript y enlaces hijos disponibles', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/docs/binding-technology/');
  await expect(page.locator('#authority-children a')).toHaveCount(6);
  await expect(page.locator('#authority-children a').first()).toBeVisible();
  await page.locator('#authority-children a').last().click();
  await expect(page.locator('h1')).toHaveText('Bi Off-line Group Check-in');
  await noOverflow(page);
  await context.close();
});

test('texto al 200% y espaciado personalizado', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ['/', parent, child]) {
    await page.goto(path);
    await page.addStyleTag({ content: 'html{font-size:200% !important} *{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}' });
    await noOverflow(page);
    await expect(page.locator('h1')).toBeVisible();
    if (await page.locator('.mobile-toggle').isVisible()) await page.locator('.mobile-toggle').click();
    await noOverflow(page);
    await expect(page.locator('#documentation-navigation')).toBeVisible();
  }
});

test('axe portada y capturas reales de escritorio y móvil', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await checkAxe(page);
  await page.screenshot({ path: 'verification/escritorio-inicio.png', fullPage: true });
  await page.goto(parent);
  await page.screenshot({ path: 'verification/escritorio-articulo.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(child);
  await page.screenshot({ path: 'verification/movil-articulo.png', fullPage: true });
  await page.locator('.mobile-toggle').click();
  await page.screenshot({ path: 'verification/movil-menu.png', fullPage: true });
});

test('404 útil, sin enlaces ficticios', async ({ page }) => {
  const response = await page.goto('/pagina-inexistente/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Página no encontrada');
  await page.getByRole('link', { name: 'Volver al índice' }).click();
  await expect(page).toHaveURL('/');
});
