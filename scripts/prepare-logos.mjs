// Rend transparents les logos de 02-front/public/drakko (leurs PNG ont un fond opaque, ce qui laisserait un
// carré blanc ou noir sur la page), recadre la marque et l'écrit en WebP dans public/brand/.
// À relancer seulement si le logo change : node scripts/prepare-logos.mjs (les sorties sont versionnées).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = (name) => join(root, '..', '02-front', 'public', 'drakko', name);
const PADDING = 4;
// Grande taille (illustrations) et petite taille (en-tête et pied de page : quelques Ko au lieu de dizaines)
const SIZES = [
  { suffix: '', width: 520 },
  { suffix: '-sm', width: 160 },
];

// « Couleur vers alpha » : le fond (blanc ou noir) devient de la transparence, la couleur d'origine est
// restituée sous l'alpha pour que les bords lissés ne gardent pas de liseré
async function toTransparent(file, outBase, background) {
  const { data, info } = await sharp(source(file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;

  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const alpha =
      background === 'white'
        ? 1 - Math.min(r, g, b) / 255
        : Math.max(r, g, b) / 255;
    if (alpha < 0.04) {
      px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
      continue;
    }
    for (let c = 0; c < 3; c++) {
      const value =
        background === 'white'
          ? 255 - (255 - px[i + c]) / alpha
          : px[i + c] / alpha;
      px[i + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
    px[i + 3] = Math.round(alpha * 255);
    const pixel = i / 4;
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }

  const crop = {
    left: Math.max(0, minX - PADDING),
    top: Math.max(0, minY - PADDING),
    width: Math.min(info.width, maxX - minX + 1 + 2 * PADDING),
    height: Math.min(info.height, maxY - minY + 1 + 2 * PADDING),
  };
  const cropped = await sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(crop)
    .png()
    .toBuffer();
  for (const { suffix, width } of SIZES) {
    const out = `${outBase}${suffix}.webp`;
    const result = await sharp(cropped)
      .resize({ width })
      .webp({ quality: 84, alphaQuality: 85 })
      .toFile(join(root, 'public', 'brand', out));
    console.log(`${out} : ${result.width}x${result.height}, ${result.size} octets`);
  }
}

await toTransparent('logo_app_light.png', 'mark-navy', 'white');
await toTransparent('logo_dark_wt.png', 'mark-white', 'black');

// Image de partage (WhatsApp, LinkedIn…) : le logo complet, avec son nom et sa signature, sur fond blanc
const OG = { width: 1200, height: 630 };
const logo = await sharp(source('logo_light.png'))
  .flatten({ background: '#ffffff' })
  .resize({ height: OG.height, fit: 'inside' })
  .toBuffer();
await sharp({
  create: { ...OG, channels: 3, background: '#ffffff' },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public', 'og.png'));
console.log('og.png : 1200x630');
