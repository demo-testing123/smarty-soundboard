/* START IT SMART – Stadt-Konfigurator: ENTSCHEIDUNGSZUSTAND.
 * Beschlüsse je Baufläche (übernommen), optional die Mehrheit einer Abstimmung, die Regie-Position.
 * Gespeichert im Browser (localStorage) – übersteht Neuladen und Absturz. Ohne Speicher läuft alles weiter, nur ohne Erinnerung.
 * Nur definierte Bauflächen werden geändert; ein Beschluss betrifft nie eine andere Fläche. */
import { BEREICHE, BEREICH_IDS } from './stadtmodell.js';
import { MISSIONEN } from './daten.js';

export const SPEICHER_SCHLUESSEL = 'sis-stadtkonfigurator-v1';

function sichererSpeicher() {
  try { const t = '__probe'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch { return null; }
}

export class Zustand {
  constructor(speicher = sichererSpeicher(), schluessel = SPEICHER_SCHLUESSEL) {
    this.speicher = speicher;
    this.schluessel = schluessel;
    this.beschluesse = {};      // bereich → variante (nur Abweichungen vom grauen Ausgangszustand)
    this.mehrheit = {};         // mission → Buchstabe (optional, nur zur Erinnerung)
    this.position = { mission: 0, schritt: 0 };
    this.verlauf = [];          // [Zeit, Text] – kleines Protokoll für die Regie
    this.laden();
  }
  laden() {
    if (!this.speicher) return;
    try {
      const d = JSON.parse(this.speicher.getItem(this.schluessel) || 'null');
      if (!d) return;
      for (const [b, v] of Object.entries(d.beschluesse || {})) if (BEREICHE[b] && BEREICHE[b].varianten.includes(v) && v !== BEREICHE[b].grund && !this.nurVorschau(b, v)) this.beschluesse[b] = v;
      for (const [m, x] of Object.entries(d.mehrheit || {})) if (MISSIONEN.some((y) => y.id === m) && /^[ABC]$/.test(x)) this.mehrheit[m] = x;
      if (d.position && Number.isInteger(d.position.mission) && Number.isInteger(d.position.schritt)) this.position = d.position;
      if (Array.isArray(d.verlauf)) this.verlauf = d.verlauf.slice(-60);
    } catch { /* kaputter Speicherstand: mit grauer Stadt beginnen */ }
  }
  speichern() {
    if (!this.speicher) return false;
    try { this.speicher.setItem(this.schluessel, JSON.stringify({ beschluesse: this.beschluesse, mehrheit: this.mehrheit, position: this.position, verlauf: this.verlauf, stand: new Date().toISOString() })); return true; } catch { return false; }
  }
  // Diskussionsbilder (Natur A/B) sind nie ein Beschluss
  nurVorschau(bereich, v) { return BEREICHE[bereich].mc && !BEREICHE[bereich].mc.includes(v); }
  variante(bereich) { return this.beschluesse[bereich] || BEREICHE[bereich].grund; }
  alle() { return Object.fromEntries(BEREICH_IDS.map((b) => [b, this.variante(b)])); }
  uebernehmen(bereich, v) {
    if (!BEREICHE[bereich] || !BEREICHE[bereich].varianten.includes(v)) throw new Error(`unbekannte Variante ${bereich}:${v}`);
    if (this.nurVorschau(bereich, v)) throw new Error(`${bereich}:${v} ist nur ein Diskussionsbild`);
    if (v === BEREICHE[bereich].grund) delete this.beschluesse[bereich]; else this.beschluesse[bereich] = v;
    this._log(`${BEREICHE[bereich].titel}: ${v}`);
    this.speichern();
  }
  zuruecksetzenBereich(bereich) { delete this.beschluesse[bereich]; this._log(`${BEREICHE[bereich].titel}: zurückgesetzt`); this.speichern(); }
  zuruecksetzenMission(missionId) {
    const m = MISSIONEN.find((x) => x.id === missionId);
    for (const b of m.bereiche) delete this.beschluesse[b];
    delete this.mehrheit[missionId];
    this._log(`${m.kurz}: zurückgesetzt`);
    this.speichern();
  }
  neuBeginnen() {
    this.beschluesse = {}; this.mehrheit = {}; this.position = { mission: 0, schritt: 0 };
    this._log('Neu begonnen');
    this.speichern();
  }
  merkeMehrheit(missionId, buchstabe) { if (buchstabe) this.mehrheit[missionId] = buchstabe; else delete this.mehrheit[missionId]; this.speichern(); }
  setzePosition(mission, schritt) { this.position = { mission, schritt }; this.speichern(); }
  status(missionId) {
    const m = MISSIONEN.find((x) => x.id === missionId);
    if (!m.bereiche.length) return 'ohne';
    const n = m.bereiche.filter((b) => this.beschluesse[b]).length;
    return n === 0 ? 'offen' : n === m.bereiche.length ? 'beschlossen' : 'teilweise';
  }
  _log(text) { this.verlauf.push([new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), text]); this.verlauf = this.verlauf.slice(-60); }
}
