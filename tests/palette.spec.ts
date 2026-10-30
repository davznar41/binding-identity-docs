import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

test('contraste mejorado de todas las parejas reales de texto y sus estados', async ({ page }) => {
  const collected: unknown[] = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/docs/authority-reporting/', '/docs/authority-reporting/group-check-in/', '/pagina-inexistente/']) {
      await page.goto(path);
      if (width < 960) await page.locator('.mobile-toggle').click();
      for (const state of ['normal', 'hover', 'foco', 'grupo', 'cabecera-hover', 'cabecera-foco']) {
        const control = page.locator('.nav-list a').first();
        if (state === 'hover') await control.hover();
        if (state === 'foco') { await control.focus(); await page.keyboard.press('Tab'); }
        if (state === 'grupo') await page.locator('.group-toggle').click();
        if (state === 'cabecera-hover') await page.locator('.brand-section').hover();
        if (state === 'cabecera-foco') await page.locator('.brand-section').focus();
        const pairs = await page.evaluate(() => {
          const rgb = (color: string) => {
            const values = color.match(/[\d.]+/g)!.map(Number);
            return [values[0], values[1], values[2], values[3] ?? 1];
          };
          const blend = (fg: number[], bg: number[]) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]));
          const lum = (c: number[]) => c.map((n) => { n /= 255; return n <= .04045 ? n / 12.92 : ((n+.055)/1.055)**2.4; }).reduce((sum,n,i) => sum+n*[.2126,.7152,.0722][i],0);
          const pairs = new Map<string, { text: string; foreground: number[]; background: number[]; ratio: number; minimum: number }>();
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            if (['SCRIPT','STYLE','SVG','PATH','NOSCRIPT'].includes(el.tagName)) continue;
            const directText = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim()).join(' ').trim();
            if (!directText || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
            let background = [255,255,255];
            const ancestors: HTMLElement[] = [];
            for (let node: HTMLElement | null = el; node; node = node.parentElement) ancestors.unshift(node);
            for (const ancestor of ancestors) background = blend(rgb(getComputedStyle(ancestor).backgroundColor), background);
            const css = getComputedStyle(el);
            const foreground = blend(rgb(css.color), background);
            const ratio = (Math.max(lum(foreground),lum(background))+.05)/(Math.min(lum(foreground),lum(background))+.05);
            const size = parseFloat(css.fontSize);
            const minimum = size >= 24 || (size >= 18.6667 && parseInt(css.fontWeight) >= 700) ? 4.5 : 7;
            const key = JSON.stringify([foreground,background,minimum]);
            if (!pairs.has(key)) pairs.set(key, { text: directText.slice(0,80), foreground, background, ratio, minimum });
          }
          return [...pairs.values()];
        });
        collected.push({ width, path, state, pairs });
        for (const pair of pairs) expect(pair.ratio, `${width} ${path} ${state} ${pair.text}`).toBeGreaterThanOrEqual(pair.minimum);
      }
    }
  }
  writeFileSync('verification/contraste-renderizado.json', JSON.stringify(collected, null, 2));
});
