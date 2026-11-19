/* QR-Code-Erzeuger (Byte-Modus, Fehlerkorrektur M, Versionen 1–10) für die Abschlussfolie im Beamerfenster.
 * Nach ISO/IEC 18004 (Aufbau wie die bekannte Referenzimplementierung von Project Nayuki, MIT-Lizenz, hier neu und gekürzt geschrieben).
 * QR.matrix(text[, maske]) → { groesse, dunkel(x, y) }   ·   QR.svg(text, farbe, rand) → SVG-Text */
(function (global) {
  'use strict';
  const EC_JE_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];   // Fehlerkorrektur M
  const BLOECKE = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

  function rohModule(v) {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  const datenBytes = (v) => Math.floor(rohModule(v) / 8) - EC_JE_BLOCK[v] * BLOECKE[v];

  function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; }
  function teiler(grad) {
    const r = new Array(grad).fill(0); r[grad - 1] = 1;
    let wurzel = 1;
    for (let i = 0; i < grad; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = mul(r[j], wurzel); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      wurzel = mul(wurzel, 0x02);
    }
    return r;
  }
  function rest(daten, t) {
    const r = t.map(() => 0);
    for (const b of daten) { const f = b ^ r.shift(); r.push(0); t.forEach((c, i) => { r[i] ^= mul(c, f); }); }
    return r;
  }

  function utf8(text) { return Array.from(new TextEncoder().encode(text)); }

  function matrix(text, maskeVorgabe) {
    const bytes = utf8(text);
    let v = 1;
    for (; v <= 10; v++) if (4 + (v < 10 ? 8 : 16) + 8 * bytes.length <= datenBytes(v) * 8) break;
    if (v > 10) throw new Error('Text zu lang für den QR-Code');
    const groesse = v * 4 + 17;
    // Bitfolge
    const bits = [];
    const schreib = (wert, n) => { for (let i = n - 1; i >= 0; i--) bits.push((wert >>> i) & 1); };
    schreib(4, 4); schreib(bytes.length, v < 10 ? 8 : 16);
    for (const b of bytes) schreib(b, 8);
    const kap = datenBytes(v) * 8;
    schreib(0, Math.min(4, kap - bits.length));
    schreib(0, (8 - bits.length % 8) % 8);
    for (let p = 0xec; bits.length < kap; p ^= 0xec ^ 0x11) schreib(p, 8);
    const daten = [];
    for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; daten.push(b); }
    // Blöcke mit Fehlerkorrektur, verschränkt
    const nb = BLOECKE[v], ecl = EC_JE_BLOCK[v], roh = Math.floor(rohModule(v) / 8);
    const kurz = nb - roh % nb, kurzLaenge = Math.floor(roh / nb);
    const t = teiler(ecl), bl = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = daten.slice(k, k + kurzLaenge - ecl + (i < kurz ? 0 : 1));
      k += d.length;
      const e = rest(d, t);
      if (i < kurz) d.push(0);
      bl.push(d.concat(e));
    }
    const folge = [];
    for (let i = 0; i < bl[0].length; i++) bl.forEach((b, j) => { if (i !== kurzLaenge - ecl || j >= kurz) folge.push(b[i]); });

    // Module
    const M = Array.from({ length: groesse }, () => new Array(groesse).fill(false));
    const F = Array.from({ length: groesse }, () => new Array(groesse).fill(false));
    const fest = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < groesse; i++) { fest(6, i, i % 2 === 0); fest(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < groesse && y >= 0 && y < groesse) fest(x, y, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(groesse - 4, 3); finder(3, groesse - 4);
    if (v >= 2) {
      const n = Math.floor(v / 7) + 2, schritt = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
      const pos = [6];
      for (let p = groesse - 7; pos.length < n; p -= schritt) pos.splice(1, 0, p);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fest(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    const formatBits = (maske) => {
      const d = (0 << 3) | maske;          // M = 0
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      const bit = (i) => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) fest(8, i, bit(i));
      fest(8, 7, bit(6)); fest(8, 8, bit(7)); fest(7, 8, bit(8));
      for (let i = 9; i < 15; i++) fest(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) fest(groesse - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) fest(8, groesse - 15 + i, bit(i));
      fest(8, groesse - 8, true);
    };
    formatBits(0);
    if (v >= 7) {
      let r = v;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (v << 12) | r;
      for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) !== 0, a = groesse - 11 + i % 3, c = Math.floor(i / 3); fest(a, c, d); fest(c, a, d); }
    }
    // Daten im Zickzack
    let i = 0;
    for (let rechts = groesse - 1; rechts >= 1; rechts -= 2) {
      if (rechts === 6) rechts = 5;
      for (let vert = 0; vert < groesse; vert++) for (let j = 0; j < 2; j++) {
        const x = rechts - j, auf = ((rechts + 1) & 2) === 0, y = auf ? groesse - 1 - vert : vert;
        if (!F[y][x] && i < folge.length * 8) { M[y][x] = ((folge[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const maskiere = (m) => {
      for (let y = 0; y < groesse; y++) for (let x = 0; x < groesse; x++) {
        if (F[y][x]) continue;
        let inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: inv = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + (x * y) % 3) % 2 === 0;
        }
        if (inv) M[y][x] = !M[y][x];
      }
    };
    const strafe = () => {
      let s = 0;
      const verlauf = (lauf, h) => { if (h[0] === 0) lauf += groesse; h.pop(); h.unshift(lauf); };
      const zaehle = (h) => { const n = h[1], kern = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n; return (kern && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (kern && h[6] >= n * 4 && h[0] >= n ? 1 : 0); };
      const ende = (farbe, lauf, h) => { if (farbe) { verlauf(lauf, h); lauf = 0; } lauf += groesse; verlauf(lauf, h); return zaehle(h); };
      for (const zeilen of [true, false]) {
        for (let a = 0; a < groesse; a++) {
          let farbe = false, lauf = 0; const h = [0, 0, 0, 0, 0, 0, 0];
          for (let b = 0; b < groesse; b++) {
            const m = zeilen ? M[a][b] : M[b][a];
            if (m === farbe) { lauf++; if (lauf === 5) s += 3; else if (lauf > 5) s++; }
            else { verlauf(lauf, h); if (!farbe) s += zaehle(h) * 40; farbe = m; lauf = 1; }
          }
          s += ende(farbe, lauf, h) * 40;
        }
      }
      for (let y = 0; y < groesse - 1; y++) for (let x = 0; x < groesse - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) s += 3; }
      let dunkel = 0; for (const z of M) for (const c of z) if (c) dunkel++;
      const ges = groesse * groesse;
      s += (Math.ceil(Math.abs(dunkel * 20 - ges * 10) / ges) - 1) * 10;
      return s;
    };
    let maske = maskeVorgabe;
    if (maske == null) {
      let best = Infinity;
      for (let m = 0; m < 8; m++) { maskiere(m); formatBits(m); const s = strafe(); if (s < best) { best = s; maske = m; } maskiere(m); }
    }
    maskiere(maske); formatBits(maske);
    return { groesse, version: v, maske, dunkel: (x, y) => M[y][x], zeilen: M.map((z) => z.map((c) => (c ? 1 : 0)).join('')) };
  }

  function svg(text, farbe = '#0b1220', rand = 4) {
    const q = matrix(text), n = q.groesse + 2 * rand;
    let pfad = '';
    for (let y = 0; y < q.groesse; y++) for (let x = 0; x < q.groesse; x++) if (q.dunkel(x, y)) pfad += `M${x + rand} ${y + rand}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#ffffff"/><path d="${pfad}" fill="${farbe}"/></svg>`;
  }

  const QR = { matrix, svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = QR; else global.QR = QR;
})(typeof window !== 'undefined' ? window : globalThis);
