/* START IT SMART – Stadt-Konfigurator: LESER UND PRÜFUNG für die erzeugte .mcworld.
 *
 * Liest die Datei so, wie Minecraft sie liest: ZIP → level.dat (NBT) → LevelDB-Protokoll → Subchunks (Paletten).
 * pruefeExport() prüft die tatsächlich erzeugte Datei, bevor sie angeboten wird: Startpunkt draußen und frei,
 * Spielmodus, jede Baufläche Block für Block wie beschlossen. Gleicher Leser wie in test.html.
 */
import * as W from '../minecraft/welt.js';
import { crcMaskiert, crc32 } from '../minecraft/mcworld.js';
import { BEREICHE, BEREICH_IDS, BEREICH_MC, vorlage, boxVon } from './stadtmodell.js';
import { START } from './minecraft-ausgabe.js';

const dec = new TextDecoder();
const dv = (a) => new DataView(a.buffer, a.byteOffset, a.byteLength);
export const PFLICHT = ['level.dat', 'levelname.txt', 'db/CURRENT', 'db/MANIFEST-000001', 'db/000002.log'];

export async function unzip(z) {
  const d = dv(z); let e = z.length - 22; while (d.getUint32(e, true) !== 0x06054b50) e--;
  const n = d.getUint16(e + 10, true); let o = d.getUint32(e + 16, true); const out = {}, crcFehler = [];
  for (let k = 0; k < n; k++) {
    const meth = d.getUint16(o + 10, true), crc = d.getUint32(o + 16, true), cs = d.getUint32(o + 20, true), nl = d.getUint16(o + 28, true), xl = d.getUint16(o + 30, true), cl = d.getUint16(o + 32, true), lo = d.getUint32(o + 42, true);
    const name = dec.decode(z.subarray(o + 46, o + 46 + nl));
    const lnl = d.getUint16(lo + 26, true), lxl = d.getUint16(lo + 28, true), roh = z.subarray(lo + 30 + lnl + lxl, lo + 30 + lnl + lxl + cs);
    const daten = meth === 0 ? roh : new Uint8Array(await new Response(new Blob([roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    if (crc32(daten) !== crc) crcFehler.push(name);
    out[name] = daten; o += 46 + nl + xl + cl;
  }
  return { dateien: out, crcFehler };
}
export function leseLog(a) {
  const records = [], fehler = []; let o = 0, teil = [];
  while (o + 7 <= a.length) {
    const rest = 32768 - (o % 32768); if (rest < 7) { o += rest; continue; }
    const d = dv(a), crc = d.getUint32(o, true), len = d.getUint16(o + 4, true), typ = a[o + 6], daten = a.subarray(o + 7, o + 7 + len);
    if (len === 0 && typ === 0) break;
    if (crcMaskiert(typ, daten) !== crc) fehler.push(`CRC bei ${o}`);
    if (typ === 1) records.push(daten); else if (typ === 2) teil = [daten]; else if (typ === 3) teil.push(daten);
    else if (typ === 4) { teil.push(daten); const n = teil.reduce((s, t) => s + t.length, 0), g = new Uint8Array(n); let p = 0; for (const t of teil) { g.set(t, p); p += t.length; } records.push(g); }
    o += 7 + len;
  }
  return { records, fehler };
}
const varint = (a, o) => { let v = 0, s = 0, b; do { b = a[o++]; v |= (b & 127) << s; s += 7; } while (b & 128); return [v >>> 0, o]; };
export function leseBatch(a) {
  const d = dv(a), anzahl = d.getUint32(8, true), m = new Map(); let o = 12;
  for (let k = 0; k < anzahl; k++) {
    const typ = a[o++]; let kl, vl; [kl, o] = varint(a, o); const key = a.slice(o, o + kl); o += kl;
    [vl, o] = varint(a, o); const val = a.subarray(o, o + vl); o += vl;
    if (typ === 1) m.set(Array.from(key).join(','), { key, val });
  }
  return { m, anzahl, rest: a.length - o };
}
export function leseNbt(a, o = 0) {
  const d = dv(a);
  const str = () => { const n = d.getUint16(o, true); o += 2; const s = dec.decode(a.subarray(o, o + n)); o += n; return s; };
  const wert = (t) => {
    switch (t) {
      case 1: return d.getInt8(o++);
      case 2: { const v = d.getInt16(o, true); o += 2; return v; }
      case 3: { const v = d.getInt32(o, true); o += 4; return v; }
      case 4: { const v = d.getBigInt64(o, true); o += 8; return v; }
      case 5: { const v = d.getFloat32(o, true); o += 4; return v; }
      case 6: { const v = d.getFloat64(o, true); o += 8; return v; }
      case 8: return str();
      case 9: { const et = a[o++], n = d.getInt32(o, true); o += 4; const l = []; for (let k = 0; k < n; k++) l.push(wert(et)); return l; }
      case 10: { const c = {}; for (;;) { const tt = a[o++]; if (tt === 0) return c; const k = str(); c[k] = wert(tt); } }
      default: throw new Error('NBT-Typ ' + t + ' bei ' + o);
    }
  };
  const t = a[o++]; str(); const v = wert(t); return { v, ende: o, typ: t };
}
export const schluessel = (name, states) => name + JSON.stringify(Object.keys(states).sort().map((k) => [k, typeof states[k] === 'bigint' ? Number(states[k]) : states[k]]));
export const NACH_SCHLUESSEL = new Map(W.NAMEN.map((n, id) => { const [bn, z] = W.BLOECKE[n]; return [schluessel('minecraft:' + bn, Object.fromEntries(Object.entries(z).map(([k, [, v]]) => [k, v]))), id]; }));
const le = (x, z) => { const a = new Uint8Array(8); const d = dv(a); d.setInt32(0, x, true); d.setInt32(4, z, true); return Array.from(a).join(','); };

// Ganze Welt lesen; hole(x, y, z) liefert die Block-ID wie im Weltmodell (fehlender Subchunk = Luft, unbekannter Block = −1)
export async function leseWelt(zipDaten) {
  const { dateien, crcFehler } = await unzip(zipDaten);
  const fehlend = PFLICHT.filter((n) => !dateien[n]);
  if (fehlend.length) return { dateien, crcFehler, fehlend };
  const log = leseLog(dateien['db/000002.log']);
  const batch = leseBatch(log.records[0]);
  const level = leseNbt(dateien['level.dat'], 8).v;
  const cache = new Map();
  const subchunk = (cx, cz, sy) => {
    const k = `${cx},${cz},${sy}`;
    if (cache.has(k)) return cache.get(k);
    const e = batch.m.get(le(cx, cz) + ',47,' + (sy & 255));
    let ids = null;
    if (e) {
      const a = e.val, d = dv(a), bits = a[3] >> 1, pw = Math.floor(32 / bits), nw = Math.ceil(4096 / pw);
      let o = 4 + nw * 4; const np = d.getInt32(o, true); o += 4; const pal = [];
      for (let q = 0; q < np; q++) { const r = leseNbt(a, o); o = r.ende; pal.push(NACH_SCHLUESSEL.get(schluessel(r.v.name, r.v.states)) ?? -1); }
      ids = new Int16Array(4096);
      for (let q = 0; q < 4096; q++) ids[q] = pal[(d.getUint32(4 + Math.floor(q / pw) * 4, true) >>> (bits * (q % pw))) & ((1 << bits) - 1)];
    }
    cache.set(k, ids);
    return ids;
  };
  const hole = (x, y, z) => {
    const ids = subchunk(Math.floor(x / 16), Math.floor(z / 16), Math.floor(y / 16));
    return ids ? ids[((x & 15) << 8) | ((z & 15) << 4) | (y & 15)] : W.ID.luft;
  };
  return { dateien, crcFehler, fehlend, logFehler: log.fehler, batch, level, hole };
}

// Prüft die erzeugte Datei gegen die Beschlüsse. Ergebnis: Liste [Text, ok, Info] und ok gesamt.
export async function pruefeExport(zipDaten, beschluesse = {}) {
  const punkte = [], ok = (t, b, info = '') => punkte.push([t, !!b, info]);
  let L;
  try { L = await leseWelt(zipDaten); } catch (e) { ok('Datei lesbar', false, String(e.message || e)); return { ok: false, punkte }; }
  ok('Datei vollständig: ZIP mit Prüfsummen, level.dat, Datenbank', !L.crcFehler.length && !L.fehlend.length, [...L.crcFehler, ...L.fehlend].join(', '));
  if (L.fehlend.length) return { ok: false, punkte };
  ok('Datenbank (LevelDB) gültig', !L.logFehler.length && L.batch.rest === 0 && L.batch.m.size === L.batch.anzahl, `${L.batch.anzahl} Einträge`);
  const lv = L.level, [sx, sy, sz] = [lv.SpawnX, lv.SpawnY, lv.SpawnZ];
  const fest = (id) => id > 0 && !W.istPflanze(id) && !W.istSchild(id) && id !== W.ID.wasser;
  let himmel = true;
  for (let y = sy; y < BEREICH_MC.y0 + BEREICH_MC.ny; y++) if (L.hole(sx, y, sz) !== W.ID.luft) { himmel = false; break; }
  ok('Startpunkt draußen: freier Platz, fester Boden, offener Himmel', sx === START.stand[0] && sy === START.stand[1] && sz === START.stand[2] && himmel && fest(L.hole(sx, sy - 1, sz)), `${sx} ${sy} ${sz}`);
  ok('Kreativmodus (Fliegen), Befehle an', lv.GameType === 1 && lv.commandsEnabled === 1 && lv.commandblocksenabled === 1);
  for (const id of BEREICH_IDS) {
    const v = beschluesse[id] || BEREICHE[id].grund, t = vorlage(id, v), [a, , c] = boxVon(id), y1 = boxVon(id)[1];
    let abw = 0;
    for (let y = 0; y < t.dy; y++) for (let z = 0; z < t.dz; z++) for (let x = 0; x < t.dx; x++) if (L.hole(a + x, y1 + y, c + z) !== t.hole(x, y, z)) abw++;
    ok(`${BEREICHE[id].titel}: ${v === BEREICHE[id].grund ? 'Ausgangszustand' : 'wie beschlossen'}`, abw === 0, abw ? `${abw} Blöcke weichen ab` : v);
  }
  return { ok: punkte.every((p) => p[1]), punkte, name: lv.LevelName };
}
