/* Dateiformate für Minecraft Education (Bedrock):
 *  - .mcworld  = ZIP mit level.dat und LevelDB-Ordner db/
 *  - .mcstructure = einzelne Struktur (NBT)
 *
 * Der Aufbau folgt dem Education-Exporter im Stadt-Konfigurator des Kollegen
 * (Funktionen bg/xg/OM, UM, _M, VM, GM im gebündelten Code):
 *  - LevelDB nur als Protokolldatei (000002.log) plus MANIFEST – Minecraft liest das beim Öffnen ein,
 *    eine eigene Tabellen-Kompression ist nicht nötig.
 *  - Chunks: Version 40, FinalizedState 2, Data3D (Höhenkarte + Biom „Ebene“), SubChunks Version 9
 *    mit einer Blockpalette je 16er-Würfel, Block-Entitäten (Schilder, Befehlsblöcke) als NBT.
 *  - level.dat: flache Welt, Kreativmodus, Befehle an.
 * Neu gegenüber dem Konfigurator: Befehlsblöcke, angepasste Spielregeln, .mcstructure-Export.
 */
import { BLOECKE, NAMEN, BLOCK_VERSION, BEREICH, ID, istSchild } from './welt.js';

/* ---------- NBT (Little Endian) ---------- */
const TYP = { byte: 1, short: 2, int: 3, long: 4, float: 5, double: 6, string: 8, list: 9, compound: 10 };
export const N = {
  b: (v) => ({ t: 'byte', v }), i: (v) => ({ t: 'int', v }), l: (v) => ({ t: 'long', v: BigInt(v) }),
  f: (v) => ({ t: 'float', v }), s: (v) => ({ t: 'string', v }),
  list: (of, v) => ({ t: 'list', of, v }),   // v: Rohwerte (Zahlen, Texte, Objekte für compound)
  c: (v) => ({ t: 'compound', v }),
};
const enc = new TextEncoder();

class Puffer {
  constructor(n = 4096) { this.a = new Uint8Array(n); this.dv = new DataView(this.a.buffer); this.o = 0; }
  platz(n) {
    if (this.o + n <= this.a.length) return;
    let m = this.a.length * 2; while (m < this.o + n) m *= 2;
    const a = new Uint8Array(m); a.set(this.a.subarray(0, this.o)); this.a = a; this.dv = new DataView(a.buffer);
  }
  u8(v) { this.platz(1); this.a[this.o++] = v & 255; }
  i16(v) { this.platz(2); this.dv.setInt16(this.o, v, true); this.o += 2; }
  u16(v) { this.platz(2); this.dv.setUint16(this.o, v, true); this.o += 2; }
  i32(v) { this.platz(4); this.dv.setInt32(this.o, v, true); this.o += 4; }
  u32(v) { this.platz(4); this.dv.setUint32(this.o, v >>> 0, true); this.o += 4; }
  i64(v) { this.platz(8); this.dv.setBigInt64(this.o, BigInt(v), true); this.o += 8; }
  f32(v) { this.platz(4); this.dv.setFloat32(this.o, v, true); this.o += 4; }
  bytes(b) { this.platz(b.length); this.a.set(b, this.o); this.o += b.length; }
  text(s) { const e = enc.encode(s); this.u16(e.length); this.bytes(e); }
  fertig() { return this.a.slice(0, this.o); }
}

function wert(p, typ, v) {
  switch (typ) {
    case 'byte': p.u8(v); break;
    case 'short': p.i16(v); break;
    case 'int': p.i32(v); break;
    case 'long': p.i64(v); break;
    case 'float': p.f32(v); break;
    case 'string': p.text(v); break;
    case 'list': {
      const { of, v: arr } = v;
      p.u8(arr.length ? TYP[of] : 0); p.i32(arr.length);
      for (const x of arr) wert(p, of, of === 'list' || of === 'compound' ? x : x);
      break;
    }
    case 'compound': {
      for (const [k, tag] of Object.entries(v)) {
        p.u8(TYP[tag.t]); p.text(k);
        wert(p, tag.t, tag.t === 'list' ? tag : tag.v);
      }
      p.u8(0);
      break;
    }
    default: throw new Error('NBT-Typ ' + typ);
  }
}
// Wurzel-Compound mit leerem Namen
export function nbt(obj, p = new Puffer()) { p.u8(TYP.compound); p.text(''); wert(p, 'compound', obj); return p; }
const nbtBytes = (obj) => nbt(obj).fertig();
const verbinde = (teile) => { const n = teile.reduce((s, t) => s + t.length, 0), a = new Uint8Array(n); let o = 0; for (const t of teile) { a.set(t, o); o += t.length; } return a; };
const le32 = (v) => { const a = new Uint8Array(4); new DataView(a.buffer).setInt32(0, v, true); return a; };

/* ---------- LevelDB: Protokoll + Manifest ---------- */
const CRC32C = Uint32Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? (n >>> 1) ^ 0x82f63b78 : n >>> 1; return n >>> 0; });
export function crc32c(bytes, start = 0xffffffff) {
  let c = start;
  for (const b of bytes) c = CRC32C[(c ^ b) & 255] ^ (c >>> 8);
  return c;
}
export function crcMaskiert(typ, daten) {
  let c = CRC32C[(0xffffffff ^ typ) & 255] ^ (0xffffffff >>> 8);
  c = ~crc32c(daten, c) >>> 0;
  return (((c >>> 15) | (c << 17)) + 0xa282ead8) >>> 0;
}
const BLOCK = 32768;
// Datensätze in 32-KB-Blöcken (FULL=1, FIRST=2, MIDDLE=3, LAST=4)
export function logDatei(daten) {
  const teile = [];
  let o = 0;
  do {
    const stueck = daten.subarray(o, o + BLOCK - 7), letzt = o + stueck.length === daten.length;
    const typ = o === 0 ? (letzt ? 1 : 2) : (letzt ? 4 : 3);
    const kopf = new Uint8Array(7), dv = new DataView(kopf.buffer);
    dv.setUint32(0, crcMaskiert(typ, stueck), true); dv.setUint16(4, stueck.length, true); kopf[6] = typ;
    teile.push(kopf, stueck); o += stueck.length;
  } while (o < daten.length);
  return verbinde(teile);
}
const varint = (n) => { const t = []; while (n >= 128) { t.push((n & 127) | 128); n >>>= 7; } t.push(n); return Uint8Array.from(t); };
function leveldb(eintraege) {
  const vergleich = enc.encode('leveldb.BytewiseComparator');
  const manifest = verbinde([Uint8Array.of(1), varint(vergleich.length), vergleich, Uint8Array.of(2, 2, 3, 3, 4, 0)]);
  const teile = [le32(1), le32(0), le32(eintraege.length)];     // Sequenz 1 (64 Bit), Anzahl
  for (const [k, v] of eintraege) teile.push(Uint8Array.of(1), varint(k.length), k, varint(v.length), v);
  return {
    'db/CURRENT': enc.encode('MANIFEST-000001\n'),
    'db/MANIFEST-000001': logDatei(manifest),
    'db/000002.log': logDatei(verbinde(teile)),
  };
}

/* ---------- Blockpalette ---------- */
const zustaende = (z) => Object.fromEntries(Object.entries(z).map(([k, [t, v]]) => [k, { t, v }]));
export const blockNbt = (name) => { const [n, z] = BLOECKE[name]; return { name: N.s('minecraft:' + n), states: N.c(zustaende(z)), version: N.i(BLOCK_VERSION) }; };
const PALETTE_BYTES = NAMEN.map((n) => nbtBytes(blockNbt(n)));

/* ---------- Chunks ---------- */
// Der erzeugte Ausschnitt kommt aus der Welt selbst (welt.bereich); Standard ist die Spielplatz-Testwelt.
const bereichVon = (welt) => welt.bereich || BEREICH;
function subchunk(welt, cx, sy, cz) {
  const MIN_Y = bereichVon(welt).y0;
  const x0 = cx * 16, y0 = MIN_Y + sy * 16, z0 = cz * 16;
  const pal = [], map = new Map(), idx = new Uint16Array(4096);
  for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) for (let y = 0; y < 16; y++) {
    const id = welt.hole(x0 + x, y0 + y, z0 + z);
    if (!map.has(id)) { map.set(id, pal.length); pal.push(id); }
    idx[(x * 16 + z) * 16 + y] = map.get(id);
  }
  if (pal.length === 1 && pal[0] === ID.luft) return null;
  const bits = [1, 2, 3, 4, 5, 6, 8, 16].find((u) => 2 ** u >= pal.length);
  const proWort = Math.floor(32 / bits), worte = new Uint32Array(Math.ceil(4096 / proWort));
  for (let k = 0; k < 4096; k++) worte[Math.floor(k / proWort)] |= idx[k] << (bits * (k % proWort));
  return verbinde([Uint8Array.of(9, 1, (MIN_Y / 16 + sy) & 255, bits << 1), new Uint8Array(worte.buffer), le32(pal.length), ...pal.map((id) => PALETTE_BYTES[id])]);
}
function data3d(welt, cx, cz) {
  const a = new Uint8Array(512 + 24 * 5), dv = new DataView(a.buffer), { ny, y0: MIN_Y } = bereichVon(welt);
  for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
    let h = ny - 1;
    while (h > 0 && !welt.hole(cx * 16 + x, MIN_Y + h, cz * 16 + z)) h--;
    dv.setInt16((z * 16 + x) * 2, h + 1, true);
  }
  for (let k = 0; k < 24; k++) { a[512 + k * 5] = 1; dv.setInt32(512 + k * 5 + 1, 1, true); }  // Biom „Ebene“
  return a;
}
function schildNbt(x, y, z, zeilen) {
  const text = () => N.c({ Text: N.s(zeilen.join('\n')), SignTextColor: N.i(-16777216), IgnoreLighting: N.b(0), PersistFormatting: N.b(1), TextOwner: N.s('') });
  return { id: N.s('Sign'), x: N.i(x), y: N.i(y), z: N.i(z), isMovable: N.b(1), IsWaxed: N.b(1), FrontText: text(), BackText: text() };
}
// modus (Änderungsauftrag 03): fehlt = Impuls mit Knopf (wie bisher, unverändert) · 'auto' = Impuls, immer aktiv (läuft einmal)
// · 'wiederholen' = Wiederholen, immer aktiv, alle „takt“ Ticks · 'kette' = Kettenblock, immer aktiv, „bedingt“ = nur nach Erfolg davor
function befehlNbt(x, y, z, befehl, name, modus = null, bedingt = false, takt = 0) {
  const art = modus === 'wiederholen' ? 1 : modus === 'kette' ? 2 : 0, immer = modus ? 1 : 0;
  return {
    id: N.s('CommandBlock'), x: N.i(x), y: N.i(y), z: N.i(z), isMovable: N.b(1),
    Command: N.s(befehl), CustomName: N.s(name), ExecuteOnFirstTick: N.b(modus === 'wiederholen' ? 1 : 0),
    LPCommandMode: N.i(art), LPCondionalMode: N.b(bedingt ? 1 : 0), LPRedstoneMode: N.b(immer),   // ohne modus: Impuls, unbedingt, braucht Redstone (Knopf)
    LastExecution: N.l(0), LastOutput: N.s(''), LastOutputParams: N.list('string', []),
    SuccessCount: N.i(0), TickDelay: N.i(takt), TrackOutput: N.b(modus ? 0 : 1), Version: N.i(13),
    auto: N.b(immer), conditionMet: N.b(0), conditionalMode: N.b(bedingt ? 1 : 0), powered: N.b(0),
  };
}
// Bett (Änderungsauftrag 03): Farbe 0–15 (0 weiß, 3 hellblau, 5 hellgrün, 11 blau, 14 rot)
function bettNbt(x, y, z, farbe) {
  return { id: N.s('Bed'), x: N.i(x), y: N.i(y), z: N.i(z), isMovable: N.b(1), color: N.b(farbe) };
}
export function entityNbt(key, e) {
  const [x, y, z] = key.split(',').map(Number);
  if (e.art === 'schild') return schildNbt(x, y, z, e.zeilen);
  if (e.art === 'bett') return bettNbt(x, y, z, e.farbe);
  return befehlNbt(x, y, z, e.befehl, e.name, e.modus, e.bedingt, e.takt);
}

/* ---------- level.dat ---------- */
export function levelDat(name, spawn) {
  const v = N.list('int', [1, 20, 70, 0, 0]);
  const flach = { biome_id: 1, block_layers: [{ block_name: 'minecraft:bedrock', count: 1 }, { block_name: 'minecraft:dirt', count: 126 }, { block_name: 'minecraft:grass_block', count: 1 }], encoding_version: 6, world_version: 'version.post_1_18', structure_options: null };
  const p = new Puffer();
  p.i32(10); p.i32(0);                                   // Kopf: Speicherversion, Länge (unten eingetragen)
  nbt({
    LevelName: N.s(name), StorageVersion: N.i(10), NetworkVersion: N.i(662),
    lastOpenedWithVersion: v, MinimumCompatibleClientVersion: N.list('int', [1, 20, 70, 0, 0]),
    baseGameVersion: N.s('1.20.70'), InventoryVersion: N.s('1.20.70'),
    Generator: N.i(2), FlatWorldLayers: N.s(JSON.stringify(flach)), RandomSeed: N.l(2050),
    GameType: N.i(1), ForceGameType: N.b(0), Difficulty: N.i(0),
    eduOffer: N.i(1), educationFeaturesEnabled: N.b(1),
    SpawnX: N.i(spawn[0]), SpawnY: N.i(spawn[1]), SpawnZ: N.i(spawn[2]), spawnradius: N.i(0),
    commandsEnabled: N.b(1), cheatsEnabled: N.b(1), hasBeenLoadedInCreative: N.b(1),
    LastPlayed: N.l(Math.floor(Date.now() / 1000)), Time: N.l(6000), currentTick: N.l(0),
    // Spielregeln: stabile Bühne – kein Tag/Nacht, kein Wetter, keine Tiere, nichts wächst oder verfällt
    domobspawning: N.b(0), dodaylightcycle: N.b(0), doweathercycle: N.b(0), dofiretick: N.b(0), mobgriefing: N.b(0),
    randomtickspeed: N.i(0), showcoordinates: N.b(1),
    commandblocksenabled: N.b(1), commandblockoutput: N.b(0), sendcommandfeedback: N.b(1),
    rainLevel: N.f(0), lightningLevel: N.f(0),
  }, p);
  const a = p.fertig();
  new DataView(a.buffer).setInt32(4, a.length - 8, true);
  return a;
}

/* ---------- ZIP ---------- */
const CRC32 = Uint32Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? (n >>> 1) ^ 0xedb88320 : n >>> 1; return n >>> 0; });
export const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC32[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; };
async function deflateRaw(daten) {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const s = new Blob([daten]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  } catch { return null; }
}
export async function zip(dateien, komprimieren = true) {
  const lokal = [], zentral = [];
  let o = 0;
  for (const [name, daten] of Object.entries(dateien)) {
    const n = enc.encode(name), crc = crc32(daten);
    const gepackt = komprimieren ? await deflateRaw(daten) : null;
    const nutze = gepackt && gepackt.length < daten.length ? gepackt : daten, methode = nutze === daten ? 0 : 8;
    const k = new DataView(new ArrayBuffer(30));
    k.setUint32(0, 0x04034b50, true); k.setUint16(4, 20, true); k.setUint16(6, 0x0800, true); k.setUint16(8, methode, true);
    k.setUint16(10, 0, true); k.setUint16(12, 0x21, true); k.setUint32(14, crc, true);
    k.setUint32(18, nutze.length, true); k.setUint32(22, daten.length, true); k.setUint16(26, n.length, true);
    lokal.push(new Uint8Array(k.buffer), n, nutze);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, methode, true);
    c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, nutze.length, true); c.setUint32(24, daten.length, true);
    c.setUint16(28, n.length, true); c.setUint32(42, o, true);
    zentral.push(new Uint8Array(c.buffer), n);
    o += 30 + n.length + nutze.length;
  }
  const z = verbinde(zentral), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, zentral.length / 2, true); e.setUint16(10, zentral.length / 2, true);
  e.setUint32(12, z.length, true); e.setUint32(16, o, true);
  return verbinde([...lokal, z, new Uint8Array(e.buffer)]);
}

/* ---------- .mcworld ---------- */
export function weltDateien(welt, name, spawn) {
  const eintraege = [], B = bereichVon(welt), MIN_Y = B.y0;
  const cx0 = B.x0 / 16, cz0 = B.z0 / 16, ncx = B.nx / 16, ncz = B.nz / 16;
  const proChunk = new Map();
  for (const [k, e] of welt.entities) {
    const [x, , z] = k.split(',').map(Number), ck = `${Math.floor(x / 16)},${Math.floor(z / 16)}`;
    if (!proChunk.has(ck)) proChunk.set(ck, []);
    proChunk.get(ck).push(nbtBytes(entityNbt(k, e)));
  }
  for (let cx = cx0; cx < cx0 + ncx; cx++) for (let cz = cz0; cz < cz0 + ncz; cz++) {
    const kopf = verbinde([le32(cx), le32(cz)]), dazu = (tag, wert, ...extra) => eintraege.push([verbinde([kopf, Uint8Array.of(tag, ...extra)]), wert]);
    dazu(44, Uint8Array.of(40));
    dazu(54, le32(2));
    dazu(43, data3d(welt, cx, cz));
    const ents = proChunk.get(`${cx},${cz}`);
    if (ents) dazu(49, verbinde(ents));
    for (let sy = 0; sy < B.ny / 16; sy++) {
      const sc = subchunk(welt, cx, sy, cz);
      if (sc) dazu(47, sc, (MIN_Y / 16 + sy) & 255);
    }
  }
  return { 'level.dat': levelDat(name, spawn), 'levelname.txt': enc.encode(name), ...leveldb(eintraege) };
}
export async function mcworld(welt, name, spawn) { return zip(weltDateien(welt, name, spawn)); }

/* ---------- .mcstructure (Format-Version 1) ---------- */
export function mcstructure(vorlage, ursprung = [0, 0, 0]) {
  const { dx, dy, dz } = vorlage, pal = [], map = new Map(), haupt = [], zweit = [], posDaten = {};
  for (let x = 0; x < dx; x++) for (let y = 0; y < dy; y++) for (let z = 0; z < dz; z++) {   // Reihenfolge: z am schnellsten
    const id = vorlage.hole(x, y, z);
    if (!map.has(id)) { map.set(id, pal.length); pal.push(id); }
    const k = haupt.length;
    haupt.push(map.get(id)); zweit.push(-1);
    if (istSchild(id)) {
      const zeilen = vorlage.schilder.get(`${x},${y},${z}`) || [];
      posDaten[String(k)] = N.c({ block_entity_data: N.c(schildNbt(ursprung[0] + x, ursprung[1] + y, ursprung[2] + z, zeilen)) });
    }
  }
  return nbtBytes({
    format_version: N.i(1),
    size: N.list('int', [dx, dy, dz]),
    structure: N.c({
      block_indices: N.list('list', [{ of: 'int', v: haupt }, { of: 'int', v: zweit }]),
      entities: N.list('compound', []),
      palette: N.c({ default: N.c({ block_palette: N.list('compound', pal.map((id) => blockNbt(NAMEN[id]))), block_position_data: N.c(posDaten) }) }),
    }),
    structure_world_origin: N.list('int', ursprung),
  });
}
