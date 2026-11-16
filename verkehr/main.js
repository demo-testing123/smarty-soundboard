/* Bedienoberfläche: Regie-Tasten, Anzeigen, Ergebnis, Ton. Verbindet Simulation und Darstellung. */
import { CONFIG } from './config.js';
import { Simulation, ROT, ROTGELB, GRUEN, GELB } from './sim.js';
import { Szene2D } from './render2d.js';

const T = CONFIG.texte;
const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('verkehr.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('verkehr.' + k, JSON.stringify(v)); } catch { /* privat */ } },
};
const sek = (s) => s.toFixed(1).replace('.', ',');

let sim = new Simulation('normal');
let szene = null;
let zustand = 'bereit';               // bereit | laeuft | pause | fertig
let ergebnisse = Object.assign({ normal: null, schlau: null }, store.get('ergebnisse', {}));
let tonAn = store.get('ton', true);
let gemeldet = 0;                     // bereits verarbeitete Ereignisse (für Töne)

// ---------- Darstellung wählen: 3D, sonst 2D ----------
async function szeneErstellen() {
  const welt = $('#welt');
  const zwei = new URLSearchParams(location.search).get('ansicht') === '2d';
  if (!zwei) {
    try {
      const m = await import('./scene3d.js');
      if (m.webglMoeglich()) { szene = new m.Szene3D(welt, sim, CONFIG); return '3d'; }
      hinweis(T.keinWebGL, 9000);
    } catch (e) {
      console.error(e);
      hinweis(T.keinWebGL, 9000);
    }
  }
  szene = new Szene2D(welt, sim, CONFIG);
  return '2d';
}

// ---------- Ton (selbst erzeugt, leise, abschaltbar) ----------
let ac = null;
function ton(art) {
  if (!tonAn) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t0 = ac.currentTime;
    const piep = (f1, f2, start, dauer, typ = 'sine', vol = 0.12) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = typ;
      o.frequency.setValueAtTime(f1, t0 + start);
      o.frequency.exponentialRampToValueAtTime(f2, t0 + start + dauer);
      g.gain.setValueAtTime(0.0001, t0 + start);
      g.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dauer);
      o.connect(g).connect(ac.destination);
      o.start(t0 + start);
      o.stop(t0 + start + dauer + 0.05);
    };
    if (art === 'funk') { piep(1200, 1700, 0, 0.12); piep(1200, 1700, 0.16, 0.12); piep(1200, 1900, 0.32, 0.16); }
    if (art === 'empfangen') piep(880, 1320, 0, 0.22, 'triangle');
    if (art === 'gruen') { piep(660, 660, 0, 0.18, 'triangle'); piep(990, 990, 0.16, 0.3, 'triangle'); }
    if (art === 'fertig') [523, 659, 784, 1047].forEach((f, i) => piep(f, f, i * 0.11, 0.28, 'triangle', 0.1));
  } catch { /* ohne Ton weiter */ }
}

// ---------- Steuerung ----------
function modusSetzen(m) {
  sim.reset(m);
  zustand = 'bereit';
  gemeldet = 0;
  ergebnisZu();
  aktualisieren(true);
}
function start() {
  if (zustand === 'laeuft') return pause();
  if (zustand === 'pause') { zustand = 'laeuft'; return aktualisieren(true); }
  if (zustand === 'fertig') { sim.reset(); gemeldet = 0; }
  ergebnisZu();
  zustand = 'laeuft';
  aktualisieren(true);
}
function pause() {
  if (zustand === 'laeuft') zustand = 'pause';
  else if (zustand === 'pause') zustand = 'laeuft';
  aktualisieren(true);
}
function zuruecksetzen() {
  sim.reset();
  zustand = 'bereit';
  gemeldet = 0;
  ergebnisZu();
  aktualisieren(true);
}

// ---------- Ergebnis mit hochzählenden Zahlen ----------
let zaehlAnim = 0;
function ergebnisAuf() {
  const box = $('#ergebnis');
  box.hidden = false;
  $('#btnErgebnis').setAttribute('aria-pressed', 'true');
  const n = ergebnisse.normal == null ? null : Simulation.runden(ergebnisse.normal);
  const s = ergebnisse.schlau == null ? null : Simulation.runden(ergebnisse.schlau);
  const ziele = [['#erN', n], ['#erS', s]];
  for (const [sel, v] of ziele) $(sel).textContent = v == null ? T.ergebnis.fehlt : '0 s';
  $('#erN').classList.toggle('fehlt', n == null);
  $('#erS').classList.toggle('fehlt', s == null);
  const spart = $('#erSpart');
  spart.hidden = n == null || s == null;
  $('#erHinweis').hidden = spart.hidden;
  if (!spart.hidden) spart.textContent = T.ergebnis.spart(Math.max(0, n - s));
  const t0 = performance.now(), dauer = 1400;
  cancelAnimationFrame(zaehlAnim);
  const schritt = (now) => {
    const k = Math.min(1, (now - t0) / dauer), e = 1 - Math.pow(1 - k, 3);
    for (const [sel, v] of ziele) if (v != null) $(sel).textContent = `${Math.round(v * e)} ${Math.round(v * e) === 1 ? 'Sekunde' : 'Sekunden'}`;
    if (k < 1) zaehlAnim = requestAnimationFrame(schritt);
  };
  zaehlAnim = requestAnimationFrame(schritt);
}
function ergebnisZu() {
  $('#ergebnis').hidden = true;
  $('#btnErgebnis').setAttribute('aria-pressed', 'false');
}

// ---------- Anzeigen ----------
let hinweisTimer = 0;
function hinweis(text, ms = 5000) {
  const el = $('#hinweis');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(hinweisTimer);
  hinweisTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function lampen(el, st) {
  el.querySelector('.l-rot').classList.toggle('an', st === ROT || st === ROTGELB);
  el.querySelector('.l-gelb').classList.toggle('an', st === GELB || st === ROTGELB);
  el.querySelector('.l-gruen').classList.toggle('an', st === GRUEN);
}

/* Schritt der Kette Information → Entscheidung → Wirkung aus dem Simulationszustand */
function kettenSchritt() {
  const fk = sim.funk, ph = sim.phase, t = sim.t, S = T.schritte;
  if (!fk) return { stufe: 0, text: S.warten };
  if (t < fk.empfangen) return { stufe: 1, text: S.funk };
  if (ph === 'QUER_GRUEN') return { stufe: 2, text: S.pruefen };
  if (ph === 'QUER_GELB') return { stufe: 3, text: S.querGelb };
  if (ph === 'ALLES_ROT_1') return { stufe: 3, text: S.allesRot };
  if (ph === 'HAUPT_ROTGELB') return { stufe: 3, text: S.rotGelb };
  return { stufe: 4, text: S.busGruen };
}

function label(el, pos, text, sichtbar, rechts = false) {
  if (!sichtbar || !pos) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = text;
  el.style.transform = `translate(${pos.x}px, ${pos.y}px) ` + (rechts ? 'translate(0, -50%)' : 'translate(-50%, -100%)');
}

let letzterZustand = '';
function aktualisieren(sofort = false) {
  const schlau = sim.modus === 'schlau';
  const z = zustand + sim.modus;
  if (sofort || z !== letzterZustand) {
    letzterZustand = z;
    $('#modus').textContent = T.modus[sim.modus];
    $('#modusInfo').textContent = T.modusInfo[sim.modus];
    $('#buehne').dataset.modus = sim.modus;
    $('#btnNormal').setAttribute('aria-pressed', String(!schlau));
    $('#btnSchlau').setAttribute('aria-pressed', String(schlau));
    $('#btnStart').innerHTML = zustand === 'laeuft' ? '⏸ Pause <kbd>Leer</kbd>' : zustand === 'pause' ? '▶ Weiter <kbd>Leer</kbd>' : '▶ Start <kbd>Leer</kbd>';
    $('#btnPause').setAttribute('aria-pressed', String(zustand === 'pause'));
    $('#kette').hidden = !schlau;
  }
  // Stoppuhr
  const uhr = $('#uhr');
  $('#uhrZeit').textContent = sek(sim.bus.gewartet) + ' s';
  uhr.classList.toggle('laeuft', sim.bus.steht && zustand === 'laeuft');
  uhr.classList.toggle('fertig', sim.bus.durch);
  // Ampelanzeigen
  lampen($('#sigBus'), sim.signal('haupt'));
  lampen($('#sigQuer'), sim.signal('quer'));
  // Kette
  if (schlau) {
    const k = kettenSchritt();
    document.querySelectorAll('#kette .glied').forEach((g, i) => {
      g.classList.toggle('aktiv', k.stufe === i + 1 || (i === 2 && k.stufe === 4));
      g.classList.toggle('erledigt', k.stufe > i + 1);
    });
    $('#ketteText').textContent = k.text;
  }
  // Banner
  const banner = $('#banner');
  const text = zustand === 'bereit' ? T.bereit : zustand === 'pause' ? T.pause + ' · weiter mit Leertaste' : zustand === 'fertig' ? T.fertig(Simulation.runden(sim.bus.gewartet)) + ' · E = Ergebnis' : '';
  banner.textContent = text;
  banner.hidden = !text;
  banner.dataset.art = zustand;
  // Beschriftungen an Bus und Ampel
  const fk = sim.funk, t = sim.t;
  const L = T.labels;
  if (szene) {
    const funkt = fk && t >= fk.gesendet && t < fk.empfangen;
    const empf = fk && t >= fk.empfangen && sim.phase !== 'HAUPT_GRUEN';
    const steht = sim.bus.steht && zustand !== 'bereit';
    const gruen = sim.signal('haupt') === GRUEN && !sim.bus.durch && sim.bus.gewartet > 0;
    label($('#lblBus'), szene.bildpunkt('bus'), funkt ? L.funk : gruen ? L.faehrt : L.wartet, funkt || steht || gruen);
    $('#lblBus').dataset.art = funkt ? 'funk' : gruen ? 'gruen' : 'warten';
    label($('#lblAmpel'), szene.bildpunkt('ampelBus'), L.empfangen, empf && schlau, true);
  }
}

// ---------- Hauptschleife: feste Simulationsschritte, Darstellung so oft wie möglich ----------
let zuletzt = performance.now(), akku = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - zuletzt) / 1000);
  zuletzt = now;
  if (zustand === 'laeuft') {
    akku += dt;
    const h = CONFIG.schritt;
    let n = 0;
    while (akku >= h - 1e-9 && n < 40 && !sim.fertig) { sim.schritt(); akku -= h; n++; }
    if (sim.fertig) {
      zustand = 'fertig';
      akku = 0;
      ergebnisse[sim.modus] = sim.bus.gewartet;
      store.set('ergebnisse', ergebnisse);
      ton('fertig');
    }
  } else akku = 0;
  // Töne zu neuen Ereignissen
  while (gemeldet < sim.ereignisse.length) {
    const e = sim.ereignisse[gemeldet++].typ;
    if (e === 'funk') ton('funk');
    if (e === 'empfangen') ton('empfangen');
    if (e === 'busGruen') ton('gruen');
  }
  if (szene) szene.render(now / 1000);
  aktualisieren();
  requestAnimationFrame(frame);
}

// ---------- Vollbild, Bedienleiste, Mauszeiger ----------
function vollbild() {
  const el = document.documentElement;
  if (!document.fullscreenElement) (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => hinweis('Vollbild wird hier nicht unterstützt – F11 drücken.'));
  else document.exitFullscreen();
}
function leisteUmschalten() {
  const app = $('#app');
  app.classList.toggle('ohne-leiste');
  store.set('ohneLeiste', app.classList.contains('ohne-leiste'));
}
let mausTimer = 0;
document.addEventListener('mousemove', () => {
  document.body.classList.remove('maus-weg');
  clearTimeout(mausTimer);
  mausTimer = setTimeout(() => { if (document.fullscreenElement) document.body.classList.add('maus-weg'); }, 2500);
});

function tonUmschalten() {
  tonAn = !tonAn;
  store.set('ton', tonAn);
  $('#btnTon').textContent = tonAn ? '🔊 Ton' : '🔇 Ton aus';
  $('#btnTon').setAttribute('aria-pressed', String(tonAn));
}

// ---------- Tasten ----------
const aktionen = {
  normal: () => modusSetzen('normal'),
  schlau: () => modusSetzen('schlau'),
  start, pause, zuruecksetzen,
  ergebnis: () => ($('#ergebnis').hidden ? ergebnisAuf() : ergebnisZu()),
  vollbild, leiste: leisteUmschalten, ton: tonUmschalten,
};
document.querySelectorAll('[data-aktion]').forEach((b) => b.addEventListener('click', (e) => { e.currentTarget.blur(); aktionen[b.dataset.aktion](); }));

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const map = {
    '1': 'normal', 'a': 'normal', '2': 'schlau', 'b': 'schlau',
    ' ': 'start', 'Enter': 'start', 'p': 'pause', 'r': 'zuruecksetzen', 'e': 'ergebnis',
    'f': 'vollbild', 'h': 'leiste', 'm': 'ton',
  };
  if (k === 'Escape' && !$('#ergebnis').hidden) { ergebnisZu(); return; }
  const a = map[k];
  if (!a) return;
  if (e.repeat && a !== 'pause') return;
  e.preventDefault();
  aktionen[a]();
});

// ---------- Start ----------
(async () => {
  document.title = `${CONFIG.titel} · Verkehrssimulation`;
  $('#titel').textContent = CONFIG.titel;
  $('#stLabel').textContent = T.stoppuhr;
  $('#sigBus .sig-name').textContent = T.ampelBus;
  $('#sigQuer .sig-name').textContent = T.ampelQuer;
  document.querySelectorAll('#kette .glied b').forEach((b, i) => { b.textContent = T.kette[i]; });
  $('#erTitel').textContent = T.ergebnis.titel;
  $('#erNName').textContent = T.ergebnis.normal;
  $('#erSName').textContent = T.ergebnis.schlau;
  $('#erHinweis').textContent = T.ergebnis.hinweis;
  if (store.get('ohneLeiste', false)) $('#app').classList.add('ohne-leiste');
  tonAn = !tonAn; tonUmschalten();

  const art = await szeneErstellen();
  $('#app').dataset.ansicht = art;
  new ResizeObserver(() => szene && szene.resize()).observe($('#welt'));
  window.__verkehr = { sim: () => sim, zustand: () => zustand, ergebnisse: () => ergebnisse, ansicht: art };
  window.__verkehrOk = true;
  $('#laden').hidden = true;
  aktualisieren(true);
  requestAnimationFrame(frame);
})().catch((e) => {
  console.error(e);
  $('#laden').hidden = true;
  const f = $('#fehler');
  f.textContent = T.ladefehler + ' (' + (e && e.message ? e.message : e) + ')';
  f.hidden = false;
});

// Offline: derselbe Service Worker wie das Soundboard speichert alle Dateien
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
}
