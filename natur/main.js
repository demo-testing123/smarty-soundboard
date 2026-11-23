/* Bedienung des Sensorlabors: vier Schritte (Klick auf eine Fläche, Zurück/Weiter), zwei Sensoranzeigen, Regel in Schritt 4.
 * Werte aus model.js (Sensorlabor), Bild aus scene3d.js. Jeder Schritt setzt beim Betreten seine Startwerte – wiederholbar
 * vorführbar ohne Zurücksetzen. Keine Hardware, keine Datenübertragung, kein Ton. */
import { CONFIG } from './config.js';
import { Sensorlabor, bodenStatus } from './model.js';

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
const lab = new Sensorlabor(C);

/* ---------- Schritte ---------- */
function schritt(i) {
  lab.setzeSchritt(i);
  if (welt) { welt.setze(zustand()); welt.sofort(); }
  anzeigeAlt = '';
  anzeigen();
}
const zustand = () => ({ regen: !!lab.s.regen, sonne: !!lab.s.sonne, wasser: lab.wasser / 100, feuchte: lab.feuchte / 100, mulde: lab.mulde, bewaesserung: lab.bewaesserung, zufluss: !!lab.s.zufluss });

/* ---------- Anzeigen (nur bei Änderung neu schreiben) ---------- */
let anzeigeAlt = '';
function anzeigen() {
  const s = lab.s, a = lab.anzeige(), r = C.regel;
  const schluessel = [lab.i, a.wasser, a.feuchte, lab.phase, lab.pruefStufe, lab.grund].join('|');
  if (schluessel === anzeigeAlt) return;
  anzeigeAlt = schluessel;
  // Schrittflächen
  document.querySelectorAll('.kachel').forEach((k, n) => { if (n === lab.i) k.setAttribute('aria-current', 'step'); else k.removeAttribute('aria-current'); });
  $('#zurueck').disabled = lab.i === 0;
  $('#weiter').disabled = lab.i === C.schritte.length - 1;
  // Text zum Schritt
  let text = s.text;
  if (s.regelpruefung && lab.phase === 'ein') text = s.textEin;
  if (s.regelpruefung && lab.phase === 'aus') text = lab.grund === 'feucht' ? s.textAus : `${C.regelText.aus}: ${lab.grund === 'leer' ? C.regelText.grundLeer : C.regelText.grundNass}.`;
  const st = $('#schrittText');
  st.replaceChildren(h('b', {}, `${lab.i + 1} · ${s.titel}: `), text);
  // Sensoranzeigen (genau zwei)
  $('#wertWasser').textContent = a.wasser;
  $('#balkenWasser').style.width = `${a.wasser}%`;
  $('#statusWasser').textContent = lab.wasser >= r.minWasser ? C.status.wasserDa : C.status.wasserLeer;
  $('#anzeigeWasser').dataset.status = lab.wasser >= r.minWasser ? 'da' : 'leer';
  const bs = bodenStatus(lab.feuchte, r);
  $('#wertFeuchte').textContent = a.feuchte;
  $('#balkenFeuchte').style.width = `${a.feuchte}%`;
  $('#statusFeuchte').textContent = C.status[bs];
  $('#anzeigeFeuchte').dataset.status = bs;
  // Regel der Steuerung: nur im Schritt „Bewässern“, sichtbar geprüft (erst Bedingung 1, dann 2, dann Ergebnis)
  const regel = $('#regel');
  regel.hidden = !s.regelpruefung;
  if (s.regelpruefung) {
    const ps = lab.pruefStufe;
    const setzeBed = (el, sichtbar, ok) => { el.classList.toggle('ja', sichtbar && ok); el.classList.toggle('nein', sichtbar && !ok); };
    // während EIN: das Ergebnis der Prüfung beim Start; nach AUS: die Regel mit den aktuellen Werten (Boden jetzt feucht → nicht mehr trocken)
    const start = lab.phase === 'ein';
    setzeBed($('#bed1'), ps >= 1, start || lab.bedingung1);
    setzeBed($('#bed2'), ps >= 2, start || lab.bedingung2);
    const e = $('#ergebnis');
    e.className = 'ergebnis' + (ps < 3 ? '' : lab.bewaesserung ? ' an' : ' aus');
    e.textContent = ps < 3 ? '→ …' : lab.bewaesserung ? `→ ${C.regelText.ein}` : `→ ${C.regelText.aus}`;
  }
}

/* ---------- Beschriftungen an 3D-Punkten ---------- */
const LABELS = [1, 2, 3].map((k) => $('#lbl' + k));
const LABEL_STAND = LABELS.map(() => ({ text: '', sichtbar: false, w: 0, h: 0, x: NaN, y: NaN }));
const KLASSE = { mulde: 'wasser', zisterne: 'wasser', wasserSensor: 'wasser', bodenSensor: 'boden', bewaesserung: 'wasser' };
function beschriftungen() {
  const namen = lab.s.labels || [], belegt = [];
  LABELS.forEach((el, k) => {
    const name = namen[k], pt = name && welt.bildpunkt(name), st = LABEL_STAND[k];
    if (!pt) { if (st.sichtbar) { el.hidden = true; st.sichtbar = false; } return; }
    if (!st.sichtbar) { el.hidden = false; st.sichtbar = true; st.w = 0; }
    const text = C.labels[name];
    if (st.text !== text) { el.textContent = text; el.className = 'label ' + (KLASSE[name] || ''); st.text = text; st.w = 0; }
    if (!st.w) { st.w = el.offsetWidth; st.h = el.offsetHeight; }
    const x = Math.round(pt.x);
    let y = Math.round(pt.y) - 8;
    for (let n = 0; n < 6; n++) {                       // überlappende Schilder weichen nach oben aus
      const hit = belegt.find((b) => x - st.w / 2 < b.r && x + st.w / 2 > b.l && y - st.h < b.u && y > b.o);
      if (!hit) break;
      y = Math.round(hit.o - 6);
    }
    belegt.push({ l: x - st.w / 2, r: x + st.w / 2, o: y - st.h, u: y });
    if (st.x !== x || st.y !== y) { el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; st.x = x; st.y = y; }
  });
}

/* ---------- Schleife: Modell laufen lassen, Bild und Anzeigen nachziehen ---------- */
let letzte = performance.now();
function takt(jetzt) {
  const dt = Math.min(0.1, Math.max(0, (jetzt - letzte) / 1000));
  letzte = jetzt;
  if (!lab.fertig) lab.schritt(dt);
  welt.setze(zustand());
  if (welt.render(jetzt)) beschriftungen();
  anzeigen();
}
function frame(jetzt) { takt(jetzt); requestAnimationFrame(frame); }

/* ---------- Vollbild, Tasten (nicht nötig, aber praktisch: ← → 1–4 F) ---------- */
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
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); if (lab.i < C.schritte.length - 1) schritt(lab.i + 1); return; }
  if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); if (lab.i > 0) schritt(lab.i - 1); return; }
  if (/^[1-4]$/.test(k)) { e.preventDefault(); schritt(Number(k) - 1); return; }
  if (k === 'f') { e.preventDefault(); vollbild(); }
});

/* ---------- Start ---------- */
(async () => {
  document.title = 'Sensorlabor Regenwasser';
  $('#titel').textContent = C.titel;
  $('#kennzeichnung').textContent = C.kennzeichnung;
  $('#titelWasser').textContent = C.anzeigen.wasser.titel;
  $('#titelFeuchte').textContent = C.anzeigen.feuchte.titel;
  $('#regelTitel').textContent = C.regelText.titel;
  $('#bed1 span').textContent = `${C.regelText.b1} (unter ${C.regel.trocken} %)`;
  $('#bed2 span').textContent = `${C.regelText.b2} (mindestens ${C.regel.minWasser} %)`;
  $('#kacheln').replaceChildren(...C.schritte.map((s, n) => h('button', { type: 'button', class: 'kachel', title: `${s.titel} (Taste ${n + 1})`, onclick: (ev) => { ev.currentTarget.blur(); schritt(n); } }, h('span', { class: 'n' }, String(n + 1)), h('span', {}, s.kurz))));
  $('#zurueck').addEventListener('click', (ev) => { ev.currentTarget.blur(); if (lab.i > 0) schritt(lab.i - 1); });
  $('#weiter').addEventListener('click', (ev) => { ev.currentTarget.blur(); if (lab.i < C.schritte.length - 1) schritt(lab.i + 1); });
  $('#vollbild').addEventListener('click', (ev) => { ev.currentTarget.blur(); vollbild(); });
  const welt3d = await import('./scene3d.js');
  if (!welt3d.webglMoeglich()) throw Object.assign(new Error(C.keinWebGL), { anzeigen: true });
  welt = new welt3d.Welt($('#welt'));
  new ResizeObserver(() => { welt.resize(); LABEL_STAND.forEach((s) => { s.w = 0; s.x = NaN; }); }).observe($('#welt'));
  schritt(0);
  // Prüfhilfe (test.html): Modell gezielt laufen lassen, auch wenn der Browser keine Bilder anfordert (ausgeblendeter Tab)
  window.__natur = {
    lab, C, welt: () => welt, schritt,
    lauf(sekunden, dt = 0.05) { for (let t = 0; t < sekunden; t += dt) { if (!lab.fertig) lab.schritt(dt); } welt.setze(zustand()); welt.render(performance.now()); beschriftungen(); anzeigen(); return lab.anzeige(); },
    bild() { welt.setze(zustand()); welt.dirty = true; welt.render(performance.now()); beschriftungen(); anzeigen(); },
  };
  window.__naturOk = true;
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
