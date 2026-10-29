/**
 * Phone-screen posters (1170×2532, an iPhone lock screen at 3×) for a teammate
 * card, in madfam.io's hero world: obsidian, the leaf→lavender→sun OKLCH
 * gradient, a white tile holding a square-module QR. Two per teammate:
 *   {short}-madf-am-pantalla.png       tracked madf.am/{short} → the card page
 *   {short}-vcard-offline-pantalla.png the contact itself, for a room with no signal
 * and a decode check that every poster and the public QR SVG read back to
 * their exact payload at 240, 320, 480 and 640 px wide.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, type Page, chromium } from '@playwright/test';
import type { TeamCard } from '../../lib/team-cards';
import { offlineVcard, offlineVcardQrSvg, shortLinkQrSvg, shortUrl } from './files';

export const DECODE_WIDTHS = [240, 320, 480, 640] as const;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function posterHtml(card: TeamCard, qr: string, hint: string, logo: string): string {
  const role = card.title
    ? `<p class="role">${esc(card.title)}</p><p class="org">Innovaciones MADFAM</p>`
    : `<p class="role">Innovaciones MADFAM</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  :root { --obsidian:#0A0E27; --pearl:#FAFAFA; --leaf:#6BCB77; --lavender:#9B59B6; --sun:#FFD93D; }
  * { box-sizing:border-box; margin:0; }
  html,body { width:390px; height:844px; overflow:hidden; background:var(--obsidian); color:var(--pearl);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing:antialiased; }
  .glow { position:absolute; width:420px; height:420px; border-radius:50%; filter:blur(80px); }
  .g1 { top:-170px; left:-170px; background:rgb(107 203 119 / .28); }
  .g2 { bottom:-170px; right:-170px; background:rgb(155 89 182 / .34); }
  .g3 { top:330px; left:50%; width:360px; height:360px; transform:translate(-50%,-50%);
        background:linear-gradient(in oklch to right, var(--leaf), var(--lavender), var(--sun)); opacity:.22; filter:blur(70px); }
  main { position:relative; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:96px 32px 40px; }
  .brand { position:absolute; top:64px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:12px; }
  .brand img { width:44px; height:44px; }
  .brand span { font-weight:700; font-size:15px; letter-spacing:.2em; color:rgb(250 250 250 / .85); }
  .frame { padding:2px; border-radius:28px;
           background:linear-gradient(in oklch to bottom right, var(--leaf), var(--lavender), var(--sun));
           box-shadow:0 28px 64px -18px rgb(0 0 0 / .7); }
  .tile { background:#fff; border-radius:26px; padding:18px; }
  .tile svg { display:block; width:268px; height:268px; shape-rendering:crispEdges; }
  h1 { margin-top:36px; width:fit-content; max-width:100%; font-size:34px; line-height:1.08; font-weight:800; letter-spacing:-.03em; text-align:center; text-wrap:balance;
       background:linear-gradient(in oklch to right, var(--leaf), var(--lavender), var(--sun)); -webkit-background-clip:text; color:transparent; }
  .role { margin-top:12px; font-size:17px; color:rgb(250 250 250 / .92); text-align:center; }
  .org { margin-top:4px; font-size:15px; color:rgb(250 250 250 / .72); }
  .link { margin-top:32px; display:flex; flex-direction:column; align-items:center; gap:10px; }
  .chip { font: 600 17px ui-monospace, "SF Mono", Menlo, monospace; padding:10px 18px; border-radius:999px;
          border:1px solid rgb(250 250 250 / .2); background:rgb(250 250 250 / .06); }
  .hint { font-size:14px; color:rgb(250 250 250 / .72); }
  </style></head><body>
  <div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
  <main>
    <div class="brand"><img src="${logo}" alt=""><span>MADFAM</span></div>
    <div class="frame"><div class="tile">${qr}</div></div>
    <h1>${esc(card.name)}</h1>
    ${role}
    <div class="link"><span class="chip">${esc(card.shortLink)}</span><span class="hint">${esc(hint)}</span></div>
  </main></body></html>`;
}

export interface Poster {
  file: string;
  png: Buffer;
  payload: string;
}

export interface DecodeResult {
  label: string;
  /** One entry per DECODE_WIDTHS: true when the read payload matched exactly. */
  reads: { width: number; ok: boolean; got: string | null }[];
}

export class PosterRenderer {
  private constructor(
    private readonly browser: Browser,
    private readonly page: Page,
    private readonly decoder: Page,
    private readonly logo: string
  ) {}

  static async launch(webRoot: string): Promise<PosterRenderer> {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    });
    const page = await context.newPage();
    const decoder = await browser.newPage();
    await decoder.setContent('<!doctype html><html><body></body></html>');
    await decoder.addScriptTag({ path: require.resolve('jsqr') });
    const svg = readFileSync(join(webRoot, 'public/assets/brand/madfam-logo.svg'));
    const logo = `data:image/svg+xml;base64,${svg.toString('base64')}`;
    return new PosterRenderer(browser, page, decoder, logo);
  }

  async render(card: TeamCard, short: string): Promise<Poster[]> {
    const kinds = [
      ['madf-am', shortLinkQrSvg(card), shortUrl(card), 'Escanea para ver mi tarjeta'],
      [
        'vcard-offline',
        offlineVcardQrSvg(card),
        offlineVcard(card),
        'Escanea para guardar mi contacto',
      ],
    ] as const;
    const posters: Poster[] = [];
    for (const [kind, qr, payload, hint] of kinds) {
      await this.page.setContent(posterHtml(card, qr, hint, this.logo));
      await this.page.evaluate(() => document.fonts.ready);
      const png = await this.page.screenshot({ type: 'png' });
      posters.push({ file: `${short}-${kind}-pantalla.png`, png, payload });
    }
    return posters;
  }

  /** Downscale `src` (a data: URL) to each width in the browser and read it
   *  with jsQR. `square` draws an SVG without intrinsic size as w×w. */
  async decode(
    label: string,
    src: string,
    expected: string,
    square = false
  ): Promise<DecodeResult> {
    const got = await this.decoder.evaluate(
      async ({ image, widths, asSquare }) => {
        const img = new Image();
        img.src = image;
        await img.decode();
        return widths.map(w => {
          const h = asSquare ? w : Math.round((img.naturalHeight * w) / img.naturalWidth);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          const { data } = ctx.getImageData(0, 0, w, h);
          const read = (window as unknown as { jsQR: typeof import('jsqr').default }).jsQR(
            data,
            w,
            h
          );
          return read ? read.data : null;
        });
      },
      { image: src, widths: [...DECODE_WIDTHS], asSquare: square }
    );
    return {
      label,
      reads: DECODE_WIDTHS.map((width, i) => ({
        width,
        ok: got[i] === expected,
        got: got[i] ?? null,
      })),
    };
  }

  async close(): Promise<void> {
    await this.browser.close();
  }
}
