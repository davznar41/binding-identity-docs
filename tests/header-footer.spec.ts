import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import documents from './fixtures/documents.json' with { type: 'json' };

test('la cabecera contiene solo el logo no enlazado y Documentación como enlace nativo', async ({ page }) => {
  for (const path of ['/', '/docs/id-validate/', '/docs/authority-reporting/', '/docs/authority-reporting/pre-check-in/']) {
    await page.goto(path);
    const banner = page.getByRole('banner');
    const link = banner.getByRole('link', { name: 'Documentación', exact: true });
    await expect(banner.locator('img')).toHaveCount(1);
    await expect(banner.locator('a')).toHaveCount(1);
    await expect(banner.locator('a img, nav, button, input')).toHaveCount(0);
    await expect(link).toHaveAttribute('href', '/');
    await expect(link).not.toHaveAttribute('role');
    await expect(link).not.toHaveAttribute('aria-label');
    await expect(link).not.toHaveAttribute('aria-current');
    await expect(link).toHaveCSS('text-decoration-line', 'none');
  }
});

test('Documentación devuelve al índice desde los 21 artículos en escritorio y móvil', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const doc of documents) {
      await page.goto(`/docs/${doc.id}/`);
      await page.getByRole('banner').getByRole('link', { name: 'Documentación', exact: true }).click();
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toHaveText('Documentación de Binding Identity');
      await expect(page.locator('.index-list > li')).toHaveCount(15);
      await expect(page.locator('.index-children a')).toHaveCount(6);
    }
  }
});

test('orden salto-cabecera, Enter y foco completo de al menos 44px', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/docs/authority-reporting/pre-check-in/');
    const banner = page.getByRole('banner');
    const link = banner.getByRole('link', { name: 'Documentación', exact: true });
    const device = width === 1440 ? 'escritorio' : 'movil';
    await page.mouse.move(0, 0);
    await expect(link).toHaveCSS('text-decoration-line', 'none');
    await banner.screenshot({ path: `verification/cabecera-normal-${device}.png` });
    await link.hover();
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await expect(link).toHaveCSS('text-decoration-thickness', '2px');
    await banner.screenshot({ path: `verification/cabecera-hover-${device}.png` });
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    expect(await link.evaluate((el) => el.matches(':focus-visible'))).toBeTruthy();
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    const state = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { width:r.width, height:r.height, full:r.left>=3 && r.top>=3 && r.right<=innerWidth-3 && r.bottom<=innerHeight-3, outline:parseFloat(s.outlineWidth), style:s.outlineStyle };
    });
    expect(state.width).toBeGreaterThanOrEqual(44);
    expect(state.height).toBeGreaterThanOrEqual(44);
    expect(state.full).toBeTruthy();
    expect(state.outline).toBeGreaterThanOrEqual(3);
    expect(state.style).toBe('solid');
    await banner.screenshot({ path: `verification/cabecera-estado-foco-${device}.png` });
    await page.screenshot({ path:`verification/cabecera-foco-${width===1440?'escritorio':'movil'}.png` });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
    await link.hover();
    await page.mouse.down();
    expect(await link.evaluate((el) => el.matches(':active'))).toBeTruthy();
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
});

test('footer ausente en las 23 páginas y CSS retirado, con navegación conservada', async ({ page }) => {
  expect(readFileSync('src/styles/global.css','utf8')).not.toContain('.site-footer');
  for (const path of ['/', ...documents.map((d)=>`/docs/${d.id}/`), '/pagina-inexistente/']) {
    await page.goto(path);
    await expect(page.locator('footer, .site-footer, [role="contentinfo"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Binding Identity / Documentación');
    if (path.startsWith('/docs/')) {
      await expect(page.getByRole('navigation', { name:'Artículos anterior y siguiente' })).toBeVisible();
      await expect(page.getByRole('navigation', { name:'Migas de pan' })).toBeVisible();
    }
  }
});

test('artículo breve mantiene altura natural y final legible sin footer incluso al imprimir', async ({ page }) => {
  const heights: number[]=[];
  for (const height of [900,1400]) {
    await page.setViewportSize({ width:1440,height });
    await page.goto('/docs/id-validate/');
    heights.push(await page.locator('main').evaluate((el)=>el.getBoundingClientRect().height));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  expect(heights[0]).toBeCloseTo(heights[1],0);
  expect(heights[1]).toBeLessThan(900);
  await page.locator('main').screenshot({ path:'verification/articulo-final-sin-footer.png' });
  await page.emulateMedia({ media:'print' });
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.locator('.previous-next')).toBeVisible();
});

test('el enlace de cabecera funciona sin JavaScript', async ({ browser, baseURL }) => {
  const context=await browser.newContext({ javaScriptEnabled:false, baseURL });
  const page=await context.newPage();
  await page.goto('/docs/authority-reporting/pre-check-in/');
  await page.getByRole('banner').getByRole('link', { name:'Documentación', exact:true }).click();
  await expect(page.locator('.index-list a')).toHaveCount(21);
  await context.close();
});
