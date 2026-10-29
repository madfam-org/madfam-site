/**
 * WebGL2 view of the paper card. The card's shape comes from Pliego's paper
 * engine in a Worker; this module owns the camera, the light, the print and
 * finish shading (coated-paper sheen, hot foil in the brand gradient), the
 * pointer/gyro/keyboard input, and a render loop that sleeps when nothing moves.
 *
 * Loaded lazily by PaperCardHero after first paint; any failure rejects and
 * the hero falls back to the page as it was.
 */
import { CARD_H, CARD_W } from './card-document';
import { TEX_H, TEX_W, drawCardArt, foilGradient, type CardArtInput } from './card-art';
import type { FromWorker, ToWorker, Vec3 } from './protocol';

/**
 * Board this stiff rings at ~90 Hz (a 45 mm wing of 350 g/m² SBS), faster than
 * a display can show, so the physics runs in slow motion: one second on screen
 * is 1/8 s of paper. The stiffness ratios, the grain and the damping are the
 * stock's; only the clock is slowed.
 */
const TIME_SCALE = 1 / 8;
/** Card width as a fraction of the canvas width at rest (matches the hit area in PaperCardHero). */
export const CARD_FRACTION = 0.78;
/** Camera distance, mm: mild perspective (about a 4:1 eye distance to card width). */
const EYE = 380;
const MAX_TILT = (10 * Math.PI) / 180;
/** Largest out-of-plane pull on a grabbed point, mm (a firm bend, never a fold). */
const MAX_LIFT = 16;
/** Flip: 850 ms on cubic-bezier(0.22, 1, 0.3, 1). */
const FLIP_MS = 850;
/** Gentle drift after load or after the last input, then rest so the loop can sleep. */
const IDLE_DRIFT_MS = 9000;
const TAP_PX = 6;
const TAP_MS = 350;

export interface PaperCardOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Focusable element over the card's rest rectangle: drags, taps and Enter/Space. */
  hit: HTMLElement;
  art: CardArtInput;
  onLive: () => void;
  onFlip?: (back: boolean) => void;
}

interface PaperCardDebug {
  frames: number;
  physicsSteps: number;
  physicsMsMedian: number;
  flipped: boolean;
}

declare global {
  interface Window {
    __paperCard?: PaperCardDebug;
  }
}

// ---------------------------------------------------------------- shaders

const VS = `#version 300 es
in vec3 aPos;
in vec3 aNor;
in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uViewProj;
out vec3 vPos;
out vec3 vNor;
out vec2 vUv;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vPos = w.xyz;
  vNor = mat3(uModel) * aNor;
  vUv = aUv;
  gl_Position = uViewProj * w;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vPos;
in vec3 vNor;
in vec2 vUv;
uniform sampler2D uFrontColor;
uniform sampler2D uFrontMat;
uniform sampler2D uBackColor;
uniform sampler2D uBackMat;
uniform sampler2D uFoil;
uniform vec3 uLight;
uniform vec3 uEye;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  // Rounded die-cut corners, r = 2.5 mm.
  vec2 p = vUv * vec2(${CARD_W.toFixed(1)}, ${CARD_H.toFixed(1)});
  vec2 q = abs(p - vec2(${(CARD_W / 2).toFixed(1)}, ${(CARD_H / 2).toFixed(1)})) - vec2(${(CARD_W / 2 - 2.5).toFixed(1)}, ${(CARD_H / 2 - 2.5).toFixed(1)});
  if (length(max(q, 0.0)) > 2.5) discard;

  bool front = gl_FrontFacing;
  vec3 N = normalize(front ? vNor : -vNor);
  vec2 uv = front ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec3 albedo = toLinear((front ? texture(uFrontColor, uv) : texture(uBackColor, uv)).rgb);
  vec3 mat = (front ? texture(uFrontMat, uv) : texture(uBackMat, uv)).rgb;

  vec3 V = normalize(uEye - vPos);
  vec3 L = normalize(uLight);
  vec3 H = normalize(L + V);
  float ndl = max(dot(N, L), 0.0);
  float ndh = max(dot(N, H), 0.0);
  float ndv = max(dot(N, V), 0.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

  // Paper tooth: fibres show on the uncoated back, barely under the varnish.
  float tooth = noise(p * 9.0) * 0.6 + noise(p * 31.0) * 0.4;
  albedo *= front ? 0.985 + 0.03 * tooth : 0.95 + 0.08 * tooth;

  vec3 diffuse = albedo * (0.3 + 0.75 * ndl);
  float gloss = mat.g;
  vec3 sheen = vec3(gloss * (1.1 * pow(ndh, 90.0) + 0.22 * pow(ndh, 10.0)) + gloss * 0.4 * fresnel);

  // Hot foil: a mirror-like film whose hue walks the brand gradient with the light.
  float x = vUv.x * 0.9 + H.x * 1.3 + H.y * 0.7 + 0.2;
  float t = 1.0 - abs(1.0 - mod(x, 2.0));
  vec3 foil = toLinear(texture(uFoil, vec2(t, 0.5)).rgb);
  vec3 foilColor = foil * (0.78 + 0.5 * pow(ndh, 6.0)) + mix(foil, vec3(1.0), 0.45) * 2.4 * pow(ndh, 120.0);

  vec3 color = mix(diffuse + sheen, foilColor, mat.r);
  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

const SHADOW_VS = `#version 300 es
in vec2 aCorner;
uniform mat4 uViewProj;
uniform vec3 uCenter;
uniform vec2 uHalf;
out vec2 vLocal;
void main() {
  vLocal = aCorner * uHalf;
  gl_Position = uViewProj * vec4(uCenter + vec3(vLocal, 0.0), 1.0);
}`;

const SHADOW_FS = `#version 300 es
precision mediump float;
in vec2 vLocal;
uniform vec2 uCard;
uniform float uBlur;
uniform float uStrength;
out vec4 outColor;
void main() {
  vec2 q = abs(vLocal) - uCard;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float a = uStrength * (1.0 - smoothstep(-uBlur * 0.5, uBlur, d));
  outColor = vec4(0.0, 0.0, 0.02, 1.0) * a;
}`;

// ---------------------------------------------------------------- math

type Mat4 = Float32Array<ArrayBuffer>;
/** A matrix's 16 elements, column-major, for destructuring. */
type Elements = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
const elements = (m: Mat4) => Array.from(m) as Elements;

function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += (a[k * 4 + r] ?? 0) * (b[c * 4 + k] ?? 0);
      o[c * 4 + r] = s;
    }
  return o;
}

const identity = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

function rotX(t: number): Mat4 {
  const c = Math.cos(t),
    s = Math.sin(t);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}
function rotY(t: number): Mat4 {
  const c = Math.cos(t),
    s = Math.sin(t);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}
function translate(x: number, y: number, z: number): Mat4 {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}
function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}
/** Engine space (Y up, card in XZ facing +Y) → view space (card in XY facing the camera). */
const BASE = new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]);

function invert(m: Mat4): Mat4 | null {
  const inv = new Float32Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] =
    elements(m);
  const b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1 / det;
  inv[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  inv[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  inv[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  inv[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  inv[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  inv[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  inv[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  inv[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  inv[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  inv[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  inv[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  inv[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  inv[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return inv;
}

function apply(
  mat: Mat4,
  x: number,
  y: number,
  z: number,
  w: number
): [number, number, number, number] {
  const m = elements(mat);
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}

/** cubic-bezier(0.22, 1, 0.3, 1) by Newton on x(t). */
function easeFlip(x: number) {
  const [x1, y1, x2, y2] = [0.22, 1, 0.3, 1];
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const dbx = (t: number) =>
    3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const d = dbx(t);
    if (Math.abs(d) < 1e-6) break;
    t = Math.min(1, Math.max(0, t - (bx(t) - x) / d));
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
}

// ---------------------------------------------------------------- GL helpers

function shader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error('paper card: createShader');
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(`paper card shader: ${gl.getShaderInfoLog(s)}`);
  return s;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram();
  if (!p) throw new Error('paper card: createProgram');
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(`paper card link: ${gl.getProgramInfoLog(p)}`);
  return p;
}

function texture(
  gl: WebGL2RenderingContext,
  source: HTMLCanvasElement | { data: Uint8Array; width: number }
) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  if ('data' in source) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      source.width,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source.data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  } else {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

function request<T extends FromWorker['type']>(worker: Worker, msg: ToWorker, type: T, ms: number) {
  return new Promise<Extract<FromWorker, { type: T }>>((resolve, reject) => {
    const timer = setTimeout(
      () => done(new Error(`paper card: no ${type} from physics in ${ms} ms`)),
      ms
    );
    const onMessage = (e: MessageEvent<FromWorker>) => {
      if (e.data.type === type) done(null, e.data as Extract<FromWorker, { type: T }>);
      else if (e.data.type === 'error') done(new Error(e.data.message));
    };
    const onError = () => done(new Error('paper card: physics worker failed to load'));
    function done(err: Error | null, value?: Extract<FromWorker, { type: T }>) {
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (err) reject(err);
      else resolve(value as Extract<FromWorker, { type: T }>);
    }
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage(msg);
  });
}

// ---------------------------------------------------------------- the card

/** Start the card. Resolves with a dispose function once the first frame is drawn. */
export async function startPaperCard(opts: PaperCardOptions): Promise<() => void> {
  const { root, canvas, hit } = opts;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) throw new Error('paper card: no WebGL2');

  const worker = new Worker(
    /* webpackChunkName: "paper-card-physics" */ new URL('./physics.worker.ts', import.meta.url),
    { type: 'module', name: 'paper-card-physics' }
  );
  const disposers: Array<() => void> = [() => worker.terminate()];
  const dispose = () => disposers.splice(0).forEach(fn => fn());

  try {
    const [ready, art] = await Promise.all([
      request(worker, { type: 'init' }, 'ready', 10000),
      drawCardArt(opts.art),
    ]);

    // --- GL resources
    const prog = program(gl, VS, FS);
    const shadowProg = program(gl, SHADOW_VS, SHADOW_FS);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const posBuf = gl.createBuffer();
    const norBuf = gl.createBuffer();
    const uvBuf = gl.createBuffer();
    const idxBuf = gl.createBuffer();
    const attrib = (
      buf: WebGLBuffer | null,
      name: string,
      size: number,
      data: Float32Array,
      usage: number
    ) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    attrib(posBuf, 'aPos', 3, ready.positions, gl.DYNAMIC_DRAW);
    attrib(norBuf, 'aNor', 3, ready.normals, gl.DYNAMIC_DRAW);
    attrib(uvBuf, 'aUv', 2, ready.uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ready.indices, gl.STATIC_DRAW);
    const indexCount = ready.indices.length;
    gl.bindVertexArray(null);

    const shadowVao = gl.createVertexArray();
    gl.bindVertexArray(shadowVao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const cornerLoc = gl.getAttribLocation(shadowProg, 'aCorner');
    gl.enableVertexAttribArray(cornerLoc);
    gl.vertexAttribPointer(cornerLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    if (art.front.color.width !== TEX_W || art.front.color.height !== TEX_H)
      throw new Error('paper card: art size');
    const textures = [
      texture(gl, art.front.color),
      texture(gl, art.front.material),
      texture(gl, art.back.color),
      texture(gl, art.back.material),
      texture(gl, { data: foilGradient(), width: 256 }),
    ];
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const U = {
      model: u('uModel'),
      viewProj: u('uViewProj'),
      light: u('uLight'),
      eye: u('uEye'),
    };
    gl.useProgram(prog);
    ['uFrontColor', 'uFrontMat', 'uBackColor', 'uBackMat', 'uFoil'].forEach((name, i) =>
      gl.uniform1i(u(name), i)
    );
    const su = (name: string) => gl.getUniformLocation(shadowProg, name);
    const SU = {
      viewProj: su('uViewProj'),
      center: su('uCenter'),
      half: su('uHalf'),
      card: su('uCard'),
      blur: su('uBlur'),
      strength: su('uStrength'),
    };

    // --- state
    let cssW = 1;
    let cssH = 1;
    let viewProj = identity();
    let model = identity();
    const tilt = { x: 0, y: 0 };
    const tiltGoal = { x: 0, y: 0 };
    const light = { x: -0.45, y: 0.55 };
    const lightGoal = { x: -0.45, y: 0.55 };
    let flip = 0; // 0 front, 1 back
    let flipFrom = 0;
    let flipTo = 0;
    let flipStart = -1;
    let lastInput = performance.now();
    let hovering = false;
    let gyro: { beta0: number; gamma0: number } | null = null;
    let physicsAwake = false;
    let stepInFlight = false;
    let simAcc = 0;
    let visible = true;
    let raf = 0;
    let last = 0;
    const debug: PaperCardDebug = {
      frames: 0,
      physicsSteps: 0,
      physicsMsMedian: 0,
      flipped: false,
    };
    window.__paperCard = debug;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const visibleW = CARD_W / CARD_FRACTION;
      const visibleH = visibleW * (cssH / cssW);
      const fovY = 2 * Math.atan(visibleH / 2 / EYE);
      viewProj = mul(perspective(fovY, cssW / cssH, 10, 2000), translate(0, 0, -EYE));
      wake();
    };

    // --- worker traffic
    worker.addEventListener('message', (e: MessageEvent<FromWorker>) => {
      const m = e.data;
      if (m.type === 'pose') {
        stepInFlight = false;
        debug.physicsSteps++;
        debug.physicsMsMedian = m.stepMs;
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.positions);
        gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.normals);
        if (m.asleep && !grab) physicsAwake = false;
        wake();
      } else if (m.type === 'grabbed') {
        if (grab) {
          grab.point = m.ok ? m.point : null;
          if (grab.point) physicsAwake = true;
        }
      } else if (m.type === 'error') {
        // A physics failure mid-session leaves the card rigid but usable.
        physicsAwake = false;
      }
    });

    // --- input
    let grab: {
      id: number;
      x0: number;
      y0: number;
      t0: number;
      moved: boolean;
      point: Vec3 | null;
    } | null = null;

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    /** Pointer ray in engine space (the space the worker's pick and grab use). */
    const engineRay = (x: number, y: number): { origin: Vec3; dir: Vec3 } | null => {
      const inv = invert(mul(viewProj, model));
      if (!inv) return null;
      const nx = (x / cssW) * 2 - 1;
      const ny = 1 - (y / cssH) * 2;
      const a = apply(inv, nx, ny, -1, 1);
      const b = apply(inv, nx, ny, 1, 1);
      const o: Vec3 = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
      const f: Vec3 = [b[0] / b[3], b[1] / b[3], b[2] / b[3]];
      const d: Vec3 = [f[0] - o[0], f[1] - o[1], f[2] - o[2]];
      const n = Math.hypot(...d);
      return { origin: o, dir: [d[0] / n, d[1] / n, d[2] / n] };
    };

    const mmPerPx = () => CARD_W / CARD_FRACTION / cssW;

    const setLightFrom = (x: number, y: number) => {
      // Light and tilt agree: the card leans toward the pointer, the light sits behind it.
      const px = Math.max(-1, Math.min(1, (x / cssW) * 2 - 1));
      const py = Math.max(-1, Math.min(1, 1 - (y / cssH) * 2));
      tiltGoal.y = px * MAX_TILT;
      tiltGoal.x = -py * MAX_TILT;
      lightGoal.x = px * 0.95;
      lightGoal.y = py * 0.95;
    };

    const startFlip = () => {
      flipFrom = flip;
      flipTo = flipTo === 0 ? 1 : 0;
      flipStart = performance.now();
      debug.flipped = flipTo === 1;
      opts.onFlip?.(flipTo === 1);
      lastInput = performance.now();
      wake();
    };

    const endGrab = (e?: PointerEvent) => {
      if (!grab) return;
      const g = grab;
      grab = null;
      worker.postMessage({ type: 'release' } satisfies ToWorker);
      if (e && hit.hasPointerCapture(e.pointerId)) hit.releasePointerCapture(e.pointerId);
      lastInput = performance.now();
      wake();
      return g;
    };

    const onDown = (e: PointerEvent) => {
      if (grab || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const { x, y } = local(e);
      grab = { id: e.pointerId, x0: x, y0: y, t0: performance.now(), moved: false, point: null };
      hit.setPointerCapture(e.pointerId);
      const ray = engineRay(x, y);
      if (ray) worker.postMessage({ type: 'grab', ...ray } satisfies ToWorker);
      lastInput = performance.now();
      wake();
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = local(e);
      if (grab && e.pointerId === grab.id) {
        const dx = x - grab.x0;
        const dy = y - grab.y0;
        const dist = Math.hypot(dx, dy);
        if (dist > TAP_PX) grab.moved = true;
        if (grab.point) {
          // Pull the grabbed point out of the card's plane, toward the viewer.
          const facing = apply(model, 0, 1, 0, 0)[2] >= 0 ? 1 : -1;
          const lift = Math.min(MAX_LIFT, dist * mmPerPx() * 0.6) * facing;
          const p = grab.point;
          worker.postMessage({ type: 'drag', point: [p[0], p[1] + lift, p[2]] } satisfies ToWorker);
          physicsAwake = true;
        }
        lastInput = performance.now();
        wake();
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return;
      const g = endGrab(e);
      if (g && !g.moved && performance.now() - g.t0 < TAP_MS) {
        askGyro();
        startFlip();
      }
    };

    const onCancel = (e: PointerEvent) => {
      if (grab && e.pointerId === grab.id) endGrab(e);
    };

    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (grab) return;
      hovering = true;
      const { x, y } = local(e);
      setLightFrom(x, y);
      lastInput = performance.now();
      wake();
    };
    const onLeave = () => {
      hovering = false;
      tiltGoal.x = tiltGoal.y = 0;
      lastInput = performance.now();
      wake();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startFlip();
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null || grab) return;
      if (!gyro) gyro = { beta0: e.beta, gamma0: e.gamma };
      const gx = Math.max(-1, Math.min(1, (e.gamma - gyro.gamma0) / 25));
      const gy = Math.max(-1, Math.min(1, (e.beta - gyro.beta0) / 25));
      tiltGoal.y = gx * MAX_TILT;
      tiltGoal.x = gy * MAX_TILT;
      lightGoal.x = gx * 0.95;
      lightGoal.y = -gy * 0.95;
      lastInput = performance.now();
      wake();
    };
    let gyroAsked = false;
    const askGyro = () => {
      // iOS asks once, from a gesture; elsewhere the events simply arrive.
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (gyroAsked || typeof DOE?.requestPermission !== 'function') return;
      gyroAsked = true;
      DOE.requestPermission().catch(() => undefined);
    };

    const onBlur = () => endGrab();
    const onVisibility = () => {
      visible = document.visibilityState === 'visible' && inView;
      if (visible) wake();
    };
    let inView = true;
    const io = new IntersectionObserver(entries => {
      inView = entries.some(en => en.isIntersecting);
      onVisibility();
    });
    io.observe(root);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    hit.addEventListener('pointerdown', onDown);
    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerup', onUp);
    hit.addEventListener('pointercancel', onCancel);
    hit.addEventListener('lostpointercapture', onCancel);
    hit.addEventListener('keydown', onKey);
    root.addEventListener('pointermove', onHover);
    root.addEventListener('pointerleave', onLeave);
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    const onLost = (e: Event) => {
      e.preventDefault();
      dispose();
      root.dispatchEvent(new CustomEvent('paper-card-failed'));
    };
    canvas.addEventListener('webglcontextlost', onLost);
    disposers.push(() => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      hit.removeEventListener('pointerdown', onDown);
      hit.removeEventListener('pointermove', onMove);
      hit.removeEventListener('pointerup', onUp);
      hit.removeEventListener('pointercancel', onCancel);
      hit.removeEventListener('lostpointercapture', onCancel);
      hit.removeEventListener('keydown', onKey);
      root.removeEventListener('pointermove', onHover);
      root.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      delete window.__paperCard;
    });

    // --- loop
    function wake() {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    function frame(now: number) {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const sinceInput = now - lastInput;

      // Idle drift: a slow figure-eight of the light, then rest.
      const drifting = !hovering && !grab && !gyro && sinceInput < IDLE_DRIFT_MS;
      if (drifting) {
        const s = now / 1000;
        const fade = Math.min(1, (IDLE_DRIFT_MS - sinceInput) / 1500);
        tiltGoal.y = Math.sin(s * 0.7) * MAX_TILT * 0.45 * fade;
        tiltGoal.x = Math.sin(s * 1.1) * MAX_TILT * 0.25 * fade;
        lightGoal.x = -0.45 + Math.sin(s * 0.7) * 0.7 * fade;
        lightGoal.y = 0.55 + Math.sin(s * 1.1) * 0.35 * fade - 0.2 * (1 - fade);
      } else if (!hovering && !gyro && !grab) {
        tiltGoal.x = tiltGoal.y = 0;
        lightGoal.x = -0.45;
        lightGoal.y = 0.55;
      }
      const k = 1 - Math.exp(-dt / 0.14);
      tilt.x += (tiltGoal.x - tilt.x) * k;
      tilt.y += (tiltGoal.y - tilt.y) * k;
      light.x += (lightGoal.x - light.x) * k;
      light.y += (lightGoal.y - light.y) * k;

      let flipping = false;
      if (flipStart >= 0) {
        const f = Math.min(1, (now - flipStart) / FLIP_MS);
        flip = flipFrom + (flipTo - flipFrom) * easeFlip(f);
        flipping = f < 1;
        if (!flipping) flipStart = -1;
      }

      // Physics: one request in flight; time that passes meanwhile is carried over.
      if (physicsAwake) {
        simAcc += dt * TIME_SCALE;
        if (!stepInFlight) {
          stepInFlight = true;
          worker.postMessage({ type: 'step', simDt: simAcc } satisfies ToWorker);
          simAcc = 0;
        }
      }

      const lift = Math.sin(flip * Math.PI) * 6;
      model = mul(
        mul(mul(translate(0, 0, lift), rotX(tilt.x)), rotY(tilt.y + flip * Math.PI)),
        BASE
      );
      draw();
      debug.frames++;

      const settling =
        Math.abs(tiltGoal.x - tilt.x) + Math.abs(tiltGoal.y - tilt.y) > 1e-4 ||
        Math.abs(lightGoal.x - light.x) + Math.abs(lightGoal.y - light.y) > 1e-3;
      if (visible && (drifting || settling || flipping || physicsAwake || grab)) {
        raf = requestAnimationFrame(frame);
      }
    }

    function draw() {
      if (!gl) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Soft shadow on a plane behind the card, pushed away from the light.
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shadowProg);
      gl.uniformMatrix4fv(SU.viewProj, false, viewProj);
      const lift = Math.sin(flip * Math.PI) * 6;
      gl.uniform3f(SU.center, -light.x * 7, -light.y * 6 - 5, -18 - lift);
      gl.uniform2f(SU.half, CARD_W * 0.75, CARD_H * 0.95);
      gl.uniform2f(
        SU.card,
        (CARD_W / 2) * Math.abs(Math.cos(flip * Math.PI)) * 0.92 + 2,
        CARD_H / 2 - 2
      );
      gl.uniform1f(SU.blur, 14 + lift);
      gl.uniform1f(SU.strength, 0.55);
      gl.bindVertexArray(shadowVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(prog);
      gl.uniformMatrix4fv(U.model, false, model);
      gl.uniformMatrix4fv(U.viewProj, false, viewProj);
      gl.uniform3f(U.light, light.x * 1.4, light.y * 1.4, 1.0);
      gl.uniform3f(U.eye, 0, 0, EYE);
      textures.forEach((t, i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, t);
      });
      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
    }

    resize();
    // First frame drawn synchronously so the canvas is never shown empty.
    last = performance.now();
    frame(last);
    opts.onLive();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
