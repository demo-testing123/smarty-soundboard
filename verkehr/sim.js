/* Simulationslogik – ohne Grafik und ohne Bedienung.
 * Läuft in festen Zeitschritten (CONFIG.schritt). Gleicher Modus → identischer Ablauf.
 *
 * Koordinaten: Kreuzungsmitte (0,0). x nach rechts (Hauptstraße), z nach vorn (Querstraße).
 * Rechtsverkehr: Spur 'ost' (Bus) bei z=+1,75, 'west' bei z=−1,75, 'sued' bei x=−1,75, 'nord' bei x=+1,75.
 */
import { CONFIG } from './config.js';

export const ROT = 'rot', ROTGELB = 'rotgelb', GRUEN = 'gruen', GELB = 'gelb';

// Phasen der Ampelsteuerung: Signal für Hauptstraße (Bus) und Querstraße
const PHASEN = {
  QUER_GRUEN:    { haupt: ROT,     quer: GRUEN },
  QUER_GELB:     { haupt: ROT,     quer: GELB },
  ALLES_ROT_1:   { haupt: ROT,     quer: ROT },
  HAUPT_ROTGELB: { haupt: ROTGELB, quer: ROT },
  HAUPT_GRUEN:   { haupt: GRUEN,   quer: ROT },
  HAUPT_GELB:    { haupt: GELB,    quer: ROT },
  ALLES_ROT_2:   { haupt: ROT,     quer: ROT },
  QUER_ROTGELB:  { haupt: ROT,     quer: ROTGELB },
};
const NAECHSTE = {
  QUER_GRUEN: 'QUER_GELB', QUER_GELB: 'ALLES_ROT_1', ALLES_ROT_1: 'HAUPT_ROTGELB', HAUPT_ROTGELB: 'HAUPT_GRUEN',
  HAUPT_GRUEN: 'HAUPT_GELB', HAUPT_GELB: 'ALLES_ROT_2', ALLES_ROT_2: 'QUER_ROTGELB', QUER_ROTGELB: 'QUER_GRUEN',
};

export function spuren(c = CONFIG) {
  const L = c.strasse.laenge, h = c.strasse.halteAbstand, o = c.strasse.breite / 4;
  const sp = (gruppe, x0, z0, dx, dz) => ({ gruppe, x0, z0, dx, dz, laenge: 2 * L, halt: L - h, mitte: L });
  return {
    ost:  sp('haupt', -L, +o, 1, 0),
    west: sp('haupt', +L, -o, -1, 0),
    sued: sp('quer', -o, -L, 0, 1),
    nord: sp('quer', +o, +L, 0, -1),
  };
}

export class Simulation {
  constructor(modus = 'normal', c = CONFIG) {
    this.c = c;
    this.spuren = spuren(c);
    this.reset(modus);
  }

  /* exakt derselbe Ausgangszustand für beide Versuche */
  reset(modus = this.modus) {
    const c = this.c;
    this.modus = modus;             // 'normal' | 'schlau'
    this.t = 0;
    this.n = 0;                     // Schrittzähler
    this.phase = 'QUER_GRUEN';
    this.inPhase = c.ampel.startQuerGruenSeit;
    this.phasenNr = 0;
    this.fahrzeuge = [];
    this.naechsteId = 1;
    this.geplant = c.autos.map((a, i) => ({ ...a, i, erledigt: false }));
    this.ereignisse = [];
    this.funk = null;               // { gesendet, empfangen, entscheidungBis }
    this.anforderung = false;
    this.fertig = false;
    this.konflikte = 0;             // Prüfung: kreuzende Richtungen gleichzeitig nicht-rot
    this.kreuzungsKonflikte = 0;    // Prüfung: kreuzende Fahrzeuge gleichzeitig in der Kreuzung
    this.rotFahrten = 0;            // Prüfung: Haltelinie bei Rot/Rot-Gelb überfahren
    this.querWarten = 0;            // Summe der Standzeit aller Autos auf der Querstraße

    const b = c.bus;
    const ost = this.spuren.ost;
    this.bus = this._neu('bus', 'ost', b.start - ost.x0, b.tempo, { laenge: b.laenge, vmax: b.tempo, a: b.anfahren, b: b.bremsen, farbe: '#f5a524' });
    this.bus.gewartet = 0;
    this.bus.steht = false;
    this.bus.ueberfahrtSignal = null;
    this._spawn();
  }

  signal(gruppe) { return PHASEN[this.phase][gruppe]; }

  _neu(typ, spur, s, v, p) {
    const f = { id: this.naechsteId++, typ, spur, s, v, weg: 0, durch: s > this.spuren[spur].halt, gelbEntscheid: null, ...p };
    this.fahrzeuge.push(f);
    return f;
  }

  _spawn() {
    const a = this.c.auto;
    for (const g of this.geplant) {
      if (g.erledigt || this.t + 1e-9 < g.t) continue;
      // nur wenn am Startpunkt Platz ist (sonst im nächsten Schritt erneut)
      const frei = this.fahrzeuge.every((f) => f.spur !== g.spur || Math.abs(f.s - g.s) > a.laenge + 4);
      if (!frei) continue;
      g.erledigt = true;
      this._neu('auto', g.spur, g.s, g.stehtSchon ? 0 : a.tempo, { laenge: a.laenge, vmax: a.tempo, a: a.anfahren, b: a.bremsen, farbe: g.farbe });
    }
  }

  _log(typ) { this.ereignisse.push({ t: this.t, typ }); }

  _wechsel(neu, grund) {
    this.phase = neu;
    this.inPhase = 0;
    this.phasenNr++;
    if (neu === 'QUER_GELB' && grund === 'bus') this._log('umschalten');
    if (neu === 'ALLES_ROT_1') this._log('allesRot');
    if (neu === 'HAUPT_ROTGELB') this._log('rotGelb');
    if (neu === 'HAUPT_GRUEN') this._log('busGruen');
  }

  _steuerung(dt) {
    const a = this.c.ampel;
    this.inPhase += dt;
    const dauer = {
      QUER_GELB: a.gelb, ALLES_ROT_1: a.allesRot, HAUPT_ROTGELB: a.rotGelb,
      HAUPT_GELB: a.gelb, ALLES_ROT_2: a.allesRot, QUER_ROTGELB: a.rotGelb,
    };
    const eps = 1e-9;
    if (this.phase === 'QUER_GRUEN') {
      // intelligente Ampel: nach Funksignal und Prüfung früher umschalten – aber nie vor der Mindestgrünzeit
      const busFrueher = this.modus === 'schlau' && this.anforderung && this.funk &&
        this.t + eps >= this.funk.entscheidungBis && this.inPhase + eps >= a.minGruen;
      if (busFrueher) this._wechsel('QUER_GELB', 'bus');
      else if (this.inPhase + eps >= a.querGruen) this._wechsel('QUER_GELB', 'zyklus');
    } else if (this.phase === 'HAUPT_GRUEN') {
      // solange der Bus angemeldet ist und noch nicht durch ist, Grün halten (höchstens 10 s länger)
      const halten = this.modus === 'schlau' && this.anforderung && !this.bus.durch && this.inPhase < a.hauptGruen + 10;
      if (!halten && this.inPhase + eps >= a.hauptGruen) this._wechsel('HAUPT_GELB');
    } else if (this.inPhase + eps >= dauer[this.phase]) {
      this._wechsel(NAECHSTE[this.phase]);
    }
  }

  _vorder(f) {
    let best = null;
    for (const o of this.fahrzeuge) if (o !== f && o.spur === f.spur && o.s > f.s && (!best || o.s < best.s)) best = o;
    return best;
  }

  _fahren(f, dt) {
    const sp = this.spuren[f.spur];
    let vZiel = f.vmax;
    let haltenMuss = false;
    const dHalt = sp.halt - f.s;           // Abstand Fahrzeugfront → Haltelinie
    if (!f.durch) {
      const st = this.signal(sp.gruppe);
      if (st === ROT || st === ROTGELB) haltenMuss = true;
      else if (st === GELB) {
        // einmal je Gelbphase entscheiden: anhalten, wenn es mit normalem Bremsen geht
        if (!f.gelbEntscheid || f.gelbEntscheid.nr !== this.phasenNr) {
          f.gelbEntscheid = { nr: this.phasenNr, halten: dHalt - 0.5 >= (f.v * f.v) / (2 * f.b) };
        }
        haltenMuss = f.gelbEntscheid.halten;
      }
      if (haltenMuss) vZiel = Math.min(vZiel, Math.sqrt(2 * f.b * Math.max(0, dHalt - 0.5)));
    }
    const vor = this._vorder(f);
    if (vor) {
      const luecke = vor.s - vor.laenge - f.s - 2.5;
      vZiel = Math.min(vZiel, Math.sqrt(vor.v * vor.v + 2 * f.b * Math.max(0, luecke)));
      if (luecke <= 0) vZiel = 0;
    }
    if (f.v < vZiel) f.v = Math.min(vZiel, f.v + f.a * dt);
    else f.v = Math.max(vZiel, f.v - 3 * f.b * dt);
    if (f.v < 1e-3 && vZiel < 1e-3) f.v = 0;

    let sNeu = f.s + f.v * dt;
    if (haltenMuss && sNeu > sp.halt - 0.3) { sNeu = Math.max(f.s, sp.halt - 0.3); f.v = 0; }   // niemals über Rot
    f.weg += sNeu - f.s;
    f.s = sNeu;

    if (!f.durch && f.s > sp.halt) {
      f.durch = true;
      const st = this.signal(sp.gruppe);
      if (st === ROT || st === ROTGELB) this.rotFahrten++;
      if (f.typ === 'bus') { f.ueberfahrtSignal = st; this.anforderung = false; this._log('busDurch'); }
    }
  }

  /* ein fester Zeitschritt */
  schritt() {
    if (this.fertig) return;
    const dt = this.c.schritt;
    const b = this.c.bus;
    this.t = ++this.n * dt;

    this._steuerung(dt);
    this._spawn();
    for (const f of this.fahrzeuge) this._fahren(f, dt);

    // Funksignal des Busses (nur intelligente Ampel)
    const funkPunkt = this.spuren.ost.halt - b.funkAbstand;
    if (this.modus === 'schlau' && !this.funk && this.bus.s >= funkPunkt) {
      this.funk = { gesendet: this.t, empfangen: this.t + b.funkDauer, entscheidungBis: this.t + b.funkDauer + this.c.ampel.entscheidung };
      this.anforderung = true;
      this._log('funk');
    }
    if (this.funk && !this.funk.angekommen && this.t + 1e-9 >= this.funk.empfangen) { this.funk.angekommen = true; this._log('empfangen'); }

    // Wartezeit: so lange der Bus vor der Haltelinie steht
    const steht = !this.bus.durch && this.bus.v < 0.05;
    if (steht) this.bus.gewartet += dt;
    if (steht && !this.bus.steht) this._log('busSteht');
    if (!steht && this.bus.steht) this._log('busFaehrt');
    this.bus.steht = steht;
    for (const f of this.fahrzeuge) if (f.typ === 'auto' && this.spuren[f.spur].gruppe === 'quer' && !f.durch && f.v < 0.05) this.querWarten += dt;

    this._pruefen();

    // Fahrzeuge am Ende der Straße entfernen
    this.fahrzeuge = this.fahrzeuge.filter((f) => f.typ === 'bus' || f.s - f.laenge < this.spuren[f.spur].laenge);
    // Versuch vorbei, wenn der Bus (Front) rechts bei CONFIG.bus.ende angekommen ist
    if (this.spuren.ost.x0 + this.bus.s >= b.ende) { this.fertig = true; this._log('fertig'); }
  }

  _pruefen() {
    const h = this.signal('haupt'), q = this.signal('quer');
    if (h !== ROT && q !== ROT) this.konflikte++;
    const halb = this.c.strasse.breite / 2;
    let haupt = false, quer = false;
    for (const f of this.fahrzeuge) {
      const sp = this.spuren[f.spur];
      const vorn = f.s, hinten = f.s - f.laenge;
      if (vorn > sp.mitte - halb && hinten < sp.mitte + halb) {
        if (sp.gruppe === 'haupt') haupt = true; else quer = true;
      }
    }
    if (haupt && quer) this.kreuzungsKonflikte++;
  }

  /* für Tests: bis zum Ende laufen lassen */
  bisEnde(maxSekunden = 300) {
    const max = Math.round(maxSekunden / this.c.schritt);
    while (!this.fertig && this.n < max) this.schritt();
    return this;
  }

  welt(f) {
    const sp = this.spuren[f.spur];
    const m = f.s - f.laenge / 2;   // Fahrzeugmitte
    return { x: sp.x0 + sp.dx * m, z: sp.z0 + sp.dz * m, winkel: Math.atan2(-sp.dz, sp.dx) };
  }

  /* Wartezeit in ganzen Sekunden, wie sie angezeigt wird */
  static runden(s) { return Math.round(s); }
}
