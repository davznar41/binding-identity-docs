import { test, expect } from '@playwright/test';

test('el salto al main mantiene un indicador de foco visible', async ({ page }) => {
  await page.goto('/docs/id-validate/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const focus = await page.locator('main').evaluate((el) => ({ width: parseFloat(getComputedStyle(el).outlineWidth), style: getComputedStyle(el).outlineStyle }));
  expect(focus.style).toBe('solid');
  expect(focus.width).toBeGreaterThanOrEqual(3);
});

test('pasar a escritorio con el botón móvil enfocado conserva el foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/id-validate/');
  await page.locator('.mobile-toggle').focus();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.nav-list a').first()).toBeFocused();
});

test('el menú abierto mantiene el enlace enfocado al cambiar de anchura', async ({ page }) => {
  await page.goto('/docs/authority-reporting/group-check-in/');
  const active = page.locator('.nav-list [aria-current="page"]');
  await active.focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(active).toBeFocused();
  await expect(page.locator('.mobile-toggle')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-toggle')).toBeFocused();
});

test('las migas no presentan separadores en líneas independientes', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/docs/authority-reporting/group-check-in/');
    await expect(page.locator('.breadcrumbs .breadcrumb-separator')).toHaveCount(0);
    const separators = await page.locator('.breadcrumbs li:not(:first-child)').evaluateAll((items) => items.map((item) => getComputedStyle(item, '::before').content));
    expect(separators.every((content) => content === 'none' || content === 'normal')).toBeTruthy();
    await expect(page.locator('.breadcrumbs li').last()).toHaveText('Bi Group Check-in');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
});

test('la presentación excluye metadatos internos y usa flechas de navegación interna', async ({ page }) => {
  for (const path of ['/', '/docs/authority-reporting/', '/docs/authority-reporting/group-check-in/']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toContainText('pendiente de validación corporativa');
    await expect(page.locator('footer, .site-footer')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('↗');
  }
});

test('capturas finales de tableta, móvil y foco', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/docs/authority-reporting/');
  await page.screenshot({ path: 'verification/tableta-principal-cerrado.png', fullPage: true });
  await page.locator('.mobile-toggle').click();
  await page.locator('.group-toggle').click();
  await page.screenshot({ path: 'verification/tableta-menu-abierto.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/authority-reporting/group-check-in/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.screenshot({ path: 'verification/foco-main-movil.png', fullPage: true });
});
