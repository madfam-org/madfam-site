// @ts-check
/**
 * Geometric semantic rules of spec §8 enforced by `loadDocument` (rules 2–5, 7 geometry, 9).
 * Each check appends human-readable problems; the loader throws once with all of them.
 */
import { polygonArea, polygonIsSimple, pointInPolygon, segmentsCross } from './geom.js';

/**
 * @typedef {import('./document.js').Doc} Doc
 */

/**
 * Rules 2, 3, 4, 5. Also attaches `faceEdges`, `edgeFaces` (2 per edge, −1 if none),
 * `edgeFaceDir` (+1 when the face walks the edge a→b), per-sheet face polygons and `edgeTwin`
 * (the other side of a split cut, spec §5.13, or −1).
 * @param {Doc & Record<string, any>} doc @param {string[]} P
 */
export function checkGeometry(doc, P) {
  const { nE, nF, coords, edges, assignment, foldAngle, treatment, faces, vSheet, eSheet, fSheet, edgeIndex } = doc;
  // rule 2: membership
  for (let e = 0; e < nE; e++) {
    const a = edges[2 * e], b = edges[2 * e + 1];
    if (vSheet[a] !== eSheet[e] || vSheet[b] !== eSheet[e]) P.push(`rule 2: edge ${e} (sheet ${eSheet[e]}) has a vertex on another sheet`);
  }
  for (let f = 0; f < nF; f++) for (const v of faces[f]) if (vSheet[v] !== fSheet[f]) { P.push(`rule 2: face ${f} (sheet ${fSheet[f]}) has vertex ${v} on another sheet`); break; }
  // rule 4 (part): assignment / treatment pairs and fold angles
  const ALLOWED = /** @type {Record<string,string>} */ ({ none: 'BJUF', crease: 'MVF', score: 'MVF', perforation: 'MVFC', cut: 'C', halfcut: 'F' });
  for (let e = 0; e < nE; e++) {
    const a = assignment[e], t = treatment[e];
    if (ALLOWED[t] && !ALLOWED[t].includes(a)) P.push(`rule 4: edge ${e} treatment ${t} is not allowed with assignment ${a}`);
    if (a !== 'M' && a !== 'V' && Math.abs(foldAngle[e]) > 1e-9) P.push(`rule 4: edge ${e} (${a}) must have fold angle 0, has ${foldAngle[e]}`);
  }
  // rule 3: faces simple, CCW, ≥ 1 mm²; rule 4: incidence
  const faceEdges = [];
  const edgeFaces = new Int32Array(2 * nE).fill(-1);
  const edgeFaceDir = new Int8Array(2 * nE);
  const facePolys = [];
  const mf = doc.meta && typeof doc.meta.min_feature_mm === 'number' ? doc.meta.min_feature_mm : 1;
  if (!(mf > 0)) P.push('pliego:meta.min_feature_mm must be > 0');
  const minArea = mf > 0 ? mf * mf : 1;
  /** @type {number[]} */
  const faceArea = [];
  for (let f = 0; f < nF; f++) {
    const fv = faces[f];
    const poly = [];
    for (const v of fv) poly.push(coords[2 * v], coords[2 * v + 1]);
    facePolys.push(poly);
    const A = polygonArea(poly);
    if (new Set(fv).size !== fv.length) P.push(`rule 3: face ${f} repeats a vertex`);
    else if (!polygonIsSimple(poly)) P.push(`rule 3: face ${f} is not simple`);
    if (A < 0) P.push(`rule 3: face ${f} is clockwise (area ${A.toFixed(3)} mm²)`);
    faceArea.push(A);
    const fe = [];
    for (let i = 0; i < fv.length; i++) {
      const a = fv[i], b = fv[(i + 1) % fv.length];
      const e = edgeIndex.get(a < b ? `${a},${b}` : `${b},${a}`);
      if (e === undefined) { P.push(`rule 4: face ${f} side ${a}–${b} is not an edge`); fe.push(-1); continue; }
      fe.push(e);
      const dir = edges[2 * e] === a ? 1 : -1;
      if (edgeFaces[2 * e] === -1) { edgeFaces[2 * e] = f; edgeFaceDir[2 * e] = dir; }
      else if (edgeFaces[2 * e + 1] === -1) { edgeFaces[2 * e + 1] = f; edgeFaceDir[2 * e + 1] = dir; }
      else P.push(`rule 4: edge ${e} borders more than two faces`);
    }
    faceEdges.push(fe);
  }
  // split cuts (spec §5.13): a cut written once per side is a pair of twin C edges on one sheet
  // with identical endpoint coordinates, each bordering one face
  const edgeTwin = new Int32Array(nE).fill(-1);
  /** @type {Map<string, number[]>} */
  const byPlace = new Map();
  for (let e = 0; e < nE; e++) {
    if (assignment[e] !== 'C') continue;
    const a = edges[2 * e], b = edges[2 * e + 1];
    const pa = `${coords[2 * a]},${coords[2 * a + 1]}`, pb = `${coords[2 * b]},${coords[2 * b + 1]}`;
    const key = `${eSheet[e]}|${pa < pb ? `${pa}|${pb}` : `${pb}|${pa}`}`;
    const l = byPlace.get(key);
    if (l) l.push(e); else byPlace.set(key, [e]);
  }
  for (const l of byPlace.values()) if (l.length === 2) { edgeTwin[l[0]] = l[1]; edgeTwin[l[1]] = l[0]; }
  const sides = (/** @type {number} */ e) => (edgeFaces[2 * e] >= 0 ? 1 : 0) + (edgeFaces[2 * e + 1] >= 0 ? 1 : 0);
  // rule 3 floor per material face: faces joined across J edges (artificial bridges, spec §2)
  // count as one region — the kernel's verify measures it the same way
  const jRoot = faces.map((_, f) => f);
  const findJ = (/** @type {number} */ f) => { while (jRoot[f] !== f) { jRoot[f] = jRoot[jRoot[f]]; f = jRoot[f]; } return f; };
  for (let e = 0; e < nE; e++) {
    if (assignment[e] !== 'J' || edgeFaces[2 * e] < 0 || edgeFaces[2 * e + 1] < 0) continue;
    const r0 = findJ(edgeFaces[2 * e]), r1 = findJ(edgeFaces[2 * e + 1]);
    if (r0 !== r1) jRoot[Math.max(r0, r1)] = Math.min(r0, r1);
  }
  /** @type {Map<number, number>} */
  const regionArea = new Map();
  for (let f = 0; f < nF; f++) if (faceArea[f] >= 0) regionArea.set(findJ(f), (regionArea.get(findJ(f)) ?? 0) + faceArea[f]);
  for (const [r, A] of regionArea) if (A < minArea) P.push(`rule 3: face ${r} area ${A.toFixed(4)} mm² (with the faces joined to it across J edges) is below the ${minArea} mm² floor (min_feature_mm²)`);
  for (let e = 0; e < nE; e++) {
    const n = sides(e);
    const a = assignment[e];
    if (a === 'B') { if (n !== 1) P.push(`rule 4: boundary edge ${e} borders ${n} faces, expected 1`); }
    else if (a === 'C' && n === 1) {
      const t = edgeTwin[e];
      if (t < 0 || sides(t) !== 1) P.push(`rule 4: C edge ${e} borders 1 face and has no split-cut twin (§5.13: exactly one other C edge of its sheet with the same endpoint coordinates, also bordering one face)`);
    }
    else if (n !== 2) P.push(`rule 4: ${a} edge ${e} borders ${n} faces, expected 2`);
    else if (edgeFaceDir[2 * e] === edgeFaceDir[2 * e + 1]) P.push(`rule 3: faces ${edgeFaces[2 * e]} and ${edgeFaces[2 * e + 1]} overlap along edge ${e} (same orientation)`);
  }
  if (P.length) return;
  // rules 3 & 5: no two edges cross anywhere (same sheet: tiling; different sheets: layout overlap)
  crossingCheck(doc, P);
  // rule 5: a sheet fully inside another sheet's face
  const nS = doc.sheets.length;
  const sheetFaces = Array.from({ length: nS }, () => /** @type {number[]} */([]));
  for (let f = 0; f < nF; f++) sheetFaces[fSheet[f]].push(f);
  for (let s = 0; s < nS; s++) if (!sheetFaces[s].length) P.push(`sheet ${doc.sheets[s].id} has no faces`);
  if (P.length) return;
  for (let s = 0; s < nS; s++) {
    const p0 = facePolys[sheetFaces[s][0]];
    const [cx, cy] = interiorPoint(p0);
    for (let o = 0; o < nS; o++) {
      if (o === s) continue;
      for (const f of sheetFaces[o]) if (pointInPolygon(cx, cy, facePolys[f], -1)) { P.push(`rule 5: sheet ${doc.sheets[s].id} overlaps sheet ${doc.sheets[o].id} in the layout frame`); break; }
    }
  }
  Object.assign(doc, { faceEdges, edgeFaces, edgeFaceDir, facePolys, sheetFaces, edgeTwin });
}

/** A point strictly inside a simple polygon (centroid of an ear). @param {number[]} P */
function interiorPoint(P) {
  const n = P.length / 2;
  for (let i = 0; i < n; i++) {
    const a = (i + n - 1) % n, b = (i + 1) % n;
    const cx = (P[2 * a] + P[2 * i] + P[2 * b]) / 3, cy = (P[2 * a + 1] + P[2 * i + 1] + P[2 * b + 1]) / 3;
    if (pointInPolygon(cx, cy, P, -1)) return [cx, cy];
  }
  return [P[0], P[1]];
}

/** Grid-bucketed all-pairs edge crossing test. @param {Doc} doc @param {string[]} P */
function crossingCheck(doc, P) {
  const { nE, coords, edges, eSheet } = doc;
  if (nE < 2) return;
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity, total = 0;
  for (let e = 0; e < nE; e++) {
    const a = edges[2 * e], b = edges[2 * e + 1];
    for (const v of [a, b]) { minx = Math.min(minx, coords[2 * v]); maxx = Math.max(maxx, coords[2 * v]); miny = Math.min(miny, coords[2 * v + 1]); maxy = Math.max(maxy, coords[2 * v + 1]); }
    total += Math.hypot(coords[2 * a] - coords[2 * b], coords[2 * a + 1] - coords[2 * b + 1]);
  }
  const cell = Math.max(total / nE, 1e-6) * 2;
  const nx = Math.min(1024, Math.max(1, Math.ceil((maxx - minx) / cell) + 1));
  const ny = Math.min(1024, Math.max(1, Math.ceil((maxy - miny) / cell) + 1));
  const cw = (maxx - minx) / nx || 1, ch = (maxy - miny) / ny || 1;
  /** @type {Map<number, number[]>} */
  const grid = new Map();
  for (let e = 0; e < nE; e++) {
    const a = edges[2 * e], b = edges[2 * e + 1];
    const x0 = Math.min(coords[2 * a], coords[2 * b]), x1 = Math.max(coords[2 * a], coords[2 * b]);
    const y0 = Math.min(coords[2 * a + 1], coords[2 * b + 1]), y1 = Math.max(coords[2 * a + 1], coords[2 * b + 1]);
    const i0 = Math.min(nx - 1, Math.floor((x0 - minx) / cw)), i1 = Math.min(nx - 1, Math.floor((x1 - minx) / cw));
    const j0 = Math.min(ny - 1, Math.floor((y0 - miny) / ch)), j1 = Math.min(ny - 1, Math.floor((y1 - miny) / ch));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * nx + i;
      let l = grid.get(k);
      if (!l) { l = []; grid.set(k, l); }
      l.push(e);
    }
  }
  const seen = new Set();
  let reported = 0;
  for (const list of grid.values()) {
    for (let p = 0; p < list.length; p++) for (let q = p + 1; q < list.length; q++) {
      const e = list[p], f = list[q];
      const a = edges[2 * e], b = edges[2 * e + 1], c = edges[2 * f], d = edges[2 * f + 1];
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsCross(coords[2 * a], coords[2 * a + 1], coords[2 * b], coords[2 * b + 1], coords[2 * c], coords[2 * c + 1], coords[2 * d], coords[2 * d + 1])) {
        const key = e < f ? e * nE + f : f * nE + e;
        if (seen.has(key)) continue;
        seen.add(key);
        if (reported++ < 50) P.push(eSheet[e] === eSheet[f] ? `rule 3: edges ${e} and ${f} cross (faces overlap)` : `rule 5: edges ${e} and ${f} of different sheets cross (sheets overlap in the layout frame)`);
      }
    }
  }
}

/**
 * Is the sheet-local point inside the sheet (any face, boundary inclusive within 1e-6 mm)?
 * @param {Doc & Record<string, any>} doc @param {number} s sheet index @param {number} u @param {number} v
 */
export function insideSheet(doc, s, u, v) {
  const [ox, oy] = doc.sheets[s].offset;
  const x = u + ox, y = v + oy;
  for (const f of doc.sheetFaces[s]) if (pointInPolygon(x, y, doc.facePolys[f], 1e-6)) return true;
  return false;
}

/** Face of sheet s containing sheet-local (u, v), or −1. @param {Doc & Record<string, any>} doc @param {number} s @param {number} u @param {number} v */
export function faceAt(doc, s, u, v) {
  const [ox, oy] = doc.sheets[s].offset;
  const x = u + ox, y = v + oy;
  for (const f of doc.sheetFaces[s]) if (pointInPolygon(x, y, doc.facePolys[f], 1e-6)) return f;
  return -1;
}

/**
 * Rule 7 (points inside sheets, glue regions) and rule 9 (initial frame).
 * @param {Doc & Record<string, any>} doc @param {string[]} P
 */
export function checkJoinsAndFrames(doc, P) {
  const si = (/** @type {string} */ id) => /** @type {number} */(doc.sheetIndex.get(id));
  const inside = (/** @type {string} */ sid, /** @type {number[]} */ p, /** @type {string} */ what) => {
    if (!insideSheet(doc, si(sid), p[0], p[1])) P.push(`rule 7: ${what} (${p[0]}, ${p[1]}) is not inside sheet ${sid}`);
  };
  doc.joins.forEach((j, i) => {
    const w = `pliego:joins[${i}] (${j.id})`;
    if (j.type === 'glue') {
      for (const p of j.a.region) inside(j.a.sheet, p, `${w} glue region point`);
      const [a, b, c, d, tx, ty] = j.map;
      for (const p of j.a.region) inside(j.b.sheet, [a * p[0] + b * p[1] + tx, c * p[0] + d * p[1] + ty], `${w} glue region mapped onto b`);
    }
    if (j.type === 'pivot') { inside(j.a.sheet, j.a.at, `${w}.a`); inside(j.b.sheet, j.b.at, `${w}.b`); }
    if (j.type === 'string') { inside(j.a.sheet, j.a.at, `${w}.a`); if (j.b.world === undefined) inside(j.b.sheet, j.b.at, `${w}.b`); }
    if (j.type === 'pin') { if (j.a.along) { inside(j.a.sheet, j.a.along[0], `${w}.along[0]`); inside(j.a.sheet, j.a.along[1], `${w}.along[1]`); } else inside(j.a.sheet, j.a.at, `${w}.a`); }
    if (j.type === 'slider') { inside(j.a.sheet, j.a.at, `${w}.a`); inside(j.track.sheet, j.track.from, `${w}.track.from`); inside(j.track.sheet, j.track.to, `${w}.track.to`); }
  });
  doc.mechanisms.forEach((m, i) => {
    const w = `pliego:mechanisms[${i}] (${m.id})`;
    if (m.type === 'rotate') inside(m.center.sheet, m.center.at, `${w}.center`);
    if (m.type === 'leaf') { inside(m.sheet, m.spine[0], `${w}.spine[0]`); inside(m.sheet, m.spine[1], `${w}.spine[1]`); }
  });
  if (P.length) return;
  const nonIdentity = doc.sheets.some((s) => s.placement.origin.some((x) => Math.abs(x) > 1e-12) || Math.abs(s.placement.rotation[3]) < 1 - 1e-12);
  if (!doc.initial) {
    if (doc.joins.length) P.push('rule 9 / §6: an "initial" frame is required when joins exist');
    if (nonIdentity) P.push('rule 9 / §6: an "initial" frame is required when a sheet has a non-identity placement');
    return;
  }
  const X = doc.initial, C = doc.coords;
  for (let e = 0; e < doc.nE; e++) {
    const a = doc.edges[2 * e], b = doc.edges[2 * e + 1];
    const L2 = Math.hypot(C[2 * a] - C[2 * b], C[2 * a + 1] - C[2 * b + 1]);
    const L3 = Math.hypot(X[3 * a] - X[3 * b], X[3 * a + 1] - X[3 * b + 1], X[3 * a + 2] - X[3 * b + 2]);
    if (L2 > 0 && Math.abs(L3 - L2) / L2 > 1e-3) P.push(`rule 9: initial frame stretches edge ${e} by ${((L3 / L2 - 1) * 100).toFixed(3)} %`);
  }
  // glue welds: every vertex of the region polygon, mapped to sheet b, lies within
  // max(collision_thickness a, b) of its image on b (spec §8.9, sampled at the region vertices)
  doc.joins.forEach((j) => {
    // a step-gated glue (spec §5.19) is created during its step, not in the initial frame
    if (j.type !== 'glue' || j.active_from !== undefined) return;
    const sa = si(j.a.sheet), sb = si(j.b.sheet);
    const tol = Math.max(doc.sheets[sa].derived.collision_thickness, doc.sheets[sb].derived.collision_thickness) * (1 + 1e-6) + 1e-6;
    const [ma, mb, mc, md, tx, ty] = j.map;
    let worst = 0;
    for (const [u, w] of j.a.region) {
      const fa = faceAt(doc, sa, u, w);
      const bu = ma * u + mb * w + tx, bv = mc * u + md * w + ty;
      const fb = faceAt(doc, sb, bu, bv);
      if (fa < 0 || fb < 0) continue; // reported by rule 7
      const pa = faceMap3(doc, fa, u + doc.sheets[sa].offset[0], w + doc.sheets[sa].offset[1]);
      const pb = faceMap3(doc, fb, bu + doc.sheets[sb].offset[0], bv + doc.sheets[sb].offset[1]);
      worst = Math.max(worst, Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]));
    }
    if (worst > tol) P.push(`rule 9: glue join ${j.id} is off its zone by ${worst.toFixed(4)} mm in the initial frame (tolerance ${tol.toFixed(4)})`);
  });
}

/**
 * Initial-frame 3-D position of a layout point inside face f (the face is rigid: affine map from its
 * best-conditioned vertex triangle).
 * @param {Doc & Record<string, any>} doc @param {number} f @param {number} x @param {number} y
 */
export function faceMap3(doc, f, x, y) {
  const X = /** @type {Float64Array} */(doc.initial);
  const C = doc.coords;
  const fv = doc.faces[f];
  let best = -1, bi = 0, bj = 1, bk = 2;
  for (let j = 1; j < fv.length; j++) for (let k = j + 1; k < fv.length; k++) {
    const i0 = fv[0], i1 = fv[j], i2 = fv[k];
    const ar = Math.abs((C[2 * i1] - C[2 * i0]) * (C[2 * i2 + 1] - C[2 * i0 + 1]) - (C[2 * i1 + 1] - C[2 * i0 + 1]) * (C[2 * i2] - C[2 * i0]));
    if (ar > best) { best = ar; bi = i0; bj = i1; bk = i2; }
  }
  const ux = C[2 * bj] - C[2 * bi], uy = C[2 * bj + 1] - C[2 * bi + 1];
  const vx = C[2 * bk] - C[2 * bi], vy = C[2 * bk + 1] - C[2 * bi + 1];
  const det = ux * vy - uy * vx;
  const px = x - C[2 * bi], py = y - C[2 * bi + 1];
  const s = (px * vy - py * vx) / det, t = (ux * py - uy * px) / det;
  return [0, 1, 2].map((c) => X[3 * bi + c] + s * (X[3 * bj + c] - X[3 * bi + c]) + t * (X[3 * bk + c] - X[3 * bi + c]));
}
