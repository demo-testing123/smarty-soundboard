/* Modell ohne Grafik: Blöcke, Wärme (vereinfacht), Wasser bei Starkregen, Zeitplan der Verwandlung.
 * Die beiden Zustände des Platzes kommen aus ../minecraft/welt.js – dieselben Vorlagen wie in der Minecraft-Testwelt. */
import { vorlageGrau, vorlageGruen, GRUEN_TEILE, BLOECKE, NAMEN, ID, istPflanze, istSchild, PLATZ } from '../minecraft/welt.js';
import { CONFIG } from './config.js';

export { GRUEN_TEILE, ID };
export const B = PLATZ.boden;                       // relative Höhe der Bodenschicht (4)
export const GROESSE = { dx: PLATZ.dx, dy: PLATZ.dy, dz: PLATZ.dz };
export const VORLAGEN = { grau: vorlageGrau(), gruen: vorlageGruen() };

/* ---------- Blockarten ---------- */
const ids = (...n) => new Set(n.map((k) => ID[k]));
const VERSIEGELT = ids('beton', 'betonHell', 'betonWeiss', 'asphalt', 'glattstein', 'andesit', 'schwarzstein', 'licht');
const LAUB = ids('eicheLaub', 'birkeLaub', 'azalee');
const HALB = ids('fichteHalb', 'bankOst', 'bankWest', 'bankSued', 'bankNord');
export const istLaub = (id) => LAUB.has(id);
export const istVersiegelt = (id) => VERSIEGELT.has(id);
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
export function sichtbareBloecke(v) {
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

/* ---------- Wärme (vereinfacht) ----------
 * Für jede Bodenstelle: liegt sie in der Sonne oder im Schatten (Blick Richtung Sonne durch das Blockgitter)?
 * Stein und Beton in der Sonne = heiß, andere Flächen in der Sonne = warm, Schatten und Wasser = kühler.
 * Bewusst ohne Zahlen: Es geht um den Unterschied, nicht um Messwerte. */
// zur Sonne hin: Süd-Südwest, hoch. So fallen die Schatten der Hochhäuser (Norden, Westen) nicht auf den Platz.
export const SONNE = (() => { const v = [-0.3, 1.1, 0.62], l = Math.hypot(...v); return v.map((k) => k / l); })();
const BODEN_AUSNAHME = (id) => id === ID.luft || istPflanze(id) || istLaub(id) || istSchild(id) || id === ID.kette || id === ID.laterne || id === ID.knopf;

export function bodenHoehe(v, x, z) {
  for (let y = v.dy - 1; y >= 0; y--) if (!BODEN_AUSNAHME(v.hole(x, y, z))) return y;
  return 0;
}
export function imSchatten(v, x, y, z, sonne = SONNE) {
  let px = x + 0.5, py = y + 1.02, pz = z + 0.5;
  for (let k = 0; k < 120; k++) {
    px += sonne[0] * 0.2; py += sonne[1] * 0.2; pz += sonne[2] * 0.2;
    if (py >= v.dy) return false;
    const bx = Math.floor(px), by = Math.floor(py), bz = Math.floor(pz);
    if (bx < 0 || bz < 0 || bx >= v.dx || bz >= v.dz) return false;
    const id = v.hole(bx, by, bz);
    if (deckt(id) || istLaub(id)) return true;
  }
  return false;
}
export function waerme(v, sonne = SONNE) {
  const feld = [];
  for (let z = 0; z < v.dz; z++) for (let x = 0; x < v.dx; x++) {
    const y = bodenHoehe(v, x, z), id = v.hole(x, y, z);
    const wasser = id === ID.wasser || id === ID.fenster;
    const schatten = imSchatten(v, x, y, z, sonne);
    const art = wasser || schatten ? 'kuehl' : istVersiegelt(id) ? 'heiss' : 'warm';
    feld.push({ x, y, z, art });
  }
  return feld;
}
export function waermeAnteile(v) {
  const n = { heiss: 0, warm: 0, kuehl: 0 };
  for (const f of waerme(v)) n[f.art]++;
  return n;
}

/* ---------- Wasser bei Starkregen (Zeit gerafft) ----------
 * grau: Regen landet auf versiegeltem Boden und fließt zu den Abflüssen; nichts versickert, nichts wird gesammelt.
 * grün: Ein Teil versickert, Regenmulde und tiefer Spielbereich nehmen vorübergehend Wasser auf, die Zisterne sammelt.
 * Nach dem Regen versickert das Wasser in Mulde und tiefem Bereich; die Zisterne bleibt gefüllt und kann Bäume gießen.
 * Alle Werte 0 … 1 (Anteil des sichtbaren Füllstands), keine Liter. */
export class Wasser {
  constructor(dauer = CONFIG.dauer) { this.d = dauer; this.reset('grau'); }
  reset(zustand, zisterne = 0.3) {
    Object.assign(this, { zustand, regen: false, giessen: false, mulde: 0, tief: 0, zisterne: zustand === 'gruen' ? zisterne : 0, abfluss: 0, versickern: 0, gegossen: 0 });
    return this;
  }
  schritt(dt) {
    const nah = (a, b, r) => (a < b ? Math.min(b, a + r) : Math.max(b, a - r));
    if (this.zustand === 'grau') {
      this.abfluss = nah(this.abfluss, this.regen ? 1 : 0, dt * 1.2);
      this.versickern = 0;
      return this;
    }
    this.abfluss = 0;
    this.versickern = nah(this.versickern, this.regen ? 1 : 0, dt * 0.8);
    const fuellen = dt / this.d.wasserFuellen, leeren = dt / this.d.versickern;
    if (this.regen) {
      this.mulde += fuellen;
      this.tief += fuellen * 0.85;
      this.zisterne += fuellen * 0.75;
    } else {
      this.mulde -= leeren;
      this.tief -= leeren * 0.8;
    }
    if (this.giessen && !this.regen && this.zisterne > 0.25) {
      this.zisterne -= dt * 0.3 / this.d.giessen;
      this.gegossen = Math.min(1, this.gegossen + dt / this.d.giessen);
    }
    for (const k of ['mulde', 'tief', 'zisterne']) this[k] = Math.max(0, Math.min(1, this[k]));
    return this;
  }
  get gesperrt() { return this.tief > 0.12; }      // „Wenn der Bereich voll Wasser ist, wird dort nicht gespielt.“
}

/* ---------- Verwandlung grau → grün: Schicht für Schicht von unten ---------- */
// Fortschritt in Schichten (0 … dy): Schicht L ist ab p > L grün; sie wächst innerhalb einer Schichtdauer auf.
export function aufbau(t, dauer = CONFIG.dauer.verwandeln, schichten = GROESSE.dy) {
  return Math.max(0, Math.min(schichten + 1, (t / dauer) * (schichten + 1)));
}
export const schichtWuchs = (p, L) => Math.max(0, Math.min(1, p - L));
