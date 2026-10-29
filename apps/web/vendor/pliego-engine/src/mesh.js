// @ts-check
/**
 * `buildMesh(doc, {meshEdge})` — the simulation mesh of a loaded sheet document (engine.md §2).
 *
 * Per sheet: split every document edge into segments ≤ h (once per edge, so neighbouring faces
 * conform), triangulate each face (ear clipping + grain-aligned lattice + Delaunay flips), duplicate
 * vertices along cut edges (C + treatment `cut`; cut tips keep one shared vertex) unless the
 * document already split them (twin edges, spec §5.13: one side each, sharing contact groups), classify interior
 * mesh edges as hinges (panel | crease | score | perforation) with their grain angle φ, lump masses,
 * and build the render mesh (vertices split along fold hinges into smoothing groups, sheet UVs).
 * All arrays are typed and allocated once.
 */
import { triangulateFace, latticePoints } from './triangulate.js';
import { quatRotate, pointInPolygon } from './geom.js';
import { faceMap3 } from './docrules.js';
import { LATTICE_MARGIN } from './constants.js';

export const HINGE_PANEL = 0, HINGE_CREASE = 1, HINGE_SCORE = 2, HINGE_PERF = 3;
const KIND_OF_TREATMENT = /** @type {Record<string, number>} */ ({ crease: HINGE_CREASE, score: HINGE_SCORE, perforation: HINGE_PERF });

/**
 * @typedef {object} Mesh
 * @property {number} h target edge length used
 * @property {number} nV @property {number} nT @property {number} nE @property {number} nH
 * @property {Float64Array} X0 initial world positions (3·nV)
 * @property {Float64Array} uv sheet-local coordinates (2·nV)
 * @property {Int32Array} vSheet @property {Int32Array} vGroup copies of one document point share a group id
 * @property {Int32Array} vFace a face of the document the vertex was created in
 * @property {Float64Array} mass
 * @property {Int32Array} tris @property {Int32Array} triSheet @property {Int32Array} triFace @property {Float64Array} triArea
 * @property {Int32Array} edges mesh edges (pairs) @property {Float64Array} edgeLen rest lengths
 * @property {Int32Array} edgeTris two triangles per edge (−1 if boundary) @property {Int32Array} edgeDoc document edge or −1
 * @property {Int32Array} hinges p0 p1 w0 w1 per hinge @property {Uint8Array} hingeKind @property {Int32Array} hingeDoc
 * @property {Int32Array} hingeEdge mesh edge of each hinge @property {Float64Array} hingePhi @property {Float64Array} hingeA areas A₁+A₂
 * @property {Int32Array} docVertex first mesh vertex of each document vertex
 * @property {Int32Array[]} docEdgeChain mesh vertices along each document edge (a→b), side 0
 * @property {Int32Array} perfPairs duplicated vertex pairs along perforations (welded until torn)
 * @property {Int32Array} perfPairDoc document edge of each pair @property {Float64Array} perfPairLen perforation length each pair carries
 * @property {{nR:number, src:Int32Array, uv:Float32Array, sheet:Int32Array, indices:Uint32Array, triCorner:Int32Array}} render
 */

/**
 * @param {import('./document.js').Doc & Record<string, any>} doc
 * @param {{meshEdge?: number}} [opts]
 * @returns {Mesh}
 */
export function buildMesh(doc, opts = {}) {
  const h = opts.meshEdge ?? defaultMeshEdge(doc);
  if (!(h > 0)) throw new RangeError('buildMesh: meshEdge must be > 0');
  const { nE, coords, edges, assignment, treatment, faces, fSheet, edgeFaces, faceEdges } = doc;
  // cut edges and perforations are split topologically; perforations are re-joined by breakable
  // welds and a perforation hinge in the World (they tear at the stock's tear strain)
  const isCut = (/** @type {number} */ e) => (assignment[e] === 'C' && treatment[e] === 'cut') || treatment[e] === 'perforation';
  /** @type {number[]} */ const U = []; // sheet-local u, v
  /** @type {number[]} */ const vS = [], vG = [], vF = [];
  let groupCounter = 0;
  const addVertex = (/** @type {number} */ u, /** @type {number} */ v, /** @type {number} */ s, /** @type {number} */ g, /** @type {number} */ f) => {
    U.push(u, v); vS.push(s); vG.push(g); vF.push(f); return vS.length - 1;
  };
  // document vertices → per-sector mesh vertices (union faces around v across non-cut edges)
  const vertexFaces = Array.from({ length: doc.nV }, () => /** @type {number[]} */([]));
  for (let f = 0; f < faces.length; f++) for (const v of faces[f]) vertexFaces[v].push(f);
  const vertexEdges = Array.from({ length: doc.nV }, () => /** @type {number[]} */([]));
  for (let e = 0; e < nE; e++) { vertexEdges[edges[2 * e]].push(e); vertexEdges[edges[2 * e + 1]].push(e); }
  /** @type {Map<number, number>[]} */
  const sectorVertex = [];
  const docVertex = new Int32Array(doc.nV).fill(-1);
  /** @type {Map<string, number>} */
  const placeGroup = new Map();
  for (let v = 0; v < doc.nV; v++) {
    const fs = vertexFaces[v];
    const parent = new Map(fs.map((f) => [f, f]));
    const find = (/** @type {number} */ f) => { let r = f; while (parent.get(r) !== r) r = /** @type {number} */(parent.get(r)); return r; };
    for (const e of vertexEdges[v]) {
      if (isCut(e)) continue;
      const f0 = edgeFaces[2 * e], f1 = edgeFaces[2 * e + 1];
      if (f0 >= 0 && f1 >= 0) { const r0 = find(f0), r1 = find(f1); if (r0 !== r1) parent.set(Math.max(r0, r1), Math.min(r0, r1)); }
    }
    /** @type {Map<number, number>} */
    const m = new Map();
    /** @type {Map<number, number>} */
    const byRoot = new Map();
    const s = doc.vSheet[v];
    const [ox, oy] = doc.sheets[s].offset;
    // copies of one point share a contact group: the sectors made here, and the vertices a split
    // cut wrote with the same coordinates on the same sheet (spec §5.13)
    const placeKey = `${s}|${coords[2 * v]},${coords[2 * v + 1]}`;
    let g = placeGroup.get(placeKey);
    if (g === undefined) { g = groupCounter++; placeGroup.set(placeKey, g); }
    for (const f of fs) {
      const r = find(f);
      let mv = byRoot.get(r);
      if (mv === undefined) { mv = addVertex(coords[2 * v] - ox, coords[2 * v + 1] - oy, s, g, f); byRoot.set(r, mv); }
      m.set(f, mv);
    }
    sectorVertex.push(m);
    if (fs.length) docVertex[v] = /** @type {number} */(m.get(fs[0]));
  }
  // split points per edge, per side
  /** @type {number[][][]} */
  const split = [];
  const twin = /** @type {Int32Array|undefined} */ (doc.edgeTwin);
  const edgeGroup = new Int32Array(nE);
  for (let e = 0; e < nE; e++) {
    const a = edges[2 * e], b = edges[2 * e + 1];
    const s = doc.eSheet[e];
    const [ox, oy] = doc.sheets[s].offset;
    const ax = coords[2 * a] - ox, ay = coords[2 * a + 1] - oy, bx = coords[2 * b] - ox, by = coords[2 * b + 1] - oy;
    const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / h - 1e-9));
    // an unsplit cut is meshed on both sides here; a split cut (twin edges, spec §5.13) already
    // has one document edge per side, each bordering one face
    const sides = isCut(e) && edgeFaces[2 * e + 1] >= 0 ? 2 : 1;
    const per = [];
    let g0 = groupCounter, rev = false;
    const tw = twin ? twin[e] : -1;
    if (tw >= 0 && tw < e) {
      // the twin was split first: share its contact groups (its points run the same or the other way)
      g0 = edgeGroup[tw];
      rev = coords[2 * edges[2 * tw]] !== coords[2 * a] || coords[2 * edges[2 * tw] + 1] !== coords[2 * a + 1];
    } else groupCounter += k - 1;
    edgeGroup[e] = g0;
    for (let sd = 0; sd < sides; sd++) {
      const list = [];
      const f = edgeFaces[2 * e + sd] >= 0 ? edgeFaces[2 * e + sd] : edgeFaces[2 * e];
      for (let q = 1; q < k; q++) list.push(addVertex(ax + ((bx - ax) * q) / k, ay + ((by - ay) * q) / k, s, g0 + (rev ? k - q : q) - 1, f));
      per.push(list);
    }
    split.push(per);
  }
  /** @type {number[]} */ const tri = [], triS = [], triF = [];
  /** @type {Map<number, number>} directed boundary segment key → document edge */
  const segDoc = new Map();
  const NV_BIG = 1 << 22;
  for (let f = 0; f < faces.length; f++) {
    const fv = faces[f];
    const s = fSheet[f];
    const sheet = doc.sheets[s];
    const ring = [];
    for (let i = 0; i < fv.length; i++) {
      const v = fv[i];
      const e = faceEdges[f][i];
      ring.push(/** @type {number} */(sectorVertex[v].get(f)));
      const side = isCut(e) && edgeFaces[2 * e + 1] === f ? 1 : 0;
      const pts = split[e][side];
      const forward = edges[2 * e] === v;
      for (let q = 0; q < pts.length; q++) ring.push(forward ? pts[q] : pts[pts.length - 1 - q]);
    }
    // record which document edge each boundary segment lies on
    let pos = 0;
    for (let i = 0; i < fv.length; i++) {
      const e = faceEdges[f][i];
      const n = split[e][0].length + 1;
      for (let q = 0; q < n; q++) {
        const a = ring[(pos + q) % ring.length], b = ring[(pos + q + 1) % ring.length];
        segDoc.set(Math.min(a, b) * NV_BIG + Math.max(a, b), e);
      }
      pos += n;
    }
    const poly = [];
    for (const mv of ring) poly.push(U[2 * mv], U[2 * mv + 1]);
    const grain = (sheet.grainDeg * Math.PI) / 180;
    const inner = latticePoints(poly, h, grain + Math.PI / 2, LATTICE_MARGIN);
    const local = triangulateFace(poly, inner, 1.25 * h);
    const ids = ring.slice();
    for (let k = 0; k < inner.length / 2; k++) ids.push(addVertex(inner[2 * k], inner[2 * k + 1], s, groupCounter++, f));
    for (let k = 0; k < local.length; k += 3) { tri.push(ids[local[k]], ids[local[k + 1]], ids[local[k + 2]]); triS.push(s); triF.push(f); }
  }
  const nV = vS.length, nT = triS.length;
  const tris = Int32Array.from(tri);
  const uv = Float64Array.from(U);
  // areas and masses
  const triArea = new Float64Array(nT);
  const mass = new Float64Array(nV);
  for (let t = 0; t < nT; t++) {
    const a = tris[3 * t], b = tris[3 * t + 1], c = tris[3 * t + 2];
    const A = 0.5 * ((uv[2 * b] - uv[2 * a]) * (uv[2 * c + 1] - uv[2 * a + 1]) - (uv[2 * b + 1] - uv[2 * a + 1]) * (uv[2 * c] - uv[2 * a]));
    if (!(A > 0)) throw new Error(`buildMesh: triangle ${t} has non-positive area ${A}`);
    triArea[t] = A;
    const m = (A * doc.sheets[triS[t]].derived.areal_density) / 3;
    mass[a] += m; mass[b] += m; mass[c] += m;
  }
  // unique edges with incident triangles
  /** @type {Map<number, number>} */
  const emap = new Map();
  /** @type {number[]} */ const E = [], ET = [];
  for (let t = 0; t < nT; t++) for (let i = 0; i < 3; i++) {
    const a = tris[3 * t + i], b = tris[3 * t + ((i + 1) % 3)];
    const key = Math.min(a, b) * NV_BIG + Math.max(a, b);
    const e = emap.get(key);
    if (e === undefined) { emap.set(key, E.length / 2); E.push(a, b); ET.push(t, -1); }
    else if (ET[2 * e + 1] === -1) ET[2 * e + 1] = t;
    else throw new Error('buildMesh: non-manifold mesh edge');
  }
  const nE2 = E.length / 2;
  const edgesM = Int32Array.from(E), edgeTris = Int32Array.from(ET);
  const edgeLen = new Float64Array(nE2), edgeDoc = new Int32Array(nE2).fill(-1);
  for (let e = 0; e < nE2; e++) {
    const a = edgesM[2 * e], b = edgesM[2 * e + 1];
    edgeLen[e] = Math.hypot(uv[2 * a] - uv[2 * b], uv[2 * a + 1] - uv[2 * b + 1]);
    const d = segDoc.get(Math.min(a, b) * NV_BIG + Math.max(a, b));
    if (d !== undefined) edgeDoc[e] = d;
  }
  // hinges
  /** @type {number[]} */ const H = [], HK = [], HD = [], HE = [], HP = [], HA = [];
  for (let e = 0; e < nE2; e++) {
    const t0 = edgeTris[2 * e], t1 = edgeTris[2 * e + 1];
    if (t1 < 0) continue;
    const a = edgesM[2 * e], b = edgesM[2 * e + 1];
    // orient so that t0 contains a→b in CCW order
    let ta = t0, tb = t1;
    if (!hasDirected(tris, t0, a, b)) { ta = t1; tb = t0; }
    const w0 = third(tris, ta, a, b), w1 = third(tris, tb, a, b);
    const d = edgeDoc[e];
    const kind = d >= 0 ? (KIND_OF_TREATMENT[doc.treatment[d]] ?? HINGE_PANEL) : HINGE_PANEL;
    const s = triS[ta];
    const grain = (doc.sheets[s].grainDeg * Math.PI) / 180;
    const tx = uv[2 * b] - uv[2 * a], ty = uv[2 * b + 1] - uv[2 * a + 1];
    // curvature direction n ⟂ edge; φ = angle between MD and n
    const L = Math.hypot(tx, ty);
    const cosPhi = Math.abs((-ty * Math.cos(grain) + tx * Math.sin(grain)) / L);
    H.push(a, b, w0, w1); HK.push(kind); HD.push(d); HE.push(e); HP.push(Math.acos(Math.min(1, cosPhi))); HA.push(triArea[ta] + triArea[tb]);
  }
  // perforations: weld pairs along the split and hinges spanning it
  /** @type {number[]} */ const PP = [], PD = [], PL = [];
  for (let e = 0; e < nE; e++) {
    if (treatment[e] !== 'perforation') continue;
    const a = edges[2 * e], b = edges[2 * e + 1];
    const f0 = edgeFaces[2 * e], f1 = edgeFaces[2 * e + 1];
    if (f1 < 0) continue;
    const cA = [/** @type {number} */(sectorVertex[a].get(f0)), ...split[e][0], /** @type {number} */(sectorVertex[b].get(f0))];
    const cB = [/** @type {number} */(sectorVertex[a].get(f1)), ...split[e][1], /** @type {number} */(sectorVertex[b].get(f1))];
    const seg = (/** @type {number} */ i) => Math.hypot(uv[2 * cA[i + 1]] - uv[2 * cA[i]], uv[2 * cA[i + 1] + 1] - uv[2 * cA[i] + 1]);
    for (let i = 0; i < cA.length; i++) {
      if (cA[i] === cB[i]) continue;
      PP.push(cA[i], cB[i]); PD.push(e);
      PL.push(0.5 * ((i > 0 ? seg(i - 1) : 0) + (i < cA.length - 1 ? seg(i) : 0)));
    }
    for (let i = 0; i + 1 < cA.length; i++) {
      const eA = emap.get(Math.min(cA[i], cA[i + 1]) * NV_BIG + Math.max(cA[i], cA[i + 1]));
      const eB = emap.get(Math.min(cB[i], cB[i + 1]) * NV_BIG + Math.max(cB[i], cB[i + 1]));
      if (eA === undefined || eB === undefined) continue;
      const tA = edgeTris[2 * eA], tB = edgeTris[2 * eB];
      let p0 = cA[i], p1 = cA[i + 1];
      if (!hasDirected(tris, tA, p0, p1)) { p0 = cA[i + 1]; p1 = cA[i]; }
      const w0 = third(tris, tA, cA[i], cA[i + 1]), w1 = third(tris, tB, cB[i], cB[i + 1]);
      const s = triS[tA];
      const grain = (doc.sheets[s].grainDeg * Math.PI) / 180;
      const tx = uv[2 * p1] - uv[2 * p0], ty = uv[2 * p1 + 1] - uv[2 * p0 + 1];
      const L = Math.hypot(tx, ty);
      const cosPhi = Math.abs((-ty * Math.cos(grain) + tx * Math.sin(grain)) / L);
      H.push(p0, p1, w0, w1); HK.push(HINGE_PERF); HD.push(e); HE.push(eA); HP.push(Math.acos(Math.min(1, cosPhi))); HA.push(triArea[tA] + triArea[tB]);
    }
  }
  const X0 = initialPositions(doc, uv, vS, vF, nV);
  const render = buildRender(doc, tris, triS, uv, vS, Int32Array.from(H), Uint8Array.from(HK), nV, nT);
  const docEdgeChain = [];
  for (let e = 0; e < nE; e++) {
    const a = edges[2 * e], b = edges[2 * e + 1];
    const fa = edgeFaces[2 * e];
    const chain = [/** @type {number} */(sectorVertex[a].get(fa)), ...split[e][0], /** @type {number} */(sectorVertex[b].get(fa))];
    docEdgeChain.push(Int32Array.from(chain));
  }
  return {
    h, nV, nT, nE: nE2, nH: HK.length, X0, uv, vSheet: Int32Array.from(vS), vGroup: Int32Array.from(vG), vFace: Int32Array.from(vF), mass,
    tris, triSheet: Int32Array.from(triS), triFace: Int32Array.from(triF), triArea,
    edges: edgesM, edgeLen, edgeTris, edgeDoc,
    hinges: Int32Array.from(H), hingeKind: Uint8Array.from(HK), hingeDoc: Int32Array.from(HD), hingeEdge: Int32Array.from(HE),
    hingePhi: Float64Array.from(HP), hingeA: Float64Array.from(HA),
    docVertex, docEdgeChain, render,
    perfPairs: Int32Array.from(PP), perfPairDoc: Int32Array.from(PD), perfPairLen: Float64Array.from(PL),
  };
}

/** Default target edge length: ~1/30 of the largest sheet dimension, clamped to [3, 8] mm. @param {any} doc */
export function defaultMeshEdge(doc) {
  let span = 0;
  for (let s = 0; s < doc.sheets.length; s++) {
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for (let v = 0; v < doc.nV; v++) if (doc.vSheet[v] === s) { minx = Math.min(minx, doc.coords[2 * v]); maxx = Math.max(maxx, doc.coords[2 * v]); miny = Math.min(miny, doc.coords[2 * v + 1]); maxy = Math.max(maxy, doc.coords[2 * v + 1]); }
    span = Math.max(span, maxx - minx, maxy - miny);
  }
  return Math.min(8, Math.max(3, span / 30));
}

/** @param {Int32Array} T @param {number} t @param {number} a @param {number} b */
function hasDirected(T, t, a, b) {
  for (let i = 0; i < 3; i++) if (T[3 * t + i] === a && T[3 * t + ((i + 1) % 3)] === b) return true;
  return false;
}
/** @param {Int32Array} T @param {number} t @param {number} a @param {number} b */
function third(T, t, a, b) {
  for (let i = 0; i < 3; i++) { const v = T[3 * t + i]; if (v !== a && v !== b) return v; }
  return -1;
}

/**
 * Initial world positions: the `initial` frame (faces are rigid there: each mesh vertex follows its
 * face's affine map) or the sheet placement applied to (u, 0, −v).
 * @param {any} doc @param {Float64Array} uv @param {number[]} vS @param {number[]} vF @param {number} nV
 */
function initialPositions(doc, uv, vS, vF, nV) {
  const X = new Float64Array(3 * nV);
  for (let v = 0; v < nV; v++) {
    const s = doc.sheets[vS[v]];
    let p;
    if (doc.initial) p = faceMap3(doc, vF[v], uv[2 * v] + s.offset[0], uv[2 * v + 1] + s.offset[1]);
    else {
      const r = quatRotate(s.placement.rotation, [uv[2 * v], 0, -uv[2 * v + 1]]);
      p = [r[0] + s.placement.origin[0], r[1] + s.placement.origin[1], r[2] + s.placement.origin[2]];
    }
    X[3 * v] = p[0]; X[3 * v + 1] = p[1]; X[3 * v + 2] = p[2];
  }
  return X;
}

/**
 * Render mesh: split vertices along fold hinges (crease/score/perforation) into smoothing groups.
 * @param {any} doc @param {Int32Array} tris @param {number[]} triS @param {Float64Array} uv @param {number[]} vS
 * @param {Int32Array} hinges @param {Uint8Array} kinds @param {number} nV @param {number} nT
 */
function buildRender(doc, tris, triS, uv, vS, hinges, kinds, nV, nT) {
  // triangles incident to each vertex
  const inc = Array.from({ length: nV }, () => /** @type {number[]} */([]));
  for (let t = 0; t < nT; t++) for (let i = 0; i < 3; i++) inc[tris[3 * t + i]].push(t);
  // smooth adjacency: triangles sharing a panel hinge
  /** @type {Map<number, number>} */
  const smooth = new Map();
  const BIG = 1 << 22;
  for (let k = 0; k < kinds.length; k++) {
    if (kinds[k] !== HINGE_PANEL) continue;
    const a = hinges[4 * k], b = hinges[4 * k + 1];
    smooth.set(Math.min(a, b) * BIG + Math.max(a, b), 1);
  }
  const triCorner = new Int32Array(3 * nT).fill(-1);
  /** @type {number[]} */ const src = [];
  for (let v = 0; v < nV; v++) {
    const ts = inc[v];
    const grp = new Map(ts.map((t) => [t, t]));
    const find = (/** @type {number} */ t) => { let r = t; while (grp.get(r) !== r) r = /** @type {number} */(grp.get(r)); return r; };
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) {
      const shared = sharedOther(tris, ts[i], ts[j], v);
      if (shared >= 0 && smooth.has(Math.min(v, shared) * BIG + Math.max(v, shared))) {
        const r0 = find(ts[i]), r1 = find(ts[j]);
        if (r0 !== r1) grp.set(Math.max(r0, r1), Math.min(r0, r1));
      }
    }
    /** @type {Map<number, number>} */
    const rv = new Map();
    for (const t of ts) {
      const r = find(t);
      let id = rv.get(r);
      if (id === undefined) { id = src.length; src.push(v); rv.set(r, id); }
      for (let i = 0; i < 3; i++) if (tris[3 * t + i] === v) triCorner[3 * t + i] = id;
    }
  }
  const nR = src.length;
  const ruv = new Float32Array(2 * nR), rsheet = new Int32Array(nR);
  const bbox = doc.sheets.map(() => [Infinity, Infinity, -Infinity, -Infinity]);
  for (let v = 0; v < nV; v++) { const b = bbox[vS[v]]; b[0] = Math.min(b[0], uv[2 * v]); b[1] = Math.min(b[1], uv[2 * v + 1]); b[2] = Math.max(b[2], uv[2 * v]); b[3] = Math.max(b[3], uv[2 * v + 1]); }
  for (let r = 0; r < nR; r++) {
    const v = src[r], b = bbox[vS[v]];
    ruv[2 * r] = (uv[2 * v] - b[0]) / Math.max(b[2] - b[0], 1e-12);
    ruv[2 * r + 1] = (uv[2 * v + 1] - b[1]) / Math.max(b[3] - b[1], 1e-12);
    rsheet[r] = vS[v];
  }
  const indices = Uint32Array.from(triCorner);
  void triS; void pointInPolygon;
  return { nR, src: Int32Array.from(src), uv: ruv, sheet: rsheet, indices, triCorner };
}

/** The vertex other than v shared by triangles t and u when they share an edge through v, else −1. */
function sharedOther(/** @type {Int32Array} */ T, /** @type {number} */ t, /** @type {number} */ u, /** @type {number} */ v) {
  for (let i = 0; i < 3; i++) {
    const a = T[3 * t + i];
    if (a === v) continue;
    for (let j = 0; j < 3; j++) if (T[3 * u + j] === a) return a;
  }
  return -1;
}

/**
 * Locate a sheet-local point on the mesh: the containing triangle and barycentric weights.
 * @param {Mesh} mesh @param {number} sheet @param {number} u @param {number} v
 * @returns {{tri:number, w:[number,number,number], verts:[number,number,number]}|null}
 */
export function locatePoint(mesh, sheet, u, v) {
  const { tris, triSheet, uv } = mesh;
  let best = null, bestMin = -Infinity;
  for (let t = 0; t < mesh.nT; t++) {
    if (triSheet[t] !== sheet) continue;
    const a = tris[3 * t], b = tris[3 * t + 1], c = tris[3 * t + 2];
    const x0 = uv[2 * a], y0 = uv[2 * a + 1];
    const ux = uv[2 * b] - x0, uy = uv[2 * b + 1] - y0, vx = uv[2 * c] - x0, vy = uv[2 * c + 1] - y0;
    const det = ux * vy - uy * vx;
    const px = u - x0, py = v - y0;
    const s = (px * vy - py * vx) / det, r = (ux * py - uy * px) / det;
    const w = [1 - s - r, s, r];
    const m = Math.min(w[0], w[1], w[2]);
    if (m > bestMin) { bestMin = m; best = { tri: t, w: /** @type {[number,number,number]} */(w), verts: /** @type {[number,number,number]} */([a, b, c]) }; }
  }
  if (!best || bestMin < -1e-6) return null;
  return best;
}
