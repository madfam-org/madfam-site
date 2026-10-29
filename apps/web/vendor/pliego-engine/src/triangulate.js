// @ts-check
/**
 * Face triangulation for the simulation mesh.
 *
 * 1. The face boundary arrives already split to segments ≤ h (shared edges split once, so faces
 *    agree — conforming).
 * 2. Ear clipping over the split boundary.
 * 3. Interior points (an equilateral lattice of spacing h, rotated so one edge family runs along
 *    the cross direction, i.e. perpendicular to the grain) are inserted one at a time; each insertion
 *    is followed by Lawson flips (Delaunay legalisation). Boundary segments are constrained, so
 *    crease, cut and outline lines remain exact mesh edges.
 * 4. A final flip pass makes the whole face constrained-Delaunay.
 *
 * engine.md §2 names Rivara longest-edge refinement for step 3; lattice insertion + Delaunay flips
 * gives the same guarantees (every edge ≤ ~h, no needle triangles away from acute boundary corners)
 * with near-equilateral interiors, which keeps lumped masses and hinge stiffnesses uniform.
 * Deterministic: fixed iteration order, no hashing.
 */
import { orient, pointInPolygon, distPointSeg } from './geom.js';

/**
 * Triangulate a simple CCW polygon (flat xy) plus interior points.
 * @param {number[]} poly boundary points, flat [x0,y0,…], CCW
 * @param {number[]} interior interior points, flat (refinement appends to it)
 * @param {number} [hmax] split interior edges longer than this
 * @returns {number[]} triangles as index triples into [boundary…, interior…]
 */
export function triangulateFace(poly, interior, hmax = Infinity) {
  const nb = poly.length / 2;
  const pts = poly.concat(interior);
  const tris = earClip(poly);
  const T = new TriMesh(pts, tris, nb);
  for (let k = 0; k < interior.length / 2; k++) T.insert(nb + k);
  T.legalizeAll();
  // longest-edge refinement: split interior edges longer than hmax at their midpoints
  for (let pass = 0; pass < 8 && Number.isFinite(hmax); pass++) {
    let best = -1, bestL = hmax;
    for (let he = 0; he < T.n.length; he++) {
      if (T.n[he] < he) continue; // each interior edge once (and skip boundary: n = −1 < he)
      const t = Math.floor(he / 3), i = he % 3;
      const a = T.t[3 * t + i], b = T.t[3 * t + ((i + 1) % 3)];
      const L = Math.hypot(pts[2 * a] - pts[2 * b], pts[2 * a + 1] - pts[2 * b + 1]);
      if (L > bestL) { bestL = L; best = he; }
    }
    if (best < 0) break;
    // split every edge longer than hmax, longest first, this pass
    const longs = [];
    for (let he = 0; he < T.n.length; he++) {
      if (T.n[he] < he) continue;
      const t = Math.floor(he / 3), i = he % 3;
      const a = T.t[3 * t + i], b = T.t[3 * t + ((i + 1) % 3)];
      const L = Math.hypot(pts[2 * a] - pts[2 * b], pts[2 * a + 1] - pts[2 * b + 1]);
      if (L > hmax) longs.push([L, a, b]);
    }
    longs.sort((x, y) => y[0] - x[0] || x[1] - y[1] || x[2] - y[2]);
    for (const [, a, b] of longs) {
      const k = pts.length / 2;
      pts.push((pts[2 * a] + pts[2 * b]) / 2, (pts[2 * a + 1] + pts[2 * b + 1]) / 2);
      interior.push(pts[2 * k], pts[2 * k + 1]);
      T.insert(k);
    }
  }
  smooth(T, pts, nb, SMOOTH_ITERS);
  // keep the caller's interior list in sync with smoothed positions
  for (let k = 0; k < interior.length / 2; k++) { interior[2 * k] = pts[2 * (nb + k)]; interior[2 * k + 1] = pts[2 * (nb + k) + 1]; }
  return T.result();
}

/** Laplacian smoothing passes over interior points (boundary fixed), each followed by Delaunay flips. */
export const SMOOTH_ITERS = 6;

/** @param {any} T @param {number[]} pts @param {number} nb @param {number} iters */
function smooth(T, pts, nb, iters) {
  const n = pts.length / 2;
  if (n <= nb) return;
  for (let it = 0; it < iters; it++) {
    const sx = new Float64Array(n), sy = new Float64Array(n), cnt = new Int32Array(n);
    for (let he = 0; he < T.t.length; he++) {
      const t = Math.floor(he / 3), i = he % 3;
      const a = T.t[3 * t + i], b = T.t[3 * t + ((i + 1) % 3)];
      sx[a] += pts[2 * b]; sy[a] += pts[2 * b + 1]; cnt[a]++;
      if (T.n[he] < 0) { sx[b] += pts[2 * a]; sy[b] += pts[2 * a + 1]; cnt[b]++; }
    }
    /** @type {number[][]} */
    const inc = Array.from({ length: n }, () => []);
    for (let t = 0; t < T.t.length / 3; t++) for (let i = 0; i < 3; i++) inc[T.t[3 * t + i]].push(t);
    for (let v = nb; v < n; v++) {
      if (!cnt[v]) continue;
      const ox = pts[2 * v], oy = pts[2 * v + 1];
      pts[2 * v] = sx[v] / cnt[v]; pts[2 * v + 1] = sy[v] / cnt[v];
      for (const t of inc[v]) if (!T.positive(t)) { pts[2 * v] = ox; pts[2 * v + 1] = oy; break; }
    }
    T.legalizeAll();
  }
}

/** Ear clipping; collinear vertices are never ears; a vertex on the candidate diagonal blocks it. @param {number[]} P */
export function earClip(P) {
  const n = P.length / 2;
  /** @type {number[]} */
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  const out = [];
  let guard = 0;
  while (idx.length > 3 && guard < 10 * n * n) {
    guard++;
    let clipped = false;
    // prefer the ear with the largest minimum angle among the first candidates (better input to flips)
    let best = -1, bestQ = -1;
    for (let k = 0; k < idx.length; k++) {
      const ia = idx[(k + idx.length - 1) % idx.length], ib = idx[k], ic = idx[(k + 1) % idx.length];
      if (!isEar(P, idx, ia, ib, ic)) continue;
      const q = minAngle(P, ia, ib, ic);
      if (q > bestQ) { bestQ = q; best = k; }
    }
    if (best >= 0) {
      const k = best;
      out.push(idx[(k + idx.length - 1) % idx.length], idx[k], idx[(k + 1) % idx.length]);
      idx.splice(k, 1);
      clipped = true;
    }
    if (!clipped) throw new Error('triangulate: ear clipping failed (polygon not simple or degenerate)');
  }
  if (idx.length === 3) {
    if (orient(P[2 * idx[0]], P[2 * idx[0] + 1], P[2 * idx[1]], P[2 * idx[1] + 1], P[2 * idx[2]], P[2 * idx[2] + 1]) <= 0) throw new Error('triangulate: degenerate final ear');
    out.push(idx[0], idx[1], idx[2]);
  }
  return out;
}

/** @param {number[]} P @param {number[]} idx @param {number} a @param {number} b @param {number} c */
function isEar(P, idx, a, b, c) {
  const ax = P[2 * a], ay = P[2 * a + 1], bx = P[2 * b], by = P[2 * b + 1], cx = P[2 * c], cy = P[2 * c + 1];
  const ar = orient(ax, ay, bx, by, cx, cy);
  const scale = Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(cx - bx, cy - by), 1e-12);
  if (ar <= 1e-12 * scale * scale) return false;
  for (const v of idx) {
    if (v === a || v === b || v === c) continue;
    const px = P[2 * v], py = P[2 * v + 1];
    const e = -1e-12 * scale * scale;
    if (orient(ax, ay, bx, by, px, py) >= e && orient(bx, by, cx, cy, px, py) >= e && orient(cx, cy, ax, ay, px, py) >= e) return false;
  }
  return true;
}

/** @param {number[]} P @param {number} a @param {number} b @param {number} c */
function minAngle(P, a, b, c) {
  const ang = (/** @type {number} */ i, /** @type {number} */ j, /** @type {number} */ k) => {
    const ux = P[2 * j] - P[2 * i], uy = P[2 * j + 1] - P[2 * i + 1], vx = P[2 * k] - P[2 * i], vy = P[2 * k + 1] - P[2 * i + 1];
    return Math.atan2(Math.abs(ux * vy - uy * vx), ux * vx + uy * vy);
  };
  return Math.min(ang(a, b, c), ang(b, c, a), ang(c, a, b));
}

/**
 * Minimal triangle mesh with half-edge adjacency for point insertion and Lawson flips.
 * Half-edge 3t+i is the directed edge (v[i] → v[i+1]) of triangle t; `n[he]` is the opposite
 * half-edge or −1 on the polygon boundary (boundary segments are therefore never flipped).
 */
class TriMesh {
  /** @param {number[]} pts @param {number[]} tris @param {number} nb */
  constructor(pts, tris, nb) {
    this.p = pts;
    this.nb = nb;
    /** @type {number[]} */
    this.t = tris.slice();
    /** @type {number[]} */
    this.n = [];
    this.last = 0;
    this.rebuild();
  }

  rebuild() {
    const nt = this.t.length / 3;
    this.n = new Array(3 * nt).fill(-1);
    const N = this.p.length / 2 + 1;
    /** @type {Map<number, number>} */
    const m = new Map();
    for (let t = 0; t < nt; t++) for (let i = 0; i < 3; i++) {
      const a = this.t[3 * t + i], b = this.t[3 * t + ((i + 1) % 3)];
      const o = m.get(b * N + a);
      if (o !== undefined) { this.n[3 * t + i] = o; this.n[o] = 3 * t + i; m.delete(b * N + a); }
      else m.set(a * N + b, 3 * t + i);
    }
  }

  /** @param {number} he @param {number} o */
  link(he, o) { this.n[he] = o; if (o >= 0) this.n[o] = he; }

  /** Locate the triangle containing (x, y): visibility walk from the last triangle, brute force fallback. */
  locate(/** @type {number} */ x, /** @type {number} */ y) {
    const p = this.p, T = this.t;
    let t = Math.min(this.last, T.length / 3 - 1);
    for (let step = 0; step < 4 * T.length; step++) {
      let moved = false;
      for (let i = 0; i < 3; i++) {
        const a = T[3 * t + i], b = T[3 * t + ((i + 1) % 3)];
        if (orient(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], x, y) < 0 && this.n[3 * t + i] >= 0) {
          t = Math.floor(this.n[3 * t + i] / 3); moved = true; break;
        }
      }
      if (!moved) break;
    }
    if (this.contains(t, x, y)) return t;
    for (let u = 0; u < T.length / 3; u++) if (this.contains(u, x, y)) return u;
    return -1;
  }

  /** @param {number} t @param {number} x @param {number} y */
  contains(t, x, y) {
    const p = this.p, T = this.t;
    const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
    const area = Math.abs(orient(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1]));
    const eps = -1e-10 * area;
    return orient(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], x, y) >= eps
      && orient(p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1], x, y) >= eps
      && orient(p[2 * c], p[2 * c + 1], p[2 * a], p[2 * a + 1], x, y) >= eps;
  }

  /** @param {number} v */
  insert(v) {
    const p = this.p, T = this.t;
    const x = p[2 * v], y = p[2 * v + 1];
    const t = this.locate(x, y);
    if (t < 0) return;
    const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
    // on an edge? (the edge's triangle area with v is ~0)
    const area = Math.abs(orient(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1]));
    for (let i = 0; i < 3; i++) {
      const u = T[3 * t + i], w = T[3 * t + ((i + 1) % 3)];
      if (Math.abs(orient(p[2 * u], p[2 * u + 1], p[2 * w], p[2 * w + 1], x, y)) <= 1e-9 * area) {
        if (this.n[3 * t + i] < 0) return; // on the boundary: never for filtered lattice points
        this.splitEdge(t, i, v);
        return;
      }
    }
    const nt = T.length / 3;
    const nbc = this.n[3 * t + 1], nca = this.n[3 * t + 2];
    T[3 * t + 2] = v; // t = (a, b, v)
    T.push(b, c, v, c, a, v); // t1 = (b, c, v), t2 = (c, a, v)
    this.n.push(-1, -1, -1, -1, -1, -1);
    const t1 = nt, t2 = nt + 1;
    this.link(3 * t1, nbc);
    this.link(3 * t2, nca);
    this.link(3 * t + 1, 3 * t1 + 2);
    this.link(3 * t + 2, 3 * t2 + 1);
    this.link(3 * t1 + 1, 3 * t2 + 2);
    this.last = t;
    this.legalize(3 * t); this.legalize(3 * t1); this.legalize(3 * t2);
  }

  /** Rare case: v lies on interior edge i of t — split the two triangles into four and rebuild. */
  splitEdge(/** @type {number} */ t, /** @type {number} */ i, /** @type {number} */ v) {
    const T = this.t;
    const op = this.n[3 * t + i];
    const t2 = Math.floor(op / 3), i2 = op % 3;
    const a = T[3 * t + i], b = T[3 * t + ((i + 1) % 3)], c = T[3 * t + ((i + 2) % 3)];
    const d = T[3 * t2 + ((i2 + 2) % 3)];
    T[3 * t] = a; T[3 * t + 1] = v; T[3 * t + 2] = c;
    T[3 * t2] = v; T[3 * t2 + 1] = b; T[3 * t2 + 2] = c;
    T.push(b, v, d, v, a, d);
    this.rebuild();
    this.legalizeAll();
  }

  /** Recursive Lawson legalisation of half-edge he (the edge opposite the new vertex). @param {number} he */
  legalize(he) {
    const stack = [he];
    let guard = 0;
    while (stack.length && guard++ < 100000) {
      const h = /** @type {number} */(stack.pop());
      const r = this.flip(h);
      if (r) stack.push(r[0], r[1]);
    }
  }

  legalizeAll() {
    let changed = true, guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      for (let he = 0; he < this.n.length; he++) if (this.flip(he)) changed = true;
    }
  }

  /**
   * Flip half-edge he = (a→b) of t = (a, b, c) with t2 = (b, a, d) if d is inside the circumcircle.
   * Returns the two outer half-edges to re-check, or null.
   * @param {number} he
   */
  flip(he) {
    const op = this.n[he];
    if (op < 0) return null;
    const T = this.t, p = this.p;
    const t = Math.floor(he / 3), i = he % 3, t2 = Math.floor(op / 3), i2 = op % 3;
    const a = T[3 * t + i], b = T[3 * t + ((i + 1) % 3)], c = T[3 * t + ((i + 2) % 3)];
    const d = T[3 * t2 + ((i2 + 2) % 3)];
    if (!inCircle(p, a, b, c, d)) return null;
    if (orient(p[2 * c], p[2 * c + 1], p[2 * a], p[2 * a + 1], p[2 * d], p[2 * d + 1]) <= 0) return null;
    if (orient(p[2 * d], p[2 * d + 1], p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1]) <= 0) return null;
    const nbc = this.n[3 * t + ((i + 1) % 3)], nca = this.n[3 * t + ((i + 2) % 3)];
    const nad = this.n[3 * t2 + ((i2 + 1) % 3)], ndb = this.n[3 * t2 + ((i2 + 2) % 3)];
    T[3 * t] = c; T[3 * t + 1] = a; T[3 * t + 2] = d; // edges: (c,a) (a,d) (d,c)
    T[3 * t2] = d; T[3 * t2 + 1] = b; T[3 * t2 + 2] = c; // edges: (d,b) (b,c) (c,d)
    this.link(3 * t, nca); this.link(3 * t + 1, nad); this.link(3 * t + 2, 3 * t2 + 2);
    this.link(3 * t2, ndb); this.link(3 * t2 + 1, nbc);
    return [3 * t + 1, 3 * t2];
  }

  /** Is triangle t strictly counter-clockwise? @param {number} t */
  positive(t) {
    const p = this.p, T = this.t;
    const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
    return orient(p[2 * a], p[2 * a + 1], p[2 * b], p[2 * b + 1], p[2 * c], p[2 * c + 1]) > 0;
  }

  result() { return this.t.slice(); }
}

/** Is d strictly inside the circumcircle of CCW triangle (a, b, c)? Relative tolerance avoids flip cycles on cocircular points. */
function inCircle(/** @type {number[]} */ p, /** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ c, /** @type {number} */ d) {
  const ax = p[2 * a] - p[2 * d], ay = p[2 * a + 1] - p[2 * d + 1];
  const bx = p[2 * b] - p[2 * d], by = p[2 * b + 1] - p[2 * d + 1];
  const cx = p[2 * c] - p[2 * d], cy = p[2 * c + 1] - p[2 * d + 1];
  const det = (ax * ax + ay * ay) * (bx * cy - cx * by) - (bx * bx + by * by) * (ax * cy - cx * ay) + (cx * cx + cy * cy) * (ax * by - bx * ay);
  const s = ax * ax + ay * ay + bx * bx + by * by + cx * cx + cy * cy;
  return det > 1e-9 * s * s;
}

/**
 * Equilateral lattice points inside a polygon, at least `margin·h` from its boundary.
 * One lattice edge family runs along direction `angle` (radians).
 * @param {number[]} poly flat CCW polygon @param {number} h @param {number} angle @param {number} margin
 */
export function latticePoints(poly, h, angle, margin) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i < poly.length; i += 2) { minx = Math.min(minx, poly[i]); maxx = Math.max(maxx, poly[i]); miny = Math.min(miny, poly[i + 1]); maxy = Math.max(maxy, poly[i + 1]); }
  const a1x = h * Math.cos(angle), a1y = h * Math.sin(angle);
  const a2x = h * Math.cos(angle + Math.PI / 3), a2y = h * Math.sin(angle + Math.PI / 3);
  // lattice coordinates range covering the bbox
  const det = a1x * a2y - a1y * a2x;
  let imin = Infinity, imax = -Infinity, jmin = Infinity, jmax = -Infinity;
  for (const [x, y] of [[minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy]]) {
    const i = (x * a2y - y * a2x) / det, j = (a1x * y - a1y * x) / det;
    imin = Math.min(imin, i); imax = Math.max(imax, i); jmin = Math.min(jmin, j); jmax = Math.max(jmax, j);
  }
  /** @type {number[]} */
  const out = [];
  const n = poly.length / 2;
  const md = margin * h;
  for (let j = Math.floor(jmin) - 1; j <= Math.ceil(jmax) + 1; j++) {
    for (let i = Math.floor(imin) - 1; i <= Math.ceil(imax) + 1; i++) {
      const x = i * a1x + j * a2x, y = i * a1y + j * a2y;
      if (x < minx || x > maxx || y < miny || y > maxy) continue;
      if (!pointInPolygon(x, y, poly, -1)) continue;
      let dmin = Infinity;
      for (let k = 0, l = n - 1; k < n; l = k++) dmin = Math.min(dmin, distPointSeg(x, y, poly[2 * l], poly[2 * l + 1], poly[2 * k], poly[2 * k + 1]));
      if (dmin >= md) out.push(x, y);
    }
  }
  return out;
}
