/* START IT SMART – Stadt-Konfigurator: BELEBUNG DER MINECRAFT-WELT
 * Änderungsauftrag 03 vom 26.11.2026 „Unsere Minecraft-Zukunftsstadt erwacht zum Leben“.
 *
 * Eine zusätzliche Ebene über der fertigen Stadt mit allen Beschlüssen. Sie verändert nichts Vorhandenes:
 *  - Einrichtung (Möbel, Waren, Pflanzkübel, Bänke, Schilder) kommt NUR in Luftblöcke. Wände, Böden, Türen und Wege bleiben.
 *  - Was eingerichtet wird, richtet sich nach der Variante, die in der Welt tatsächlich steht (Beschluss oder Ausgangszustand).
 *  - Flächen im Ausgangszustand bekommen keine Blöcke, nur Figuren. So bleiben Kammern und /clone-Knöpfe im Regieraum
 *    exakt wie bisher (ein Bauauftrag von Hand setzt die Fläche ohne Einrichtung, wie vorher).
 *  - Figuren (Dorfbewohner, Kinder, NPC als Verkaufs- und Lehrpersonal, Tiere) sind keine Blöcke. Befehlsblöcke unter dem
 *    Regieraum rufen sie EINMAL, sobald die ganze Stadt geladen ist (Prüfung: Grundgestein an 25 Punkten lesbar).
 *    Nur Befehle, die es in Bedrock seit Langem gibt (summon, kill, testforblock, setblock, tickingarea) – die Befehlsblöcke
 *    der Welt haben Befehlsversion 13. Notfall-Knopf im Boden des Regieraums: alle Figuren neu rufen.
 *  - Keine aggressiven Kreaturen (Welt steht auf „friedlich“), keine bewegten Fahrzeuge (in Minecraft gibt es keine Autos;
 *    nachgebaute fahrende Blockautos wären nicht zuverlässig).
 *
 * Nachbesserung 03 vom 27.11.2026 „Lebendige Straßen“ – Ursache der fehlenden Bewohner:
 *    Gerufen wurde „summon villager_v2 …“. Diese Kennung ist in Bedrock/Minecraft Education NICHT rufbar (Mojangs
 *    Verhaltensdatei villager_v2.json: "is_summonable": false; ein solcher Befehl ist „nicht auswertbar“). Katzen, Kaninchen
 *    und NPC sind rufbar – darum erschienen nur sie. Jetzt: „summon villager …“ (rufbar, "is_summonable": true).
 *    Dazu viel mehr Bewohner unter freiem Himmel (Gehwege, Plätze, Haltestelle, vor Läden und Häusern, Schule/Treffpunkt,
 *    Spielplatz) und abgestellte Fahrräder passend zur Variante. Die Welt steht fest auf Mittag (6000): Erwachsene sind dann
 *    im Tagesplan „umherziehen“, Kinder im Tagesplan „spielen“ – beides ist Bewegung.
 */
import { ID, istPflanze } from '../minecraft/welt.js';
import { BEREICHE, BEREICH_IDS, boxVon, vorlage, mcGrund, grundstadt3D, bereichAn, auto, STADT, S } from './stadtmodell.js';

export const FIGUREN_HOECHSTENS = 80;           // Nachbesserung 03: Leistung – höchstens 80 Figuren (Bewohner, Personal, Tiere)
export const DRAUSSEN_MINDESTENS = 30;          // so viele Dorfbewohner mindestens unter freiem Himmel (jede Kombination)
const k3 = (x, y, z) => `${x},${y},${z}`;

/* ---------- Blockgruppen ---------- */
const N = (...n) => new Set(n.map((x) => ID[x]));
// Hier kann man durchgehen (keine Kollision): Luft, Pflanzen, Teppiche, Schilder, Knöpfe, Schienen
export const DURCH = new Set([ID.luft, ...['farn', 'hohesGras', 'mohn', 'kornblume', 'margerite', 'loewenzahn', 'teppichRot', 'teppichBlau', 'teppichGelb',
  'schildNord', 'schildSued', 'schildWest', 'schildOst', 'knopf', 'knopfSued', 'schieneOW'].map((n) => ID[n])]);
// Darauf stehen Figuren beim Erscheinen (Böden, Wege, Rasen – nicht Möbel, Autos, Wasser oder Laub)
const BODENBLOCK = N('glattstein', 'andesit', 'betonHell', 'beton', 'betonWeiss', 'kies', 'gras', 'pfad', 'eicheBretter', 'fichteBretter',
  'steinziegel', 'gruenBeton', 'sandstein', 'limette', 'erde', 'moos', 'markierung', 'bretterBirke', 'grobeErde');
const fest = (id) => !DURCH.has(id) && id !== ID.wasser;

/* ---------- Plan: sammelt Blöcke, Block-Entitäten und Figuren für eine Fläche ---------- */
class Plan {
  // ref(x, y, z) liefert den Block der Welt ohne Belebung; box = erlaubter Bereich (null = überall außerhalb der Bauflächen)
  constructor(name, ref, box) {
    Object.assign(this, { name, ref, box });
    this.bloecke = new Map();      // "x,y,z" -> Blockname
    this.be = new Map();           // "x,y,z" -> { art: 'bett' | 'schild', … }
    this.figuren = [];
    this.ziele = [];               // eingerichtete Räume: [Titel, x, y, z] – müssen vom Startpunkt aus zu Fuß erreichbar sein
    this.fehler = [];              // Einrichtung, die NICHT gesetzt wurde (Zelle belegt oder außerhalb) – Test: muss leer sein
  }
  innen(x, z) {
    if (this.box) { const [a, , c, d, , f] = this.box; return x >= a && x <= d && z >= c && z <= f; }
    return x >= STADT.x1 && x <= STADT.x2 && z >= STADT.z1 && z <= STADT.z2 && !bereichAn(x, z);
  }
  hole(x, y, z) { const k = k3(x, y, z); return this.bloecke.has(k) ? ID[this.bloecke.get(k)] : this.ref(x, y, z); }
  setze(x, y, z, n) {
    if (!this.innen(x, z) || this.hole(x, y, z) !== ID.luft) { this.fehler.push(`${n} ${x} ${y} ${z}`); return false; }
    this.bloecke.set(k3(x, y, z), n);
    return true;
  }
  quader(x1, y1, z1, x2, y2, z2, n) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) this.setze(x, y, z, n);
  }
  // Innenwand (3 Blöcke hoch über dem Boden y0) mit Durchgängen [x, z] (2 hoch)
  wand(x1, z1, x2, z2, y0, n, durch = [], hoch = 3) {
    for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
      for (let y = y0; y < y0 + hoch; y++) if (!(durch.some(([a, c]) => a === x && c === z) && y < y0 + 2)) this.setze(x, y, z, n);
  }
  bett(x, y, z, richtung, farbe) {
    const [dx, dz] = richtung === 'Nord' ? [0, -1] : [1, 0];
    if (this.setze(x, y, z, `bett${richtung}Fuss`)) this.be.set(k3(x, y, z), { art: 'bett', farbe });
    if (this.setze(x + dx, y, z + dz, `bett${richtung}Kopf`)) this.be.set(k3(x + dx, y, z + dz), { art: 'bett', farbe });
  }
  schild(x, y, z, richtung, zeilen) { if (this.setze(x, y, z, 'schild' + richtung)) this.be.set(k3(x, y, z), { art: 'schild', zeilen }); }
  pflanzkuebel(x, y, z) { if (this.setze(x, y, z, 'moos')) this.setze(x, y + 1, z, 'azaleeBusch'); }
  beet(x1, z1, x2, z2, y, blumen = ['mohn', 'kornblume', 'margerite']) {
    let k = 0;
    for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) if (this.setze(x, y, z, 'gras')) this.setze(x, y + 1, z, blumen[k++ % blumen.length]);
  }
  ziel(titel, x, y, z) { this.ziele.push([titel, x, y, z]); }
  frei(x, y, z) { return this.innen(x, z) && DURCH.has(this.hole(x, y, z)) && DURCH.has(this.hole(x, y + 1, z)) && BODENBLOCK.has(this.hole(x, y - 1, z)); }
  // unter freiem Himmel: über dem Kopf nichts Festes bis zur Oberkante der Fläche (Grundstadt: 30 Blöcke)
  himmel(x, y, z) {
    const oben = this.box ? this.box[4] : y + 30;
    for (let yy = y + 2; yy <= oben; yy++) if (!DURCH.has(this.hole(x, yy, z))) return false;
    return true;
  }
  // eine Figur an fester Stelle (Verkaufspersonal, Lehrkraft, Wartende): muss frei stehen
  figur(typ, name, x, y, z, kind = false) {
    if (!this.frei(x, y, z)) { this.fehler.push(`Figur ${name} ${x} ${y} ${z} nicht frei`); return; }
    this.figuren.push({ typ, name, x, y, z, kind, ort: this.name, draussen: this.himmel(x, y, z) });
  }
  // Fahrrad (Nachbesserung 03): Rad – Rahmen – Rad, 1 Block hoch, entlang x oder z; nur wenn alle drei Zellen frei sind
  fahrrad(x, z, achse = 'x', y = S) {
    const [dx, dz] = achse === 'x' ? [1, 0] : [0, 1], a = achse.toUpperCase();
    for (let k = 0; k < 3; k++) if (!this.innen(x + k * dx, z + k * dz) || this.hole(x + k * dx, y, z + k * dz) !== ID.luft || !fest(this.hole(x + k * dx, y - 1, z + k * dz))) { this.fehler.push(`Fahrrad ${x} ${y} ${z} kein Platz`); return; }
    this.setze(x, y, z, 'rad' + a); this.setze(x + dx, y, z + dz, 'rahmen' + a); this.setze(x + 2 * dx, y, z + 2 * dz, 'rad' + a);
  }
  // Fahrradständer: erste Stelle im Rechteck, an der n Fahrräder nebeneinander passen (je 2 Blöcke Abstand), sonst Fehler
  fahrradstaender(rechteck, n, achsen = 'zx', y = S) {
    const [x1, z1, x2, z2] = rechteck;
    const passt = (x, z, ax) => {
      for (let k = 0; k < 3; k++) {
        const a = ax === 'x' ? x + k : x, c = ax === 'x' ? z : z + k;
        if (!this.innen(a, c) || this.hole(a, y, c) !== ID.luft || !fest(this.hole(a, y - 1, c)) || VERBOTEN.has(`${a},${c}`)) return false;
      }
      return true;
    };
    for (const ax of achsen) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      const pos = Array.from({ length: n }, (_, k) => (ax === 'z' ? [x + 2 * k, z] : [x, z + 2 * k]));
      if (pos.every(([a, c]) => passt(a, c, ax))) { for (const [a, c] of pos) this.fahrrad(a, c, ax, y); return; }
    }
    this.fehler.push(`${this.name}: kein Platz für ${n} Fahrräder in ${rechteck}`);
  }
  // mehrere Figuren gleichmäßig verteilt auf freie Bodenzellen im Rechteck [x1, z1, x2, z2] (Höhe y oder Liste);
  // draussen = nur Zellen unter freiem Himmel (Gehwege, Plätze, Höfe – nicht in Häusern, nicht unter Dächern)
  verteile(rechteck, ys, liste, draussen = false) {
    const [x1, z1, x2, z2] = rechteck, hoehen = Array.isArray(ys) ? ys : [ys], kand = [];
    const belegt = new Set(this.figuren.map((f) => k3(f.x, f.y, f.z)));
    for (const y of hoehen) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++)
      if (this.frei(x, y, z) && !belegt.has(k3(x, y, z)) && !VERBOTEN.has(`${x},${z}`) && (!draussen || this.himmel(x, y, z))) kand.push([x, y, z]);
    if (kand.length < liste.length) { this.fehler.push(`${this.name}: nur ${kand.length} freie Plätze für ${liste.length} Figuren in ${rechteck}`); }
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, gewaehlt = [];
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2;
    for (const f of liste) {
      if (!kand.length) break;
      // erste Figur nah der Mitte, jede weitere möglichst weit weg von den schon gesetzten (gleichmäßig verteilt, immer gleich)
      let best = 0, bestWert = -Infinity;
      kand.forEach((c, i) => {
        const w = gewaehlt.length ? Math.min(...gewaehlt.map((g) => d2(c, g))) : -d2(c, [mx, 0, mz]);
        if (w > bestWert) { best = i; bestWert = w; }
      });
      const [c] = kand.splice(best, 1);
      gewaehlt.push(c);
      this.figuren.push({ typ: f[0], name: f[1], x: c[0], y: c[1], z: c[2], kind: !!f[2], ort: this.name, draussen: this.himmel(c[0], c[1], c[2]) });
    }
  }
}
// Hier erscheint keine Figur: Startpunkt und sein Umfeld
const VERBOTEN = new Set();
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) VERBOTEN.add(`${16 + dx},${-2 + dz}`);

// Dorfbewohner: „villager“ ist rufbar; „villager_v2“ NICHT (Ursache der fehlenden Bewohner bis zur Nachbesserung 03)
const D = 'villager', NPC = 'npc';
const kind = (name) => [D, name, true], erw = (name) => [D, name], tier = (typ, name) => [typ, name];

/* ---------- Musterwohnung im Bestand (immer, unabhängig von der Wohnform) ----------
 * Haus 1 der Nordreihe an der Wohnstraße (außerhalb aller Bauflächen): Erdgeschoss x −61…−48, z −59…−48, Tür (−55, −47). */
function musterwohnung(p) {
  const y = S;
  p.wand(-61, -53, -48, -53, y, 'betonWeiss', [[-58, -53], [-51, -53]]);      // Flur | Schlafräume
  p.wand(-55, -59, -55, -54, y, 'betonWeiss');                                // Elternschlafzimmer | Kinderzimmer
  // Wohnzimmer (Südwest): Sofa, Couchtisch, Fernseher, Bücherregal, Pflanze, Lampe
  for (const z of [-51, -50, -49]) p.setze(-58, y, z, 'bankOst');
  p.setze(-60, y, -50, 'tischplatte');
  p.setze(-61, y, -50, 'fass'); p.setze(-61, y + 1, -50, 'bildschirm');
  p.quader(-61, y, -52, -61, y + 1, -52, 'insektenhotel');
  p.setze(-60, y, -49, 'teppichRot'); p.setze(-60, y, -51, 'teppichRot'); p.setze(-59, y, -50, 'teppichRot');
  p.pflanzkuebel(-56, y, -48);
  p.setze(-60, y + 2, -50, 'haengelampe');
  // Küche und Essplatz (Südost)
  p.setze(-48, y, -52, 'fass'); p.setze(-48, y, -51, 'ofenWest'); p.setze(-48, y, -50, 'quarz'); p.setze(-48, y, -49, 'fass');
  p.setze(-48, y + 1, -50, 'kuchen');
  p.setze(-52, y, -50, 'tischplatte'); p.setze(-51, y, -50, 'tischplatte');
  p.setze(-53, y, -50, 'bankWest'); p.setze(-50, y, -50, 'bankOst');
  p.setze(-52, y, -49, 'bankSued'); p.setze(-51, y, -49, 'bankSued');
  p.setze(-52, y + 2, -50, 'haengelampe');
  // Elternschlafzimmer (Nordwest)
  p.bett(-60, y, -58, 'Nord', 11); p.bett(-59, y, -58, 'Nord', 11);
  p.setze(-61, y, -59, 'fass'); p.setze(-61, y + 1, -59, 'laterne');
  p.setze(-58, y, -59, 'fass'); p.setze(-58, y + 1, -59, 'laterne');
  p.quader(-56, y, -59, -56, y + 1, -59, 'fass');                              // Schrank
  p.setze(-60, y, -56, 'teppichBlau'); p.setze(-59, y, -56, 'teppichBlau');
  // Kinderzimmer (Nordost)
  p.bett(-49, y, -58, 'Nord', 5);
  p.setze(-53, y, -59, 'tischplatte'); p.setze(-53, y, -58, 'bankSued');        // Schreibtisch mit Stuhl
  p.quader(-54, y, -59, -54, y + 1, -59, 'insektenhotel');
  p.setze(-48, y, -55, 'zielscheibe');
  p.setze(-51, y, -56, 'teppichGelb'); p.setze(-50, y, -56, 'teppichGelb');
  p.setze(-51, y + 2, -57, 'haengelampe');
  p.ziel('Musterwohnung Wohnzimmer', -57, y, -50); p.ziel('Musterwohnung Elternschlafzimmer', -57, y, -55); p.ziel('Musterwohnung Kinderzimmer', -52, y, -55);
  p.verteile([-61, -59, -48, -48], y, [erw('Sophie'), erw('Malik'), kind('Juna')]);
}

/* ---------- Grundstadt (außerhalb der Bauflächen, in jeder Welt gleich) ---------- */
function grundBelebung(p) {
  musterwohnung(p);
  // Sitzgruppen am breiten Gehweg östlich der Hauptstraße (Süd): Pflanzkübel, zwei Bänke, Pflanzkübel – an der Ostkante
  for (const z of [28, 38, 50, 62, 74]) { p.pflanzkuebel(51, S, z); p.setze(51, S, z + 1, 'bankOst'); p.setze(51, S, z + 2, 'bankOst'); p.pflanzkuebel(51, S, z + 3); }
  // Vorplatz vor dem Büroturm: drei Blumenbeete
  for (const x of [54, 58, 62]) p.beet(x, 30, x + 1, 30, S);
  // kleiner Park zwischen den Bürotürmen
  for (const z of [33, 39, 45]) p.beet(72, z, 72, z + 1, S, ['loewenzahn', 'mohn']);
  for (const z of [36, 42]) p.setze(72, S, z, 'bankWest');
  // Parkplatz im Südosten: je Reihe die ersten zwei freien Stellplätze bekommen ein Auto (nur wo alles frei ist)
  for (const [z, farben] of [[57, ['blau', 'rot']], [72, ['betonWeiss', 'gelb']]]) {
    let n = 0;
    for (let x = 55; x + 1 <= 72 && n < 2; x += 3) if (autoWennFrei(p, x, z, farben[n])) n++;
  }
  // Fahrradständer am breiten Gehweg Ost (Fahrräder quer zum Gehweg, 2 Blöcke Durchgang bleiben frei)
  p.fahrradstaender([48, 26, 48, 84], 3, 'x');
  // Menschen unterwegs: Gehwege und Plätze – Nachbesserung 03: deutlich mehr, alle unter freiem Himmel
  p.verteile([-16, -14, 31, -13], S, [erw('Paul'), erw('Ida'), erw('Vera')], true);              // Ringstraße Nord, Nordseite
  p.verteile([-16, -2, 31, -1], S, [erw('Leon'), erw('Lina'), erw('Samir'), kind('Jule')], true); // Ringstraße Nord am Platz (Startpunkt)
  p.verteile([-14, -11, -1, 31], S, [erw('Elif'), erw('Felix')], true);                          // Ringstraße West, am Spielplatz
  p.verteile([44, -64, 51, -27], S, [erw('Greta'), erw('Anton')], true);                         // Hauptstraße Nord
  p.verteile([-64, -46, 31, -45], S, [erw('Rosa'), erw('Lars'), kind('Oskar')], true);           // vor den Häusern der Nordreihe
  p.verteile([-64, 32, 31, 33], S, [erw('Karl')], true);                                         // Ringstraße Süd, Nordseite
  p.verteile([46, 26, 51, 84], S, [erw('Frieda'), tier('cat', 'Minka')], true);                  // breiter Gehweg Ost mit Bänken
  p.verteile([52, 26, 95, 84], S, [erw('Edda'), kind('Merle')], true);                           // Vorplatz Büroturm, Park, Höfe
}
function autoWennFrei(p, x, z, farbe) {
  for (let y = S; y <= S + 1; y++) for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 2; dx++) if (p.hole(x + dx, y, z + dz) !== ID.luft || !p.innen(x + dx, z + dz)) return false;
  auto(p, x, z, 'z', farbe);
  return true;
}

/* ---------- Bauflächen je Variante ---------- */
const BELEBE = {
  spielplatz(p, v) {
    // Spielplatz bleibt unverändert (keine Blöcke) – nur Besucher: spielende Kinder, Eltern, Tiere
    if (v === 'gruen') {
      p.verteile([1, 1, 30, 30], S, [kind('Lotta'), kind('Mats'), kind('Emil'), kind('Nele'), kind('Jonte'), erw('Hanna'), erw('Jonas'), tier('rabbit', 'Hoppel'), tier('rabbit', 'Flocke'), tier('cat', 'Tiger')], true);
    } else p.verteile([1, 1, 30, 30], S, [kind('Lotta'), kind('Mats'), erw('Hanna'), erw('Can')], true);
  },
  laternen(p) { p.verteile([32, 0, 33, 95], S, [erw('Otto')], true); p.verteile([44, 0, 45, 95], S, [erw('Marie')], true); },
  parken(p, v) {
    if (v === 'B') {
      // Spielstraße: Kinderfahrräder in den Grünstreifen, Kinder spielen, Nachbarn auf dem Gehweg; geparkt wird nur im Westteil
      p.fahrradstaender([-15, -44, 30, -41], 2); p.fahrradstaender([-15, -28, 30, -25], 2);
      p.verteile([-12, -36, 28, -33], S, [kind('Tom'), kind('Mila'), kind('Nina')], true); p.verteile([-15, -44, 30, -41], S, [erw('Jakob'), erw('Ruben'), tier('cat', 'Mohrle')], true);
    } else if (v === 'C') {
      // Straße für Menschen: viele zu Fuß, Fahrradständer in den Grünstreifen (die Autos stehen im Parkhaus am Rand)
      p.fahrradstaender([-30, -44, 30, -41], 3); p.fahrradstaender([-30, -28, 30, -25], 3);
      p.verteile([-46, -44, 30, -41], S, [erw('Jakob'), kind('Mila'), erw('Lotte')], true); p.verteile([-46, -38, 30, -25], S, [erw('Sina'), erw('Till'), kind('Ylva')], true);
    } else if (v === 'A') p.verteile([-64, -46, 31, -38], S, [erw('Jakob'), erw('Lotte')], true);
    else p.verteile([-64, -46, 31, -38], S, [erw('Jakob')], true);
  },
  kreuzung(p) {
    // Bushaltestelle: eine Wartende unter dem Dach (steht still und wartet), dazu Fahrgäste, die ankommen und gehen
    p.figur(NPC, 'Fahrgast', 32, S, -23);
    p.verteile([32, -24, 34, -19], S, [erw('Clara'), erw('Theo')]);
  },
  zukunft(p) { p.verteile([61, -12, 75, -10], S + 7, [erw('Ella'), erw('Luca')]); p.verteile([82, -14, 93, -13], S, [erw('Nora')], true); },
  aufstocken(p, v) { p.verteile([52, 22, 71, 25], S, v === 'holz' ? [erw('Ben'), kind('Ali')] : [erw('Ben')], true); },

  wohnen(p, v) {
    const y = S;
    if (v === 'A') {
      // Haus 1: Wohnküche (Innenraum x 56…60, z −56…−52, Tür 58|−51)
      p.setze(56, y, -56, 'fass'); p.setze(57, y, -56, 'ofenSued'); p.setze(58, y, -56, 'quarz'); p.setze(59, y, -56, 'fass'); p.pflanzkuebel(60, y, -56);
      p.setze(57, y, -54, 'tischplatte'); p.setze(56, y, -54, 'bankWest'); p.setze(58, y, -54, 'bankOst');
      p.setze(60, y, -53, 'bankOst'); p.setze(60, y, -52, 'bankOst');            // Sofa
      p.setze(56, y, -52, 'fass'); p.setze(56, y + 1, -52, 'bildschirm');        // Fernseher
      p.setze(57, y + 2, -54, 'haengelampe');
      // Haus 2: Schlafzimmer und Kinderecke (Innenraum x 68…72, z −56…−52, Tür 70|−51)
      p.bett(68, y, -55, 'Nord', 14); p.bett(69, y, -55, 'Nord', 14); p.bett(72, y, -55, 'Nord', 3);
      p.setze(71, y, -56, 'fass'); p.setze(71, y + 1, -56, 'laterne');
      p.setze(72, y, -53, 'tischplatte'); p.setze(71, y, -53, 'bankWest');
      p.quader(68, y, -52, 68, y + 1, -52, 'insektenhotel');
      p.setze(70, y + 2, -54, 'haengelampe');
      p.ziel('Wohnen A Haus 1', 58, y, -53); p.ziel('Wohnen A Haus 2', 70, y, -53);
      p.verteile([56, -56, 60, -52], y, [erw('Mia')]);
      p.verteile([53, -50, 90, -43], y, [kind('Finn'), kind('Lea'), erw('Noah'), erw('Ivo'), tier('chicken', 'Gackerine'), tier('chicken', 'Henriette')], true);
    } else if (v === 'B') {
      // Haus Süd, Erdgeschoss: Wohnküche (Innenraum x 65…76, z −32…−28, Tür 71|−33)
      for (const [x, n] of [[65, 'fass'], [66, 'ofenNord'], [67, 'quarz'], [68, 'quarz'], [69, 'fass']]) p.setze(x, y, -28, n);
      p.setze(67, y + 1, -28, 'kuchen');
      p.setze(67, y, -30, 'tischplatte'); p.setze(68, y, -30, 'tischplatte'); p.setze(66, y, -30, 'bankWest'); p.setze(69, y, -30, 'bankOst');
      for (const x of [74, 75, 76]) p.setze(x, y, -29, 'bankSued');               // Sofa
      p.setze(75, y, -30, 'tischplatte');
      p.setze(75, y, -32, 'fass'); p.setze(75, y + 1, -32, 'bildschirm');
      p.quader(76, y, -32, 76, y + 1, -32, 'insektenhotel'); p.pflanzkuebel(73, y, -28);
      p.setze(67, y + 2, -30, 'haengelampe'); p.setze(75, y + 2, -31, 'haengelampe');
      // Haus Nord, Erdgeschoss: Schlafzimmer, Flur, Kinderzimmer (Innenraum x 65…76, z −55…−51, Tür 71|−50)
      p.wand(70, -55, 70, -51, y, 'betonWeiss', [[70, -53]]); p.wand(72, -55, 72, -51, y, 'betonWeiss', [[72, -53]]);
      p.bett(66, y, -54, 'Nord', 11); p.bett(67, y, -54, 'Nord', 11);
      p.setze(65, y, -55, 'fass'); p.setze(65, y + 1, -55, 'laterne'); p.setze(68, y, -55, 'fass'); p.setze(68, y + 1, -55, 'laterne');
      p.quader(69, y, -55, 69, y + 1, -55, 'fass');
      p.bett(74, y, -54, 'Nord', 5); p.bett(76, y, -54, 'Nord', 3);
      p.setze(76, y, -51, 'tischplatte'); p.setze(75, y, -51, 'bankWest'); p.setze(73, y, -55, 'zielscheibe');
      p.setze(67, y + 2, -52, 'haengelampe'); p.setze(74, y + 2, -52, 'haengelampe');
      p.ziel('Wohnen B Wohnküche', 71, y, -30); p.ziel('Wohnen B Schlafzimmer', 67, y, -52); p.ziel('Wohnen B Kinderzimmer', 74, y, -52);
      p.verteile([65, -32, 76, -28], y, [erw('Selin'), erw('Tim')]);
      p.verteile([58, -48, 84, -35], y, [kind('Ole'), kind('Pia'), erw('Ivo'), tier('cat', 'Luna')], true);
    } else if (v === 'C') {
      // höheres Haus, Erdgeschoss (Innenraum x 57…68, z −57…−53, Tür 62|−52): Wohnküche | Flur | Schlafzimmer und Kinderzimmer
      for (const [x, n] of [[57, 'fass'], [58, 'ofenSued'], [59, 'quarz'], [60, 'fass']]) p.setze(x, y, -57, n);
      p.setze(58, y, -55, 'tischplatte'); p.setze(59, y, -55, 'tischplatte'); p.setze(57, y, -55, 'bankWest'); p.setze(60, y, -55, 'bankOst');
      p.setze(58, y + 2, -55, 'haengelampe');
      p.wand(64, -55, 68, -55, y, 'betonWeiss', [[65, -55]]);
      p.bett(66, y, -56, 'Nord', 14); p.bett(67, y, -56, 'Nord', 14);
      p.setze(65, y, -57, 'fass'); p.setze(65, y + 1, -57, 'laterne'); p.quader(68, y, -57, 68, y + 1, -57, 'fass');
      p.bett(67, y, -54, 'Ost', 5);
      p.setze(64, y, -54, 'tischplatte'); p.setze(64, y, -53, 'bankSued'); p.setze(66, y + 2, -53, 'haengelampe');
      p.ziel('Wohnen C Wohnküche', 59, y, -54); p.ziel('Wohnen C Schlafzimmer', 65, y, -56); p.ziel('Wohnen C Kinderzimmer', 65, y, -53);
      p.verteile([57, -56, 63, -53], y, [erw('Amira'), erw('Jan')]);
      p.verteile([55, -50, 90, -24], y, [kind('Kian'), erw('Ute'), erw('Ivo'), tier('rabbit', 'Krumel'), tier('rabbit', 'Puenktchen')], true);
    } else p.verteile([52, -60, 91, -21], y, [erw('Ivo'), kind('Lisa')], true);                // grau: Bewohner vor den alten Blöcken
  },

  einkaufen(p, v) {
    const y = S;
    if (v === 'A') {
      // Großer Supermarkt (Innenraum x −62…−53, z 3…19, 6 hoch; Eingang −58/−57 | 20)
      const waren = ['melone', 'heu', 'kuerbis', 'honig'];
      for (let z = 4; z <= 15; z++) for (const x of [-62, -53]) { p.setze(x, y, z, 'fass'); p.setze(x, y + 1, z, waren[(z + x) & 3]); p.setze(x, y + 2, z, 'fass'); }
      for (let z = 6; z <= 14; z++) for (const x of [-58, -57]) { p.setze(x, y, z, 'fass'); p.setze(x, y + 1, z, waren[(z + 2 + x) & 3]); }
      for (const x of [-61, -54]) { p.setze(x, y, 17, 'quarz'); p.setze(x, y + 1, 17, 'bildschirm'); }   // Kassen
      p.schild(-58, y + 1, 15, 'Sued', ['Obst, Gemuese', 'und Brot']);
      for (const x of [-60, -55]) for (const z of [6, 12, 18]) p.setze(x, y + 5, z, 'haengelampe');
      p.figur(NPC, 'Kassiererin', -62, y, 17); p.figur(NPC, 'Kassierer', -53, y, 17);
      p.ziel('Supermarkt', -59, y, 10);
      p.verteile([-61, 4, -54, 16], y, [erw('Dana'), erw('Erik'), kind('Fiete')]);
      p.verteile([-63, 21, -50, 31], y, [erw('Gisela'), erw('Mira'), erw('Lukas')], true);       // vor dem Eingang, auf dem Parkplatz
      p.verteile([-64, -14, -17, -13], y, [erw('Romy')], true);                                 // vor den Wohnhäusern des Westviertels
    } else if (v === 'B') {
      // Markthalle (Innenraum x −30…−19, z 3…28): Waren auf den vorhandenen Ständen, Händler dahinter
      const waren = [['melone', 'kuerbis', 'melone'], ['kuchen', 'heu', 'kuchen'], ['kuerbis', 'melone', 'heu'], ['honig', 'kuchen', 'honig']];
      let k = 0;
      for (let z = 5; z <= 25; z += 4) for (const x of [-29, -21]) {
        const w = waren[k++ % 4];
        p.setze(x + 1, y + 1, z, w[0]); p.setze(x, y + 1, z + 1, w[1]); p.setze(x + 1, y + 1, z + 1, w[2]);
      }
      for (const [xa, za] of [[-31, 0], [-21, 0], [-31, 30], [-21, 30]]) p.setze(xa + 1, y + 1, za, ['melone', 'kuchen', 'kuerbis', 'honig'][((xa + za) >>> 0) & 3]);
      for (const z of [8, 16, 24]) p.setze(-25, y + 6, z, 'haengelampe');
      p.figur(NPC, 'Obsthaendler', -30, y, 6); p.figur(NPC, 'Baeckerin', -19, y, 10); p.figur(NPC, 'Gemuesefrau', -30, y, 18); p.figur(NPC, 'Imker', -19, y, 22);
      p.ziel('Markthalle', -24, y, 15);
      p.verteile([-27, 3, -22, 28], y, [erw('Dana'), erw('Erik'), kind('Fiete'), erw('Gisela')]);
      p.fahrradstaender([-34, 0, -31, 1], 2, 'x');                                                          // Fahrräder vor der Markthalle
      p.verteile([-33, 0, -17, 1], y, [erw('Mira')], true); p.verteile([-33, 30, -17, 31], y, [erw('Lukas')], true);   // vor beiden Eingängen
      p.verteile([-64, -14, -17, -13], y, [erw('Romy')], true);
    } else if (v === 'C') {
      // Bäckerei im Erdgeschoss (Laden x −34…−29, z −22…−17, Tür −32|−16; Trennwand zum Hausflur bei x −28)
      p.wand(-28, -22, -28, -17, y, 'betonWeiss');
      p.quader(-33, y, -19, -31, y, -19, 'quarz'); p.setze(-33, y + 1, -19, 'kuchen'); p.setze(-31, y + 1, -19, 'kuchen');
      p.quader(-34, y, -22, -30, y, -22, 'heu'); p.setze(-29, y, -22, 'ofenSued');
      p.setze(-32, y + 2, -19, 'haengelampe');
      p.figur(NPC, 'Baecker', -32, y, -21);
      // Gemüseladen (Laden x −61…−57, z −22…−17, Tür −58|−16; Trennwand bei x −56)
      p.wand(-56, -22, -56, -17, y, 'betonWeiss');
      for (const [z, w] of [[-21, 'melone'], [-20, 'kuerbis'], [-19, 'melone'], [-18, 'kuerbis']]) { p.setze(-61, y, z, 'fass'); p.setze(-61, y + 1, z, w); }
      p.setze(-59, y, -20, 'quarz'); p.setze(-58, y, -20, 'quarz'); p.setze(-60, y + 2, -19, 'haengelampe');
      p.figur(NPC, 'Gemuesehaendler', -58, y, -21);
      // Lebensmittelladen an der Gasse (Innenraum x −39…−36, z 2…9)
      for (let z = 2; z <= 7; z++) { p.setze(-39, y, z, 'fass'); p.setze(-39, y + 1, z, ['honig', 'heu', 'melone'][z % 3]); }
      p.setze(-37, y, 4, 'quarz'); p.setze(-36, y, 4, 'quarz'); p.setze(-37, y + 2, 6, 'haengelampe');
      p.figur(NPC, 'Ladnerin', -36, y, 3);
      p.ziel('Baeckerei', -32, y, -18); p.ziel('Gemueseladen', -58, y, -18); p.ziel('Lebensmittelladen', -37, y, 7);
      p.fahrradstaender([-49, 12, -48, 14], 2);                                                            // Fahrräder in der Wohngasse
      p.verteile([-64, -14, -17, -13], y, [erw('Dana'), erw('Erik'), erw('Mira'), erw('Lukas')], true);   // vor Bäckerei und Gemüseladen
      p.verteile([-49, 12, -33, 19], y, [kind('Fiete'), erw('Romy')], true);                               // Wohngasse vor dem Lebensmittelladen
    } else { p.verteile([-49, 12, -33, 19], y, [erw('Dana')], true); p.verteile([-64, -14, -17, -13], y, [erw('Mira'), erw('Romy')], true); }
  },

  bildung(p, v) {
    const y = S;
    if (v === 'A') {
      // Schule (Innenraum x −59…−38, z 51…62, 4 hoch; Türen −49/−48 | 50 und −49 | 63): Flur x −50…−47 bleibt frei
      p.wand(-51, 51, -51, 62, y, 'betonWeiss', [[-51, 56]], 4);
      p.wand(-46, 51, -46, 62, y, 'betonWeiss', [[-46, 54], [-46, 60]], 4);
      p.wand(-45, 57, -38, 57, y, 'betonWeiss', [], 4);
      // Klassenzimmer: Tafel, Lehrerpult, Tische mit Stühlen, Bücher
      p.quader(-59, y + 1, 55, -59, y + 2, 58, 'asphalt');
      p.setze(-57, y, 56, 'tischplatte'); p.setze(-57, y, 57, 'tischplatte');
      for (const x of [-55, -53]) for (const z of [53, 55, 58, 60]) { p.setze(x, y, z, 'tischplatte'); p.setze(x + 1, y, z, 'bankOst'); }
      p.quader(-59, y, 51, -56, y + 1, 51, 'insektenhotel');
      for (const z of [54, 59]) p.setze(-55, y + 3, z, 'haengelampe');
      p.schild(-50, y + 2, 56, 'Ost', ['Klassenzimmer']);
      // Computerraum
      for (let z = 52; z <= 55; z++) { p.setze(-38, y, z, 'tischplatte'); p.setze(-38, y + 1, z, 'bildschirm'); p.setze(-39, y, z, 'bankWest'); }
      for (let x = -44; x <= -41; x++) { p.setze(x, y, 51, 'tischplatte'); p.setze(x, y + 1, 51, 'bildschirm'); p.setze(x, y, 52, 'bankSued'); }
      p.setze(-42, y + 3, 54, 'haengelampe');
      p.schild(-47, y + 2, 54, 'West', ['Computerraum']);
      // Forscherwerkstatt
      for (const [z, n] of [[59, 'werkbank'], [60, 'schmiedetisch'], [61, 'kartentisch']]) p.setze(-38, y, z, n);
      p.setze(-45, y, 62, 'webstuhl'); p.quader(-44, y, 62, -44, y + 1, 62, 'insektenhotel');
      p.setze(-42, y, 60, 'tischplatte'); p.setze(-41, y, 60, 'tischplatte'); p.setze(-42, y + 1, 60, 'kuerbis'); p.setze(-41, y, 61, 'bankSued');
      p.setze(-42, y + 3, 59, 'haengelampe');
      p.schild(-47, y + 2, 60, 'West', ['Forscher-', 'werkstatt']);
      p.figur(NPC, 'Lehrerin', -58, y, 59); p.figur(NPC, 'Forscherin', -40, y, 59);
      p.ziel('Klassenzimmer', -54, y, 57); p.ziel('Computerraum', -42, y, 54); p.ziel('Forscherwerkstatt', -43, y, 60);
      p.verteile([-56, 52, -52, 61], y, [kind('Zoe'), kind('Milan')]);
      p.verteile([-45, 52, -40, 56], y, [kind('Ayla')]);
      p.fahrradstaender([-58, 66, -37, 79], 4);                                                            // Fahrradständer am Schulhof
      p.verteile([-58, 66, -37, 79], y, [kind('Bela'), kind('Cem'), kind('Willi')], true);                 // Schulhof
      p.verteile([-56, 46, -42, 49], y, [erw('Gustav')], true);                                            // Eltern am Schuleingang
    } else if (v === 'B') {
      // alter Bahnhof (Innenraum x 3…26, z 67…78, 4 hoch): Werkbänke stehen schon; dazu Café, Treffpunkt, Tischtennis
      p.quader(25, y, 69, 25, y, 71, 'quarz'); p.setze(25, y + 1, 69, 'kuchen'); p.setze(25, y + 1, 71, 'kuchen'); p.setze(26, y, 72, 'fass');
      for (const z of [70, 74]) { p.setze(22, y, z, 'tischplatte'); p.setze(21, y, z, 'bankWest'); p.setze(23, y, z, 'bankOst'); p.setze(22, y + 3, z, 'haengelampe'); }
      p.schild(26, y + 2, 70, 'West', ['Cafe']);
      for (const x of [5, 6, 7]) p.setze(x, y, 78, 'bankSued');
      p.setze(6, y, 76, 'tischplatte'); p.quader(3, y, 74, 3, y + 1, 75, 'insektenhotel'); p.pflanzkuebel(3, y, 78);
      p.quader(9, y, 69, 10, y, 71, 'gruenBeton');                                 // Tischtennisplatte
      p.setze(6, y + 3, 76, 'haengelampe'); p.setze(10, y + 3, 70, 'haengelampe');
      p.figur(NPC, 'Cafe', 26, y, 70); p.figur(NPC, 'Werkstattleiter', 18, y, 70);
      p.ziel('Bahnhof Cafe', 22, y, 72); p.ziel('Bahnhof Treffpunkt', 6, y, 77);
      p.verteile([3, 67, 26, 78], y, [erw('Hugo'), kind('Ines'), kind('Juri')]);
      p.fahrradstaender([0, 52, 29, 64], 3);                                                               // Fahrräder am Bahnhof
      p.verteile([0, 52, 29, 64], y, [erw('Kira'), erw('Malte'), kind('Tarek')], true);                    // Bahnhofsvorplatz
    } else if (v === 'C') {
      // 1) Lerngarten-Hütte als kleiner Kreativraum (Innenraum x −11…−9, z 65…67, Tür −10 | 64)
      p.quader(-11, y, 67, -9, y, 67, 'insektenhotel'); p.setze(-11, y, 65, 'webstuhl'); p.setze(-9, y, 65, 'kartentisch'); p.setze(-10, y + 2, 66, 'haengelampe');
      // 2) Sporthalle wird Jugendtreff (Innenraum x −32…−22, z 51…60, Tür −27 | 50)
      for (const x of [-31, -30, -29]) p.setze(x, y, 59, 'bankSued');
      p.setze(-30, y, 57, 'tischplatte'); p.quader(-32, y, 54, -32, y + 1, 56, 'insektenhotel');
      p.quader(-25, y, 56, -23, y, 57, 'gruenBeton');                              // Kickertisch / Tischtennis
      p.setze(-22, y + 1, 53, 'zielscheibe'); p.setze(-22, y, 53, 'fass');
      p.setze(-24, y, 60, 'webstuhl'); p.setze(-23, y, 60, 'kartentisch');
      p.setze(-30, y, 58, 'teppichBlau'); p.setze(-29, y, 58, 'teppichBlau'); p.setze(-31, y, 58, 'teppichBlau');
      p.setze(-30, y + 3, 57, 'haengelampe'); p.setze(-24, y + 3, 55, 'haengelampe');
      p.schild(-25, y + 2, 49, 'Nord', ['Jugendtreff', 'offen fuer alle']);
      p.figur(NPC, 'Jugendtreff', -27, y, 58);
      p.ziel('Jugendtreff', -27, y, 54); p.ziel('Lerngarten Kreativraum', -10, y, 66);
      p.verteile([-32, 51, -22, 60], y, [kind('Lio'), kind('Maja')]);
      p.fahrradstaender([-32, 46, -29, 49], 2);                                                            // Fahrräder vor dem Jugendtreff
      p.verteile([-31, 64, -23, 76], y, [kind('Noel'), kind('Oda'), kind('Anouk')], true);
      p.verteile([24, 52, 29, 60], y, [erw('Petra'), erw('Zeynep')], true);
    } else p.verteile([-64, 46, 31, 49], y, [erw('Hugo'), erw('Charlotte')], true);
  },
};

/* ---------- Pläne erzeugen (zwischengespeichert) ---------- */
const cache = new Map();
// Variante, die in der Minecraft-Welt auf der Fläche steht (genau wie erzeugeStadtWelt sie setzt)
export function varianteInWelt(id, beschluesse = {}) {
  const v = BEREICHE[id].mcFest || beschluesse[id];
  return v && v !== BEREICHE[id].grund && BEREICHE[id].mc.includes(v) ? v : mcGrund(id);
}
export function einrichtung(id, v) {
  const k = `${id}:${v}`;
  if (cache.has(k)) return cache.get(k);
  const t = vorlage(id, v), box = boxVon(id), [ox, oy, oz] = box;
  const ref = (x, y, z) => { const a = x - ox, b = y - oy, c = z - oz; return t.innen(a, b, c) ? t.hole(a, b, c) : ID.beton; };
  const p = new Plan(`${id}:${v}`, ref, box);
  BELEBE[id](p, v);
  // Ausgangszustand: keine Blöcke (Kammern und Zurücksetzen bleiben exakt), nur Figuren
  if (v === mcGrund(id) && p.bloecke.size) p.fehler.push(`${id}: Ausgangszustand darf keine Blöcke bekommen`);
  cache.set(k, p);
  return p;
}
export function grundPlan() {
  if (cache.has('grund')) return cache.get('grund');
  const g = grundstadt3D();
  const p = new Plan('Grundstadt', (x, y, z) => g.hole(x, y, z), null);
  grundBelebung(p);
  cache.set('grund', p);
  return p;
}
export function plaene(beschluesse = {}) { return [grundPlan(), ...BEREICH_IDS.map((id) => einrichtung(id, varianteInWelt(id, beschluesse)))]; }

/* ---------- Befehlsblöcke für die Figuren (unter dem Regieraum) ----------
 * Ebene y = Boden − 3 (Sperre): Wiederholblock prüft „Merker noch Luft?“, dann 25 × Grundgestein lesbar (= Stadt geladen),
 *   dann Merker auf Stein (nie wieder) und Redstone-Block an T → startet die Figurenkette einmal.
 * Ebene y = Boden − 1 (Kette): Kopf H liegt im Boden des Regieraums (Knopf obendrauf = Notfall „Figuren neu rufen“),
 *   die Kette läuft darunter in Schlangenlinie: erst alte Figuren entfernen, dann jede Figur rufen, zuletzt T wieder Holzboden. */
export const PRUEFPUNKTE = [-56, -24, 8, 40, 88].flatMap((x) => [-56, -24, 8, 40, 88].map((z) => [x, z]));
const zahl = (v) => (Math.round(v * 10) / 10).toString();
export function rufBefehl(f) {
  const x = zahl(f.x + 0.5), z = zahl(f.z + 0.5);
  if (f.typ === D && f.kind) return `summon villager ${x} ${f.y} ${z} minecraft:entity_born ${f.name}`;   // Kind (Ereignis „geboren“)
  return `summon ${f.typ} ${f.name} ${x} ${f.y} ${z}`;
}
// Arten, die per /summon gerufen werden dürfen (Mojang-Verhaltensdateien: "is_summonable": true) – villager_v2 gehört NICHT dazu
export const RUFBAR = ['villager', 'npc', 'cat', 'rabbit', 'chicken'];
// aufräumen: Dorfbewohner beider Kennungen (ein gerufener „villager“ kann im Spiel zu „villager_v2“ werden)
export const AUFRAEUMEN = ['kill @e[type=villager]', 'kill @e[type=villager_v2]', 'kill @e[type=npc]', 'kill @e[type=cat]', 'kill @e[type=rabbit]', 'kill @e[type=chicken]', 'kill @e[type=item]'];
export function technikOrte(R) {
  const y0 = R.boden;
  const H = [R.x2 - 2, y0, R.z2 - 1], T = [R.x2 - 1, y0, R.z2 - 1];
  return { H, T, knopf: [H[0], y0 + 1, H[2]], schild: [H[0], y0 + 2, R.z2], kette: y0 - 1, sperre: y0 - 3,
    M: [R.x1, y0 - 3, R.z1 + 2], ticking: [R.x1, y0 - 3, R.z1 + 4], R0: [R.x1, y0 - 3, R.z1] };
}
export function baueTechnik(w, figuren, R, ticking) {
  const o = technikOrte(R), p3 = (v) => v.join(' ');
  const befehl = (pos, block, cmd, name, modus, extra = {}) => {
    w.setze(pos[0], pos[1], pos[2], block);
    w.entities.set(k3(...pos), { art: 'befehl', befehl: cmd, name, modus, ...extra });
  };
  // Kette der Figuren: Kopf im Boden (Impuls, Knopf), darunter Schlangenlinie
  const liste = [...AUFRAEUMEN, ...figuren.map(rufBefehl), `setblock ${p3(o.T)} spruce_planks`];
  befehl(o.H, 'befehlsblockUnten', liste[0], 'Figuren rufen', null);
  w.setze(o.knopf[0], o.knopf[1], o.knopf[2], 'knopf');
  w.setze(o.schild[0], o.schild[1], o.schild[2], 'schildNord');
  w.entities.set(k3(...o.schild), { art: 'schild', zeilen: ['FIGUREN', 'Knopf im Boden:', 'alle Bewohner', 'neu rufen'] });
  const weg = [];
  const yk = o.kette;
  for (let x = o.H[0]; x >= R.x1; x--) weg.push([x, yk, o.H[2]]);
  for (let z = o.H[2] - 1; z >= R.z1 && weg.length < liste.length + 2; z--) {
    const west = (o.H[2] - z) % 2 === 0;
    const xs = []; for (let x = R.x1; x <= R.x2; x++) xs.push(x);
    for (const x of west ? xs.reverse() : xs) weg.push([x, yk, z]);
  }
  if (weg.length < liste.length - 1) throw new Error('zu viele Figuren für die Befehlskette');
  for (let i = 1; i < liste.length; i++) {
    const a = weg[i - 1], b = weg[i] || [a[0] - 1, a[1], a[2]];
    const block = b[0] > a[0] ? 'ketteOst' : b[0] < a[0] ? 'ketteWest' : 'ketteNord';
    befehl(a, block, liste[i], i - AUFRAEUMEN.length >= 0 && i - AUFRAEUMEN.length < figuren.length ? `Figur ${figuren[i - AUFRAEUMEN.length].name}` : 'Figuren', 'kette');
  }
  // Sperre: einmal auslösen, sobald die Stadt geladen ist
  const sperre = [`testforblock ${p3(o.M)} air`, ...PRUEFPUNKTE.map(([x, z]) => `testforblock ${x} -64 ${z} bedrock`), `setblock ${p3(o.M)} stone`, `setblock ${p3(o.T)} redstone_block`];
  sperre.forEach((cmd, i) => {
    const pos = [o.R0[0] + i, o.R0[1], o.R0[2]];
    if (i === 0) befehl(pos, 'wiederholbefehlOst', cmd, 'Figuren: Stadt geladen?', 'wiederholen', { takt: 20 });   // jede Sekunde prüfen
    else befehl(pos, 'ketteBedingtOst', cmd, 'Figuren: Sperre', 'kette', { bedingt: true });
  });
  w.setze(o.M[0], o.M[1], o.M[2], 'luft');
  // Stadt immer geladen halten (einmal beim ersten Öffnen; wie der Knopf „EINMALIG“ im Regieraum)
  befehl(o.ticking, 'befehlsblock', ticking.replace(/^\//, ''), 'Stadt geladen halten', 'auto');
  return { kette: liste.length, sperre: sperre.length };
}

/* ---------- Anwenden ---------- */
export function belebe(w, beschluesse, R, ticking) {
  let bloecke = 0, belegt = 0;
  const alle = plaene(beschluesse);
  for (const p of alle) {
    for (const [k, n] of p.bloecke) {
      const [x, y, z] = k.split(',').map(Number);
      if (w.hole(x, y, z) !== ID.luft) { belegt++; continue; }
      w.setze(x, y, z, n); bloecke++;
    }
    for (const [k, e] of p.be) { const [x, y, z] = k.split(',').map(Number); if (w.hole(x, y, z) === ID[p.bloecke.get(k)]) w.entities.set(k, { ...e }); }
  }
  const figuren = alle.flatMap((p) => p.figuren);
  const t = baueTechnik(w, figuren, R, ticking);
  return { bloecke, belegt, figuren, ...t };
}

/* ---------- Prüfhilfen ---------- */
// Belebungsblöcke einer Fläche (für die Prüfung der Datei: Vorlage + diese Blöcke = erwarteter Inhalt)
export function belebungsBloecke(id, v) { return einrichtung(id, v).bloecke; }
// Zu Fuß erreichbar? Breitensuche über Zellen mit 2 freien Blöcken und festem Boden (Stufen bis 1 Block)
export function erreichbar(w, start, ziele, y1 = S - 2, y2 = S + 12) {
  const { x1, z1, x2, z2 } = STADT, nx = x2 - x1 + 1, nz = z2 - z1 + 1, ny = y2 - y1 + 1;
  const besucht = new Uint8Array(nx * nz * ny), idx = (x, y, z) => ((y - y1) * nz + (z - z1)) * nx + (x - x1);
  const steh = (x, y, z) => x >= x1 && x <= x2 && z >= z1 && z <= z2 && y > y1 && y < y2 && DURCH.has(w.hole(x, y, z)) && DURCH.has(w.hole(x, y + 1, z)) && fest(w.hole(x, y - 1, z));
  const q = [start]; besucht[idx(...start)] = 1;
  for (let i = 0; i < q.length; i++) {
    const [x, y, z] = q[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const dy of [0, 1, -1]) {
      const a = x + dx, b = y + dy, c = z + dz;
      if (a < x1 || a > x2 || c < z1 || c > z2 || b <= y1 || b >= y2 || besucht[idx(a, b, c)]) continue;
      if (dy === 1 && !DURCH.has(w.hole(x, y + 2, z))) continue;
      if (dy === -1 && !DURCH.has(w.hole(a, y + 1, c))) continue;
      if (!steh(a, b, c)) continue;
      besucht[idx(a, b, c)] = 1; q.push([a, b, c]);
      if (dy !== 0) break;
    }
  }
  return ziele.map(([titel, x, y, z]) => [titel, !!besucht[idx(x, y, z)]]);
}
