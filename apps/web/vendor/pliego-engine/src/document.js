// @ts-check
/**
 * `loadDocument(json)` — parse and validate a sheet document (spec docs/spec/v1/sheet-document.md).
 * Fails closed: every problem found is listed in one `DocumentError`; nothing half-loads.
 * Plain FOLD files (no `pliego:version`) load with the spec §7 defaults.
 */
import { BUILTIN_STOCKS, DERIVED_KEYS } from './material.js';
import { checkGeometry, checkJoinsAndFrames } from './docrules.js';
import { checkKeyedMechanisms } from './keyed.js';
import { checkJoinGates } from './gates.js';
import { documentDigest } from './digest.js';

export class DocumentError extends Error {
  /** @param {string[]} problems */
  constructor(problems) {
    super(`sheet document rejected (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n- ${problems.join('\n- ')}`);
    this.name = 'DocumentError';
    this.problems = problems;
  }
}

const ASSIGN = new Set(['B', 'M', 'V', 'F', 'U', 'C', 'J']);
const TREAT = new Set(['none', 'crease', 'score', 'perforation', 'cut', 'halfcut']);
/** spec §4 allowed assignments per treatment */
const TREAT_ALLOWED = /** @type {Record<string, string>} */ ({ none: 'BJUF', crease: 'MVF', score: 'MVF', perforation: 'MVFC', cut: 'C', halfcut: 'F' });
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL_KINDS = new Set(['angle', 'distance', 'sequence', 'wind', 'toggle']);
const MECH_TYPES = new Set(['hinge', 'slide', 'rotate', 'leaf', 'translate']);
const JOIN_TYPES = new Set(['glue', 'pivot', 'string', 'pin', 'slider']);

/** @param {any} v */ const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/** @param {any} v @param {number} n */ const isVec = (v, n) => Array.isArray(v) && v.length === n && v.every(isNum);
/** @param {any} v */ const isInt = (v) => Number.isInteger(v) && v >= 0;

/**
 * @typedef {object} Sheet
 * @property {string} id @property {number} index @property {string} stockId
 * @property {Record<string, number>} derived @property {number} grainDeg
 * @property {[number, number]} offset @property {{origin:number[], rotation:number[]}} placement
 * @property {{color:string, art:string|null}} front @property {{color:string, art:string|null}} back
 * @property {{mechanism:string}|null} kinematic @property {any} label @property {any} presentation spec §5.16 (or null)
 */

/**
 * @typedef {object} Doc
 * @property {boolean} plainFold
 * @property {number} nV @property {number} nE @property {number} nF
 * @property {Float64Array} coords layout xy
 * @property {Int32Array} edges vertex pairs
 * @property {string[]} assignment @property {Float64Array} foldAngle degrees
 * @property {string[]} treatment @property {Float64Array} restAngle degrees
 * @property {(string|null)[]|null} edgeNames optional per-edge names (spec §3)
 * @property {number[][]} faces
 * @property {Int32Array} vSheet @property {Int32Array} eSheet @property {Int32Array} fSheet
 * @property {Sheet[]} sheets @property {Map<string, number>} sheetIndex
 * @property {Record<string, any>} stocks
 * @property {any[]} joins @property {any[]} mechanisms @property {any[]} controls
 * @property {{mode:string, steps:any[]}|null} sequence
 * @property {Float64Array|null} initial 3-D coords per document vertex
 * @property {Record<string, Float64Array>} targets
 * @property {number[][]|null} faceOrders
 * @property {any} meta @property {string|null} title
 * @property {string[]} warnings
 * @property {Map<string, number>} edgeIndex "a,b" (a<b) → edge
 */

/**
 * Load and validate a sheet document (object or JSON string).
 * @param {any} input
 * @returns {Doc}
 */
export function loadDocument(input) {
  /** @type {string[]} */
  const P = [];
  let json = input;
  if (typeof input === 'string') {
    try { json = JSON.parse(input); } catch (e) { throw new DocumentError([`not valid JSON: ${/** @type {Error} */(e).message}`]); }
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new DocumentError(['document is not a JSON object']);
  const plainFold = !('pliego:version' in json);
  const doc = plainFold ? withFoldDefaults(json, P) : json;
  const out = parseCore(doc, plainFold, P);
  if (P.length) throw new DocumentError(P);
  checkGeometry(out, P);
  if (P.length) throw new DocumentError(P);
  checkJoinsAndFrames(out, P);
  if (P.length) throw new DocumentError(P);
  return out;
}

/**
 * Spec §7: a FOLD file without pliego: fields → one sheet `sheet-0`, built-in stock `kami`, grain 90°,
 * treatments from assignments, identity placement, one sequence step driving every M/V edge.
 * @param {any} f @param {string[]} P
 */
function withFoldDefaults(f, P) {
  const V = Array.isArray(f.vertices_coords) ? f.vertices_coords.length : 0;
  const E = Array.isArray(f.edges_vertices) ? f.edges_vertices.length : 0;
  const F = Array.isArray(f.faces_vertices) ? f.faces_vertices.length : 0;
  if (!F) P.push('FOLD: faces_vertices is required (the engine meshes faces)');
  const assignment = Array.isArray(f.edges_assignment) ? f.edges_assignment : new Array(E).fill('U');
  const fold = Array.isArray(f.edges_foldAngle)
    ? f.edges_foldAngle
    : assignment.map((/** @type {string} */ a) => (a === 'V' ? 180 : a === 'M' ? -180 : 0));
  const coords = Array.isArray(f.vertices_coords)
    ? f.vertices_coords.map((/** @type {number[]} */ c) => (Array.isArray(c) && c.length === 3 && Math.abs(c[2]) < 1e-9 ? [c[0], c[1]] : c))
    : [];
  const mv = [];
  for (let e = 0; e < E; e++) if (assignment[e] === 'M' || assignment[e] === 'V') mv.push([e, fold[e]]);
  const label = { en: 'Fold', es: 'Doblar', fr: 'Plier', pt: 'Dobrar' };
  return {
    ...f,
    file_spec: 1.2,
    file_creator: f.file_creator ?? 'unknown',
    frame_unit: 'mm',
    vertices_coords: coords,
    edges_assignment: assignment,
    edges_foldAngle: fold,
    'pliego:version': 1,
    'pliego:vertices_sheet': new Array(V).fill(0),
    'pliego:edges_sheet': new Array(E).fill(0),
    'pliego:faces_sheet': new Array(F).fill(0),
    'pliego:edges_treatment': assignment.map((/** @type {string} */ a) => (a === 'M' || a === 'V' ? 'crease' : a === 'C' ? 'cut' : 'none')),
    'pliego:sheets': [{
      id: 'sheet-0', label: { en: 'Sheet', es: 'Hoja', fr: 'Feuille', pt: 'Folha' }, stock: 'kami', grain_deg: 90,
      offset: [0, 0], placement: { origin: [0, 0, 0], rotation: [0, 0, 0, 1] },
      front: { color: '#f4efe6', art: null }, back: { color: '#f4efe6', art: null }, kinematic: null,
    }],
    'pliego:stocks': { kami: BUILTIN_STOCKS.kami },
    'pliego:controls': [{ id: 'sequence', kind: 'sequence', label: { en: 'Step', es: 'Paso', fr: 'Étape', pt: 'Passo' }, min: 0, max: 1, default: 0 }],
    'pliego:sequence': mv.length ? { mode: 'physical', steps: [{ id: 'fold', label, duration_ms: 1500, targets: mv, release: [], note: null }] } : undefined,
    'pliego:meta': { kernel: 'none (plain FOLD)', digest: null },
  };
}

/** @param {any} d @param {boolean} plainFold @param {string[]} P @returns {Doc} */
function parseCore(d, plainFold, P) {
  if (!plainFold) {
    if (d.file_spec !== 1.2) P.push('file_spec must be 1.2');
    if (typeof d.file_creator !== 'string' || !d.file_creator) P.push('file_creator is required');
    if (d.frame_unit !== 'mm') P.push('frame_unit must be "mm"');
    if (d['pliego:version'] !== 1) P.push('pliego:version must be 1');
    for (const k of ['file_classes', 'frame_classes', 'frame_attributes']) if (!Array.isArray(d[k])) P.push(`${k} is required`);
    if (!d['pliego:meta'] || typeof d['pliego:meta'].kernel !== 'string') P.push('pliego:meta.kernel is required');
  }
  const vc = Array.isArray(d.vertices_coords) ? d.vertices_coords : (P.push('vertices_coords is required'), []);
  const ev = Array.isArray(d.edges_vertices) ? d.edges_vertices : (P.push('edges_vertices is required'), []);
  const fv = Array.isArray(d.faces_vertices) ? d.faces_vertices : (P.push('faces_vertices is required'), []);
  const nV = vc.length, nE = ev.length, nF = fv.length;
  const coords = new Float64Array(2 * nV);
  vc.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
    if (!isVec(c, 2)) P.push(`rule 1: vertices_coords[${i}] is not a 2-D point`);
    else { coords[2 * i] = c[0]; coords[2 * i + 1] = c[1]; }
  });
  const edges = new Int32Array(2 * nE);
  /** @type {Map<string, number>} */
  const edgeIndex = new Map();
  ev.forEach((/** @type {any} */ e, /** @type {number} */ i) => {
    if (!Array.isArray(e) || e.length !== 2 || !isInt(e[0]) || !isInt(e[1]) || e[0] >= nV || e[1] >= nV || e[0] === e[1]) {
      P.push(`rule 1: edges_vertices[${i}] is not a pair of distinct vertex indices in range`);
      return;
    }
    edges[2 * i] = e[0]; edges[2 * i + 1] = e[1];
    const key = e[0] < e[1] ? `${e[0]},${e[1]}` : `${e[1]},${e[0]}`;
    if (edgeIndex.has(key)) P.push(`rule 1: edges ${edgeIndex.get(key)} and ${i} join the same vertices`);
    else edgeIndex.set(key, i);
  });
  const assignment = arr(d.edges_assignment, nE, 'edges_assignment', P);
  assignment.forEach((a, i) => { if (!ASSIGN.has(a)) P.push(`rule 1: edges_assignment[${i}] = ${JSON.stringify(a)} is not one of B M V F U C J`); });
  const foldAngle = numArr(d.edges_foldAngle, nE, 'edges_foldAngle', P, -180, 180);
  const faces = [];
  for (let f = 0; f < nF; f++) {
    const face = fv[f];
    if (!Array.isArray(face) || face.length < 3 || !face.every((/** @type {any} */ v) => isInt(v) && v < nV)) {
      P.push(`rule 1: faces_vertices[${f}] must list ≥ 3 vertex indices in range`);
      faces.push([]);
    } else faces.push(face.slice());
  }
  const vSheet = Int32Array.from(arr(d['pliego:vertices_sheet'], nV, 'pliego:vertices_sheet', P));
  const eSheet = Int32Array.from(arr(d['pliego:edges_sheet'], nE, 'pliego:edges_sheet', P));
  const fSheet = Int32Array.from(arr(d['pliego:faces_sheet'], nF, 'pliego:faces_sheet', P));
  const treatment = arr(d['pliego:edges_treatment'], nE, 'pliego:edges_treatment', P);
  treatment.forEach((t, i) => { if (!TREAT.has(t)) P.push(`rule 1: pliego:edges_treatment[${i}] = ${JSON.stringify(t)} is not a treatment`); });
  const names = d['pliego:edges_name'] === undefined ? null : arr(d['pliego:edges_name'], nE, 'pliego:edges_name', P);
  if (names) names.forEach((n, i) => { if (n !== null && (typeof n !== 'string' || !SLUG.test(n))) P.push(`pliego:edges_name[${i}] must be kebab case or null`); });
  const restAngle = d['pliego:edges_restAngle'] === undefined ? new Float64Array(nE) : numArr(d['pliego:edges_restAngle'], nE, 'pliego:edges_restAngle', P, -180, 180);

  // stocks (rule 6)
  const stocks = d['pliego:stocks'];
  if (!stocks || typeof stocks !== 'object' || Array.isArray(stocks) || !Object.keys(stocks).length) P.push('rule 6: pliego:stocks must be a non-empty object');
  else {
    for (const id of Object.keys(stocks)) {
      const s = stocks[id];
      if (!SLUG.test(id)) P.push(`rule 6: stock id ${JSON.stringify(id)} is not kebab case`);
      const der = s && s.derived;
      if (!der || typeof der !== 'object') { P.push(`rule 6: stock ${id} has no derived block`); continue; }
      for (const k of ['G12', 'score_yield_deg', 'perf_cut_mm', 'perf_bridge_mm', 'D12', 'D66']) {
        if (der[k] !== undefined && !(isNum(der[k]) && der[k] > 0)) P.push(`rule 6: stock ${id} derived.${k} (optional) must be a positive number`);
      }
      for (const k of DERIVED_KEYS) {
        if (!isNum(der[k])) P.push(`rule 6: stock ${id} derived.${k} missing or not a number`);
        else if (der[k] < 0 || (der[k] === 0 && !['crease_set_rate', 'friction', 'nu', 'crease_yield_deg'].includes(k))) P.push(`rule 6: stock ${id} derived.${k} = ${der[k]} must be positive`);
      }
    }
  }
  // sheets
  const sheetsIn = Array.isArray(d['pliego:sheets']) ? d['pliego:sheets'] : (P.push('pliego:sheets is required'), []);
  /** @type {Map<string, number>} */
  const sheetIndex = new Map();
  /** @type {Sheet[]} */
  const sheets = [];
  sheetsIn.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    const where = `pliego:sheets[${i}]`;
    if (!s || typeof s !== 'object') { P.push(`${where} is not an object`); return; }
    if (typeof s.id !== 'string' || !SLUG.test(s.id)) P.push(`${where}.id must be kebab case`);
    else if (sheetIndex.has(s.id)) P.push(`${where}.id ${s.id} is not unique`);
    else sheetIndex.set(s.id, i);
    if (!s.label || typeof s.label.en !== 'string') P.push(`${where}.label.en is required`);
    const stockOk = stocks && typeof s.stock === 'string' && Object.prototype.hasOwnProperty.call(stocks, s.stock);
    if (!stockOk) P.push(`rule 6: ${where}.stock ${JSON.stringify(s.stock)} does not resolve`);
    if (!isNum(s.grain_deg)) P.push(`${where}.grain_deg must be a number`);
    if (!isVec(s.offset, 2)) P.push(`${where}.offset must be [x, y]`);
    const pl = s.placement;
    let rotation = [0, 0, 0, 1];
    if (!pl || !isVec(pl.origin, 3) || !isVec(pl.rotation, 4)) P.push(`${where}.placement must have origin [x,y,z] and rotation [x,y,z,w]`);
    else {
      const qn = Math.hypot(...pl.rotation);
      if (qn < 1e-9) P.push(`${where}.placement.rotation is a zero quaternion`);
      else rotation = pl.rotation.map((/** @type {number} */ q) => q / qn);
    }
    for (const side of ['front', 'back']) if (!s[side] || typeof s[side].color !== 'string') P.push(`${where}.${side}.color is required`);
    const kin = s.kinematic ?? null;
    if (kin !== null && (typeof kin !== 'object' || typeof kin.mechanism !== 'string')) P.push(`${where}.kinematic must be null or {mechanism}`);
    sheets.push({
      id: s.id, index: i, stockId: s.stock, derived: stockOk ? stocks[s.stock].derived : {},
      grainDeg: isNum(s.grain_deg) ? s.grain_deg : 90,
      offset: isVec(s.offset, 2) ? [s.offset[0], s.offset[1]] : [0, 0],
      placement: { origin: pl && isVec(pl.origin, 3) ? pl.origin.slice() : [0, 0, 0], rotation },
      front: s.front ?? { color: '#ffffff', art: null }, back: s.back ?? { color: '#ffffff', art: null },
      kinematic: kin, label: s.label, presentation: s.presentation ?? null,
    });
    // rule 17 (§5.16): presentation has only root_face (a face of this sheet, checked below) and end
    if (s.presentation !== undefined && s.presentation !== null) {
      const pr = s.presentation;
      if (typeof pr !== 'object' || Object.keys(pr).some((k) => k !== 'root_face' && k !== 'end')) P.push(`rule 17: ${where}.presentation has only root_face and end`);
      else {
        if (pr.root_face !== undefined && !(isInt(pr.root_face) && pr.root_face < nF && fSheet[pr.root_face] === i)) P.push(`rule 17: ${where}.presentation.root_face ${JSON.stringify(pr.root_face)} is not a face of this sheet`);
        if (pr.end !== undefined && !(pr.end && isVec(pr.end.origin, 3) && isVec(pr.end.rotation, 4) && Math.abs(Math.hypot(...pr.end.rotation) - 1) < 1e-6)) P.push(`rule 17: ${where}.presentation.end needs a finite origin and a unit quaternion rotation`);
      }
    }
  });
  if (!sheets.length && !P.length) P.push('pliego:sheets must not be empty');
  const nS = sheets.length;
  vSheet.forEach((s, i) => { if (s >= nS || s < 0) P.push(`rule 1: pliego:vertices_sheet[${i}] = ${s} out of range`); });
  eSheet.forEach((s, i) => { if (s >= nS || s < 0) P.push(`rule 1: pliego:edges_sheet[${i}] = ${s} out of range`); });
  fSheet.forEach((s, i) => { if (s >= nS || s < 0) P.push(`rule 1: pliego:faces_sheet[${i}] = ${s} out of range`); });

  const frames = Array.isArray(d.file_frames) ? d.file_frames : [];
  /** @type {Float64Array|null} */
  let initial = null;
  /** @type {Record<string, Float64Array>} */
  const targets = {};
  frames.forEach((/** @type {any} */ fr, /** @type {number} */ i) => {
    if (!fr || typeof fr.frame_title !== 'string' || !Array.isArray(fr.vertices_coords)) { P.push(`file_frames[${i}] needs frame_title and vertices_coords`); return; }
    if (fr.vertices_coords.length !== nV) { P.push(`rule 1: file_frames[${i}] (${fr.frame_title}) has ${fr.vertices_coords.length} vertices, expected ${nV}`); return; }
    const X = new Float64Array(3 * nV);
    let ok = true;
    fr.vertices_coords.forEach((/** @type {any} */ c, /** @type {number} */ v) => {
      if (!isVec(c, 3)) ok = false; else { X[3 * v] = c[0]; X[3 * v + 1] = c[1]; X[3 * v + 2] = c[2]; }
    });
    if (!ok) { P.push(`file_frames[${i}] (${fr.frame_title}) vertices must be 3-D points`); return; }
    if (fr.frame_title === 'initial') { if (initial) P.push('file_frames: more than one "initial" frame'); initial = X; }
    else if (/^target:[a-z0-9-]+$/.test(fr.frame_title)) targets[fr.frame_title.slice(7)] = X;
    else P.push(`file_frames[${i}].frame_title ${JSON.stringify(fr.frame_title)} is not "initial" or "target:<name>"`);
  });

  const joins = Array.isArray(d['pliego:joins']) ? d['pliego:joins'] : (d['pliego:joins'] === undefined ? [] : (P.push('pliego:joins must be an array'), []));
  const mechanisms = Array.isArray(d['pliego:mechanisms']) ? d['pliego:mechanisms'] : (d['pliego:mechanisms'] === undefined ? [] : (P.push('pliego:mechanisms must be an array'), []));
  const controls = Array.isArray(d['pliego:controls']) ? d['pliego:controls'] : (d['pliego:controls'] === undefined ? [] : (P.push('pliego:controls must be an array'), []));
  const seq = d['pliego:sequence'] ?? null;
  checkRefs({ joins, mechanisms, controls, seq, sheets, sheetIndex, assignment, nE }, P);
  if (d['pliego:meta'] && d['pliego:meta'].min_feature_mm !== undefined && !(isNum(d['pliego:meta'].min_feature_mm) && d['pliego:meta'].min_feature_mm > 0)) P.push('pliego:meta.min_feature_mm must be a number > 0');
  if (d['pliego:meta'] && d['pliego:meta'].digest != null) {
    if (!/^sha256:[0-9a-f]{64}$/.test(d['pliego:meta'].digest)) P.push('rule 10: pliego:meta.digest must be "sha256:<64 hex>" or null');
    else if (!plainFold) {
      // rule 10: recompute over the canonical serialisation (spec §5.15, RFC 8785) with digest null
      let got = null;
      try { got = documentDigest(d); } catch (e) { P.push(`rule 10: the document has no canonical serialisation (${/** @type {Error} */(e).message})`); }
      if (got && got !== d['pliego:meta'].digest) P.push(`rule 10: pliego:meta.digest ${d['pliego:meta'].digest} does not match the document (canonical digest ${got})`);
    }
  }

  return {
    plainFold, nV, nE, nF, coords, edges, assignment, foldAngle, treatment, restAngle, faces, edgeNames: names,
    vSheet, eSheet, fSheet, sheets, sheetIndex, stocks: stocks ?? {}, joins, mechanisms, controls,
    sequence: seq, initial, targets,
    faceOrders: Array.isArray(d.faceOrders) ? d.faceOrders : null,
    meta: d['pliego:meta'] ?? null, title: typeof d.file_title === 'string' ? d.file_title : null,
    warnings: [], edgeIndex,
  };
}

/** @param {any} a @param {number} n @param {string} name @param {string[]} P @returns {any[]} */
function arr(a, n, name, P) {
  if (!Array.isArray(a)) { P.push(`${name} is required`); return new Array(n).fill(0); }
  if (a.length !== n) P.push(`rule 1: ${name} has length ${a.length}, expected ${n}`);
  return a.length === n ? a : new Array(n).fill(0);
}

/** @param {any} a @param {number} n @param {string} name @param {string[]} P @param {number} lo @param {number} hi */
function numArr(a, n, name, P, lo, hi) {
  const v = arr(a, n, name, P);
  const out = new Float64Array(n);
  v.forEach((x, i) => {
    if (!isNum(x) || x < lo || x > hi) P.push(`rule 1: ${name}[${i}] = ${x} must be a number in [${lo}, ${hi}]`);
    else out[i] = x;
  });
  return out;
}

/**
 * Rule 7/8 references (structure only; geometry of points is checked in docrules).
 * @param {{joins:any[], mechanisms:any[], controls:any[], seq:any, sheets:Sheet[], sheetIndex:Map<string,number>, assignment:string[], nE:number}} c
 * @param {string[]} P
 */
function checkRefs(c, P) {
  const { joins, mechanisms, controls, seq, sheets, sheetIndex, assignment, nE } = c;
  /** @type {Map<string, any>} */
  const ctrl = new Map();
  controls.forEach((k, i) => {
    if (!k || typeof k.id !== 'string' || !SLUG.test(k.id)) { P.push(`pliego:controls[${i}].id must be kebab case`); return; }
    if (ctrl.has(k.id)) P.push(`pliego:controls[${i}].id ${k.id} is not unique`);
    ctrl.set(k.id, k);
    if (!CONTROL_KINDS.has(k.kind)) P.push(`pliego:controls[${i}].kind ${JSON.stringify(k.kind)} is not a control kind`);
    if (!k.label || typeof k.label.en !== 'string') P.push(`pliego:controls[${i}].label.en is required`);
    if (k.default === undefined || (typeof k.default !== 'number' && typeof k.default !== 'boolean')) P.push(`pliego:controls[${i}].default is required`);
    if (isNum(k.min) && isNum(k.max) && k.min > k.max) P.push(`pliego:controls[${i}] min > max`);
  });
  /** @type {Map<string, any>} */
  const mech = new Map();
  const needCtrl = (/** @type {string} */ id, /** @type {string} */ where, /** @type {string[]} */ kinds) => {
    const k = ctrl.get(id);
    if (!k) P.push(`rule 7: ${where} control ${JSON.stringify(id)} is not declared in pliego:controls`);
    else if (!kinds.includes(k.kind)) P.push(`rule 7: ${where} control ${id} has kind ${k.kind}, expected ${kinds.join('|')}`);
  };
  const needSheet = (/** @type {any} */ id, /** @type {string} */ where) => {
    if (typeof id !== 'string' || !sheetIndex.has(id)) { P.push(`rule 7: ${where} sheet ${JSON.stringify(id)} does not resolve`); return null; }
    return sheets[/** @type {number} */(sheetIndex.get(id))];
  };
  mechanisms.forEach((m, i) => {
    const w = `pliego:mechanisms[${i}]`;
    if (!m || typeof m.id !== 'string' || !SLUG.test(m.id)) { P.push(`${w}.id must be kebab case`); return; }
    if (mech.has(m.id)) P.push(`${w}.id ${m.id} is not unique`);
    mech.set(m.id, m);
    if (!MECH_TYPES.has(m.type)) { P.push(`${w}.type ${JSON.stringify(m.type)} is not a mechanism type`); return; }
    if (m.type === 'hinge') {
      if (!m.axis || !isVec(m.axis.origin, 3) || !isVec(m.axis.direction, 3) || Math.hypot(...m.axis.direction) < 1e-12) P.push(`${w}.axis needs origin and a non-zero direction`);
      needCtrl(m.angle_control, w, ['angle']);
      if (!isNum(m.rest)) P.push(`${w}.rest must be a number`);
    }
    if (m.type === 'slide') { needCtrl(m.control, w, ['distance', 'angle']); if (!isNum(m.travel) || m.travel <= 0) P.push(`${w}.travel must be > 0`); }
    if (m.type === 'translate') {
      needCtrl(m.control, w, ['distance', 'angle']);
      if (!isVec(m.direction, 3) || Math.hypot(...m.direction) < 1e-12) P.push(`${w}.direction must be a non-zero [x,y,z]`);
      if (!isNum(m.travel) || m.travel <= 0) P.push(`${w}.travel must be > 0`);
    }
    if (m.type === 'rotate') { needCtrl(m.control, w, ['angle']); if (!m.center) P.push(`${w}.center is required`); else needSheet(m.center.sheet, `${w}.center`); }
    if (m.type === 'leaf') {
      needCtrl(m.control, w, ['angle']);
      const s = needSheet(m.sheet, w);
      if (s && s.kinematic) P.push(`${w}.sheet ${s.id} must be a physical (non-kinematic) sheet`);
      if (!Array.isArray(m.spine) || m.spine.length !== 2 || !m.spine.every((/** @type {any} */ p) => isVec(p, 2))) P.push(`${w}.spine must be two [u,v] points`);
    }
    if (m.type === 'hinge' || m.type === 'rotate' || (m.type === 'translate' && m.sheets_moving !== undefined)) {
      if (!Array.isArray(m.sheets_moving) || (m.type !== 'translate' && !m.sheets_moving.length)) P.push(`${w}.sheets_moving must list sheets`);
      else for (const sid of m.sheets_moving) {
        const s = needSheet(sid, `${w}.sheets_moving`);
        if (s && (!s.kinematic || s.kinematic.mechanism !== m.id)) P.push(`rule 7: ${w} moves sheet ${sid}, which is not kinematic on mechanism ${m.id}`);
      }
    }
  });
  checkKeyedMechanisms(mechanisms, P); // spec §5.18, rule 19
  for (const s of sheets) {
    if (!s.kinematic) continue;
    const m = mech.get(s.kinematic.mechanism);
    if (!m) P.push(`rule 7: sheet ${s.id} is kinematic on mechanism ${JSON.stringify(s.kinematic.mechanism)}, which does not exist`);
    // a kinematic sheet that its mechanism does not list in sheets_moving is a fixed board (§5.1)
  }
  const jids = new Set();
  joins.forEach((j, i) => {
    const w = `pliego:joins[${i}]`;
    if (!j || typeof j.id !== 'string' || !SLUG.test(j.id)) { P.push(`${w}.id must be kebab case`); return; }
    if (jids.has(j.id)) P.push(`${w}.id ${j.id} is not unique`);
    jids.add(j.id);
    if (!JOIN_TYPES.has(j.type)) { P.push(`${w}.type ${JSON.stringify(j.type)} is not a join type`); return; }
    const pt = (/** @type {any} */ p, /** @type {string} */ ww) => { if (!p || !needSheet(p.sheet, ww)) return; if (!isVec(p.at, 2)) P.push(`${ww}.at must be [u, v]`); };
    if (j.type === 'glue') {
      if (!j.a || !needSheet(j.a.sheet, `${w}.a`) || !Array.isArray(j.a.region) || j.a.region.length < 3 || !j.a.region.every((/** @type {any} */ p) => isVec(p, 2))) P.push(`${w}.a needs sheet and a region of ≥ 3 [u,v] points`);
      if (!j.b || !needSheet(j.b.sheet, `${w}.b`)) P.push(`${w}.b.sheet is required`);
      if (!isVec(j.map, 6)) P.push(`${w}.map must be [a, b, c, d, tx, ty]`);
      if (j.side !== 'front' && j.side !== 'back') P.push(`${w}.side must be front|back`);
    }
    if (j.type === 'pivot') { pt(j.a, `${w}.a`); pt(j.b, `${w}.b`); }
    if (j.type === 'string') {
      pt(j.a, `${w}.a`);
      if (j.b && j.b.world !== undefined) { if (!isVec(j.b.world, 3)) P.push(`${w}.b.world must be [x,y,z]`); } else pt(j.b, `${w}.b`);
      if (!isNum(j.length) || j.length <= 0) P.push(`${w}.length must be > 0`);
    }
    if (j.type === 'pin') {
      if (!j.a || !needSheet(j.a.sheet, `${w}.a`)) P.push(`${w}.a.sheet is required`);
      else if (j.a.along !== undefined) { if (!Array.isArray(j.a.along) || j.a.along.length !== 2 || !j.a.along.every((/** @type {any} */ p) => isVec(p, 2))) P.push(`${w}.a.along must be two [u,v] points`); }
      else if (!isVec(j.a.at, 2)) P.push(`${w}.a needs at or along`);
      if (j.world !== null && !isVec(j.world, 3)) P.push(`${w}.world must be [x,y,z] or null`);
      if (j.mechanism !== undefined) { const m = mech.get(j.mechanism); if (!m || m.type !== 'translate') P.push(`rule 7: ${w}.mechanism ${JSON.stringify(j.mechanism)} is not a translate mechanism`); }
    }
    if (j.type === 'slider') {
      pt(j.a, `${w}.a`);
      if (!j.track || !needSheet(j.track.sheet, `${w}.track`) || !isVec(j.track.from, 2) || !isVec(j.track.to, 2)) P.push(`${w}.track needs sheet, from, to`);
      if (j.mechanism !== undefined) { const m = mech.get(j.mechanism); if (!m || m.type !== 'slide') P.push(`rule 7: ${w}.mechanism ${JSON.stringify(j.mechanism)} is not a slide mechanism`); }
    }
  });
  checkJoinGates(joins, seq, P); // spec §5.19–§5.20, rules 20–21
  if (seq !== null) {
    if (typeof seq !== 'object' || (seq.mode !== 'physical' && seq.mode !== 'kinematic')) P.push('pliego:sequence.mode must be physical|kinematic');
    if (!Array.isArray(seq.steps) || !seq.steps.length) P.push('pliego:sequence.steps must be a non-empty array');
    else {
      if (![...ctrl.values()].some((k) => k.kind === 'sequence')) P.push('rule 7: a sequence exists but no control of kind "sequence" is declared');
      const sids = new Set();
      seq.steps.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
        const w = `pliego:sequence.steps[${i}]`;
        if (!st || typeof st.id !== 'string' || !SLUG.test(st.id)) P.push(`${w}.id must be kebab case`);
        else if (sids.has(st.id)) P.push(`${w}.id ${st.id} is not unique`); else sids.add(st.id);
        if (!Number.isInteger(st.duration_ms) || st.duration_ms < 100 || st.duration_ms > 60000) P.push(`${w}.duration_ms must be an integer in [100, 60000]`);
        if (!Array.isArray(st.targets)) P.push(`${w}.targets must be an array`);
        else st.targets.forEach((/** @type {any} */ t, /** @type {number} */ k) => {
          if (!Array.isArray(t) || t.length !== 2 || !isInt(t[0]) || t[0] >= nE) { P.push(`rule 8: ${w}.targets[${k}] edge index out of range`); return; }
          if (!'MVF'.includes(assignment[t[0]])) P.push(`rule 8: ${w}.targets[${k}] edge ${t[0]} is ${assignment[t[0]]}, not M/V/F`);
          if (!isNum(t[1]) || t[1] < -180 || t[1] > 180) P.push(`rule 8: ${w}.targets[${k}] angle ${t[1]} not in [−180, 180]`);
        });
        if (st.release !== undefined) {
          if (!Array.isArray(st.release)) P.push(`${w}.release must be an array`);
          else st.release.forEach((/** @type {any} */ e) => {
            if (!isInt(e) || e >= nE) P.push(`rule 8: ${w}.release edge ${e} out of range`);
            else if (!'MVF'.includes(assignment[e])) P.push(`rule 8: ${w}.release edge ${e} is ${assignment[e]}, not M/V/F`);
          });
        }
      });
    }
  }
}
