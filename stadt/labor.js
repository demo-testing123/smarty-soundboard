/* START IT SMART – Calliope-Labor (Mission Technik · Szene 2/5, Auftrag 01 vom 26.11.2026).
 * Vereinfachtes Blockprogramm für eine schlaue Straßenlaterne – kein MakeCode-Nachbau, keine Hardwarekopplung.
 * Logik (Klasse Labor) und Darstellung (laborAnsicht) sind getrennt. Die Logik bekommt die Zeit immer von außen
 * (monotone Zeit in Millisekunden, im Browser performance.now()): keine Wartefunktion, nichts blockiert, und die
 * Abnahmetests sind mit genauen Zeiten prüfbar. Alle Werte sind simuliert. Nichts wird gespeichert. */

export const LABOR = {
  schwelle: 30,          // unter 30 % = dunkel, ab 30 % = hell (didaktische Simulationsannahme)
  sekunden: 10,          // Standard der verbesserten Regel
  min: 1, max: 20,       // einstellbare Sekunden
  wolkeMs: 2000,         // kurze Wolke: zwei Sekunden dunkel, danach wieder hell
  sonne: 85, wolke: 15, abgedeckt: 5, nacht: 10,   // simulierte Helligkeit in Prozent
};
export const BAU = ['WENN', 'Bedingung', 'DANN', 'SONST'];   // Reihenfolge beim Aufbau der einfachen Regel

const begrenzen = (x, a, b) => Math.max(a, Math.min(b, x));

export class Labor {
  constructor(cfg = {}) { this.cfg = { ...LABOR, ...cfg }; this.neu(0); }

  /* ---------- Programm ---------- */
  // Alles auf Anfang (Neu beginnen): nur die Schleife, Versuch A, Standard-Sekunden
  neu(t = 0) { this.stufe = 0; this.verbessert = false; this.modus = 'A'; this.sekunden = this.cfg.sekunden; this.testZurueck(t); }
  get fertig() { return this.stufe >= BAU.length; }                 // erst dann sind die Tests frei
  get naechster() { return this.fertig ? null : BAU[this.stufe]; }
  blockErgaenzen(t) { if (this.fertig) return false; this.stufe++; this.testZurueck(t); return true; }
  // Zeitblock ergänzen: verbesserte Regel (Versuch B)
  verbessern(t) { if (!this.fertig) return false; this.verbessert = true; this.modus = 'B'; this.testZurueck(t); return true; }
  setModus(m, t) {
    if (m === 'B' && !this.verbessert) return this.verbessern(t);
    if (m !== 'A' && m !== 'B') return false;
    if (m !== this.modus) { this.modus = m; this.testZurueck(t); }          // Moduswechsel beendet den laufenden Test
    return true;
  }
  setSekunden(s, t) {
    const n = Number(s);
    s = begrenzen(Math.round(Number.isFinite(n) ? n : this.cfg.sekunden), this.cfg.min, this.cfg.max);
    if (s !== this.sekunden) { this.sekunden = s; this.testZurueck(t); }  // neuer Wert = neuer, eindeutiger Versuch
    return this.sekunden;
  }

  /* ---------- Test ---------- */
  // Test abbrechen: hell (Sonne), Wolke und Abdecken aus, Zähler 0, Licht aus
  testZurueck(t) {
    this.helligkeit = this.cfg.sonne; this.wolkeBis = null; this.wolkeHell = null; this.abgedeckt = false; this.vorAbdecken = null;
    this.dunkelSeit = null; this.licht = false; this.auswerten(t);
  }
  setHelligkeit(w, t) {
    this.tick(t);
    this.wolkeBis = null; this.abgedeckt = false;
    this.helligkeit = begrenzen(Math.round(Number(w) || 0), 0, 100);
    this.auswerten(t);
  }
  sonne(t) { this.setHelligkeit(this.cfg.sonne, t); }
  dunkelheit(t) { this.setHelligkeit(this.cfg.nacht, t); }             // anhaltende Dunkelheit
  // Sensor abdecken (Hand über dem Sensor) – zweiter Klick nimmt die Hand weg
  abdecken(t) {
    this.tick(t);
    if (this.abgedeckt) { this.abgedeckt = false; this.helligkeit = this.vorAbdecken ?? this.cfg.sonne; }
    else {
      this.vorAbdecken = this.wolkeBis != null ? this.wolkeHell : this.helligkeit;
      this.wolkeBis = null; this.abgedeckt = true; this.helligkeit = this.cfg.abgedeckt;
    }
    this.auswerten(t);
  }
  // Kurze Wolke: startet immer aus einem hellen Ausgangszustand, zwei Sekunden dunkel, dann wieder hell
  wolke(t) {
    this.tick(t);
    const vorher = this.wolkeBis != null ? this.wolkeHell : this.abgedeckt ? this.vorAbdecken : this.helligkeit;
    this.abgedeckt = false; this.wolkeBis = null;
    this.helligkeit = vorher >= this.cfg.schwelle ? vorher : this.cfg.sonne;
    this.auswerten(t);                                                     // hell: Zähler 0, Licht aus
    this.wolkeHell = this.helligkeit; this.wolkeBis = t + this.cfg.wolkeMs;
    this.helligkeit = this.cfg.wolke;
    this.auswerten(t);
  }
  // Zeit fortschreiben (regelmäßig aufrufen); beendet die Wolke pünktlich
  tick(t) {
    if (this.wolkeBis != null && t >= this.wolkeBis) { this.helligkeit = this.wolkeHell; this.wolkeBis = null; }
    this.auswerten(t);
    return this.zustand(t);
  }
  // Die Regel: A = sofort an bei Dunkelheit; B = erst nach der gewählten Dauer ununterbrochener Dunkelheit.
  // Bei Aufhellung sofort aus und Zähler auf null.
  auswerten(t) {
    this.jetzt = t;
    if (this.helligkeit >= this.cfg.schwelle) { this.dunkelSeit = null; this.licht = false; return; }
    if (this.dunkelSeit == null) this.dunkelSeit = t;
    if (!this.fertig) { this.licht = false; return; }
    this.licht = this.modus === 'A' || t - this.dunkelSeit >= this.sekunden * 1000;
  }
  zustand(t = this.jetzt) {
    const dauerMs = this.dunkelSeit == null ? 0 : Math.max(0, t - this.dunkelSeit), zielMs = this.sekunden * 1000;
    return {
      helligkeit: this.helligkeit, dunkel: this.helligkeit < this.cfg.schwelle, licht: this.licht, dauerMs, zielMs,
      fortschritt: Math.min(1, dauerMs / zielMs), wolke: this.wolkeBis != null, abgedeckt: this.abgedeckt,
      modus: this.modus, sekunden: this.sekunden, stufe: this.stufe, fertig: this.fertig, verbessert: this.verbessert,
    };
  }
}

/* ---------- Darstellung ---------- */
function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kinder.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
function s(tag, attrs = {}, ...kinder) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const c of kinder.flat()) if (c) el.append(c);
  return el;
}
const sek = (ms) => (Math.floor(ms / 100) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const mischen = (a, b, x) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - x) + parseInt(b.slice(1 + i, 3 + i), 16) * x).toString(16).padStart(2, '0')).join('');

// Schematischer Calliope mini: Platine mit Kontakten, Tasten A und B, 5×5-LED-Matrix
function calliopeSvg() {
  const punkte = [];
  for (let i = 0; i < 12; i++) { const r = i % 2 ? 66 : 88, w = (i * 30 - 90) * Math.PI / 180; punkte.push(`${(100 + r * Math.cos(w)).toFixed(1)},${(100 + r * Math.sin(w)).toFixed(1)}`); }
  const leds = [];
  const matrix = s('g', {});
  for (let z = 0; z < 5; z++) for (let x = 0; x < 5; x++) { const r = s('rect', { x: 71 + x * 12, y: 71 + z * 12, width: 8, height: 8, rx: 1.6, class: 'led' }); leds.push(r); matrix.append(r); }
  const svg = s('svg', { viewBox: '0 0 200 200', class: 'calliope-svg', role: 'img', 'aria-label': 'Calliope mini mit 5 mal 5 LEDs' },
    s('polygon', { points: punkte.join(' '), class: 'platine', 'stroke-linejoin': 'round' }),
    ...[0, 2, 4, 6, 8, 10].map((i) => { const w = (i * 30 - 90) * Math.PI / 180; return s('circle', { cx: (100 + 80 * Math.cos(w)).toFixed(1), cy: (100 + 80 * Math.sin(w)).toFixed(1), r: 9, class: 'kontakt' }); }),
    s('rect', { x: 64, y: 64, width: 72, height: 72, rx: 6, class: 'matrix-feld' }), matrix,
    s('circle', { cx: 46, cy: 100, r: 9, class: 'taste' }), s('text', { x: 46, y: 104.5, class: 'taste-text' }, document.createTextNode('A')),
    s('circle', { cx: 154, cy: 100, r: 9, class: 'taste' }), s('text', { x: 154, y: 104.5, class: 'taste-text' }, document.createTextNode('B')),
    s('text', { x: 100, y: 156, class: 'platine-text' }, document.createTextNode('Calliope mini')));
  return { svg, leds };
}

// Straßenlaterne in einer Tag-/Nachtumgebung
function laterneSvg() {
  const sterne = s('g', { class: 'sterne' }, ...[[24, 30], [52, 18], [84, 40], [150, 22], [176, 46], [30, 70]].map(([x, y]) => s('circle', { cx: x, cy: y, r: 1.6 })));
  const himmel = s('rect', { x: 0, y: 0, width: 200, height: 170, class: 'himmel' });
  const sonne = s('circle', { cx: 52, cy: 46, r: 17, class: 'sonne' });
  const mond = s('path', { d: 'M168 30a16 16 0 1 0 12 26a13 13 0 1 1 -12 -26z', class: 'mond' });
  const wolke = s('g', { class: 'wolke' }, s('ellipse', { cx: 58, cy: 56, rx: 40, ry: 17 }), s('ellipse', { cx: 38, cy: 48, rx: 20, ry: 16 }), s('ellipse', { cx: 66, cy: 40, rx: 24, ry: 19 }), s('ellipse', { cx: 90, cy: 52, rx: 16, ry: 12 }));
  const kegel = s('polygon', { points: '118,86 150,86 178,170 90,170', class: 'kegel' });
  const schein = s('ellipse', { cx: 134, cy: 172, rx: 46, ry: 8, class: 'schein' });
  const kopf = s('rect', { x: 120, y: 74, width: 28, height: 13, rx: 3, class: 'kopf' });
  const glas = s('rect', { x: 123, y: 84, width: 22, height: 5, rx: 2, class: 'glas' });
  const svg = s('svg', { viewBox: '0 0 200 220', class: 'laterne-svg', role: 'img', 'aria-label': 'Straßenlaterne' },
    himmel, sterne, sonne, mond, wolke,
    s('rect', { x: 0, y: 170, width: 200, height: 50, class: 'boden' }),
    s('rect', { x: 0, y: 186, width: 200, height: 18, class: 'strasse' }),
    ...[12, 52, 92, 132, 172].map((x) => s('rect', { x, y: 194, width: 20, height: 3, class: 'markierung' })),
    kegel, schein,
    s('rect', { x: 64, y: 82, width: 6, height: 92, class: 'mast' }), s('path', { d: 'M67 84 Q 70 72 92 76 L 124 78', class: 'arm' }),
    kopf, glas);
  return { svg, himmel, sterne, sonne, mond, wolke, kegel, schein, glas };
}

/**
 * Baut das Labor: szene (ersetzt die 3D-Stadt) und steuerung (große Testknöpfe im Bedienfeld).
 * uhr: monotone Zeit; geaendert: wird nach Aufbau-/Modusänderungen gerufen (z. B. Regie neu zeichnen).
 */
export function laborAnsicht(labor, { uhr = () => performance.now(), geaendert = () => {} } = {}) {
  const cfg = labor.cfg, jetzt = () => uhr();
  let neuerBlock = null;                                     // zuletzt ergänzter Block (kurz hervorgehoben)

  // 1 · Sensor: Calliope mini und Helligkeit
  const cal = calliopeSvg();
  const hand = h('span', { class: 'hand', 'aria-hidden': 'true' }, '✋');
  const hellWert = h('b', { class: 'wert' }), hellWort = h('span', { class: 'wort' });
  const hellFuellung = h('i', { class: 'fuellung' });
  const sensorKarte = h('section', { class: 'labor-karte sensor' },
    h('div', { class: 'labor-kopf' }, h('span', { class: 'n' }, '1'), h('h3', {}, 'Calliope mini'), h('span', { class: 'rolle' }, 'Sensor')),
    h('div', { class: 'calliope' }, cal.svg, hand),
    h('div', { class: 'hell-anzeige' },
      h('div', { class: 'zeile' }, h('span', {}, 'Helligkeit'), hellWert, hellWort),
      h('div', { class: 'messbalken', style: `--schwelle:${cfg.schwelle}%` }, hellFuellung, h('span', { class: 'schwelle' }, `${cfg.schwelle} %`)),
      h('small', {}, `simuliert · unter ${cfg.schwelle} % = dunkel`)));

  // 2 · Programm: verschachtelte Blöcke
  const progKopf = h('div', { class: 'labor-kopf' });
  const prog = h('div', { class: 'prog' });
  const zaehlerText = h('b', {}), zaehlerFuellung = h('i', { class: 'fuellung' });
  const zaehler = h('div', { class: 'zaehler' }, h('div', { class: 'zeile' }, h('span', {}, '⏱ Ununterbrochen dunkel'), h('small', {}, 'simuliert'), zaehlerText), h('div', { class: 'fortschritt' }, zaehlerFuellung));
  const progKarte = h('section', { class: 'labor-karte programm' }, progKopf, prog, zaehler);
  let zeileDann = null, zeileSonst = null;

  // 3 · LED: Straßenlaterne
  const lat = laterneSvg();
  const lichtText = h('b', {});
  const laterneKarte = h('section', { class: 'labor-karte laterne' },
    h('div', { class: 'labor-kopf' }, h('span', { class: 'n' }, '3'), h('h3', {}, 'Straßenlaterne'), h('span', { class: 'rolle' }, 'LED')),
    h('div', { class: 'laterne-bild' }, lat.svg), h('div', { class: 'licht-status' }, lichtText));

  const szene = h('div', { class: 'labor-buehne' }, sensorKarte, progKarte, laterneKarte);

  // Testknöpfe (erst frei, wenn das Programm fertig ist)
  const regler = h('input', { type: 'range', min: 0, max: 100, step: 1, value: labor.helligkeit, 'aria-label': 'Helligkeit in Prozent' });
  const reglerWert = h('output', {});
  regler.addEventListener('input', () => { labor.setHelligkeit(regler.value, jetzt()); aktualisieren(jetzt()); });
  const knopf = (zeichen, text, fn, extra = {}) => h('button', { type: 'button', class: 'labor-knopf', ...extra, onclick: () => { fn(jetzt()); aktualisieren(jetzt()); } }, h('span', { class: 'zeichen' }, zeichen), h('span', {}, text));
  const kSonne = knopf('☀', 'Sonne', (t) => labor.sonne(t));
  const kAbdecken = knopf('✋', 'Sensor abdecken', (t) => labor.abdecken(t), { 'aria-pressed': 'false' });
  const kWolke = knopf('☁', 'Kurze Wolke', (t) => labor.wolke(t));
  const kNacht = knopf('☾', 'Anhaltende Dunkelheit', (t) => labor.dunkelheit(t));
  const kZurueck = knopf('↺', 'Test zurücksetzen', (t) => labor.testZurueck(t), { class: 'labor-knopf leise' });
  const gesperrt = h('div', { class: 'labor-gesperrt' }, 'Zuerst bauen wir das Programm.');
  const steuerung = h('div', { class: 'labor-steuerung' },
    h('label', { class: 'regler' }, h('span', {}, 'Helligkeit'), regler, reglerWert),
    kSonne, kAbdecken, kWolke, kNacht, kZurueck, gesperrt);
  const testElemente = [regler, kSonne, kAbdecken, kWolke, kNacht, kZurueck];

  function block(cls, ...inhalt) { return h('div', { class: `blk ${cls}` }, ...inhalt); }
  function programmZeichnen() {
    const st = labor.zustand(jetzt()), B = st.modus === 'B';
    // Kopf: Titel des Versuchs und Aufbau-/Moduswahl
    const steuer = [];
    if (!st.fertig) steuer.push(h('button', { type: 'button', class: 'haupt bau', onclick: () => { labor.blockErgaenzen(jetzt()); neuerBlock = labor.stufe; zeichnen(); } }, `＋ ${labor.naechster}`));
    else if (!st.verbessert) steuer.push(h('button', { type: 'button', class: 'haupt bau', onclick: () => { labor.verbessern(jetzt()); neuerBlock = 'zeit'; zeichnen(); } }, '⏱ Zeitblock ergänzen'));
    else steuer.push(h('span', { class: 'gruppe versuch' }, ...['A', 'B'].map((m) => h('button', { type: 'button', 'aria-pressed': String(st.modus === m), onclick: () => { labor.setModus(m, jetzt()); neuerBlock = null; zeichnen(); } }, `Versuch ${m}`))));
    progKopf.replaceChildren(h('span', { class: 'n' }, '2'), h('h3', {}, B ? 'Versuch B – verbesserte Regel' : 'Versuch A – einfache Regel'), h('span', { class: 'luecke' }), ...steuer);
    // Blöcke
    const neu = (k) => (neuerBlock === k ? ' neu' : '');
    let bedingung = null;
    if (st.stufe >= 2 && !B) bedingung = h('span', { class: `slot voll${neu(2)}` }, `Helligkeit unter ${cfg.schwelle} %`);
    else if (st.stufe >= 2) {
      const auswahl = h('select', { 'aria-label': 'Sekunden', class: 'sekunden' }, ...Array.from({ length: cfg.max - cfg.min + 1 }, (_, i) => cfg.min + i).map((n) => h('option', { value: n, selected: n === st.sekunden || null }, String(n))));
      auswahl.addEventListener('change', () => { labor.setSekunden(auswahl.value, jetzt()); neuerBlock = null; aktualisieren(jetzt()); geaendert(); });
      bedingung = h('span', { class: `slot voll zeit${neu('zeit')}` }, h('span', { class: 'stueck' }, 'es seit ', auswahl, ' Sekunden'), h('span', { class: 'stueck' }, 'ununterbrochen dunkel ist'));
    } else bedingung = h('span', { class: 'slot leer' }, '');
    zeileDann = st.stufe >= 3 ? h('div', { class: `zeile${neu(3)}` }, h('span', { class: 'lbl' }, 'DANN'), block('aktion', 'Licht AN')) : null;
    zeileSonst = st.stufe >= 4 ? h('div', { class: `zeile sonst${neu(4)}` }, h('span', { class: 'lbl' }, 'SONST'), block('aktion', 'Licht AUS')) : null;
    const wenn = st.stufe >= 1 ? block(`wenn${neu(1)}`, h('div', { class: 'kopf' }, h('span', { class: 'lbl' }, 'WENN'), bedingung), zeileDann, zeileSonst) : null;
    prog.replaceChildren(block('schleife', h('div', { class: 'kopf' }, 'DAUERHAFT WIEDERHOLEN'), h('div', { class: 'innen' }, wenn)));
    zaehler.hidden = !(B && st.fertig);
    // Tests erst nach Fertigstellung
    for (const el of testElemente) el.disabled = !st.fertig;
    gesperrt.hidden = st.fertig;
    steuerung.classList.toggle('aus', !st.fertig);
  }
  function zeichnen() { programmZeichnen(); aktualisieren(jetzt()); geaendert(); }

  function aktualisieren(t) {
    const st = labor.tick(t);
    // LED-Matrix und Laterne zeigen denselben Zustand
    for (const led of cal.leds) led.classList.toggle('an', st.licht);
    laterneKarte.classList.toggle('an', st.licht); sensorKarte.classList.toggle('an', st.licht);
    lichtText.textContent = st.licht ? 'Licht AN' : 'Licht AUS';
    // Umgebung: bei abgedecktem Sensor bleibt es draußen hell (nur der Sensor „sieht“ dunkel); die Wolke ist ein trüber Tag
    const umgebung = st.abgedeckt ? (labor.vorAbdecken ?? cfg.sonne) : st.wolke ? (labor.wolkeHell ?? cfg.sonne) : st.helligkeit, x = umgebung / 100;
    lat.himmel.setAttribute('fill', st.wolke ? '#8d9db0' : mischen('#132039', '#a8d8f2', x));
    lat.sonne.style.opacity = String(st.wolke ? 0.35 : Math.max(0, (x - 0.2) / 0.8));
    lat.mond.style.opacity = lat.sterne.style.opacity = String(!st.wolke && umgebung < cfg.schwelle ? 1 : 0);
    lat.wolke.style.opacity = st.wolke ? '1' : '0';
    hand.classList.toggle('an', st.abgedeckt);
    hellWert.textContent = `${st.helligkeit} %`;
    hellWort.textContent = st.dunkel ? 'dunkel' : 'hell';
    hellWort.className = `wort ${st.dunkel ? 'dunkel' : 'hell'}`;
    hellFuellung.style.width = `${st.helligkeit}%`;
    if (document.activeElement !== regler) regler.value = String(st.helligkeit);
    reglerWert.textContent = `${st.helligkeit} %`;
    kAbdecken.setAttribute('aria-pressed', String(st.abgedeckt));
    kAbdecken.lastChild.textContent = st.abgedeckt ? 'Hand wegnehmen' : 'Sensor abdecken';
    kWolke.classList.toggle('laeuft', st.wolke);
    zaehlerText.textContent = `${sek(Math.min(st.dauerMs, st.zielMs))} s von ${st.sekunden} s`;   // ab dem Ziel bleibt die Anzeige voll
    zaehlerFuellung.style.width = `${st.fortschritt * 100}%`;
    zaehler.classList.toggle('voll', st.fortschritt >= 1);
    // welcher Zweig gerade gilt
    if (zeileDann) zeileDann.classList.toggle('aktiv', st.fertig && st.licht);
    if (zeileSonst) zeileSonst.classList.toggle('aktiv', st.fertig && !st.licht);
    return st;
  }

  programmZeichnen();
  aktualisieren(jetzt());
  return {
    szene, steuerung, aktualisieren,
    // Regie-Tasten (Enter, A, B) laufen über dieselben Wege wie die Knöpfe
    blockErgaenzen: () => { if (labor.blockErgaenzen(jetzt())) { neuerBlock = labor.stufe; zeichnen(); return true; } return false; },
    modus: (m) => { const war = labor.verbessert; labor.setModus(m, jetzt()); neuerBlock = !war && labor.verbessert ? 'zeit' : null; zeichnen(); },
  };
}
