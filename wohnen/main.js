/* Bedienung: Modi, Teilschritte, Anzeigen, Tasten. Zahlen kommen aus model.js, Bilder aus scene3d.js. */
import { CONFIG } from './config.js';
import { experimentZahlen, variantenZahlen } from './model.js';

const C = CONFIG;
const $ = (s) => document.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
};

let welt = null;
const S = {
  modus: 'start',
  exp: { zustand: 'nebeneinander', vermutung: false, anzeige: 'nebeneinander' },
  variante: 'A',
  auf: { ansicht: 'bestand', karte: null, antwort: false },
  info: false,
};

// Teilschritte je Modus (für ← → / Bild↑ Bild↓ / Leertaste)
const SCHRITTE = {
  experiment: ['neben', 'vermutung', 'stapeln'],
  varianten: ['A', 'B', 'C', 'vergleich'],
  aufstocken: ['bestand', 'aufstocken', 'material', 'einsparen', 'check', 'antwort'],
};
const gruppe = (m) => (m === 'A' || m === 'B' || m === 'C' || m === 'vergleich' ? 'varianten' : m);

function aktuellerSchritt() {
  const g = gruppe(S.modus);
  if (g === 'experiment') return S.exp.zustand === 'gestapelt' ? 'stapeln' : S.exp.vermutung ? 'vermutung' : 'neben';
  if (g === 'varianten') return S.modus;
  if (g === 'aufstocken') return S.auf.ansicht === 'check' && S.auf.antwort ? 'antwort' : S.auf.ansicht;
  return null;
}

function schritt(name) {
  const g = gruppe(S.modus);
  if (g === 'experiment') {
    if (name === 'neben') { S.exp.vermutung = false; expSetzen('nebeneinander'); }
    if (name === 'vermutung') { S.exp.vermutung = !S.exp.vermutung || S.exp.zustand === 'gestapelt'; if (S.exp.zustand === 'gestapelt') expSetzen('nebeneinander'); }
    if (name === 'stapeln') { S.exp.vermutung = false; expSetzen('gestapelt'); }
  } else if (g === 'varianten') {
    modus(name);
    return;
  } else if (g === 'aufstocken') {
    if (name === 'antwort') { S.auf.ansicht = 'check'; S.auf.antwort = true; }
    else {
      if (name !== 'check') S.auf.antwort = false;
      S.auf.ansicht = name;
      if (name !== 'material') S.auf.karte = null;
    }
    welt.aufstockenSetzen(name === 'bestand' ? 'bestand' : 'aufgestockt', true);
    welt.hervorheben(S.auf.ansicht === 'material' ? S.auf.karte : S.auf.ansicht === 'einsparen' ? 'einsparen' : null);
  }
  anzeigen();
}

function weiter(richtung) {
  const g = gruppe(S.modus);
  const liste = SCHRITTE[g];
  if (!liste) { if (richtung > 0) modus('experiment'); return; }
  const i = liste.indexOf(aktuellerSchritt());
  const n = Math.min(liste.length - 1, Math.max(0, i + richtung));
  if (n !== i) schritt(liste[n]);
}

function expSetzen(z) {
  if (S.exp.zustand === z) return;
  S.exp.zustand = z;
  welt.experimentSetzen(z, true);
}

/* Modus wechseln: Zielmodus startet immer im Ausgangszustand */
function modus(m) {
  const vorher = gruppe(S.modus);
  S.modus = m;
  const g = gruppe(m);
  if (g === 'experiment' && vorher !== 'experiment') {
    S.exp = { zustand: 'nebeneinander', vermutung: false, anzeige: 'nebeneinander' };
    welt.experimentSetzen('nebeneinander', false);
  }
  if (g === 'aufstocken' && vorher !== 'aufstocken') {
    S.auf = { ansicht: 'bestand', karte: null, antwort: false };
    welt.aufstockenSetzen('bestand', false);
    welt.hervorheben(null);
  }
  if (m === 'A' || m === 'B' || m === 'C') S.variante = m;
  welt.zeige(m);
  anzeigen();
}

function zuruecksetzen() {
  const g = gruppe(S.modus);
  if (g === 'experiment') {
    S.exp = { zustand: 'nebeneinander', vermutung: false, anzeige: 'nebeneinander' };
    welt.experimentSetzen('nebeneinander', false);
  } else if (g === 'varianten') {
    S.modus = S.modus === 'vergleich' ? S.variante : S.modus;
    welt.zeige(S.modus);
  } else if (g === 'aufstocken') {
    S.auf = { ansicht: 'bestand', karte: null, antwort: false };
    welt.aufstockenSetzen('bestand', false);
    welt.hervorheben(null);
  }
  anzeigen();
}

/* ---------- Anzeigen ---------- */
function zahl(label, wert, einheit = '', klasse = '') {
  return h('div', { class: 'zahl ' + klasse }, h('span', { class: 'z-label' }, label), h('b', { class: 'z-wert' }, String(wert), einheit ? h('small', {}, ' ' + einheit) : null));
}

function knopf(text, aktion, aktiv = false, taste = null, extra = '') {
  return h('button', { type: 'button', class: 'sub ' + extra, 'aria-pressed': String(aktiv), onclick: (e) => { e.currentTarget.blur(); aktion(); } }, text, taste ? h('kbd', {}, taste) : null);
}

let letzteZahlen = '';
function anzeigen() {
  const m = S.modus, g = gruppe(m);
  document.body.dataset.modus = m;
  document.body.dataset.gruppe = g;

  // Hauptleiste
  document.querySelectorAll('#haupt [data-modus]').forEach((b) => {
    const z = b.dataset.modus;
    b.setAttribute('aria-pressed', String(z === m || (z === 'experiment' && g === 'experiment') || (z === 'aufstocken' && g === 'aufstocken')));
  });
  $('#btnInfo').setAttribute('aria-pressed', String(S.info));

  // Startbildschirm
  $('#startbild').hidden = m !== 'start';

  // Titel und Frage
  const kopf = $('#kopf');
  kopf.hidden = m === 'start';
  let titel = '', frage = '';
  if (g === 'experiment') { titel = C.experiment.titel; frage = C.experiment.frage; }
  if (m === 'A' || m === 'B' || m === 'C') { titel = `Variante ${m}: ${C.varianten[m].titel}`; frage = C.varianten[m].frage; }
  if (m === 'vergleich') { titel = 'Alle drei Varianten im Vergleich'; frage = 'Gleiches Grundstück, gleicher Maßstab, je 6 Wohnungen.'; }
  if (g === 'aufstocken') {
    titel = C.aufstocken.titel;
    frage = S.auf.ansicht === 'check' ? C.aufstocken.check.frage : C.aufstocken.frage;
  }
  $('#titel').textContent = titel;
  $('#frage').textContent = frage;
  $('#frage').hidden = m === 'start' || m === 'vergleich' || !frage || (g === 'experiment' && S.exp.vermutung) ||
    (g === 'aufstocken' && (S.auf.ansicht === 'material' || S.auf.ansicht === 'einsparen'));

  // Teilschritte
  const sub = $('#sub');
  sub.innerHTML = '';
  const schrittJetzt = aktuellerSchritt();
  if (g === 'experiment') {
    const b = C.experiment.buttons;
    sub.append(
      knopf(b.vermutung, () => schritt('vermutung'), S.exp.vermutung),
      knopf(b.neben, () => schritt('neben'), S.exp.zustand === 'nebeneinander' && !S.exp.vermutung),
      knopf(b.stapeln, () => schritt('stapeln'), S.exp.zustand === 'gestapelt', null, 'wichtig'),
    );
  } else if (g === 'varianten') {
    for (const v of ['A', 'B', 'C']) sub.append(knopf(`${v} · ${C.varianten[v].kurz}`, () => modus(v), m === v, v));
    sub.append(knopf(C.varianten.vergleichen, () => modus('vergleich'), m === 'vergleich', 'V'));
  } else if (g === 'aufstocken') {
    const b = C.aufstocken.buttons;
    for (const k of ['bestand', 'aufstocken', 'material', 'einsparen', 'check']) {
      sub.append(knopf(b[k], () => schritt(k), schrittJetzt === k || (k === 'check' && schrittJetzt === 'antwort')));
    }
  }
  sub.hidden = !sub.children.length;

  // Zahlen und Karten rechts
  const panel = $('#panel');
  panel.innerHTML = '';
  if (g === 'experiment') {
    const z = experimentZahlen(S.exp.anzeige);
    const L = C.experiment.zaehler;
    panel.append(zahl(L.wohnungen, z.wohnungen, '', 'gross'), zahl(L.belegt, z.belegt), zahl(L.frei, z.freiGeworden, '', z.freiGeworden ? 'gruen' : ''));
  } else if (m === 'A' || m === 'B' || m === 'C') {
    const z = variantenZahlen(m);
    const L = C.varianten.zaehler;
    panel.append(
      zahl(L.wohnungen, z.wohnungen, '', 'gross'),
      zahl(L.bebaut, z.bebaut, L.einheit),
      zahl(L.unbebaut, z.unbebaut, L.einheit),
      h('div', { class: 'zahl typ typ-' + m }, h('span', { class: 'z-label' }, L.gruen), h('b', { class: 'z-wert' }, z.gruenTyp)),
      h('p', { class: 'raster' }, `davon Grün ${z.gruen} · Wege ${z.wege}`),
    );
  } else if (g === 'aufstocken' && S.auf.ansicht === 'material') {
    panel.append(h('p', { class: 'panel-hinweis' }, 'Karte antippen:'));
    for (const k of C.aufstocken.karten) {
      const offen = S.auf.karte === k.id;
      panel.append(h('button', { type: 'button', class: 'karte karte-' + k.id, 'aria-expanded': String(offen), onclick: () => { S.auf.karte = offen ? null : k.id; welt.hervorheben(S.auf.karte); anzeigen(); } },
        h('b', {}, k.titel), offen ? h('span', {}, k.text) : null));
    }
    panel.append(h('p', { class: 'abwaegen' }, C.aufstocken.abwaegen));
  } else if (g === 'aufstocken' && S.auf.ansicht === 'einsparen') {
    panel.append(h('div', { class: 'textkarte gruen' }, C.aufstocken.einsparen), h('div', { class: 'textkarte' }, C.aufstocken.bilanz));
  } else if (g === 'aufstocken' && S.auf.ansicht === 'check') {
    panel.append(S.auf.antwort
      ? h('div', { class: 'textkarte antwort' }, '✓ ' + C.aufstocken.check.antwort)
      : h('button', { type: 'button', class: 'sub wichtig gross', onclick: () => schritt('antwort') }, C.aufstocken.check.zeigen));
  }
  panel.hidden = !panel.children.length;

  // Vermutungs-Karte
  $('#vermutung').hidden = !(g === 'experiment' && S.exp.vermutung);
  $('#vermutungText').textContent = C.experiment.vermutung;

  // Fußnoten
  $('#fussnote').textContent = g === 'experiment' ? C.experiment.hinweis : g === 'varianten' ? C.varianten.rasterInfo : g === 'aufstocken' ? C.aufstocken.vorbild : '';
  $('#fussnote').hidden = !$('#fussnote').textContent;

  // Moderation (das Lernziel steht nur hier, nicht auf der Leinwand)
  const mod = C.moderation[g === 'varianten' ? 'varianten' : g] || C.moderation.start;
  const info = $('#info');
  info.hidden = !S.info;
  $('#infoListe').innerHTML = '';
  $('#infoListe').append(h('li', {}, h('b', {}, 'Lernziel: '), mod.lernziel));
  for (const n of mod.notizen) $('#infoListe').append(h('li', {}, n));

  beschriftungen();
}

/* Beschriftungen an 3D-Punkten */
function setzeLabel(el, name, text, sichtbar, unten = false) {
  const p = sichtbar && welt ? welt.bildpunkt(name) : null;
  if (!p) { el.hidden = true; return; }
  el.hidden = false;
  if (el.textContent !== text) el.textContent = text;
  el.classList.toggle('unten', unten);
  el.style.transform = `translate(${p.x}px, ${p.y}px) ` + (unten ? 'translate(-50%, 1.5cqh)' : 'translate(-50%, -100%)');
}

function beschriftungen() {
  const m = S.modus, g = gruppe(m);
  const z = experimentZahlen(S.exp.anzeige);
  setzeLabel($('#lbl1'), 'frei', `${z.freiGeworden} Felder frei geworden`, g === 'experiment' && z.freiGeworden > 0);
  if (m === 'A' || m === 'B' || m === 'C') setzeLabel($('#lbl1'), m, C.varianten[m].gruenText, true);
  if (g === 'aufstocken') {
    const auf = S.auf.ansicht !== 'bestand' && !welt.aufstockenLaeuft();
    setzeLabel($('#lbl1'), 'alt', C.aufstocken.labels.alt, true);
    setzeLabel($('#lbl2'), 'neu', C.aufstocken.labels.neu, auf);
    setzeLabel($('#lbl3'), 'fundament', C.aufstocken.labels.fundament, S.auf.ansicht === 'einsparen');
  } else { $('#lbl2').hidden = true; $('#lbl3').hidden = true; }
  if (m === 'vergleich') {
    ['A', 'B', 'C'].forEach((v, i) => {
      const zz = variantenZahlen(v);
      setzeLabel($('#lbl' + (i + 1)), 'vgl' + v, `${v} · ${C.varianten[v].kurz}\n${zz.wohnungen} Wohnungen · bebaut ${zz.bebaut}\nGrün: ${zz.gruenTyp}`, true, true);
    });
  }
  if (m === 'start') $('#lbl1').hidden = true;
}

// ---------- Schleife ----------
function frame(now) {
  welt.render(now);
  // Zahlen im Experiment erst nach Ende der Stapelbewegung umstellen
  if (!welt.experimentLaeuft() && S.exp.anzeige !== S.exp.zustand) { S.exp.anzeige = S.exp.zustand; anzeigen(); }
  beschriftungen();
  requestAnimationFrame(frame);
}

// ---------- Vollbild, Tasten ----------
function vollbild() {
  if (!document.fullscreenElement) (document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : Promise.reject()).catch(() => {});
  else document.exitFullscreen();
}
let mausTimer = 0;
document.addEventListener('mousemove', () => {
  document.body.classList.remove('maus-weg');
  clearTimeout(mausTimer);
  mausTimer = setTimeout(() => { if (document.fullscreenElement) document.body.classList.add('maus-weg'); }, 3000);
});

const aktionen = {
  start: () => modus('start'), experiment: () => modus('experiment'),
  A: () => modus('A'), B: () => modus('B'), C: () => modus('C'), aufstocken: () => modus('aufstocken'),
  reset: zuruecksetzen, info: () => { S.info = !S.info; anzeigen(); }, vollbild,
};
document.querySelectorAll('[data-aktion]').forEach((b) => b.addEventListener('click', (e) => { e.currentTarget.blur(); aktionen[b.dataset.aktion](); }));

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const map = { '0': 'start', 'Home': 'start', '1': 'experiment', '2': 'A', '3': 'B', '4': 'C', '5': 'aufstocken', 'a': 'A', 'b': 'B', 'c': 'C', 'r': 'reset', 'i': 'info', 'f': 'vollbild' };
  if (map[k]) { e.preventDefault(); aktionen[map[k]](); return; }
  if (k === 'v' && gruppe(S.modus) === 'varianten') { e.preventDefault(); modus('vergleich'); return; }
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); weiter(1); return; }
  if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); weiter(-1); return; }
  if (k === 'Escape' && S.info) { S.info = false; anzeigen(); }
});

// ---------- Start ----------
(async () => {
  document.title = C.titel;
  $('#startTitel').textContent = C.titel;
  $('#startUntertitel').textContent = C.untertitel;
  const welt3d = await import('./scene3d.js');
  if (!welt3d.webglMoeglich()) throw Object.assign(new Error(C.keinWebGL), { anzeigen: true });
  welt = new welt3d.Welt($('#welt'), C);
  new ResizeObserver(() => welt.resize()).observe($('#welt'));
  modus('start');
  window.__wohnen = { S, welt: () => welt, modus, schritt, weiter, zuruecksetzen, experimentZahlen, variantenZahlen };
  window.__wohnenOk = true;
  $('#laden').hidden = true;
  requestAnimationFrame(frame);
})().catch((e) => {
  console.error(e);
  $('#laden').hidden = true;
  const f = $('#fehler');
  f.textContent = e && e.anzeigen ? e.message : C.ladefehler + ' (' + (e && e.message ? e.message : e) + ')';
  f.hidden = false;
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
}
