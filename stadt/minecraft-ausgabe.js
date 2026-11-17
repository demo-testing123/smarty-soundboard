/* START IT SMART – Stadt-Konfigurator: MINECRAFT-AUSGABE.
 *
 * EINE vorbereitete graue Welt, die während der Vorlesung geöffnet bleibt. Jede Variante jeder Baufläche liegt fertig gebaut
 * in einer Kammer UNTER ihrer Baufläche (gleiche Chunks). Ein Knopf im Regieraum oder ein Chat-Befehl kopiert sie mit
 * /clone … replace auf die Baufläche: sofort, ohne Block-für-Block-Bau, ohne neue Welt. Nachbarflächen bleiben unberührt.
 *
 * Keine direkte Verbindung Browser → Minecraft: Die Regie löst jeden Bauauftrag selbst aus (Knopf oder Chat).
 */
import { Welt } from '../minecraft/welt.js';
import { mcworld } from '../minecraft/mcworld.js';
import { BEREICH_MC, BEREICHE, BEREICH_IDS, boxVon, groesseVon, ursprungVon, baueGrundstadt, stift, vorlage, STADT, S } from './stadtmodell.js';
import { KAMERAS, MISSIONEN } from './daten.js';

const p3 = (v) => v.join(' ');
export const WELTNAME = 'START IT SMART Stadt 2050';
export const TICKING = { name: 'stadt', von: [STADT.x1, STADT.z1], bis: [STADT.x2, STADT.z2] };   // 10 × 10 Chunks (erlaubt: 100)
export const REGIERAUM = { x1: -12, z1: -13, x2: 29, z2: -5, boden: 49, stand: [8, 50, -7], blick: [8, 52, -13] };

// Variantennamen auf Schildern (nur ASCII, wie im Spielplatz-Test)
const KURZ = {
  spielplatz: { grau: 'GRAU', gruen: 'GRUEN' }, laternen: { immer: 'IMMER AN', sensor: 'SENSOR' },
  parken: { grau: 'GRAU', A: 'A vor Haus', B: 'B Strassen', C: 'C Parkhaus' }, kreuzung: { normal: 'NORMAL', bus: 'BUS FUNK' },
  wohnen: { grau: 'GRAU', A: 'A Gaerten', B: 'B Hof', C: 'C Park' }, aufstocken: { bestand: 'BESTAND', holz: '+2 HOLZ' },
  einkaufen: { grau: 'GRAU', A: 'A Stadtrand', B: 'B Mitte', C: 'C Laeden' }, bildung: { grau: 'GRAU', A: 'A Schule', B: 'B Bahnhof', C: 'C verteilt' },
};
const SCHILD_TITEL = { spielplatz: 'SPIELPLATZ', laternen: 'LATERNEN', parken: 'PARKEN', kreuzung: 'KREUZUNG', wohnen: 'WOHNEN', aufstocken: 'AUFSTOCKEN', einkaufen: 'EINKAUFEN', bildung: 'BILDUNG' };

/* ---------- Kammern ---------- */
export function kammer(id, v) {
  const k = BEREICHE[id].mc.indexOf(v);
  if (k < 0) return null;
  const [a, b, c, d, e, f] = boxVon(id), H = e - b + 1, oben = b - 5 - k * (H + 4);
  return [[a, oben - H + 1, c], [d, oben, f]];
}
export const anzahlBloecke = (id) => groesseVon(id).reduce((x, y) => x * y, 1);

/* ---------- Ansichten (Teleport-Punkte über der Stadt) ---------- */
export function ansicht(key) {
  const k = KAMERAS[key], a = (k.azimut * Math.PI) / 180, e = (k.hoehe * Math.PI) / 180;
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  let d = k.zoom * 1.55;
  const pos = () => k.ziel.map((z, i) => Math.round(z + dir[i] * d));
  let p = pos();
  while ((p[0] > STADT.x2 - 2 || p[0] < STADT.x1 + 2 || p[2] > STADT.z2 - 2 || p[2] < STADT.z1 + 2 || p[1] > 150) && d > 10) { d *= 0.95; p = pos(); }
  // nicht innerhalb einer Baufläche stehen (sonst würde ein Bauauftrag die Plattform überschreiben)
  for (const id of BEREICH_IDS) {
    const [x1, y1, z1, x2, y2, z2] = boxVon(id);
    if (p[0] >= x1 - 1 && p[0] <= x2 + 1 && p[2] >= z1 - 1 && p[2] <= z2 + 1 && p[1] >= y1 - 1 && p[1] <= y2 + 2) p[1] = y2 + 3;
  }
  return { stand: p, blick: k.ziel.map(Math.round), titel: k.titel };
}
export const ANSICHTEN = ['gesamt', 'platz', 'laternen', 'wohnstrasse', 'kreuzung', 'wohnen', 'aufstocken', 'einkaufen', 'wohnhaus', 'bildung'];

/* ---------- Befehle ---------- */
export function befehle(id, v) {
  const kb = kammer(id, v), [x1, y1, z1] = ursprungVon(id), box = boxVon(id);
  if (!kb) return null;
  return {
    bauen: `/clone ${p3(kb[0])} ${p3(kb[1])} ${p3([x1, y1, z1])}`,
    pruefen: `/testforblocks ${p3(kb[0])} ${p3(kb[1])} ${p3([x1, y1, z1])} all`,
    zuruecksetzen: `/clone ${p3(kammer(id, BEREICHE[id].grund)[0])} ${p3(kammer(id, BEREICHE[id].grund)[1])} ${p3([x1, y1, z1])}`,
    flaeche: `${p3(box.slice(0, 3))} bis ${p3(box.slice(3))}`,
    kammer: `${p3(kb[0])} bis ${p3(kb[1])}`,
    bloecke: anzahlBloecke(id),
  };
}
export function tp(key, wer = '@s') { const a = ansicht(key); return `/tp ${wer} ${p3(a.stand)} facing ${p3(a.blick)}`; }
export const ALLGEMEIN = {
  ticking: `/tickingarea add ${TICKING.von[0]} 0 ${TICKING.von[1]} ${TICKING.bis[0]} 0 ${TICKING.bis[1]} ${TICKING.name}`,
  regieraum: `/tp @s ${p3(REGIERAUM.stand)} facing ${p3(REGIERAUM.blick)}`,
  tag: '/time set noon',
  nacht: '/time set midnight',
  ruhe: '/gamerule sendcommandfeedback false',
};

/* ---------- Welt bauen ---------- */
function befehlsblock(p, x, y, z, befehl, name, knopf, schildPos, schildRichtung, zeilen) {
  p.setze(x, y, z, 'befehlsblock');
  p.w.entities.set(`${x},${y},${z}`, { art: 'befehl', befehl: befehl.replace(/^\//, ''), name });
  p.setze(knopf[0], knopf[1], knopf[2], knopf[3]);
  if (schildPos) p.schild(schildPos[0], schildPos[1], schildPos[2], schildRichtung, zeilen);
}
export function regieKnoepfe() {
  // untere Reihe: Bauaufträge (je Fläche alle Varianten), obere Reihe: Ansichten, Zeit, Einrichten
  const unten = [], oben = [];
  for (const m of MISSIONEN) for (const id of m.bereiche) {
    for (const v of BEREICHE[id].mc) unten.push({ id, v, befehl: befehle(id, v).bauen, zeilen: [SCHILD_TITEL[id], KURZ[id][v], m.kurz.toUpperCase().replace('Ä', 'AE').replace('Ü', 'UE').replace('Ö', 'OE')] });
    unten.push(null);
  }
  for (const k of ANSICHTEN) oben.push({ befehl: tp(k, '@p'), zeilen: ['ANSICHT', KAMERAS[k].titel.replace('ß', 'ss').replace('ä', 'ae').replace('ü', 'ue').replace('ö', 'oe')] });
  oben.push(null, { befehl: ALLGEMEIN.tag, zeilen: ['ZEIT', 'TAG'] }, { befehl: ALLGEMEIN.nacht, zeilen: ['ZEIT', 'NACHT'] }, null, { befehl: ALLGEMEIN.ticking, zeilen: ['EINMALIG', 'Stadt immer', 'geladen halten'] });
  while (unten.length && unten[unten.length - 1] === null) unten.pop();
  return { unten, oben };
}
export function erzeugeStadtWelt() {
  const w = new Welt(BEREICH_MC), p = stift(w);
  baueGrundstadt(p);
  // Vorlagen-Kammern: Decke und Boden aus Andesit (nur über der eigenen Fläche), Licht in der Decke, Inhalt = Vorlage
  for (const id of BEREICH_IDS) for (const v of BEREICHE[id].mc) {
    const [a, e] = kammer(id, v);
    p.quader(a[0], a[1] - 1, a[2], e[0], a[1] - 1, e[2], 'andesit');
    p.quader(a[0], e[1] + 1, a[2], e[0], e[1] + 1, e[2], 'andesit');
    for (let z = a[2] + 2; z <= e[2]; z += 6) for (let x = a[0] + 2; x <= e[0]; x += 6) p.setze(x, e[1] + 1, z, 'licht');
    p.einsetzen(vorlage(id, v), a);
  }
  // Regieraum unter der Ringstraße Nord (keine Baufläche darüber, keine Kammer daneben)
  const R = REGIERAUM, y0 = R.boden;
  p.quader(R.x1 - 1, y0, R.z1 - 1, R.x2 + 1, y0 + 8, R.z2 + 1, 'betonWeiss');
  p.quader(R.x1, y0 + 1, R.z1 + 1, R.x2, y0 + 7, R.z2, 'luft');
  p.quader(R.x1, y0, R.z1, R.x2, y0, R.z2, 'fichteBretter');
  for (let x = R.x1 + 2; x <= R.x2; x += 5) for (let z = R.z1 + 2; z <= R.z2; z += 4) p.setze(x, y0 + 8, z, 'licht');
  const { unten, oben } = regieKnoepfe();
  const reihe = (liste, y) => liste.forEach((k, i) => {
    if (!k) return;
    const x = R.x1 + 1 + i;
    befehlsblock(p, x, y, R.z1, k.befehl, k.zeilen.join(' '), [x, y, R.z1 + 1, 'knopfSued'], [x, y + 1, R.z1 + 1], 'Sued', k.zeilen);
  });
  reihe(unten, y0 + 2);
  reihe(oben, y0 + 5);
  p.schild(R.x2 - 1, y0 + 3, R.z2, 'Nord', ['REGIERAUM', 'unten: bauen', 'oben: Ansichten', 'Zeit, Einrichten']);
  p.setze(R.x2 - 1, y0 + 3, R.z2 + 1, 'betonWeiss');
  // Ansichtspunkte: unsichtbare Plattform (Barriere) und ein ZURUECK-Knopf hinter dem Standplatz
  for (const k of ANSICHTEN) {
    const { stand: [x, y, z], blick } = ansicht(k);
    p.quader(x - 1, y - 1, z - 1, x + 1, y - 1, z + 1, 'sperre');
    p.quader(x - 1, y, z - 1, x + 1, y + 2, z + 1, 'luft');
    const dx = Math.sign(x - blick[0]), dz = Math.sign(z - blick[2]), bx = x + (Math.abs(x - blick[0]) > Math.abs(z - blick[2]) ? dx : 0), bz = z + (Math.abs(x - blick[0]) > Math.abs(z - blick[2]) ? 0 : dz);
    befehlsblock(p, bx, y - 1, bz, ALLGEMEIN.regieraum.replace('@s', '@p'), 'Zurueck', [bx, y, bz, 'knopf'], null);
  }
  return w;
}
export async function stadtMcworld() {
  const w = erzeugeStadtWelt();
  return { daten: await mcworld(w, WELTNAME, REGIERAUM.stand), welt: w };
}

/* ---------- Bauaufträge als Text ---------- */
export function bauauftrag(id, v, titelVariante) {
  const b = befehle(id, v);
  if (!b) return null;
  const knopf = `Regieraum, untere Reihe: Schild „${SCHILD_TITEL[id]} – ${KURZ[id][v]}“`;
  return [
    `BAUAUFTRAG ${BEREICHE[id].titel}: ${titelVariante || v}`,
    `Baufläche: ${b.flaeche} (${b.bloecke.toLocaleString('de-DE')} Blöcke)`,
    `Vorlage (Kammer): ${b.kammer}`,
    `Auslösen: ${knopf} – oder im Chat:`,
    `   ${b.bauen}`,
    `Prüfen:   ${b.pruefen}`,
    `          Erwartet: ${b.bloecke.toLocaleString('de-DE')} Blöcke verglichen, keine Abweichung.`,
    `Zurück:   ${b.zuruecksetzen}`,
    `Nur diese Baufläche ändert sich; Nachbarflächen und frühere Beschlüsse bleiben.`,
  ].join('\n');
}
export function alleBauauftraege() {
  const t = [`START IT SMART – Bauaufträge für Minecraft Education (Welt „${WELTNAME}“)`, '',
    'EINMAL VOR DER VORLESUNG', `   ${ALLGEMEIN.ticking}`, '   (hält die ganze Stadt geladen; 10 × 10 Chunks = die erlaubte Höchstgröße)', `   ${ALLGEMEIN.ruhe}`, '',
    'REGIERAUM', `   ${ALLGEMEIN.regieraum}`, '', 'ANSICHTEN'];
  for (const k of ANSICHTEN) t.push(`   ${KAMERAS[k].titel.padEnd(16)} ${tp(k)}`);
  t.push('', 'ZEIT', `   Tag:   ${ALLGEMEIN.tag}`, `   Nacht: ${ALLGEMEIN.nacht}`, '');
  for (const m of MISSIONEN) for (const id of m.bereiche) {
    t.push(`==== ${m.titel} ====`);
    for (const v of BEREICHE[id].mc) t.push(bauauftrag(id, v), '');
  }
  return t.join('\n');
}
