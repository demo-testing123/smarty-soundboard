/* Modell ohne Grafik: sichtbare Blöcke des grünen Spielplatzes und das Sensorlabor (Regel, Werte je Schritt).
 * Der Platz kommt aus ../minecraft/welt.js – dieselbe Vorlage wie in der Minecraft-Testwelt und im Stadt-Konfigurator.
 * Alle Werte sind modellierte Beispielwerte in Prozent (keine echten Sensoren, keine Messgenauigkeit). */
import { vorlageGruen, GRUEN_TEILE, BLOECKE, NAMEN, ID, istPflanze, istSchild, PLATZ } from '../minecraft/welt.js';
import { CONFIG } from './config.js';

export { GRUEN_TEILE, ID };
export const B = PLATZ.boden;                       // relative Höhe der Bodenschicht (4)
export const GROESSE = { dx: PLATZ.dx, dy: PLATZ.dy, dz: PLATZ.dz };
export const VORLAGE = vorlageGruen();

/* ---------- Blockarten ---------- */
const ids = (...n) => new Set(n.map((k) => ID[k]));
const LAUB = ids('eicheLaub', 'birkeLaub', 'azalee');
const HALB = ids('fichteHalb', 'bankOst', 'bankWest', 'bankSued', 'bankNord');
export const istLaub = (id) => LAUB.has(id);
export const blockFarbe = (id) => BLOECKE[NAMEN[id]][2];
export function form(id) {
  if (id === ID.luft || istSchild(id) || id === ID.knopf) return 'keine';
  if (id === ID.wasser) return 'wasser';
  if (istPflanze(id)) return 'pflanze';
  if (HALB.has(id)) return 'halb';
  if (id === ID.laterne) return 'klein';
  if (id === ID.kette) return 'duenn';
  if (id === ID.fenster) return 'glas';
  return 'voll';
}
const deckt = (id) => { const f = form(id); return f === 'voll' && !istLaub(id); };

/* Sichtbare Blöcke: alles, was nicht rundum von vollen Blöcken umschlossen ist.
 * Norden und Westen (x < 0, z < 0) grenzen bis zur Bodenschicht an die Straßenplatte, Süden und Osten sind die
 * offene Schnittkante des Modells (dort sieht man den Boden im Schnitt). Wasser wird eigens dargestellt (Füllstand). */
export function sichtbareBloecke(v = VORLAGE) {
  const offen = (x, y, z) => {
    if (y < 0) return false;
    if (x < 0 || z < 0) return y > B;
    if (x >= v.dx || z >= v.dz || y >= v.dy) return true;
    return !deckt(v.hole(x, y, z));
  };
  const liste = [];
  for (let y = 0; y < v.dy; y++) for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) {
    const id = v.hole(x, y, z), f = form(id);
    if (f === 'keine' || f === 'wasser') continue;
    if (f === 'voll' && ![[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => offen(x + a, y + b, z + c))) continue;
    liste.push({ x, y, z, id, form: f, laub: istLaub(id) });
  }
  return liste;
}
// Rasenflächen von oben (für die Anzeige „nass / feucht / trocken“): oberster Block ist Gras, darüber nur Luft oder Pflanzen
export function rasenFelder(v = VORLAGE) {
  const felder = [];
  for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) {
    let y = v.dy - 1;
    while (y > 0 && (v.hole(x, y, z) === ID.luft || istPflanze(v.hole(x, y, z)))) y--;
    if (v.hole(x, y, z) === ID.gras || v.hole(x, y, z) === ID.moos) felder.push({ x, y, z });
  }
  return felder;
}

/* ---------- Regel der Steuerung (regelbasiert, keine KI) ----------
 * EIN nur, wenn Boden trocken (Feuchte UNTER dem Grenzwert) UND genug Wasser in der Zisterne.
 * AUS, sobald der Boden feucht genug ist ODER zu wenig Wasser da ist. Bei leerer Zisterne startet nie etwas. */
export const bodenStatus = (feuchte, r = CONFIG.regel) => (feuchte < r.trocken ? 'trocken' : feuchte >= r.nass ? 'nass' : 'feucht');
export const darfStarten = (feuchte, wasser, r = CONFIG.regel) => feuchte < r.trocken && wasser >= r.minWasser && wasser > 0;
export const mussStoppen = (feuchte, wasser, r = CONFIG.regel) => feuchte >= r.feuchtGenug || wasser < r.minWasser;

/* ---------- Sensorlabor: Werte je Schritt (Zeit gerafft) ----------
 * setzeSchritt(i) setzt die Startwerte des Schritts – jeder Schritt ist dadurch immer gleich vorführbar, ohne Schalter
 * zurückzusetzen. schritt(dt) lässt die Werte laufen. In Schritt 4 wird erst sichtbar geprüft, dann bewässert. */
export class Sensorlabor {
  constructor(c = CONFIG) { this.c = c; this.setzeSchritt(0); }
  setzeSchritt(i) {
    const n = this.c.schritte.length;
    this.i = Math.max(0, Math.min(n - 1, i));
    this.s = this.c.schritte[this.i];
    this.wasser = this.s.start.wasser;
    this.feuchte = this.s.start.feuchte;
    this.t = 0;
    this.bewaesserung = false;
    this.phase = this.s.regelpruefung ? 'pruefen' : 'lauf';
    this.grund = null;
    this.mulde = this.i === 1 ? 0.75 : 0;           // nach dem Regen steht noch etwas Wasser in der Mulde
    this.gegossen = 0;
    return this;
  }
  // nur für Prüfungen: andere Ausgangswerte im laufenden Schritt
  setzeWerte({ wasser = this.wasser, feuchte = this.feuchte } = {}) { this.wasser = wasser; this.feuchte = feuchte; return this; }
  // was die Regel gerade sieht (für die Anzeige)
  get bedingung1() { return this.feuchte < this.c.regel.trocken; }
  get bedingung2() { return this.wasser >= this.c.regel.minWasser && this.wasser > 0; }
  get status() { return bodenStatus(this.feuchte, this.c.regel); }
  // Anzeige-Stufe der Regelprüfung: 0 nichts, 1 Bedingung 1, 2 beide Bedingungen, 3 Ergebnis
  get pruefStufe() {
    if (!this.s.regelpruefung) return 0;
    if (this.phase !== 'pruefen') return 3;
    return Math.min(2, Math.floor((this.t / this.c.pruefDauer) * 3) + 1);
  }
  schritt(dt) {
    const s = this.s, r = this.c.regel, nah = (a, b, d) => (a < b ? Math.min(b, a + d) : Math.max(b, a - d));
    this.t += dt;
    if (s.regelpruefung) {
      if (this.phase === 'pruefen' && this.t >= this.c.pruefDauer) {
        if (darfStarten(this.feuchte, this.wasser, r)) { this.bewaesserung = true; this.phase = 'ein'; }
        else { this.phase = 'aus'; this.grund = !this.bedingung1 ? 'nass' : 'leer'; }
      } else if (this.phase === 'ein') {
        this.feuchte = Math.min(100, this.feuchte + s.tempo.feuchte * dt);
        this.wasser = Math.max(0, this.wasser - s.tempo.wasser * dt);
        this.gegossen = Math.min(1, this.gegossen + dt / 6);
        if (mussStoppen(this.feuchte, this.wasser, r)) {
          this.bewaesserung = false; this.phase = 'aus';
          this.grund = this.feuchte >= r.feuchtGenug ? 'feucht' : 'leer';
        }
      }
    } else {
      this.wasser = nah(this.wasser, s.ziel.wasser, s.tempo.wasser * dt);
      this.feuchte = nah(this.feuchte, s.ziel.feuchte, s.tempo.feuchte * dt);
    }
    this.mulde = s.regen ? Math.min(1, this.mulde + dt / 7) : Math.max(0, this.mulde - dt / 9);
    return this;
  }
  // fertig = nichts bewegt sich mehr (Anzeige ruhig, es wird nicht mehr gezeichnet)
  get fertig() {
    const s = this.s;
    if (s.regelpruefung) return this.phase === 'aus';
    return this.wasser === s.ziel.wasser && this.feuchte === s.ziel.feuchte && (s.regen ? this.mulde === 1 : this.mulde === 0);
  }
  // Werte so anzeigen, dass keine Messgenauigkeit vorgetäuscht wird: ganze Prozent
  anzeige() { return { wasser: Math.round(this.wasser), feuchte: Math.round(this.feuchte) }; }
}
