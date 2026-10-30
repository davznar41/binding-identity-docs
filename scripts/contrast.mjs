import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import console from 'node:console';

const luminance = (hex) => {
  const rgb = hex.match(/[a-f\d]{2}/gi).map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};

const tokens = Object.fromEntries([...readFileSync('src/styles/tokens.css', 'utf8').matchAll(/--(color-[\w-]+):\s*(#[\da-f]{6})/gi)].map((m) => [m[1], m[2]]));
const pairs = [];
for (const foreground of ['text', 'heading', 'muted', 'accent', 'accent-hover']) {
  for (const background of ['bg', 'surface', 'tint', 'hover']) {
    pairs.push([`${foreground} / ${background}`, tokens[`color-${foreground}`], tokens[`color-${background}`], 7]);
  }
}
for (const background of ['bg','surface']) pairs.push([`Enlace azul / ${background}`, tokens['color-link'], tokens[`color-${background}`], 7]);
pairs.push(['Texto de botón / acento', '#ffffff', tokens['color-accent'], 7]);
pairs.push(['Texto de botón / hover', '#ffffff', tokens['color-accent-hover'], 7]);
for (const background of ['bg','surface','tint','hover']) {
  pairs.push([`Foco / ${background}`, tokens['color-focus'], tokens[`color-${background}`], 3]);
  pairs.push([`Borde esencial / ${background}`, tokens['color-strong-border'], tokens[`color-${background}`], 3]);
}

const results = pairs.map(([name, foreground, background, minimum]) => {
  const a = luminance(foreground);
  const b = luminance(background);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return { name, foreground, background, minimum, ratio: Number(ratio.toFixed(2)), pass: ratio >= minimum };
});
mkdirSync('verification', { recursive: true });
writeFileSync('verification/contraste.json', JSON.stringify({ method: 'WCAG relative luminance sRGB', results }, null, 2) + '\n');
if (results.some((result) => !result.pass)) throw new Error('Hay parejas de contraste insuficientes.');
console.log(`${results.length} parejas de contraste verificadas.`);
