/**
 * Print art for the two faces of the paper card, drawn to 2D canvases and
 * uploaded as textures. Each face has a colour map (ink on paper) and a
 * material map: R = hot-foil, G = varnish gloss.
 *
 * Front: rich black ink on the coated side, the name in hot foil, the title
 * and the link in pearl ink. Back: the uncoated side, the QR in obsidian ink
 * (square modules on whole texels), and the link to read aloud.
 */
import { CARD_H, CARD_W } from './card-document';

/** Texels per mm: 1152 × 640 per face. */
const PX_PER_MM = 12.8;
export const TEX_W = Math.round(CARD_W * PX_PER_MM);
export const TEX_H = Math.round(CARD_H * PX_PER_MM);

const OBSIDIAN = '#0A0E27';
const PEARL = '#FAFAFA';
const PAPER_BACK = '#F3F2EE';
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export interface CardFace {
  color: HTMLCanvasElement;
  material: HTMLCanvasElement;
}

export interface CardArtInput {
  name: string;
  title?: string;
  org: string;
  shortLink: string;
  /** URL of the QR SVG (public/c/{slug}-qr.svg, made with @madfam/qr). */
  qrSrc: string;
  /** URL of the white MADFAM mark. */
  logoSrc: string;
}

function canvas() {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  return c;
}

function context(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('paper card: no 2D canvas');
  return ctx;
}

const mm = (v: number) => v * PX_PER_MM;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`paper card: could not load ${src}`));
    img.src = src;
  });
}

/** Split the name into at most two lines that fit `maxWidth` at the largest size from `sizes`. */
function fitName(ctx: CanvasRenderingContext2D, name: string, maxWidth: number) {
  const words = name.split(/\s+/);
  for (const size of [8.2, 7.4, 6.6, 5.9, 5.2].map(mm)) {
    ctx.font = `700 ${size}px ${SANS}`;
    if (ctx.measureText(name).width <= maxWidth) return { size, lines: [name] };
    for (let cut = words.length - 1; cut > 0; cut--) {
      const a = words.slice(0, cut).join(' ');
      const b = words.slice(cut).join(' ');
      if (ctx.measureText(a).width <= maxWidth && ctx.measureText(b).width <= maxWidth) {
        return { size, lines: [a, b] };
      }
    }
  }
  return { size: mm(5.2), lines: [name] };
}

export async function drawCardArt(
  input: CardArtInput
): Promise<{ front: CardFace; back: CardFace }> {
  const [{ img: qr, modules }, logo] = await Promise.all([
    loadQr(input.qrSrc),
    loadImage(input.logoSrc),
  ]);

  // ---- front -------------------------------------------------------------
  const fc = canvas();
  const fm = canvas();
  const c = context(fc);
  const m = context(fm);
  c.fillStyle = OBSIDIAN;
  c.fillRect(0, 0, TEX_W, TEX_H);
  // Varnish over the whole printed side; foil sits on top of it.
  m.fillStyle = 'rgb(0, 150, 0)';
  m.fillRect(0, 0, TEX_W, TEX_H);

  const left = mm(7);
  const logoH = mm(7.5);
  c.drawImage(logo, left, mm(6.5), (logoH * logo.naturalWidth) / logo.naturalHeight, logoH);
  c.font = `600 ${mm(2.6)}px ${SANS}`;
  c.fillStyle = PEARL;
  c.textBaseline = 'middle';
  c.fillText('MADFAM', left + logoH * 1.15, mm(6.5) + logoH / 2);

  const { size, lines } = fitName(c, input.name, TEX_W - 2 * left);
  const lineH = size * 1.08;
  const nameBottom = mm(32);
  c.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    const y = nameBottom - (lines.length - 1 - i) * lineH;
    c.font = `700 ${size}px ${SANS}`;
    m.font = c.font;
    // Under the foil the ink is the gradient's dark end, so the name still reads if the foil is dim.
    c.fillStyle = '#3d3f5c';
    c.fillText(line, left, y);
    m.fillStyle = 'rgb(255, 0, 0)';
    m.fillText(line, left, y);
  });

  c.fillStyle = 'rgba(250, 250, 250, 0.9)';
  c.font = `500 ${mm(3.1)}px ${SANS}`;
  c.fillText(input.title ?? input.org, left, mm(39));
  if (input.title) {
    c.fillStyle = 'rgba(250, 250, 250, 0.7)';
    c.font = `400 ${mm(2.8)}px ${SANS}`;
    c.fillText(input.org, left, mm(43.5));
  }
  c.fillStyle = 'rgba(250, 250, 250, 0.75)';
  c.font = `500 ${mm(2.6)}px ${MONO}`;
  c.textAlign = 'right';
  c.fillText(input.shortLink, TEX_W - left, mm(43.5));

  // ---- back --------------------------------------------------------------
  const bc = canvas();
  const bm = canvas();
  const b = context(bc);
  const bmc = context(bm);
  b.fillStyle = PAPER_BACK;
  b.fillRect(0, 0, TEX_W, TEX_H);
  bmc.fillStyle = 'rgb(0, 20, 0)';
  bmc.fillRect(0, 0, TEX_W, TEX_H);

  // The QR on whole texels: an integer number of texels per module, no smoothing.
  const perModule = Math.floor(mm(38) / modules);
  const qrSide = perModule * modules;
  const qrX = Math.round(mm(5));
  const qrY = Math.round((TEX_H - qrSide) / 2);
  b.imageSmoothingEnabled = false;
  b.drawImage(qr, qrX, qrY, qrSide, qrSide);

  const textX = qrX + qrSide + mm(4);
  b.fillStyle = OBSIDIAN;
  b.textAlign = 'left';
  b.textBaseline = 'alphabetic';
  b.font = `600 ${mm(3.6)}px ${MONO}`;
  b.fillText(input.shortLink, textX, mm(25));
  b.fillStyle = 'rgba(10, 14, 39, 0.66)';
  b.font = `400 ${mm(2.6)}px ${SANS}`;
  b.fillText('madfam.io', textX, mm(30.5));

  return { front: { color: fc, material: fm }, back: { color: bc, material: bm } };
}

/** The QR SVG and its side in modules (quiet zone included), read from its viewBox "0 0 N N". */
async function loadQr(src: string) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`paper card: could not load ${src}`);
  const svg = await res.text();
  const modules = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1]);
  if (!(modules > 0)) throw new Error('paper card: QR SVG without a square viewBox');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    return { img: await loadImage(url), modules };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---- foil gradient ---------------------------------------------------------

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(c: number) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.min(1, Math.max(0, v));
}

function hexToOklch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function oklchToRgb([L, C, h]: [number, number, number]): [number, number, number] {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(x => Math.round(linearToSrgb(x) * 255)) as [number, number, number];
}

/**
 * The brand gradient leaf → lavender → sun, interpolated in OKLCH along the
 * shorter hue arc (what `bg-linear-to-r/oklch` does), as an RGBA8 strip.
 */
export function foilGradient(width = 256): Uint8Array {
  const stops = ['#6BCB77', '#9B59B6', '#FFD93D'].map(hexToOklch);
  const out = new Uint8Array(width * 4);
  for (let i = 0; i < width; i++) {
    const t = (i / (width - 1)) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(t));
    const f = t - k;
    const a = stops[k];
    const b = stops[k + 1];
    if (!a || !b) continue;
    let dh = b[2] - a[2];
    if (dh > Math.PI) dh -= 2 * Math.PI;
    if (dh < -Math.PI) dh += 2 * Math.PI;
    const rgb = oklchToRgb([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + dh * f]);
    out.set([...rgb, 255], i * 4);
  }
  return out;
}
