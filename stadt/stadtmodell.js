/* START IT SMART – Stadt-Konfigurator: das Stadtmodell (ohne Grafik, ohne Dateiformat).
 *
 * EINE Stadt für beide Systeme: Die 3D-Vorschau im Browser und die Minecraft-Welt werden aus denselben Blöcken erzeugt.
 * Die Stadt ist grau (2050). Für jede Mission gibt es eine feste BAUFLÄCHE (Quader). Nur dort ändert sich etwas;
 * Nachbarflächen und frühere Entscheidungen bleiben unberührt. Jede Variante einer Baufläche ist ein vollständiger
 * Block-Quader („Vorlage“). In Minecraft liegt jede Vorlage in einer Kammer unter ihrer Baufläche; ein /clone tauscht sie.
 *
 * Koordinaten wie Minecraft: x nach Osten, z nach Süden, y nach oben. Oberste Bodenschicht y = 63, man steht auf y = 64.
 * Der Spielplatz liegt genau dort, wo er im Spielplatz-Test liegt (0 59 0 – 31 74 31); seine Befehle bleiben gleich.
 */
import { Welt, ID, NAMEN, istPflanze, vorlageGrau, vorlageGruen, Vorlage, PLATZ } from '../minecraft/welt.js';

export const BODEN = 63;
export const S = BODEN + 1;
export const STADT = { x1: -64, z1: -64, x2: 95, z2: 95 };                       // 160 × 160 Blöcke = 10 × 10 Chunks
export const BEREICH_3D = { x0: -64, z0: -64, nx: 160, nz: 160, y0: 56, ny: 64 };  // Browser: nur die Oberfläche
export const BEREICH_MC = { x0: -64, z0: -64, nx: 160, nz: 160, y0: -64, ny: 224 }; // Minecraft: mit Kammern, bis y 159 (Ansichtspunkte)

/* ---------- Zeichnen mit Begrenzung ----------
 * Alle Bau-Funktionen schreiben über einen „Stift“. clip() lässt nur Schreibzugriffe innerhalb eines Quaders durch.
 * So kann dieselbe Funktion die ganze Stadt bauen oder nur den Inhalt einer Baufläche. */
export function stift(w, box = null) {
  const [ax, ay, az, bx, by, bz] = box || [-1e9, -1e9, -1e9, 1e9, 1e9, 1e9];
  const innen = (x, y, z) => x >= ax && x <= bx && y >= ay && y <= by && z >= az && z <= bz;
  const P = {
    w, box,
    trifft: (x1, z1, x2, z2) => !(x2 < ax || x1 > bx || z2 < az || z1 > bz),
    hole: (x, y, z) => w.hole(x, y, z),
    setze(x, y, z, n) { if (innen(x, y, z) && w.index(x, y, z) >= 0) w.setze(x, y, z, n); },
    quader(x1, y1, z1, x2, y2, z2, n) {
      const xa = Math.max(Math.min(x1, x2), ax), xb = Math.min(Math.max(x1, x2), bx);
      const ya = Math.max(Math.min(y1, y2), ay, w.bereich.y0), yb = Math.min(Math.max(y1, y2), by, w.bereich.y0 + w.bereich.ny - 1);
      const za = Math.max(Math.min(z1, z2), az), zb = Math.min(Math.max(z1, z2), bz);
      for (let y = ya; y <= yb; y++) for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) if (w.index(x, y, z) >= 0) w.setze(x, y, z, n);
    },
    schild(x, y, z, richtung, zeilen) {
      if (!innen(x, y, z) || w.index(x, y, z) < 0) return;
      w.setze(x, y, z, 'schild' + richtung);
      w.entities.set(`${x},${y},${z}`, { art: 'schild', zeilen });
    },
    einsetzen(v, [ox, oy, oz]) {
      for (let y = 0; y < v.dy; y++) for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) P.setze(ox + x, oy + y, oz + z, v.hole(x, y, z));
      for (const [k, zeilen] of v.schilder) { const [x, y, z] = k.split(',').map(Number); if (innen(ox + x, oy + y, oz + z)) w.entities.set(`${ox + x},${oy + y},${oz + z}`, { art: 'schild', zeilen }); }
    },
  };
  return P;
}

// kleiner, fester Zufallsgenerator: gleiche Stadt bei jedem Erzeugen
function zufall(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- Bausteine ---------- */
// Gebäude: Geschosse mit Fensterbändern, flaches Dach, Türöffnungen (Luft, 1 × 2)
export function haus(p, { x1, z1, x2, z2, g = 4, gh = 3, wand = 'betonHell', fenster = 'fenster', dach = 'beton', tueren = [], muster = 2, rand = null }) {
  if (!p.trifft(x1, z1, x2, z2)) return { x1, z1, x2, z2, hoehe: g * gh + 1 };
  p.quader(x1, BODEN, z1, x2, BODEN, z2, 'beton');
  for (let k = 0; k < g; k++) {
    const yb = S + k * gh;
    for (let y = yb; y < yb + gh; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      const aussen = x === x1 || x === x2 || z === z1 || z === z2;
      if (!aussen) { p.setze(x, y, z, y === yb && k > 0 ? 'beton' : 'luft'); continue; }
      const ecke = (x === x1 || x === x2) && (z === z1 || z === z2);
      const reihe = gh >= 4 ? (y - yb === 1 || y - yb === 2) : y - yb === 1;
      const s = (x === x1 || x === x2) ? z - z1 : x - x1;
      p.setze(x, y, z, !ecke && reihe && s % muster === 1 ? fenster : (rand && y === yb ? rand : wand));
    }
  }
  const yd = S + g * gh;
  p.quader(x1, yd, z1, x2, yd, z2, dach);
  for (const [x, z] of tueren) { p.setze(x, S, z, 'luft'); p.setze(x, S + 1, z, 'luft'); }
  return { x1, z1, x2, z2, hoehe: g * gh + 1 };
}
export function baum(p, x, z, art = 'eiche', h = 5, y0 = S) {
  const stamm = art === 'birke' ? 'birkeStamm' : 'eicheStamm', laub = art === 'birke' ? 'birkeLaub' : 'eicheLaub';
  const oben = y0 + h - 1;
  const lage = (y, r, ecken) => {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (!ecken && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      const v = p.hole(x + dx, y, z + dz);
      if (v === ID.luft || istPflanze(v)) p.setze(x + dx, y, z + dz, laub);
    }
  };
  lage(oben - 2, 2, false); lage(oben - 1, 2, false); lage(oben, 1, true);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (p.hole(x + dx, oben + 1, z + dz) === ID.luft) p.setze(x + dx, oben + 1, z + dz, laub);
  p.quader(x, y0, z, x, oben, z, stamm);
  p.setze(x, y0 - 1, z, 'erde');
}
const AUTOFARBEN = ['rot', 'blau', 'betonWeiss', 'gelb', 'beton', 'gruenBeton', 'betonHell', 'orange', 'cyanBeton', 'braun'];
// Auto: 4 lang, 2 breit, 2 hoch; (x, z) = nordwestliche Ecke
export function auto(p, x, z, achse = 'x', farbe = 'rot', y = S) {
  if (achse === 'x') { p.quader(x, y, z, x + 3, y, z + 1, farbe); p.quader(x + 1, y + 1, z, x + 2, y + 1, z + 1, 'schwarzGlas'); }
  else { p.quader(x, y, z, x + 1, y, z + 3, farbe); p.quader(x, y + 1, z + 1, x + 1, y + 1, z + 2, 'schwarzGlas'); }
}
// Autoreihe: reihe = Richtung, in der die Autos hintereinander stehen; ausrichtung = Längsrichtung der Autos
// (gleich = Längsparken, Schritt 5; quer = Querparken, Schritt 3)
export function autoreihe(p, reihe, fest, von, bis, rnd, dichte = 1, schritt = 5, ausrichtung = reihe) {
  const laenge = ausrichtung === reihe ? 4 : 2;
  for (let k = von; k + laenge - 1 <= bis; k += schritt) {
    if (rnd() > dichte) continue;
    const f = AUTOFARBEN[Math.floor(rnd() * AUTOFARBEN.length)];
    if (reihe === 'x') auto(p, k, fest, ausrichtung, f); else auto(p, fest, k, ausrichtung, f);
  }
}
// Bus: 3 breit, 10 lang (entlang z, Front im Süden), 3 hoch
export function bus(p, x, z, funk = false) {
  p.quader(x, S, z, x + 2, S + 2, z + 9, 'gelb');
  p.quader(x, S + 1, z + 1, x, S + 1, z + 8, 'schwarzGlas'); p.quader(x + 2, S + 1, z + 1, x + 2, S + 1, z + 8, 'schwarzGlas');
  p.quader(x, S + 1, z + 9, x + 2, S + 1, z + 9, 'schwarzGlas');
  p.quader(x, S + 2, z, x + 2, S + 2, z, 'orange');
  if (funk) { p.setze(x + 1, S + 3, z + 7, 'kupfer'); p.setze(x + 1, S + 4, z + 7, 'kette'); }
}
// Ampel: Mast, darüber grün – gelb – rot (dunkel = aus)
export function ampel(p, x, z, zustand, funk = false) {
  p.quader(x, S, z, x, S + 2, z, 'schwarzstein');
  p.setze(x, S + 3, z, zustand === 'gruen' ? 'limette' : 'schwarzstein');
  p.setze(x, S + 4, z, 'schwarzstein');
  p.setze(x, S + 5, z, zustand === 'rot' ? 'rot' : 'schwarzstein');
  if (funk) { p.setze(x, S + 6, z, 'kupfer'); p.setze(x, S + 7, z, 'kette'); }
}
// Straßenlaterne. 'immer': rote Stromquelle direkt unter der Lampe → leuchtet Tag und Nacht.
// 'sensor': Lampe mit umgekehrtem Tageslichtsensor obendrauf → leuchtet nur bei Dunkelheit (Minecraft-Logik).
export function laterne(p, x, z, modus) {
  p.quader(x, S, z, x, S + 2, z, 'schwarzstein');
  if (modus === 'immer') { p.setze(x, S + 3, z, 'redstone'); p.setze(x, S + 4, z, 'lampeAn'); }
  else { p.setze(x, S + 3, z, 'schwarzstein'); p.setze(x, S + 4, z, 'lampeAus'); p.setze(x, S + 5, z, 'sensor'); }
}
function zebra(p, achseStrasse, a, b, c1, c2) {
  // Zebrastreifen quer über eine Fahrbahn: achseStrasse = Richtung der Straße; a..b = Breite der Querung; c1..c2 = Fahrbahn
  for (let c = c1; c <= c2; c++) for (let k = a; k <= b; k++) {
    const weiss = (c - c1) % 2 === 0;
    if (achseStrasse === 'x') p.setze(k, BODEN, c, weiss ? 'betonWeiss' : 'asphalt'); else p.setze(c, BODEN, k, weiss ? 'betonWeiss' : 'asphalt');
  }
}

/* ---------- Straßennetz ----------
 * Bänder: Gehweg (mit Bordstein an der Fahrbahn), Fahrbahn in der Mitte. Kreuzungen entstehen, wo sich Fahrbahnen treffen. */
export const STRASSEN = [
  { name: 'Ringstraße Nord', x1: -64, z1: -14, x2: 45, z2: -1, achse: 'x', fahrbahn: 8 },
  { name: 'Ostweg', x1: 46, z1: -14, x2: 95, z2: -1, achse: 'x', fahrbahn: 8 },
  { name: 'Ringstraße Süd', x1: -64, z1: 32, x2: 42, z2: 45, achse: 'x', fahrbahn: 8 },
  { name: 'Ringstraße West', x1: -14, z1: -11, x2: -1, z2: 42, achse: 'z', fahrbahn: 8 },
  { name: 'Hauptstraße', x1: 32, z1: -64, x2: 45, z2: 95, achse: 'z', fahrbahn: 8 },
  { name: 'Wohnstraße', x1: -48, z1: -40, x2: 42, z2: -29, achse: 'x', fahrbahn: 6 },
  { name: 'Wohngasse', x1: -49, z1: 12, x2: -33, z2: 19, achse: 'x', fahrbahn: 0 },
];
// feste Querungen (Zebrastreifen) – auch für die Wegmessung „zu Fuß“
export const QUERUNGEN = [
  { name: 'Wohnhaus', achse: 'x', a: -43, b: -41, c1: -11, c2: -4 },     // Ringstraße Nord vor „Unser Wohnhaus“
  { name: 'Platz Süd', achse: 'x', a: 14, b: 17, c1: 35, c2: 42 },        // Ringstraße Süd vor dem Spielplatz
  { name: 'Platz West', achse: 'z', a: 10, b: 13, c1: -11, c2: -4 },      // Ringstraße West
  { name: 'Platz Nord', achse: 'x', a: 14, b: 17, c1: -11, c2: -4 },      // Ringstraße Nord
  { name: 'Schule', achse: 'x', a: -50, b: -47, c1: 35, c2: 42 },         // Ringstraße Süd vor der Schule
];
function fahrbahnVon(s) {
  const breite = s.achse === 'x' ? s.z2 - s.z1 + 1 : s.x2 - s.x1 + 1, a = (s.achse === 'x' ? s.z1 : s.x1) + Math.floor((breite - s.fahrbahn) / 2);
  return [a, a + s.fahrbahn - 1];
}
export function strassen(p) {
  for (const s of STRASSEN) p.quader(s.x1, BODEN, s.z1, s.x2, BODEN, s.z2, 'glattstein');          // Gehwege
  for (const s of STRASSEN) {                                                                     // Bordsteine
    if (!s.fahrbahn) continue;
    const [a, b] = fahrbahnVon(s);
    if (s.achse === 'x') { p.quader(s.x1, BODEN, a - 1, s.x2, BODEN, a - 1, 'andesit'); p.quader(s.x1, BODEN, b + 1, s.x2, BODEN, b + 1, 'andesit'); }
    else { p.quader(a - 1, BODEN, s.z1, a - 1, BODEN, s.z2, 'andesit'); p.quader(b + 1, BODEN, s.z1, b + 1, BODEN, s.z2, 'andesit'); }
  }
  for (const s of STRASSEN) {                                                                     // Fahrbahnen
    if (!s.fahrbahn) continue;
    const [a, b] = fahrbahnVon(s);
    if (s.achse === 'x') p.quader(s.x1, BODEN, a, s.x2, BODEN, b, 'asphalt'); else p.quader(a, BODEN, s.z1, b, BODEN, s.z2, 'asphalt');
  }
  const istFahrbahn = (x, z) => STRASSEN.some((s) => {
    if (!s.fahrbahn || x < s.x1 || x > s.x2 || z < s.z1 || z > s.z2) return false;
    const [a, b] = fahrbahnVon(s), c = s.achse === 'x' ? z : x;
    return c >= a && c <= b;
  });
  for (const s of STRASSEN) {                                                                     // Mittellinien (gestrichelt)
    if (s.fahrbahn < 6) continue;
    const [a, b] = fahrbahnVon(s), m = Math.floor((a + b) / 2);
    const lang = s.achse === 'x' ? [s.x1, s.x2] : [s.z1, s.z2];
    for (let k = lang[0]; k <= lang[1]; k++) {
      if (((k % 6) + 6) % 6 > 2) continue;
      const [x, z] = s.achse === 'x' ? [k, m] : [m, k];
      // nicht auf Kreuzungsflächen anderer Fahrbahnen
      const andere = STRASSEN.some((t) => t !== s && t.fahrbahn && x >= t.x1 && x <= t.x2 && z >= t.z1 && z <= t.z2 && (() => { const [c, d] = fahrbahnVon(t), q = t.achse === 'x' ? z : x; return q >= c && q <= d; })());
      if (!andere && istFahrbahn(x, z)) p.setze(x, BODEN, z, 'betonWeiss');
    }
  }
  for (const q of QUERUNGEN) zebra(p, q.achse, q.a, q.b, q.c1, q.c2);
  // Bahnstrecke am Südrand: Schotterbett und zwei Gleise (alt, nicht mehr befahren)
  p.quader(STADT.x1, BODEN, 85, STADT.x2, BODEN, 92, 'kies');
  p.quader(STADT.x1, S, 87, STADT.x2, S, 87, 'schieneOW');
  p.quader(STADT.x1, S, 90, STADT.x2, S, 90, 'schieneOW');
}

/* ---------- Bauflächen (Missionen) ----------
 * box = [x1, y1, z1, x2, y2, z2]. grund = Ausgangszustand der grauen Stadt. mc = Varianten mit Minecraft-Kammer. */
export const BEREICHE = {
  spielplatz: { titel: 'Spielplatz', mission: 'natur', box: [0, 59, 0, 31, 74, 31], grund: 'grau', varianten: ['grau', 'A', 'B', 'gruen'], mc: ['grau', 'gruen'] },
  laternen: { titel: 'Straßenbeleuchtung Hauptstraße', mission: 'technik', box: [32, 62, 0, 45, 71, 95], grund: 'immer', varianten: ['immer', 'sensor'], mc: ['immer', 'sensor'] },
  parken: { titel: 'Wohnstraße und Parken', mission: 'mobilitaet', box: [-64, 62, -44, 31, 79, -25], grund: 'grau', varianten: ['grau', 'A', 'B', 'C'], mc: ['grau', 'A', 'B', 'C'] },
  kreuzung: { titel: 'Kreuzung mit Bus', mission: 'mobilitaet', box: [32, 62, -26, 51, 73, -1], grund: 'normal', varianten: ['normal', 'bus'], mc: ['normal', 'bus'] },
  wohnen: { titel: 'Wohngrundstück', mission: 'wohnen', box: [52, 62, -60, 91, 85, -21], grund: 'grau', varianten: ['grau', 'A', 'B', 'C'], mc: ['grau', 'A', 'B', 'C'] },
  aufstocken: { titel: 'Bestandshaus', mission: 'wohnen', box: [52, 62, 6, 71, 85, 25], grund: 'bestand', varianten: ['bestand', 'holz'], mc: ['bestand', 'holz'] },
  einkaufen: { titel: 'Westviertel: Läden und Wege', mission: 'einkaufen', box: [-64, 62, -24, -17, 81, 31], grund: 'grau', varianten: ['grau', 'A', 'B', 'C'], mc: ['grau', 'A', 'B', 'C'] },
  bildung: { titel: 'Südviertel: Schule und Bahnhof', mission: 'bildung', box: [-64, 62, 46, 31, 83, 95], grund: 'grau', varianten: ['grau', 'A', 'B', 'C'], mc: ['grau', 'A', 'B', 'C'] },
};
export const BEREICH_IDS = Object.keys(BEREICHE);
export const boxVon = (id) => BEREICHE[id].box;
export const ursprungVon = (id) => BEREICHE[id].box.slice(0, 3);
export function groesseVon(id) { const [a, b, c, d, e, f] = BEREICHE[id].box; return [d - a + 1, e - b + 1, f - c + 1]; }
export function bereichAn(x, z) {
  for (const id of BEREICH_IDS) { const [a, , c, d, , f] = BEREICHE[id].box; if (x >= a && x <= d && z >= c && z <= f) return id; }
  return null;
}

/* ---------- feste Orte (für Kameras, Tafeln, Wege) ---------- */
export const ORTE = {
  wohnhaus: { x: -42, z: -16, titel: 'Unser Wohnhaus', tuer: [-42, -16] },
  platz: { x: 16, z: 16, titel: 'Spielplatz' },
  kreuzung: { x: 39, z: -8, titel: 'Kreuzung' },
  schule: { x: -48, z: 56, titel: 'Schule' },
  bahnhof: { x: 14, z: 72, titel: 'Alter Bahnhof' },
};
// Ziele der Einkaufswege (Eingänge) je Variante
export const LADEN = {
  A: { tuer: [-57, 20], titel: 'Großer Supermarkt am Rand' },
  B: { tuer: [-25, 2], titel: 'Markthalle in der Mitte' },
  C: { tuer: [-40, 5], titel: 'Bäckerei in der Wohngasse' },
};

/* ---------- graue Grundstadt (alles, was sich nie ändert) ---------- */
const HAEUSER = [
  // Nordreihe an der Wohnstraße (Türen nach Süden)
  { x1: -62, z1: -60, x2: -47, z2: -47, g: 5, wand: 'betonHell', tueren: [[-55, -47]] },
  { x1: -42, z1: -60, x2: -25, z2: -47, g: 6, wand: 'betonWeiss', tueren: [[-33, -47]] },
  { x1: -20, z1: -60, x2: -5, z2: -47, g: 4, wand: 'ziegel', dach: 'tiefschiefer', tueren: [[-12, -47]] },
  { x1: 2, z1: -60, x2: 27, z2: -47, g: 7, wand: 'beton', fenster: 'grauGlas', tueren: [[14, -47]] },
  // Südreihe an der Wohnstraße
  { x1: -62, z1: -23, x2: -49, z2: -16, g: 4, wand: 'beton', tueren: [[-55, -23], [-55, -16]] },
  { x1: -46, z1: -23, x2: -38, z2: -16, g: 3, wand: 'betonHell', rand: 'cyanBeton', tueren: [[-42, -23], [-42, -16]], name: 'wohnhaus' },
  { x1: -35, z1: -23, x2: -19, z2: -16, g: 5, wand: 'betonWeiss', tueren: [[-27, -23], [-27, -16]] },
  { x1: -14, z1: -23, x2: 5, z2: -16, g: 4, wand: 'betonWeiss', fenster: 'grauGlas', tueren: [[-4, -23]] },
  { x1: 10, z1: -23, x2: 29, z2: -16, g: 3, wand: 'ziegel', dach: 'tiefschiefer', tueren: [[19, -23]] },
  // Westviertel an der Wohngasse
  { x1: -49, z1: 1, x2: -44, z2: 10, g: 3, wand: 'ziegel', dach: 'tiefschiefer', tueren: [[-46, 10]] },
  { x1: -40, z1: 1, x2: -35, z2: 10, g: 3, wand: 'betonHell', tueren: [[-38, 10]] },
  { x1: -49, z1: 21, x2: -44, z2: 30, g: 3, wand: 'betonWeiss', tueren: [[-46, 21]] },
  { x1: -40, z1: 21, x2: -35, z2: 30, g: 4, wand: 'beton', tueren: [[-38, 21]] },
  // Südost: Bürotürme und Wohnblock
  { x1: 76, z1: 4, x2: 91, z2: 19, g: 9, gh: 4, wand: 'betonHell', fenster: 'cyanGlas', dach: 'beton' },
  { x1: 52, z1: 34, x2: 67, z2: 47, g: 6, gh: 4, wand: 'betonWeiss', fenster: 'cyanGlas' },
  { x1: 76, z1: 30, x2: 91, z2: 45, g: 8, gh: 4, wand: 'beton', fenster: 'grauGlas' },
  { x1: 78, z1: 56, x2: 91, z2: 75, g: 5, wand: 'ziegel', dach: 'tiefschiefer' },
  // Süd: Schule, Sporthalle (Bestand in der Baufläche Bildung, aber in allen Varianten gleich)
  { x1: -60, z1: 50, x2: -37, z2: 63, g: 3, gh: 4, wand: 'betonHell', dach: 'tiefschiefer', tueren: [[-49, 50], [-48, 50], [-49, 63]], name: 'schule' },
  { x1: -33, z1: 50, x2: -21, z2: 61, g: 2, gh: 4, wand: 'betonWeiss', fenster: 'grauGlas', muster: 3, tueren: [[-27, 50]] },
];

export function zeichneGrund(p) {
  const { x1, z1, x2, z2 } = STADT, y0 = p.w.bereich.y0;
  if (y0 <= -64) p.quader(x1, -64, z1, x2, -64, z2, 'grundgestein');
  p.quader(x1, Math.max(y0, -63), z1, x2, BODEN - 1, z2, 'erde');
  p.quader(x1, BODEN, z1, x2, BODEN, z2, 'beton');                     // versiegelt
  strassen(p);
  const rnd = zufall(2050);

  // Vorplätze und Hofflächen: helle Platten
  p.quader(-64, BODEN, -46, 31, BODEN, -45, 'betonHell');
  p.quader(-64, BODEN, -24, 31, BODEN, -24, 'betonHell');
  p.quader(-64, BODEN, -15, 31, BODEN, -15, 'betonHell');
  p.quader(46, BODEN, -64, 51, BODEN, -15, 'glattstein');             // Gehweg östlich der Hauptstraße (Nord)
  p.quader(-64, BODEN, 46, 31, BODEN, 49, 'glattstein');               // Gehweg vor Schule und Bahnhof
  for (const h of HAEUSER) haus(p, h);
  p.schild(-42, S + 2, -15, 'Sued', ['Unser Wohnhaus', 'Startpunkt', 'im Wohngebiet']);

  // Westviertel: Durchgänge zur Wohngasse
  p.quader(-43, BODEN, 0, -41, BODEN, 11, 'glattstein');
  p.quader(-43, BODEN, 20, -41, BODEN, 31, 'glattstein');
  p.quader(-34, BODEN, 0, -33, BODEN, 31, 'glattstein');
  // Platz A (Rand): heute ein Parkplatz
  p.quader(-64, BODEN, 0, -50, BODEN, 31, 'beton');
  for (let z = 2; z <= 29; z += 3) p.quader(-63, BODEN, z, -59, BODEN, z, 'betonWeiss');
  for (let z = 2; z <= 29; z += 3) p.quader(-55, BODEN, z, -51, BODEN, z, 'betonWeiss');
  autoreihe(p, 'z', -62, 3, 29, rnd, 0.5, 3, 'x'); autoreihe(p, 'z', -55, 3, 29, rnd, 0.4, 3, 'x');
  // Platz B (Mitte): ungenutzte, versiegelte Fläche mit Bauzaun
  p.quader(-32, BODEN, 0, -17, BODEN, 31, 'betonHell');
  for (let z = 0; z <= 31; z++) { p.setze(-32, S, z, z % 4 === 0 ? 'gitter' : 'luft'); p.setze(-17, S, z, z % 4 === 0 ? 'gitter' : 'luft'); }
  for (let x = -32; x <= -17; x++) { p.setze(x, S, 0, x % 4 === 0 ? 'gitter' : 'luft'); p.setze(x, S, 31, x % 4 === 0 ? 'gitter' : 'luft'); }

  // Wohngrundstück (Nordost): versiegelte Brache mit Zaun
  p.quader(52, BODEN, -60, 91, BODEN, -21, 'beton');
  for (let x = 52; x <= 91; x++) { p.setze(x, S, -60, 'gitter'); p.setze(x, S, -21, x >= 70 && x <= 73 ? 'luft' : 'gitter'); }
  for (let z = -60; z <= -21; z++) { p.setze(52, S, z, 'gitter'); p.setze(91, S, z, 'gitter'); }
  p.quader(60, S, -50, 65, S + 2, -47, 'beton'); p.quader(78, S, -36, 81, S, -31, 'kies');       // alter Betonsockel, Schotterhaufen

  // Bestandshaus (Aufstocken): Wohnblock mit 4 Geschossen
  p.quader(52, BODEN, 6, 71, BODEN, 25, 'betonHell');
  haus(p, { x1: 55, z1: 10, x2: 68, z2: 21, g: 4, wand: 'beton', fenster: 'fenster', dach: 'beton', tueren: [[61, 21]] });

  // Südost: Parkplatz, Ränder
  for (let x = 54; x <= 72; x += 3) { p.quader(x, BODEN, 57, x, BODEN, 61, 'betonWeiss'); p.quader(x, BODEN, 72, x, BODEN, 76, 'betonWeiss'); }
  autoreihe(p, 'x', 57, 55, 72, rnd, 0.7, 3, 'z'); autoreihe(p, 'x', 72, 55, 72, rnd, 0.6, 3, 'z');

  // Süden: Schulhof (versiegelt, Zaun, Tor geschlossen), Brache in der Mitte, alter Bahnhof
  p.quader(-60, BODEN, 64, -37, BODEN, 79, 'beton');
  for (let x = -61; x <= -36; x++) { p.setze(x, S, 80, 'gitter'); p.setze(x, S + 1, 80, 'gitter'); }
  for (let z = 64; z <= 80; z++) for (const x of [-61, -36]) { p.setze(x, S, z, 'gitter'); p.setze(x, S + 1, z, 'gitter'); }
  p.quader(-18, BODEN, 50, -3, BODEN, 79, 'beton');
  autoreihe(p, 'x', 54, -17, -4, rnd, 0.6, 5); autoreihe(p, 'x', 70, -17, -4, rnd, 0.5, 5);
  p.quader(0, BODEN, 50, 29, BODEN, 65, 'betonHell');
  bahnhof(p, false);
  p.quader(0, S, 81, 29, S, 84, 'steinziegel');                        // Bahnsteig

  // drei einzelne, kleine Bäume in der ganzen grauen Stadt – sonst kaum Schatten
  for (const [x, z] of [[48, -40], [84, 52], [-2, -52]]) { p.setze(x, BODEN, z, 'erde'); baum(p, x, z, 'birke', 4); }
}

function bahnhof(p, offen) {
  const x1 = 2, z1 = 66, x2 = 27, z2 = 79;
  haus(p, { x1, z1, x2, z2, g: 2, gh: 4, wand: 'ziegel', fenster: offen ? 'glas' : 'fichteBretter', dach: 'kupfer', muster: 3, tueren: offen ? [[14, 66], [15, 66], [14, 79], [15, 79]] : [] });
  for (let k = 1; k <= 3; k++) p.quader(x1 + k, S + 8 + k, z1 + k, x2 - k, S + 8 + k, z2 - k, 'kupfer');   // Walmdach
  if (!offen) { p.setze(14, S, 66, 'fichteBretter'); p.setze(15, S, 66, 'fichteBretter'); p.setze(14, S + 1, 66, 'fichteBretter'); p.setze(15, S + 1, 66, 'fichteBretter'); }
}

/* ---------- Varianten je Baufläche ----------
 * Jede Funktion bekommt den Stift (begrenzt auf die Baufläche) mit der grauen Grundstadt darin und baut ihre Variante.
 * Alles außerhalb der Baufläche ist für sie unerreichbar. */
const BAUE = {
  spielplatz(p, v) {
    const ursprung = [PLATZ.x, PLATZ.y, PLATZ.z];
    const vorlage = v === 'gruen' ? vorlageGruen() : v === 'A' ? spielplatzA() : v === 'B' ? spielplatzB() : vorlageGrau();
    p.einsetzen(vorlage, ursprung);
  },

  laternen(p, v) {
    for (let z = 4; z <= 74; z += 10) { laterne(p, 33, z, v); laterne(p, 44, z + 5, v); }
  },

  kreuzung(p, v) {
    const bv = v === 'bus';
    // Haltelinien und Bushaltestelle
    p.quader(35, BODEN, -15, 38, BODEN, -15, 'betonWeiss');
    p.quader(46, BODEN, -11, 46, BODEN, -8, 'betonWeiss');
    p.quader(32, S, -24, 33, S + 2, -24, 'glas'); p.quader(32, S + 3, -25, 33, S + 3, -20, 'glas');
    p.quader(32, S, -20, 32, S + 2, -20, 'schwarzstein'); p.setze(33, S, -22, 'bankOst');
    // Ampeln: Bus kommt von Norden, Querverkehr von Osten
    ampel(p, 34, -16, bv ? 'gruen' : 'rot', bv);
    ampel(p, 47, -12, bv ? 'rot' : 'gruen');
    bus(p, 36, -25, bv);
    if (bv) {
      // Bus hat sich per Funk angemeldet: Querverkehr hält sicher an, erst dann bekommt der Bus Grün
      auto(p, 47, -10, 'x', 'blau');
      for (let z = -26; z <= -16; z += 2) p.setze(39, BODEN, z, 'gelb');           // Busspur-Markierung
      p.quader(34, S, -18, 34, S + 1, -18, 'schwarzstein');
      p.schild(34, S + 1, -17, 'Sued', ['Bus meldet sich', 'per Funk an']);
    } else {
      auto(p, 40, -10, 'x', 'beton');                                                // Querverkehr fährt
    }
  },

  parken(p, v) {
    const rnd = zufall(77 + v.charCodeAt(0));
    const reiheNord = -37, reiheSued = -33;           // Parkstreifen am Fahrbahnrand (je 2 breit)
    if (v === 'grau') {
      // dicht an dicht, teils auf dem Gehweg; Brache am Rand voller Autos
      autoreihe(p, 'x', reiheNord, -47, 30, rnd, 0.95, 5);
      autoreihe(p, 'x', reiheSued - 1, -47, 30, rnd, 0.95, 5);
      autoreihe(p, 'x', -40, -45, 30, rnd, 0.45, 9);                // halb auf dem Gehweg
      autoreihe(p, 'x', -30, -42, 30, rnd, 0.45, 9);
      for (let z = -42; z <= -28; z += 3) autoreihe(p, 'x', z, -63, -50, rnd, 0.7, 5);
      return;
    }
    // ab hier: Gehwege frei; sichere Querung in der Mitte
    zebra(p, 'x', -4, -1, -37, -32);
    if (v === 'A') {
      // Stellplätze direkt vor den Häusern (Vorzonen), geordnet
      for (const zs of [-44, -27]) for (let x = -46; x <= 28; x += 5) {
        if (x >= -5 && x <= 1) continue;
        p.quader(x - 1, BODEN, zs, x - 1, BODEN, zs + 1, 'betonWeiss');
        auto(p, x, zs, 'x', AUTOFARBEN[Math.floor(rnd() * AUTOFARBEN.length)]);
      }
      for (let z = -42; z <= -28; z += 3) autoreihe(p, 'x', z, -63, -50, rnd, 0.6, 5);
      return;
    }
    // B und C: freie Abschnitte bekommen Bäume, Beete, Bänke, breitere Gehwege
    const gruen = (xa, xb) => {
      // Gehwege je 1 Block breiter (früherer Parkstreifen), Fahrbahn bleibt 4 breit
      p.quader(xa, BODEN, -38, xb, BODEN, -38, 'glattstein'); p.quader(xa, BODEN, -31, xb, BODEN, -31, 'glattstein');
      p.quader(xa, BODEN, -37, xb, BODEN, -37, 'andesit'); p.quader(xa, BODEN, -32, xb, BODEN, -32, 'andesit');
      // Vorzonen: Grün mit Bäumen, Bänken und Blumen statt Stellplätzen
      for (const [za, zb, zbaum, bank] of [[-44, -41, -42, 'bankSued'], [-28, -25, -27, 'bankNord']]) {
        p.quader(xa, BODEN, za, xb, BODEN, zb, 'gras');
        for (let x = xa + 2; x <= xb - 2; x += 8) { if (x >= -6 && x <= 2) continue; baum(p, x, zbaum, x % 16 === 0 ? 'birke' : 'eiche', 5); }
        for (let x = xa + 5; x <= xb - 2; x += 8) if (x < -6 || x > 2) p.setze(x, S, za === -44 ? zb : za, bank);
        for (let x = xa + 6; x <= xb - 2; x += 8) if (x < -6 || x > 2) { p.setze(x, S, za === -44 ? za : zb, 'mohn'); p.setze(x + 1, S, za === -44 ? za : zb, 'kornblume'); }
        if (xa <= -4 && xb >= -1) p.quader(-4, BODEN, za, -1, BODEN, zb, 'glattstein');   // Weg zur Querung
      }
    };
    if (v === 'B') {
      // Parken nur noch im westlichen Abschnitt (Parkstraße); östlicher Abschnitt wird Spielstraße
      autoreihe(p, 'x', reiheNord, -47, -19, rnd, 0.95, 5);
      autoreihe(p, 'x', reiheSued - 1, -47, -19, rnd, 0.95, 5);
      p.quader(-17, BODEN, -36, -17, BODEN, -33, 'betonWeiss');
      gruen(-15, 30);
      for (let x = -12; x <= 28; x += 10) { p.setze(x, BODEN, -35, 'limette'); p.setze(x, BODEN, -34, 'limette'); }   // Spielstraßen-Markierung
      p.quader(4, S, -35, 5, S, -34, 'orange'); p.quader(20, S, -35, 21, S, -34, 'orange');                            // Spielelemente
      for (let z = -42; z <= -28; z += 3) autoreihe(p, 'x', z, -63, -50, rnd, 0.6, 5);
      return;
    }
    if (v === 'C') {
      gruen(-46, 30);
      // Parkhaus am Quartiersrand (4 Ebenen, offene Seiten mit Geländer, Zufahrt von der Wohnstraße)
      const [x1, z1, x2, z2] = [-63, -43, -50, -26];
      p.quader(x1, BODEN, z1, x2, BODEN, z2, 'beton');
      for (let e = 0; e < 4; e++) {
        const y = S + e * 3;
        p.quader(x1, y - 1, z1, x2, y - 1, z2, e === 0 ? 'beton' : 'betonHell');
        for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2], [x1, -35], [x2, -35]]) p.quader(x, y, z, x, y + 1, z, 'beton');
        for (let x = x1; x <= x2; x++) { p.setze(x, y, z1, 'gitter'); p.setze(x, y, z2, 'gitter'); }
        for (let z = z1; z <= z2; z++) { p.setze(x1, y, z, z === -35 ? 'beton' : 'gitter'); if (!(e === 0 && z >= -37 && z <= -32)) p.setze(x2, y, z, z === -35 ? 'beton' : 'gitter'); }
        for (let k = 0; k < 3; k++) auto(p, x1 + 2 + k * 4, z1 + 2, 'z', AUTOFARBEN[(e * 3 + k) % AUTOFARBEN.length], y);
        for (let k = 0; k < 2; k++) auto(p, x1 + 2 + k * 4, z2 - 5, 'z', AUTOFARBEN[(e * 2 + k + 4) % AUTOFARBEN.length], y);
      }
      p.quader(x1, S + 11, z1, x2, S + 11, z2, 'beton');
      p.quader(x1 + 1, S + 12, -36, x1 + 6, S + 12, -34, 'blau');
      p.quader(-49, BODEN, -37, -47, BODEN, -32, 'asphalt');                // Zufahrt
      p.schild(-49, S + 2, -38, 'Ost', ['Parkhaus', 'am Rand des', 'Viertels']);
      p.setze(-49, S, -38, 'schwarzstein'); p.setze(-49, S + 1, -38, 'schwarzstein');
    }
  },

  wohnen(p, v) {
    if (v === 'grau') return;
    // Brache räumen: offener Boden, Zaun weg, Zugang von Süden
    p.quader(52, S, -60, 91, S + 3, -21, 'luft');
    p.quader(52, BODEN, -60, 91, BODEN, -21, 'gras');
    p.quader(52, BODEN - 1, -60, 91, BODEN - 1, -21, 'erde');
    p.quader(70, BODEN, -40, 73, BODEN, -21, 'kies');
    const rnd = zufall(600 + v.charCodeAt(0));
    const wiese = (dichte) => {
      for (let z = -59; z <= -22; z++) for (let x = 53; x <= 90; x++) {
        if (p.hole(x, BODEN, z) !== ID.gras || p.hole(x, S, z) !== ID.luft) continue;
        const r = rnd();
        if (r < dichte) p.setze(x, S, z, r < dichte * 0.5 ? 'hohesGras' : r < dichte * 0.75 ? 'margerite' : 'loewenzahn');
      }
    };
    const H = WOHNHAEUSER[v];
    if (v === 'A') {
      // sechs kleine Häuser (2 Geschosse = 1 Wohnung) mit eigenem Garten hinter Hecken
      for (const [hx, hz, x2, z2] of H.umrisse) {
        haus(p, { x1: hx, z1: hz, x2, z2, g: 2, wand: 'betonWeiss', fenster: 'fenster', dach: 'terrakotta', tueren: [[hx + 3, z2]] });
        p.quader(hx + 1, S + 7, hz + 1, x2 - 1, S + 7, z2 - 1, 'terrakotta');
        p.quader(hx - 1, BODEN, z2 + 1, x2 + 2, BODEN, z2 + 8, 'gras');
        for (let x = hx - 2; x <= x2 + 3; x++) p.setze(x, S, z2 + 9, 'azalee');
        for (let z = z2 + 1; z <= z2 + 9; z++) { p.setze(hx - 2, S, z, 'azalee'); p.setze(x2 + 3, S, z, 'azalee'); }
        p.setze(hx + 3, BODEN, z2 + 1, 'kies'); p.setze(hx + 3, BODEN, z2 + 2, 'kies');
        p.quader(hx + 5, BODEN, z2 + 4, hx + 7, BODEN, z2 + 6, 'erde'); p.setze(hx + 6, S, z2 + 5, 'farn');
      }
      wiese(0.05);
      return;
    }
    if (v === 'B') {
      // zwei kompakte Häuser (3 Geschosse = 3 Wohnungen) um einen gemeinsamen Hof
      for (const [x1, z1, x2, z2] of H.umrisse) {
        const sued = z1 > -40;
        haus(p, { x1, z1, x2, z2, g: 3, wand: 'betonWeiss', fenster: 'fenster', dach: 'beton', tueren: [[71, sued ? z1 : z2]] });
        p.quader(x1 + 1, S + 9, z1 + 1, x2 - 1, S + 9, z2 - 1, 'moos');                    // begrüntes Dach
      }
      p.quader(58, BODEN, -48, 84, BODEN, -35, 'gras');
      p.quader(70, BODEN, -49, 72, BODEN, -34, 'kies');
      p.quader(60, BODEN, -46, 64, BODEN, -43, 'sandstein'); p.setze(62, S, -44, 'gelb');      // Sandkasten
      for (const [x, z] of [[80, -45], [80, -38], [61, -38]]) baum(p, x, z, 'eiche', 5);
      for (let x = 66; x <= 68; x++) p.setze(x, S, -41, 'bankNord');
      p.quader(75, S, -43, 76, S, -42, 'fichteBretter'); p.setze(74, S, -43, 'bankOst'); p.setze(77, S, -43, 'bankWest');
      for (let z = -47; z <= -44; z++) { p.setze(83, BODEN, z, 'erde'); p.setze(83, S, z, z % 2 ? 'heu' : 'kornblume'); }
      wiese(0.08);
      return;
    }
    if (v === 'C') {
      // ein höheres Haus (6 Geschosse = 6 Wohnungen) und ein großer, zusammenhängender Park
      const [x1, z1, x2, z2] = H.umrisse[0];
      haus(p, { x1, z1, x2, z2, g: 6, wand: 'betonWeiss', fenster: 'fenster', dach: 'beton', tueren: [[62, z2]] });
      p.quader(x1 + 1, S + 18, z1 + 1, x2 - 1, S + 18, z2 - 1, 'moos');
      p.quader(62, BODEN, z2 + 1, 62, BODEN, -40, 'kies'); p.quader(62, BODEN, -40, 72, BODEN, -40, 'kies');
      p.quader(80, BODEN - 1, -52, 86, BODEN - 1, -47, 'erde'); p.quader(81, BODEN, -51, 85, BODEN, -48, 'wasser');   // Teich
      for (const [x, z, a] of [[76, -55, 'eiche'], [88, -57, 'birke'], [86, -40, 'eiche'], [64, -30, 'eiche'], [80, -28, 'birke'], [56, -36, 'birke'], [76, -44, 'eiche'], [57, -45, 'eiche']]) baum(p, x, z, a, 6);
      for (let x = 64; x <= 67; x++) p.setze(x, S, -41, 'bankSued');
      p.quader(83, S, -32, 83, S + 2, -32, 'fichteStamm'); p.quader(86, S, -32, 86, S + 2, -32, 'fichteStamm'); p.quader(83, S + 3, -32, 86, S + 3, -32, 'fichteStammX');
      p.quader(84, S + 1, -32, 85, S + 2, -32, 'kette'); p.setze(84, S, -32, 'fichteHalb'); p.setze(85, S, -32, 'fichteHalb');
      wiese(0.16);
    }
  },

  aufstocken(p, v) {
    if (v !== 'holz') return;
    // zwei zusätzliche Geschosse in Holzbauweise auf dem erhaltenen Betonhaus (vereinfachtes Modell)
    const [x1, z1, x2, z2] = [55, 10, 68, 21];
    for (let k = 0; k < 2; k++) {
      const yb = S + 12 + 1 + k * 3;
      for (let y = yb; y < yb + 3; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
        const aussen = x === x1 || x === x2 || z === z1 || z === z2;
        if (!aussen) { p.setze(x, y, z, y === yb ? 'eicheBretter' : 'luft'); continue; }
        const ecke = (x === x1 || x === x2) && (z === z1 || z === z2), s = (x === x1 || x === x2) ? z - z1 : x - x1;
        p.setze(x, y, z, ecke ? 'fichteStamm' : (y - yb === 1 && s % 2 === 1 ? 'glas' : 'bretterBirke'));
      }
    }
    p.quader(x1, S + 19, z1, x2, S + 19, z2, 'fichteBretter');
    p.quader(x1 + 1, S + 20, z1 + 1, x2 - 1, S + 20, z2 - 1, 'moos');
  },

  einkaufen(p, v) {
    if (v === 'A') {
      // großer Supermarkt am Rand mit Parkplatz; Eingang zum Parkplatz (Süden)
      p.quader(-64, S, 0, -50, S + 2, 31, 'luft');
      p.quader(-64, BODEN, 0, -50, BODEN, 31, 'beton');
      haus(p, { x1: -63, z1: 2, x2: -52, z2: 20, g: 1, gh: 6, wand: 'betonWeiss', fenster: 'glas', dach: 'beton', muster: 4, tueren: [[-58, 20], [-57, 20]] });
      p.quader(-63, S + 4, 20, -52, S + 4, 20, 'blau');
      p.quader(-61, S + 6, 7, -54, S + 6, 14, 'betonHell');
      for (let x = -63; x <= -51; x += 3) p.quader(x, BODEN, 23, x, BODEN, 26, 'betonWeiss');
      const rnd = zufall(9);
      autoreihe(p, 'x', 23, -62, -52, rnd, 0.8, 3, 'z'); autoreihe(p, 'x', 28, -62, -52, rnd, 0.6, 3, 'z');
      p.quader(-51, BODEN, 0, -50, BODEN, 31, 'glattstein');
      p.schild(-56, S + 3, 21, 'Sued', ['Supermarkt', 'viel Auswahl', 'an einem Ort']);
      return;
    }
    if (v === 'B') {
      // Markthalle in der Mitte (am Spielplatz): Stände unter einem Dach; Eingang zur Ringstraße (Norden)
      p.quader(-32, S, 0, -17, S + 2, 31, 'luft');
      p.quader(-32, BODEN, 0, -17, BODEN, 31, 'glattstein');
      haus(p, { x1: -31, z1: 2, x2: -18, z2: 29, g: 1, gh: 7, wand: 'ziegel', fenster: 'glas', dach: 'kupfer', muster: 2, tueren: [[-25, 2], [-24, 2], [-25, 29], [-24, 29]] });
      for (let k = 1; k <= 3; k++) p.quader(-31 + k, S + 7 + k, 2 + k, -18 - k, S + 7 + k, 29 - k, k === 3 ? 'glas' : 'kupfer');
      for (let z = 5; z <= 26; z += 4) for (const x of [-29, -21]) {
        p.quader(x, S, z, x + 1, S, z + 1, 'fichteBretter');
        p.setze(x, S + 1, z, ['wolleRot', 'wolleGelb', 'wolleGruen', 'wolleWeiss'][(z + x) & 3]);
      }
      for (const x of [-30, -28, -22, -20]) p.setze(x, S, 1, x % 4 === 0 ? 'bankNord' : 'luft');
      p.schild(-23, S + 2, 1, 'Nord', ['Markthalle', 'viele Staende', 'unter einem Dach']);
      return;
    }
    if (v === 'C') {
      // kleine Läden im Erdgeschoss der Häuser an der Wohngasse
      // Bäckerei (Haus Nordreihe Ost, Tür zum Durchgang im Westen)
      p.setze(-40, S, 5, 'luft'); p.setze(-40, S + 1, 5, 'luft');
      p.quader(-40, S, 3, -40, S + 1, 4, 'glas'); p.quader(-40, S, 6, -40, S + 1, 7, 'glas');
      for (let z = 2; z <= 8; z++) p.setze(-41, S + 2, z, z % 2 ? 'wolleGelb' : 'wolleWeiss');
      p.schild(-41, S + 3, 5, 'West', ['Baeckerei', 'Brot und', 'Broetchen']);
      p.quader(-39, BODEN, 2, -36, BODEN, 9, 'eicheBretter');
      // Gemüseladen (Haus Südreihe West, Tür zum Durchgang im Osten)
      p.setze(-44, S, 25, 'luft'); p.setze(-44, S + 1, 25, 'luft');
      p.quader(-44, S, 23, -44, S + 1, 24, 'glas'); p.quader(-44, S, 26, -44, S + 1, 27, 'glas');
      for (let z = 22; z <= 28; z++) p.setze(-43, S + 2, z, z % 2 ? 'wolleGruen' : 'wolleWeiss');
      p.schild(-43, S + 3, 25, 'Ost', ['Gemueseladen', 'um die Ecke']);
      p.setze(-43, S, 23, 'fass'); p.setze(-43, S, 27, 'heu');
      // Kiosk an der Gasse
      p.quader(-36, S, 13, -34, S + 2, 13, 'fichteBretter'); p.setze(-35, S + 1, 13, 'glas'); p.quader(-36, S + 3, 13, -34, S + 3, 14, 'wolleRot');
      // Gasse wird belebter: Bänke und Pflanzkübel
      for (const x of [-48, -45]) { p.setze(x, S, 16, 'bankNord'); }
      for (const x of [-47, -37]) { p.setze(x, S, 15, 'fass'); p.setze(x, S + 1, 15, 'farn'); }
    }
  },

  bildung(p, v) {
    if (v === 'grau') return;
    if (v === 'A') {
      // Schule nachmittags öffnen: Tor offen, Hof teils entsiegelt, Werkstatt- und Sportecke
      p.quader(-36, S, 70, -36, S + 1, 73, 'luft');                         // Tor auf
      p.quader(-35, BODEN, 70, -32, BODEN, 73, 'glattstein');
      p.quader(-58, BODEN, 66, -50, BODEN, 78, 'gras');
      for (const [x, z] of [[-56, 69], [-53, 75]]) baum(p, x, z, 'eiche', 5);
      for (let x = -48; x <= -39; x++) { p.setze(x, BODEN, 66, 'limette'); p.setze(x, BODEN, 77, 'limette'); }
      for (let z = 66; z <= 77; z++) { p.setze(-48, BODEN, z, 'limette'); p.setze(-39, BODEN, z, 'limette'); }
      p.quader(-44, S, 77, -43, S + 3, 77, 'schwarzstein'); p.quader(-44, S + 4, 76, -43, S + 4, 77, 'orange');   // Basketballkorb
      p.quader(-60, S, 79, -57, S, 79, 'werkbank'); p.quader(-60, S + 3, 77, -56, S + 3, 79, 'fichteBretter');
      for (const [x, z] of [[-60, 77], [-56, 77]]) p.quader(x, S, z, x, S + 2, z, 'fichteStamm');
      p.quader(-36, S, 74, -36, S + 2, 74, 'fichteStamm');
      p.schild(-35, S + 2, 74, 'Ost', ['Offene Schule', 'nachmittags', 'Hof und Werkraum']);
      return;
    }
    if (v === 'B') {
      // alter Bahnhof wird Werkstatt und Treffpunkt
      bahnhof(p, true);
      p.quader(4, BODEN, 52, 25, BODEN, 64, 'glattstein');
      p.quader(4, BODEN, 52, 9, BODEN, 58, 'gras'); p.quader(20, BODEN, 52, 25, BODEN, 58, 'gras');
      baum(p, 6, 55, 'eiche', 5); baum(p, 23, 55, 'birke', 5);
      for (let x = 11; x <= 18; x += 3) { p.setze(x, S, 60, 'bankSued'); }
      for (let x = 4; x <= 25; x += 3) p.setze(x, S, 65, 'zaun');
      for (let x = 4; x <= 24; x += 4) for (let z = 68; z <= 76; z += 4) p.setze(x, S, z, 'werkbank');
      p.quader(0, S + 1, 81, 29, S + 1, 81, 'zaun');
      for (let x = 3; x <= 27; x += 6) { p.quader(x, S + 1, 83, x + 1, S + 1, 83, 'fichteBretter'); }
      p.schild(14, S + 2, 65, 'Nord', ['Werkstatt', 'im alten Bahnhof', 'Treffpunkt']);
      return;
    }
    if (v === 'C') {
      // drei kleine Treff-, Spiel- und Lernorte, verteilt über das Südviertel
      // 1) Lerngarten mit Hütte auf der Brache
      p.quader(-17, S, 53, -4, S + 1, 76, 'luft');
      p.quader(-17, BODEN, 53, -4, BODEN, 66, 'gras');
      for (let x = -15; x <= -7; x += 4) { p.quader(x, BODEN, 56, x + 2, BODEN, 62, 'erde'); for (let z = 56; z <= 62; z += 2) p.setze(x + 1, S, z, z % 4 ? 'heu' : 'kornblume'); }
      haus(p, { x1: -12, z1: 64, x2: -8, z2: 68, g: 1, gh: 3, wand: 'eicheBretter', fenster: 'glas', dach: 'fichteBretter', tueren: [[-10, 64]] });
      baum(p, -5, 55, 'birke', 5);
      // 2) kleiner Bewegungsplatz an der Schulecke (außerhalb des Schulhofs)
      p.quader(-31, BODEN, 64, -23, BODEN, 76, 'gruenBeton');
      p.quader(-31, S, 66, -31, S + 3, 66, 'schwarzstein'); p.quader(-31, S + 4, 66, -30, S + 4, 66, 'orange');
      p.quader(-25, S, 70, -23, S, 72, 'gelb');
      // 3) Lese- und Treffecke am Bahnhofsvorplatz (Bücherschrank, Bänke, Schatten)
      p.quader(24, BODEN, 52, 29, BODEN, 60, 'gras');
      p.quader(26, S, 53, 27, S + 2, 53, 'insektenhotel');
      baum(p, 28, 58, 'eiche', 5);
      p.setze(25, S, 57, 'bankOst'); p.setze(25, S, 58, 'bankOst');
      p.schild(-8, S + 1, 63, 'Nord', ['Lerngarten', 'Treffpunkt']);
      p.schild(27, S + 1, 54, 'Sued', ['Lese-Ecke']);
    }
  },
};

/* ---------- Diskussionsbilder Spielplatz (nur im Browser, nicht in Minecraft) ---------- */
const PB = PLATZ.boden, PS = PB + 1;
function spielplatzA() {
  // „großer Abenteuerspielplatz mit viel Platz zum Toben“ – viel Spiel, kaum Grün und Schatten
  const v = new Vorlage();
  v.quader(0, 0, 0, 31, PB - 1, 31, 'erde');
  v.quader(0, PB, 0, 31, PB, 31, 'gruenBeton');
  v.quader(2, PB, 2, 13, PB, 13, 'sandstein'); v.quader(18, PB, 18, 29, PB, 29, 'sandstein');
  v.quader(15, PB, 0, 16, PB, 31, 'betonHell'); v.quader(0, PB, 15, 31, PB, 16, 'betonHell');
  // große Kletterburg
  for (const [x, z] of [[4, 4], [11, 4], [4, 11], [11, 11]]) v.quader(x, PS, z, x, PS + 5, z, 'fichteStamm');
  v.quader(4, PS + 3, 4, 11, PS + 3, 11, 'fichteBretter'); v.quader(6, PS + 6, 6, 9, PS + 6, 9, 'rot');
  v.quader(6, PS + 4, 4, 9, PS + 5, 4, 'gitter'); v.quader(4, PS + 4, 6, 4, PS + 5, 9, 'gitter');
  for (let k = 0; k < 4; k++) v.quader(12 + k, PS + 3 - k, 7, 12 + k, PS + 3 - k, 8, 'gelb');           // Rutsche
  for (let k = 0; k < 3; k++) v.quader(7, PS + k, 12 + k, 8, PS + k, 12 + k, 'fichteBretter');           // Treppe
  // Kletterwand, Schaukeln, Trampolin, Karussell
  v.quader(20, PS, 3, 27, PS + 3, 3, 'orange'); for (const [x, y] of [[21, 1], [23, 2], [25, 1], [26, 3]]) v.setze(x, PS + y, 4, 'braun');
  v.quader(19, PS, 8, 19, PS + 4, 8, 'fichteStamm'); v.quader(29, PS, 8, 29, PS + 4, 8, 'fichteStamm'); v.quader(20, PS + 4, 8, 28, PS + 4, 8, 'fichteStammX');
  for (const x of [21, 24, 27]) { v.quader(x, PS + 2, 8, x, PS + 3, 8, 'kette'); v.setze(x, PS + 1, 8, 'fichteHalb'); }
  v.quader(4, PS, 21, 9, PS, 26, 'schwarzstein'); v.quader(5, PS, 22, 8, PS, 25, 'blau');
  v.quader(21, PS, 21, 25, PS, 25, 'rot'); v.quader(23, PS, 21, 23, PS + 2, 25, 'gelb'); v.quader(21, PS, 23, 25, PS + 2, 23, 'gelb'); v.setze(23, PS + 2, 23, 'rot');
  v.quader(12, PS, 26, 14, PS + 2, 28, 'blau');
  v.quader(26, PS, 28, 29, PS, 28, 'bankNord');
  return v;
}
function spielplatzB() {
  // „grüner Park mit Bäumen und Natur“ – viel Grün und Schatten, keine Spielgeräte
  const v = new Vorlage(), rnd = zufall(4711);
  v.quader(0, 0, 0, 31, PB - 1, 31, 'erde');
  v.quader(0, PB, 0, 31, PB, 31, 'gras');
  for (let k = 0; k < 32; k++) { const z = 15 + Math.round(5 * Math.sin(k / 5)); v.quader(k, PB, z, k, PB, z + 1, 'kies'); }
  v.quader(15, PB, 0, 16, PB, 12, 'kies');
  v.quader(19, PB - 1, 22, 26, PB - 1, 28, 'erde'); v.quader(20, PB, 23, 25, PB, 27, 'wasser');             // Teich
  for (const [x, z, a, h] of [[5, 5, 'eiche', 6], [11, 3, 'birke', 5], [26, 6, 'eiche', 6], [4, 26, 'eiche', 6], [11, 24, 'birke', 5], [28, 15, 'birke', 5], [21, 11, 'eiche', 5], [7, 14, 'birke', 5], [29, 29, 'eiche', 5]]) baum(stift(gefaess(v)), x, z, a, h, PS);
  v.quader(26, PS, 1, 27, PS + 2, 1, 'insektenhotel');
  for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++) {
    if (v.hole(x, PB, z) !== ID.gras || v.hole(x, PS, z) !== ID.luft) continue;
    const r = rnd();
    if (r < 0.16) v.setze(x, PS, z, r < 0.06 ? 'hohesGras' : r < 0.09 ? 'mohn' : r < 0.12 ? 'kornblume' : r < 0.14 ? 'margerite' : 'loewenzahn');
  }
  for (const [x, z] of [[14, 9], [18, 9]]) v.setze(x, PS, z, 'bankOst');
  v.setze(9, PS, 18, 'bankSued'); v.setze(10, PS, 18, 'bankSued');
  return v;
}
// Hilfe: eine Vorlage wie eine Welt ansprechen (für baum() in Vorlagen-Koordinaten)
function gefaess(v) {
  return { bereich: { x0: 0, y0: 0, z0: 0, nx: v.dx, ny: v.dy, nz: v.dz }, index: (x, y, z) => (v.innen(x, y, z) ? 0 : -1), hole: (x, y, z) => v.hole(x, y, z), setze: (x, y, z, n) => v.setze(x, y, z, n), entities: new Map() };
}

/* ---------- Vorlagen erzeugen ---------- */
let grundCache = null;
export function grundstadt3D() {
  // graue Grundstadt (nur Oberfläche) – einmal erzeugt, danach immer kopiert
  if (!grundCache) {
    const w = new Welt(BEREICH_3D);
    baueGrundstadt(stift(w));
    grundCache = w;
  }
  return grundCache;
}
export function baueGrundstadt(p) {
  zeichneGrund(p);
  for (const id of BEREICH_IDS) BAUE[id](stift(p.w, boxVon(id)), BEREICHE[id].grund);
}
const vorlagenCache = new Map();
// Vorlage einer Variante: die graue Grundstadt in der Baufläche, darauf die Variante gebaut
export function vorlage(id, v) {
  const k = `${id}:${v}`;
  if (vorlagenCache.has(k)) return vorlagenCache.get(k);
  const box = boxVon(id), [nx, ny, nz] = groesseVon(id);
  const w = new Welt({ x0: box[0], y0: box[1], z0: box[2], nx, ny, nz });
  const p = stift(w, box);
  zeichneGrund(p);
  // Prüfhilfe: Schreibversuche der Variante außerhalb ihrer Baufläche zählen (Test: müssen 0 sein)
  let draussen = 0;
  const pv = { ...p, setze(x, y, z, n) { if (x < box[0] || x > box[3] || y < box[1] || y > box[4] || z < box[2] || z > box[5]) { draussen++; return; } p.setze(x, y, z, n); } };
  pv.quader = function (x1, y1, z1, x2, y2, z2, n) {
    if (Math.min(x1, x2) < box[0] || Math.max(x1, x2) > box[3] || Math.min(y1, y2) < box[1] || Math.max(y1, y2) > box[4] || Math.min(z1, z2) < box[2] || Math.max(z1, z2) > box[5]) draussen++;
    p.quader(x1, y1, z1, x2, y2, z2, n);
  };
  pv.schild = function (x, y, z, r, zeilen) { if (x < box[0] || x > box[3] || y < box[1] || y > box[4] || z < box[2] || z > box[5]) draussen++; p.schild(x, y, z, r, zeilen); };
  BAUE[id](pv, v);
  const t = w.ausschnitt([box.slice(0, 3), box.slice(3)]);
  t.draussen = draussen;
  vorlagenCache.set(k, t);
  return t;
}
// Vorlage schnell in eine Welt einsetzen (wie /clone … replace: jeder Block der Baufläche, auch Luft; Schilder mit)
export function einsetzen(w, id, t) {
  const [ox, oy, oz] = ursprungVon(id), [, , , bx, by, bz] = boxVon(id), B = w.bereich;
  for (const k of [...w.entities.keys()]) {
    const [x, y, z] = k.split(',').map(Number);
    if (x >= ox && x <= bx && y >= oy && y <= by && z >= oz && z <= bz) w.entities.delete(k);
  }
  for (let y = 0; y < t.dy; y++) {
    const wy = oy + y - B.y0;
    if (wy < 0 || wy >= B.ny) continue;
    for (let z = 0; z < t.dz; z++) {
      const q = (y * t.dz + z) * t.dx;
      w.daten.set(t.daten.subarray(q, q + t.dx), (wy * B.nz + (oz + z - B.z0)) * B.nx + (ox - B.x0));
    }
  }
  for (const [k, zeilen] of t.schilder) { const [x, y, z] = k.split(',').map(Number); w.entities.set(`${ox + x},${oy + y},${oz + z}`, { art: 'schild', zeilen }); }
}
export function stadtFuer(zustand) {
  // 3D-Welt für einen Entscheidungsstand { bereichId: variante }
  const g = grundstadt3D(), w = new Welt(BEREICH_3D);
  w.daten.set(g.daten);
  for (const [k, e] of g.entities) w.entities.set(k, e);
  for (const id of BEREICH_IDS) {
    const v = zustand[id] || BEREICHE[id].grund;
    if (v !== BEREICHE[id].grund) einsetzen(w, id, vorlage(id, v));
  }
  return w;
}

/* ---------- Messungen im Modell (keine erfundenen Zahlen) ---------- */
// Wohnen: Umrisse der Häuser je Variante (eine Quelle für Bau UND Messung). Alle Wohnungen gleich groß:
// 7 × 7 Felder je Geschoss bei A (2 Geschosse = 1 Wohnung), 14 × 7 bei B und C (1 Wohnung je Geschoss) – vereinfachtes Modell.
export const WOHNHAEUSER = {
  grau: { umrisse: [], geschosse: 0, wohnungenJeHaus: 0 },
  A: { umrisse: [[55, -57, 61, -51], [67, -57, 73, -51], [79, -57, 85, -51], [55, -39, 61, -33], [67, -39, 73, -33], [79, -39, 85, -33]], geschosse: 2, wohnungenJeHaus: 1 },
  B: { umrisse: [[64, -56, 77, -50], [64, -33, 77, -27]], geschosse: 3, wohnungenJeHaus: 3 },
  C: { umrisse: [[56, -58, 69, -52]], geschosse: 6, wohnungenJeHaus: 6 },
};
export const bebauteFlaeche = (v) => WOHNHAEUSER[v].umrisse.reduce((n, [a, b, c, d]) => n + (c - a + 1) * (d - b + 1), 0);
export const wohnungen = (v) => WOHNHAEUSER[v].umrisse.length * WOHNHAEUSER[v].wohnungenJeHaus;

// Fußweg vom Wohnhaus zu einem Ziel: Breitensuche über begehbare Felder (Gehwege, Plätze, Querungen, offene Türen)
const GEHBAR = new Set(['glattstein', 'andesit', 'betonHell', 'beton', 'kies', 'gras', 'pfad', 'eicheBretter', 'steinziegel', 'gruenBeton', 'sandstein', 'betonWeiss', 'limette', 'erde'].map((n) => ID[n]));
const FREI = (id) => id === ID.luft || istPflanze(id);
export function fussweg(hole, start, ziel) {
  const [x0, z0, x1, z1] = [STADT.x1, STADT.z1, STADT.x2, STADT.z2], nx = x1 - x0 + 1, nz = z1 - z0 + 1;
  const querung = (x, z) => QUERUNGEN.some((q) => (q.achse === 'x' ? x >= q.a && x <= q.b && z >= q.c1 && z <= q.c2 : z >= q.a && z <= q.b && x >= q.c1 && x <= q.c2));
  const geht = (x, z) => {
    const b = hole(x, BODEN, z);
    if (!(GEHBAR.has(b) || (b === ID.asphalt && querung(x, z)))) return false;
    return FREI(hole(x, S, z)) && FREI(hole(x, S + 1, z));
  };
  const vor = new Int32Array(nx * nz).fill(-1), idx = (x, z) => (z - z0) * nx + (x - x0);
  const q = [idx(...start)];
  vor[q[0]] = q[0];
  for (let h = 0; h < q.length; h++) {
    const k = q[h], x = (k % nx) + x0, z = Math.floor(k / nx) + z0;
    if (x === ziel[0] && z === ziel[1]) {
      const weg = [];
      for (let c = k; ; c = vor[c]) { weg.push([(c % nx) + x0, Math.floor(c / nx) + z0]); if (vor[c] === c) break; }
      return weg.reverse();
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = x + dx, c = z + dz;
      if (a < x0 || a > x1 || c < z0 || c > z1) continue;
      const n = idx(a, c);
      if (vor[n] >= 0 || !geht(a, c)) continue;
      vor[n] = k; q.push(n);
    }
  }
  return null;
}
export function einkaufsweg(variante) {
  // Weg auf der Stadt mit genau dieser Einkaufs-Variante (alle anderen Flächen grau – sie berühren den Weg nicht)
  const g = grundstadt3D(), t = vorlage('einkaufen', variante), [ax, ay, az] = ursprungVon('einkaufen');
  const [nx, ny, nz] = groesseVon('einkaufen');
  const hole = (x, y, z) => {
    const a = x - ax, b = y - ay, c = z - az;
    if (a >= 0 && b >= 0 && c >= 0 && a < nx && b < ny && c < nz) return t.hole(a, b, c);
    return g.hole(x, y, z);
  };
  return fussweg(hole, ORTE.wohnhaus.tuer, LADEN[variante].tuer);
}
