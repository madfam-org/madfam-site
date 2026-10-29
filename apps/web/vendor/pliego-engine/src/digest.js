// @ts-check
/**
 * `pliego:meta.digest` verification (spec §5.7, rule 10; canonical serialisation per wave-3 lane H's
 * spec §5.15, RFC 8785 / JCS): "sha256:" + hex SHA-256 of the UTF-8 bytes JavaScript's
 * `JSON.stringify` writes for the parsed document with every object's keys sorted (UTF-16 code
 * units, the default sort) and `pliego:meta.digest` set to null.
 *
 * SHA-256 is written here from FIPS 180-4 (synchronous, zero dependencies: `loadDocument` is
 * synchronous and runs in the browser, where WebCrypto's digest is asynchronous).
 */

/**
 * Canonical JSON text (RFC 8785 for the values JSON.parse produces). Throws on lone surrogates
 * and non-finite numbers, which the canonical form does not allow.
 * @param {any} v
 * @returns {string}
 */
export function canonicalJSON(v) {
  if (v === null || typeof v === 'boolean') return JSON.stringify(v);
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new RangeError('canonical JSON: non-finite number');
    return JSON.stringify(v);
  }
  if (typeof v === 'string') {
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(v)) throw new RangeError('canonical JSON: lone surrogate in a string');
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(canonicalJSON).join(',')}]`;
  if (typeof v === 'object') {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
    return `{${keys.map((k) => `${canonicalJSON(k)}:${canonicalJSON(v[k])}`).join(',')}}`;
  }
  throw new TypeError(`canonical JSON: unsupported value of type ${typeof v}`);
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/**
 * SHA-256 of a byte array, as lower-case hex (FIPS 180-4).
 * @param {Uint8Array} msg
 */
export function sha256Hex(msg) {
  const len = msg.length, nBlocks = ((len + 9 + 63) >> 6);
  const buf = new Uint8Array(nBlocks * 64);
  buf.set(msg);
  buf[len] = 0x80;
  const bits = len * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, Math.floor(bits / 0x100000000));
  dv.setUint32(buf.length - 4, bits >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  for (let b = 0; b < nBlocks; b++) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(b * 64 + 4 * i);
    for (let i = 16; i < 64; i++) {
      const x = W[i - 15], y = W[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + bb) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i++) out += H[i].toString(16).padStart(8, '0');
  return out;
}

/**
 * The digest a document should carry: "sha256:" + SHA-256 of its canonical serialisation with
 * `pliego:meta.digest` set to null.
 * @param {any} json a parsed sheet document
 */
export function documentDigest(json) {
  const meta = json && json['pliego:meta'] && typeof json['pliego:meta'] === 'object' ? json['pliego:meta'] : {};
  const text = canonicalJSON({ ...json, 'pliego:meta': { ...meta, digest: null } });
  return `sha256:${sha256Hex(new TextEncoder().encode(text))}`;
}
