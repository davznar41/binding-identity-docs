import { test, expect } from '@playwright/test';
import expected from './fixtures/documents.json' with { type: 'json' };
import { getDocumentationIcon, type DocumentationIconRegistry } from '../src/lib/documentation-icons';

const parent = '/docs/authority-reporting/';
const normal = '/docs/id-validate/';
const paths = expected.map((doc) => `/docs/${doc.id}/`);

test('el menú contiene títulos íntegros sin numeración, encabezado ni nota residual', async ({ page }) => {
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Documentación de funcionalidades', exact: true });
  await expect(navigation.locator('.nav-list > li')).toHaveCount(15);
  await expect(navigation.locator('.nav-list')).toHaveCSS('list-style-type', 'none');
  await expect(navigation.locator('.sidebar-heading, .count, .nav-number, .sidebar-note')).toHaveCount(0);
  await expect(navigation).not.toContainText('Guía de funcionalidades');
  await expect(navigation.getByText('Binding Identity Technology', { exact: true })).toHaveCount(0);
  const mainTitles = expected.filter((doc) => !doc.id.includes('/')).map((doc) => doc.title);
  await expect(navigation.locator('.nav-row > a')).toHaveText(mainTitles);
  for (const doc of expected) {
    await expect(navigation.getByRole('link', { name: doc.title, exact: true, includeHidden: true })).toHaveAttribute('href', `/docs/${doc.id}/`);
  }
  await expect(page.locator('.group-toggle')).toHaveAttribute('aria-controls', 'authority-children');
  await expect(page.locator('.group-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('el directorio semántico expone 15 accesos, seis hijos y exactamente los 21 destinos', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Documentación de Binding Identity');
  await expect(page.locator('main .home-lead, main .home-stats, main .index-number, main .article-meta, main .article-position, main .primary-link')).toHaveCount(0);
  const directory = page.locator('ul.index-list');
  await expect(directory).toHaveCount(1);
  await expect(directory).toHaveCSS('list-style-type', 'none');
  await expect(directory.locator(':scope > li')).toHaveCount(15);
  await expect(directory.locator(':scope > li > .index-item')).toHaveCount(15);
  await expect(directory.locator(':scope > li.index-group')).toHaveCount(1);
  const group = directory.locator(':scope > li').last();
  await expect(group).toHaveClass(/index-group/);
  await expect(group.locator(':scope > .index-item')).toHaveAttribute('href', parent);
  await expect(group.locator('ul.index-children > li > a')).toHaveCount(6);
  await expect(directory.locator('a')).toHaveCount(21);
  const destinations = await directory.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(destinations).toEqual(paths);
  expect(new Set(destinations).size).toBe(21);
  for (const doc of expected) {
    const link = directory.getByRole('link', { name: doc.title, exact: true });
    await expect(link).toHaveAttribute('href', `/docs/${doc.id}/`);
    expect((await request.get(`/docs/${doc.id}/`)).ok(), doc.title).toBeTruthy();
  }
  await expect(page.locator('a a')).toHaveCount(0);
});

test('sin iconos registrados no hay nodos decorativos, columnas vacías ni nombres añadidos', async ({ page }) => {
  for (const path of ['/', normal, parent]) {
    await page.goto(path);
    await expect(page.locator('.documentation-icon')).toHaveCount(0);
    await expect(page.locator('.nav-list img, .index-list img')).toHaveCount(0);
    const gaps = await page.locator('.nav-row > a, .index-item').evaluateAll((links) => links.map((link) => {
      const text = [...link.childNodes].find((node) => node.nodeType === Node.ELEMENT_NODE && node.textContent?.trim());
      if (!(text instanceof HTMLElement)) return 0;
      const linkStyle = getComputedStyle(link);
      return text.getBoundingClientRect().left - link.getBoundingClientRect().left - parseFloat(linkStyle.paddingLeft) - parseFloat(linkStyle.borderLeftWidth);
    }));
    expect(gaps.every((gap) => Math.abs(gap) < 1), `${path}: ${gaps.join(', ')}`).toBeTruthy();
    const nav = page.locator('#documentation-navigation');
    for (const doc of expected) await expect(nav.getByRole('link', { name: doc.title, exact: true, includeHidden: true })).toHaveCount(1);
  }
});

test('el registro opcional resuelve recursos por identificador estable y conserva sus URLs', () => {
  const icon = { src: '/documentacion/_astro/approved.svg' };
  const registry: DocumentationIconRegistry = { 'id-validate': icon };
  expect(getDocumentationIcon('id-validate', registry)).toBe(icon);
  expect(getDocumentationIcon('id-electronic-reading', registry)).toBeUndefined();
  expect(getDocumentationIcon('authority-reporting/group-check-in', registry)).toBeUndefined();
  expect(getDocumentationIcon('id-validate')).toBeUndefined();
  expect(icon.src).toBe('/documentacion/_astro/approved.svg');
});

test('la portada mantiene dos columnas en escritorio y una en móvil sin desbordar', async ({ page }) => {
  for (const [width, columns] of [[1440, 2], [390, 1], [320, 1]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const layout = await page.locator('.index-list').evaluate((element) => {
      const css = getComputedStyle(element);
      return { display: css.display, columns: css.gridTemplateColumns.split(/\s+/).length, width: element.getBoundingClientRect().width, groupWidth: element.querySelector('.index-group')!.getBoundingClientRect().width };
    });
    expect(layout.display).toBe('grid');
    expect(layout.columns).toBe(columns);
    expect(layout.groupWidth).toBeCloseTo(layout.width, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    if (width === 1440 || width === 390) await page.screenshot({ path: `verification/uxdoc-portada-${width === 1440 ? 'escritorio' : 'movil'}.png`, fullPage: true });
  }
});

test('los 21 enlaces del directorio conservan el orden de teclado y los nombres accesibles', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const links = page.locator('.index-list a');
  await links.first().focus();
  for (let i = 0; i < expected.length; i++) {
    await expect(links.nth(i)).toBeFocused();
    await expect(links.nth(i)).toHaveAccessibleName(expected[i].title);
    await expect(links.nth(i)).toHaveCSS('outline-style', 'solid');
    if (i < expected.length - 1) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(paths.at(-1)!);
  await expect(page.locator('h1')).toHaveText(expected.at(-1)!.title);
});

test('capturas UX-DOC de artículo normal, apartado padre y navegación móvil', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(normal);
  await expect(page.locator('h1')).toHaveText('ID Validate');
  await page.screenshot({ path: 'verification/uxdoc-articulo-normal-escritorio.png', fullPage: true });
  await page.goto(parent);
  await expect(page.locator('.related a')).toHaveCount(6);
  await expect(page.locator('.related-number')).toHaveCount(0);
  await page.locator('.group-toggle').click();
  await page.screenshot({ path: 'verification/uxdoc-apartado15-escritorio.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(normal);
  await page.screenshot({ path: 'verification/uxdoc-articulo-normal-movil.png', fullPage: true });
  await page.goto(parent);
  await expect(page.locator('h1')).toHaveText('Bi Authority Reporting (SESHospedajes Management)');
  await expect(page.locator('.related a')).toHaveCount(6);
  await page.screenshot({ path: 'verification/uxdoc-apartado15-movil.png', fullPage: true });
  await page.locator('.mobile-toggle').click();
  await page.locator('.group-toggle').click();
  await expect(page.locator('.group-toggle')).toHaveAttribute('aria-expanded', 'true');
  const captureState = await page.locator('.skip-link').evaluate((link) => ({
    focused: link === document.activeElement,
    top: link.getBoundingClientRect().top,
    bottom: link.getBoundingClientRect().bottom,
    scrollY: window.scrollY,
  }));
  test.info().annotations.push({ type: 'mobile-capture', description: JSON.stringify(captureState) });
  // The group button scrolls into view on activation; capture from the page top.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'verification/uxdoc-apartado15-movil-menu.png', fullPage: true });
  await page.goto('/docs/authority-reporting/group-check-in/');
  await page.locator('.mobile-toggle').click();
  await expect(page.locator('#authority-children a')).toHaveCount(6);
  await expect(page.locator('[aria-current="page"]')).toHaveAccessibleName('Bi Group Check-in');
  await page.screenshot({ path: 'verification/uxdoc-navegacion-movil.png', fullPage: true });
});
