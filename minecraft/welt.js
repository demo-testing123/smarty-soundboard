/* Spielplatz-Test für Minecraft Education – Weltmodell ohne Grafik und ohne Dateiformat.
 *
 * Idee: Der sichtbare Platz und seine fertig gebauten Varianten liegen in DERSELBEN Welt.
 * Die Varianten stehen in geschlossenen Vorlagen-Kammern direkt unter dem Platz (gleiche Chunks,
 * also immer geladen, wenn der Platz geladen ist). Ein einziger /clone-Befehl kopiert eine Kammer
 * auf den Platz. Modus „replace“ überschreibt dabei JEDEN Block des Platzes, auch mit Luft:
 * Es bleibt nichts Altes stehen, und außerhalb des Platz-Quaders wird nichts verändert.
 *
 * Koordinaten: x nach Osten, z nach Süden, y nach oben. Oberste Bodenschicht y = 63, man steht auf y = 64
 * (wie die flache Welt, die Minecraft außerhalb des erzeugten Bereichs weiterbaut).
 */

/* ---------- Blöcke ----------
 * Namen und Zustände wie im Bedrock-Exporter des Stadt-Konfigurators (Stand 1.20.70, Blockversion 18105860).
 * Minecraft wandelt diese älteren Namen beim Laden selbst in die aktuellen um. Neu dazu kommen nur
 * command_block und stone_button, die es seit Langem unverändert gibt. */
export const BLOCK_VERSION = 18105860;
const b = (v) => ['byte', v], i = (v) => ['int', v], s = (v) => ['string', v];
const LAUB = { persistent_bit: b(1), update_bit: b(0) };       // persistent: Laub zerfällt nicht
const treppe = (r) => ['spruce_stairs', { upside_down_bit: b(0), weirdo_direction: i(r) }, '#7a5a3a'];
const schild = (r) => ['wall_sign', { facing_direction: i(r) }, '#c49a65'];

// [Bedrock-Name, Zustände, Farbe für die Draufsicht auf der Webseite]
export const BLOECKE = {
  luft: ['air', {}, null],
  grundgestein: ['bedrock', { infiniburn_bit: b(0) }, '#555555'],
  erde: ['dirt', { dirt_type: s('normal') }, '#8b6a4a'],
  grobeErde: ['dirt', { dirt_type: s('coarse') }, '#7a5c40'],
  gras: ['grass_block', {}, '#79b04a'],
  moos: ['moss_block', {}, '#5f8a35'],
  kies: ['gravel', {}, '#a59d95'],
  beton: ['gray_concrete', {}, '#5d6068'],
  betonHell: ['light_gray_concrete', {}, '#a3a39f'],
  betonWeiss: ['white_concrete', {}, '#e6e6e2'],
  asphalt: ['black_concrete', {}, '#2c2d33'],
  glattstein: ['smooth_stone', {}, '#b9b8b4'],
  andesit: ['polished_andesite', {}, '#8f979e'],
  schwarzstein: ['polished_blackstone', {}, '#3d3a44'],
  steinziegel: ['stonebrick', { stone_brick_type: s('default') }, '#7c7c7c'],
  moosziegel: ['stonebrick', { stone_brick_type: s('mossy') }, '#6f7d5f'],
  fenster: ['light_blue_stained_glass', {}, '#9cc9dc'],
  wasser: ['water', { liquid_depth: i(0) }, '#2f74d0'],
  markierung: ['light_blue_concrete', {}, '#35b0dc'],
  rohr: ['waxed_oxidized_cut_copper', {}, '#5fa591'],
  gelb: ['yellow_concrete', {}, '#f1c232'],
  rot: ['red_concrete', {}, '#b83c3c'],
  eicheStamm: ['oak_log', { pillar_axis: s('y') }, '#6b5232'],
  eicheLiegendX: ['oak_log', { pillar_axis: s('x') }, '#6b5232'],
  birkeStamm: ['birch_log', { pillar_axis: s('y') }, '#d8d3c4'],
  fichteStamm: ['spruce_log', { pillar_axis: s('y') }, '#4a3622'],
  fichteStammX: ['spruce_log', { pillar_axis: s('x') }, '#4a3622'],
  balkenX: ['stripped_oak_log', { pillar_axis: s('x') }, '#b48e60'],
  eicheLaub: ['oak_leaves', LAUB, '#3f7f2a'],
  birkeLaub: ['birch_leaves', LAUB, '#7aa84a'],
  azalee: ['azalea_leaves_flowered', LAUB, '#8a9d4a'],
  fichteBretter: ['spruce_planks', {}, '#7a5a3a'],
  eicheBretter: ['oak_planks', {}, '#b8945f'],
  fichteHalb: ['spruce_slab', { 'minecraft:vertical_half': s('bottom') }, '#86653f'],
  bankOst: treppe(0), bankWest: treppe(1), bankSued: treppe(2), bankNord: treppe(3),
  farn: ['tallgrass', { tall_grass_type: s('fern') }, '#4f8a35'],
  hohesGras: ['tallgrass', { tall_grass_type: s('tall') }, '#6aa13f'],
  mohn: ['red_flower', { flower_type: s('poppy') }, '#d23a2a'],
  kornblume: ['red_flower', { flower_type: s('cornflower') }, '#4a6fd8'],
  margerite: ['red_flower', { flower_type: s('oxeye') }, '#f4f4f0'],
  loewenzahn: ['yellow_flower', {}, '#f3d23a'],
  insektenhotel: ['bookshelf', {}, '#9a6a3a'],
  heu: ['hay_block', { deprecated: i(0), pillar_axis: s('y') }, '#d6b03a'],
  laterne: ['lantern', { hanging: b(0) }, '#f0c060'],
  kette: ['chain', { pillar_axis: s('y') }, '#4b4b4b'],
  licht: ['sea_lantern', {}, '#dfeee8'],
  befehlsblock: ['command_block', { conditional_bit: b(0), facing_direction: i(3) }, '#c08050'],
  knopf: ['stone_button', { button_pressed_bit: b(0), facing_direction: i(1) }, '#888888'],
  schildNord: schild(2), schildSued: schild(3), schildWest: schild(4), schildOst: schild(5),
};
export const NAMEN = Object.keys(BLOECKE);
export const ID = Object.fromEntries(NAMEN.map((n, k) => [n, k]));
const PFLANZEN = new Set(['farn', 'hohesGras', 'mohn', 'kornblume', 'margerite', 'loewenzahn'].map((n) => ID[n]));
const SCHILDER = new Set(['schildNord', 'schildSued', 'schildWest', 'schildOst'].map((n) => ID[n]));
export const istPflanze = (id) => PFLANZEN.has(id);
export const istSchild = (id) => SCHILDER.has(id);

/* ---------- Koordinaten (alle Befehle und Prüfungen werden daraus berechnet) ---------- */
export const BODEN_Y = 63;                                      // oberste Bodenschicht
// Platz-Quader: 32 × 16 × 32 Blöcke. Unten 4 Schichten Untergrund (für Mulde und Zisterne),
// dann die Bodenschicht (relativ y 4) und 11 Schichten Luft für Bäume und Spielgeräte.
export const PLATZ = { x: 0, y: 59, z: 0, dx: 32, dy: 16, dz: 32, boden: 4 };
// Vorlagen-Kammern direkt unter dem Platz (gleiche x/z, also dieselben Chunks)
export const VORLAGEN = {
  grau: { titel: 'Grau', untertitel: 'Ausgangszustand: versiegelter, heißer Platz', ursprung: [0, 39, 0] },
  gruen: { titel: 'Grün', untertitel: 'Natur-Abenteuerspielplatz mit Regenmulde und Zisterne', ursprung: [0, 19, 0] },
};
// Kontrollkopie: Platz plus 4 Blöcke Rand ringsum im Ausgangszustand – zum Prüfen mit /testforblocks
export const KONTROLLE = { rand: 4, ursprung: [-4, -1, -4] };
export const REGIE = { stand: [17, 80, 47], blick: [16, 63, 14] };          // Regieplatz (Startpunkt)
export const WASSERBLICK = { stand: [16, 70, 38], blick: [14, 61, 16] };    // Aussicht auf Mulde, Spielfläche, Zisterne
export const TICKING = { name: 'spielplatz', von: [-8, -8], bis: [39, 39] };
// erzeugter Bereich der Welt; außerhalb baut Minecraft flache Welt weiter
export const BEREICH = { x0: -48, z0: -48, nx: 128, nz: 128, y0: -64, ny: 192 };

const ende = (o, d) => [o[0] + d.dx - 1, o[1] + d.dy - 1, o[2] + d.dz - 1];
export const platzBox = () => [[PLATZ.x, PLATZ.y, PLATZ.z], ende([PLATZ.x, PLATZ.y, PLATZ.z], PLATZ)];
export const vorlageBox = (k) => [VORLAGEN[k].ursprung, ende(VORLAGEN[k].ursprung, PLATZ)];
export function kontrollBox() {
  const r = KONTROLLE.rand, [[x1, y1, z1], [x2, y2, z2]] = platzBox();
  return [[x1 - r, y1, z1 - r], [x2 + r, y2, z2 + r]];
}
export function kontrollKopieBox() {
  const [[x1, y1, z1], [x2, y2, z2]] = kontrollBox(), [ox, oy, oz] = KONTROLLE.ursprung;
  return [[ox, oy, oz], [ox + x2 - x1, oy + y2 - y1, oz + z2 - z1]];
}

/* ---------- Befehle ---------- */
const p3 = (v) => v.join(' ');
export function befehle() {
  const [pa] = platzBox();
  const clone = (k) => `/clone ${p3(vorlageBox(k)[0])} ${p3(vorlageBox(k)[1])} ${p3(pa)}`;
  const [ka, kb] = kontrollBox(), [kk] = kontrollKopieBox();
  const r = KONTROLLE.rand, [[x1, , z1], [x2, , z2]] = platzBox();
  // Randstreifen einzeln prüfen, solange der Platz grün ist (der Platz selbst weicht dann ja ab)
  const off = (x, z) => [kk[0] + (x - ka[0]), kk[1], kk[2] + (z - ka[2])];
  const streifen = [
    ['Nord', [ka[0], ka[1], ka[2]], [kb[0], kb[1], z1 - 1]],
    ['Süd', [ka[0], ka[1], z2 + 1], [kb[0], kb[1], kb[2]]],
    ['West', [ka[0], ka[1], z1], [x1 - 1, kb[1], z2]],
    ['Ost', [x2 + 1, ka[1], z1], [kb[0], kb[1], z2]],
  ].map(([n, a, e]) => [n, `/testforblocks ${p3(a)} ${p3(e)} ${p3(off(a[0], a[2]))} all`]);
  return {
    grau: clone('grau'),
    gruen: clone('gruen'),
    uebersicht: `/tp @s ${p3(REGIE.stand)} facing ${p3(REGIE.blick)}`,
    wasser: `/tp @s ${p3(WASSERBLICK.stand)} facing ${p3(WASSERBLICK.blick)}`,
    ticking: `/tickingarea add ${TICKING.von[0]} 0 ${TICKING.von[1]} ${TICKING.bis[0]} 0 ${TICKING.bis[1]} ${TICKING.name}`,
    pruefeGrau: `/testforblocks ${p3(ka)} ${p3(kb)} ${p3(kk)} all`,
    pruefeGruen: `/testforblocks ${p3(vorlageBox('gruen')[0])} ${p3(vorlageBox('gruen')[1])} ${p3(pa)} all`,
    pruefeRand: streifen,
    zuKammer: (k) => `/tp @s ${VORLAGEN[k].ursprung[0] + 16} ${VORLAGEN[k].ursprung[1] + PLATZ.boden + 1} ${VORLAGEN[k].ursprung[2] + 24} facing 16 ${VORLAGEN[k].ursprung[1] + 6} 8`,
    // optional: gespeicherte Strukturen mit Aufbau-Animation (einmal speichern, dann laden)
    strukturSpeichern: (k) => `/structure save spielplatz_${k} ${p3(vorlageBox(k)[0])} ${p3(vorlageBox(k)[1])} false disk true`,
    strukturLaden: (k, sek = 0) => `/structure load spielplatz_${k} ${p3(pa)}` + (sek ? ` 0_degrees none layer_by_layer ${sek}` : ''),
    gamerule: '/gamerule sendcommandfeedback false',
    // Kontrollkopie neu anlegen, nachdem jemand den Rand ums Platz bewusst umgebaut hat (nur bei GRAUEM Platz!)
    kontrollNeu: `/clone ${p3(ka)} ${p3(kb)} ${p3(kk)}`,
  };
}

/* ---------- Vorlage: ein Quader mit Blöcken und Schildern ---------- */
export class Vorlage {
  constructor(dx = PLATZ.dx, dy = PLATZ.dy, dz = PLATZ.dz) {
    Object.assign(this, { dx, dy, dz });
    this.daten = new Uint8Array(dx * dy * dz);
    this.schilder = new Map();                       // "x,y,z" -> Zeilen
  }
  innen(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.dx && y < this.dy && z < this.dz; }
  hole(x, y, z) { return this.innen(x, y, z) ? this.daten[(y * this.dz + z) * this.dx + x] : 0; }
  setze(x, y, z, n) { if (this.innen(x, y, z)) this.daten[(y * this.dz + z) * this.dx + x] = typeof n === 'number' ? n : ID[n]; }
  quader(x1, y1, z1, x2, y2, z2, n) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) this.setze(x, y, z, n);
  }
  schild(x, y, z, richtung, zeilen) { this.setze(x, y, z, 'schild' + richtung); this.schilder.set(`${x},${y},${z}`, zeilen); }
  zaehle(n) { const id = ID[n]; let c = 0; for (const v of this.daten) if (v === id) c++; return c; }
}

// kleiner, fester Zufallsgenerator: dieselbe Welt bei jedem Erzeugen
function zufall(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const B = PLATZ.boden;              // relative Höhe der Bodenschicht in der Vorlage
const S = B + 1;                    // darauf steht man

/* ---------- Vorlage GRAU: versiegelt, heiß, wenig einladend ---------- */
export function vorlageGrau() {
  const v = new Vorlage();
  v.quader(0, 0, 0, 31, B - 2, 31, 'erde');
  v.quader(0, B - 1, 0, 31, B - 1, 31, 'kies');              // Schotter-Unterbau
  for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++)
    v.setze(x, B, z, x % 8 === 0 || z % 8 === 0 ? 'betonHell' : 'beton');   // Betonplatten mit Fugen
  for (const [x, z] of [[8, 16], [24, 16], [16, 8], [16, 24]]) v.setze(x, B, z, 'asphalt');  // Abflüsse
  for (const [x, z] of [[5, 5], [26, 5], [5, 26], [26, 26], [12, 28], [19, 28]]) v.setze(x, S, z, 'betonHell'); // Betonwürfel
  v.quader(10, S, 3, 21, S, 3, 'beton');                     // lange Betonbank ohne Lehne
  v.quader(15, S, 15, 16, S + 3, 16, 'schwarzstein');        // ein Lichtmast in der Mitte
  v.quader(15, S + 4, 15, 16, S + 4, 16, 'licht');
  return v;
}

/* ---------- Vorlage GRÜN: Natur-Abenteuerspielplatz (Drehbuch: „Beides gemeinsam!“) ----------
 * Bäume und Schatten, Wiese und wilde Ecke, wasserdurchlässige Kieswege, Spielgeräte,
 * bepflanzte Regenmulde, tiefer liegender Spielbereich mit Sitzstufen, markierte Zisterne mit Gießleitung.
 * Die genaue Gestaltung ist ein Entwurf: Das Team kann sie in der Vorlagen-Kammer direkt umbauen. */
export const GRUEN_TEILE = {
  wildeEcke: [1, 1, 9, 9],
  kletterturm: [11, 2, 17, 10],
  schaukel: [20, 1, 26, 3],
  balancieren: [21, 7, 30, 11],
  mulde: [2, 13, 8, 21],
  tieferSpielbereich: [10, 12, 21, 22],
  zisterne: [23, 13, 28, 18],
};

export function vorlageGruen() {
  const v = new Vorlage(), rnd = zufall(2050);
  v.quader(0, 0, 0, 31, B - 1, 31, 'erde');
  v.quader(0, B, 0, 31, B, 31, 'gras');

  // wasserdurchlässige Kieswege: Eingang Süd, Eingang West, Verbindung zum Kletterturm
  v.quader(15, B, 23, 16, B, 31, 'kies');
  v.quader(0, B, 11, 9, B, 12, 'kies');
  v.quader(15, B, 9, 16, B, 11, 'kies');
  v.quader(17, B, 23, 22, B, 24, 'kies');
  v.quader(22, B, 19, 23, B, 23, 'kies');

  // tiefer liegender Spielbereich: Rand eine Stufe tiefer, innen zwei Stufen tiefer
  const [tx1, tz1, tx2, tz2] = GRUEN_TEILE.tieferSpielbereich;
  v.quader(tx1, B, tz1, tx2, B, tz2, 'luft');
  v.quader(tx1, B - 1, tz1, tx2, B - 1, tz2, 'gras');
  v.quader(tx1 + 1, B - 1, tz1 + 1, tx2 - 1, B - 1, tz2 - 1, 'luft');
  v.quader(tx1 + 1, B - 2, tz1 + 1, tx2 - 1, B - 2, tz2 - 1, 'gras');
  for (let x = tx1 + 1; x <= tx2 - 1; x += 2) { v.setze(x, B, tz1, 'fichteHalb'); v.setze(x, B, tz2, 'fichteHalb'); } // Sitzstufen
  for (const [x, z, h] of [[13, 15, 1], [15, 17, 2], [18, 15, 1], [17, 19, 1], [12, 19, 2]])         // Baumstümpfe zum Klettern
    v.quader(x, B - 1, z, x, B - 2 + h, z, 'eicheStamm');
  v.quader(19, B - 1, 18, 20, B, 19, 'moosziegel');                                                   // Kletterfelsen
  v.quader(14, S, 23, 14, S + 1, 23, 'fichteStamm');                                                  // Schild-Pfosten
  v.schild(14, S + 1, 24, 'Sued', ['Tiefer Spielbereich', 'Bei Starkregen darf', 'sich hier Wasser', 'sammeln']);

  // bepflanzte Regenmulde (eine Stufe tiefer) mit Zulauf vom Weg
  const [mx1, mz1, mx2, mz2] = GRUEN_TEILE.mulde;
  v.quader(mx1, B, mz1, mx2, B, mz2, 'luft');
  v.quader(mx1, B - 1, mz1, mx2, B - 1, mz2, 'gras');
  v.quader(5, B, 13, 5, B, 13, 'kies');
  for (let z = mz1; z <= mz2; z++) for (let x = mx1; x <= mx2; x++) {
    if (x === 5 && z === 13) continue;
    const r = rnd();
    v.setze(x, B, z, r < 0.35 ? 'farn' : r < 0.5 ? 'kornblume' : r < 0.62 ? 'margerite' : r < 0.75 ? 'hohesGras' : 'luft');
  }
  v.quader(1, S, 22, 1, S + 1, 22, 'fichteStamm');
  v.schild(1, S + 1, 23, 'Sued', ['Regenmulde', 'Hier kann Regen', 'versickern']);

  // Zisterne: unterirdischer Wasserspeicher, mit Glas abgedeckt und hellblau markiert
  const [zx1, zz1, zx2, zz2] = GRUEN_TEILE.zisterne;
  v.quader(zx1, 0, zz1, zx2, B - 1, zz2, 'glattstein');
  v.quader(zx1 + 1, 1, zz1 + 1, zx2 - 1, B - 1, zz2 - 1, 'wasser');
  v.quader(zx1, B, zz1, zx2, B, zz2, 'markierung');
  v.quader(zx1 + 1, B, zz1 + 1, zx2 - 1, B, zz2 - 1, 'fenster');
  v.quader(zx2, S, zz2 + 1, zx2, S, zz2 + 4, 'rohr');                  // Gießleitung zum Baum
  v.quader(zx1 - 1, S, zz1 - 1, zx1 - 1, S + 1, zz1 - 1, 'fichteStamm');
  v.schild(zx1 - 1, S + 1, zz1, 'Sued', ['Zisterne', 'Regenwasser', 'zum Giessen', 'der Baeume']);

  // Kletterturm mit Stufen und Rutsche
  v.quader(12, S, 3, 15, S + 2, 6, 'luft');
  for (const [x, z] of [[12, 3], [15, 3], [12, 6], [15, 6]]) v.quader(x, S, z, x, S + 3, z, 'fichteStamm');
  v.quader(12, S + 3, 3, 15, S + 3, 6, 'fichteBretter');
  for (const [x, z] of [[12, 3], [15, 3], [12, 6], [15, 6]]) v.setze(x, S + 4, z, 'laterne');
  v.quader(13, S, 9, 14, S, 9, 'fichteBretter'); v.quader(13, S, 8, 14, S + 1, 8, 'fichteBretter'); v.quader(13, S, 7, 14, S + 2, 7, 'fichteBretter');
  v.quader(16, S + 2, 4, 16, S + 2, 5, 'gelb'); v.quader(17, S + 1, 4, 17, S + 1, 5, 'gelb'); v.quader(18, S, 4, 18, S, 5, 'gelb');

  // Schaukel
  v.quader(20, S, 2, 20, S + 4, 2, 'fichteStamm'); v.quader(26, S, 2, 26, S + 4, 2, 'fichteStamm');
  v.quader(21, S + 4, 2, 25, S + 4, 2, 'fichteStammX');
  for (const x of [22, 24]) { v.quader(x, S + 2, 2, x, S + 3, 2, 'kette'); v.setze(x, S + 1, 2, 'fichteHalb'); }

  // Balancierbalken und Trittstämme
  v.quader(21, S, 8, 27, S, 8, 'balkenX');
  for (const [x, z, h] of [[22, 10, 1], [24, 10, 2], [26, 10, 1], [28, 9, 2]]) v.quader(x, S, z, x, S + h - 1, z, 'eicheStamm');

  // wilde Ecke: Lebensraum mit Insektenhotel und Totholz
  const [wx1, wz1, wx2, wz2] = GRUEN_TEILE.wildeEcke;
  for (let z = wz1; z <= wz2; z++) for (let x = wx1; x <= wx2; x++) {
    const r = rnd();
    v.setze(x, S, z, r < 0.4 ? 'hohesGras' : r < 0.6 ? 'farn' : r < 0.7 ? 'mohn' : r < 0.78 ? 'loewenzahn' : 'luft');
  }
  v.quader(3, S, 2, 4, S + 2, 2, 'insektenhotel'); v.quader(3, S + 3, 2, 4, S + 3, 2, 'fichteHalb');
  v.quader(6, S, 7, 8, S, 7, 'eicheLiegendX'); v.quader(7, S + 1, 7, 8, S + 1, 7, 'eicheLiegendX');
  v.quader(1, S, 1, 1, S, 9, 'azalee');                                  // niedrige Hecke

  // Bäume für Schatten
  const baeume = [[7, 4, 'eiche', 5], [29, 6, 'birke', 5], [29, 22, 'eiche', 6], [4, 27, 'eiche', 6], [12, 27, 'birke', 5], [25, 28, 'eiche', 5], [9, 15, 'birke', 5]];
  for (const [x, z, art, h] of baeume) baum(v, x, z, art, h);

  // Bänke im Schatten und ein Picknicktisch
  v.quader(3, S, 24, 6, S, 24, 'bankSued'); v.quader(22, S, 26, 24, S, 26, 'bankSued'); v.quader(9, S, 29, 11, S, 29, 'bankNord');
  v.quader(19, S, 29, 20, S, 29, 'fichteBretter'); v.setze(18, S, 29, 'bankOst'); v.setze(21, S, 29, 'bankWest');

  // Wiese: Blumen und Gras auf freien Rasenflächen
  for (let z = 0; z < 32; z++) for (let x = 0; x < 32; x++) {
    if (v.hole(x, B, z) !== ID.gras || v.hole(x, S, z) !== ID.luft) continue;
    const r = rnd();
    if (r < 0.1) v.setze(x, S, z, 'hohesGras'); else if (r < 0.14) v.setze(x, S, z, 'loewenzahn'); else if (r < 0.17) v.setze(x, S, z, 'margerite');
  }
  return v;
}

function baum(v, x, z, art, h) {
  const stamm = art === 'birke' ? 'birkeStamm' : 'eicheStamm', laub = art === 'birke' ? 'birkeLaub' : 'eicheLaub';
  const oben = S + h - 1;
  const lage = (y, r, ecken) => {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (!ecken && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      const w = v.hole(x + dx, y, z + dz);
      if (w === ID.luft || istPflanze(w)) v.setze(x + dx, y, z + dz, laub);
    }
  };
  lage(oben - 2, 2, false); lage(oben - 1, 2, false); lage(oben, 1, true);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (v.hole(x + dx, oben + 1, z + dz) === ID.luft) v.setze(x + dx, oben + 1, z + dz, laub);
  v.quader(x, S, z, x, oben, z, stamm);
  v.setze(x, B, z, 'erde');
}

/* ---------- Welt ---------- */
export class Welt {
  constructor() {
    const { nx, nz, ny } = BEREICH;
    this.daten = new Uint8Array(nx * nz * ny);
    this.entities = new Map();             // "x,y,z" -> { art: 'schild', zeilen } | { art: 'befehl', befehl, name }
  }
  index(x, y, z) {
    const { x0, z0, y0, nx, nz, ny } = BEREICH;
    const a = x - x0, c = z - z0, h = y - y0;
    if (a < 0 || c < 0 || h < 0 || a >= nx || c >= nz || h >= ny) return -1;
    return (h * nz + c) * nx + a;
  }
  hole(x, y, z) { const k = this.index(x, y, z); return k < 0 ? 0 : this.daten[k]; }
  setze(x, y, z, n) {
    const k = this.index(x, y, z);
    if (k < 0) throw new Error(`außerhalb des Bereichs: ${x} ${y} ${z}`);
    this.daten[k] = typeof n === 'number' ? n : ID[n];
    this.entities.delete(`${x},${y},${z}`);
  }
  quader(x1, y1, z1, x2, y2, z2, n) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) this.setze(x, y, z, n);
  }
  // Vorlage an Ursprung einsetzen (wie /clone im Modus replace: auch Luft wird geschrieben)
  einsetzen(vorlage, [ox, oy, oz]) {
    for (let y = 0; y < vorlage.dy; y++) for (let z = 0; z < vorlage.dz; z++) for (let x = 0; x < vorlage.dx; x++)
      this.setze(ox + x, oy + y, oz + z, vorlage.hole(x, y, z));
    for (const [k, zeilen] of vorlage.schilder) {
      const [x, y, z] = k.split(',').map(Number);
      this.entities.set(`${ox + x},${oy + y},${oz + z}`, { art: 'schild', zeilen });
    }
  }
  // Quader kopieren (Modell von /clone … replace normal): Blöcke und Block-Entitäten
  klonen([a1, a2], ziel) {
    const [x1, y1, z1] = a1, [x2, y2, z2] = a2, [tx, ty, tz] = ziel;
    const puffer = [], ents = [];
    for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      puffer.push(this.hole(x, y, z));
      const e = this.entities.get(`${x},${y},${z}`);
      if (e) ents.push([x - x1, y - y1, z - z1, e]);
    }
    let k = 0;
    for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++)
      this.setze(tx + x - x1, ty + y - y1, tz + z - z1, puffer[k++]);
    for (const [x, y, z, e] of ents) this.entities.set(`${tx + x},${ty + y},${tz + z}`, { ...e });
  }
  ausschnitt([a1, a2]) {
    const v = new Vorlage(a2[0] - a1[0] + 1, a2[1] - a1[1] + 1, a2[2] - a1[2] + 1);
    for (let y = 0; y < v.dy; y++) for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) {
      v.setze(x, y, z, this.hole(a1[0] + x, a1[1] + y, a1[2] + z));
      const e = this.entities.get(`${a1[0] + x},${a1[1] + y},${a1[2] + z}`);
      if (e && e.art === 'schild') v.schilder.set(`${x},${y},${z}`, e.zeilen);
    }
    return v;
  }
  befehlsblock(x, y, z, befehl, name, schildRichtung, schildZeilen) {
    this.setze(x, y, z, 'befehlsblock');
    this.entities.set(`${x},${y},${z}`, { art: 'befehl', befehl: befehl.replace(/^\//, ''), name });
    this.setze(x, y + 1, z, 'knopf');
    const [sx, sz] = { Ost: [x + 1, z], West: [x - 1, z], Sued: [x, z + 1], Nord: [x, z - 1] }[schildRichtung];
    this.setze(sx, y, sz, 'schild' + schildRichtung);
    this.entities.set(`${sx},${y},${sz}`, { art: 'schild', zeilen: schildZeilen });
  }
}

/* ---------- komplette Testwelt ---------- */
export function erzeugeWelt() {
  const w = new Welt(), { x0, z0, nx, nz, y0 } = BEREICH, x9 = x0 + nx - 1, z9 = z0 + nz - 1;
  const grau = vorlageGrau(), gruen = vorlageGruen();

  // Boden wie die flache Welt: Grundgestein, Erde, Gras auf y 63
  w.quader(x0, y0, z0, x9, y0, z9, 'grundgestein');
  w.quader(x0, y0 + 1, z0, x9, BODEN_Y - 1, z9, 'erde');
  w.quader(x0, BODEN_Y, z0, x9, BODEN_Y, z9, 'gras');

  // Straßen rund um den Platz: Bordstein direkt am Platz, Gehweg, Fahrbahn, äußerer Gehweg
  const ring = (a, b2, n) => {
    for (let z = a; z <= b2; z++) for (let x = a; x <= b2; x++)
      if (x === a || x === b2 || z === a || z === b2) w.setze(x, BODEN_Y, z, n);
  };
  w.quader(-14, BODEN_Y, -14, 45, BODEN_Y, 45, 'glattstein');
  w.quader(-12, BODEN_Y, -12, 43, BODEN_Y, 43, 'asphalt');
  w.quader(-4, BODEN_Y, -4, 35, BODEN_Y, 35, 'glattstein');
  ring(-1, 32, 'andesit');
  for (let k = -10; k <= 41; k += 4) for (const [x, z] of [[k, -8], [k, 39], [-8, k], [39, k]]) if (w.hole(x, BODEN_Y, z) === ID.asphalt) w.setze(x, BODEN_Y, z, 'betonWeiss');

  // markante graue Hochhäuser (wie im Drehbuch: zentraler Platz zwischen Hochhäusern)
  const hochhaus = (xa, za, xb, zb, h, wand) => {
    const y1 = BODEN_Y + 1, y2 = BODEN_Y + h;
    w.quader(xa - 1, BODEN_Y, za - 1, xb + 1, BODEN_Y, zb + 1, 'glattstein');
    for (let y = y1; y <= y2; y++) for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) {
      const rand = x === xa || x === xb || z === za || z === zb, ecke = (x === xa || x === xb) && (z === za || z === zb);
      if (y === y2) w.setze(x, y, z, 'beton');
      else if (rand) w.setze(x, y, z, !ecke && (y - y1) % 4 > 0 && (y - y1) % 4 < 3 && y > y1 ? 'fenster' : wand);
    }
  };
  hochhaus(0, -30, 11, -19, 38, 'betonHell');
  hochhaus(18, -32, 29, -21, 28, 'betonWeiss');
  hochhaus(-30, -30, -19, -19, 32, 'betonHell');
  hochhaus(48, -28, 59, -17, 24, 'betonWeiss');
  hochhaus(-30, 2, -19, 13, 26, 'betonWeiss');
  hochhaus(48, 4, 59, 15, 34, 'betonHell');
  hochhaus(-30, 48, -19, 59, 12, 'betonHell');
  hochhaus(48, 48, 59, 59, 12, 'betonWeiss');

  // Vorlagen-Kammern: Wände aus Andesit, Licht in der Decke, Inhalt = Vorlage
  const kammer = ([a, e], vorlage) => {
    w.quader(a[0] - 1, a[1] - 1, a[2] - 1, e[0] + 1, e[1] + 1, e[2] + 1, 'andesit');
    for (let z = a[2] + 2; z <= e[2]; z += 6) for (let x = a[0] + 2; x <= e[0]; x += 6) w.setze(x, e[1] + 1, z, 'licht');
    if (vorlage) w.einsetzen(vorlage, a);
  };
  kammer(vorlageBox('grau'), grau);
  kammer(vorlageBox('gruen'), gruen);

  // Platz im Ausgangszustand
  w.einsetzen(grau, platzBox()[0]);

  // Regieplatz mit Knöpfen (Startpunkt) – liegt außerhalb des Platzes und des Kontrollrands
  const b2 = befehle();
  w.quader(10, 79, 44, 22, 79, 50, 'fichteBretter');
  for (const [x, z] of [[10, 44], [22, 44], [10, 50], [22, 50]]) w.quader(x, BODEN_Y + 1, z, x, 78, z, 'fichteStamm');
  w.quader(10, 80, 50, 22, 80, 50, 'fichteHalb'); w.quader(22, 80, 44, 22, 80, 49, 'fichteHalb');
  const tp = (s) => s.replace('@s', '@p');
  w.befehlsblock(11, 80, 45, b2.grau, 'Platz grau', 'Ost', ['GRAU', 'Ausgangszustand', '(Zuruecksetzen)']);
  w.befehlsblock(11, 80, 46, b2.gruen, 'Platz gruen', 'Ost', ['GRUEN', 'Natur-Abenteuer-', 'spielplatz']);
  w.befehlsblock(11, 80, 48, tp(b2.wasser), 'Ansicht Wasser', 'Ost', ['ANSICHT', 'Mulde, Spielbereich,', 'Zisterne']);
  w.befehlsblock(11, 80, 49, tp(b2.uebersicht), 'Ansicht Uebersicht', 'Ost', ['ANSICHT', 'Uebersicht', '(hierher zurueck)']);

  // Aussichtspunkt „Wasser“ über der Straße südlich des Platzes
  w.quader(14, 69, 37, 18, 69, 39, 'fichteBretter');
  for (const [x, z] of [[14, 37], [18, 37], [14, 39], [18, 39]]) w.quader(x, BODEN_Y + 1, z, x, 68, z, 'fichteStamm');
  w.befehlsblock(18, 70, 39, tp(b2.uebersicht), 'Zurueck', 'West', ['ZURUECK', 'zum Regieplatz']);

  // Kontrollkopie: Platz + Rand im Ausgangszustand (für /testforblocks)
  const kb = kontrollBox(), kk = kontrollKopieBox();
  const kopie = w.ausschnitt(kb);
  kammer(kk, kopie);

  return { welt: w, vorlagen: { grau, gruen }, kopie };
}
