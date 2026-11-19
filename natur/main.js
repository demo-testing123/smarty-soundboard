/* Bedienung: Abschnitte nach Drehbuch, Teilschritte, Anzeigen, Tasten. Bilder aus scene3d.js, Werte aus model.js. */
import { CONFIG } from './config.js';

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
const S = { modus: 'start', schritt: 0, wahl: null, waerme: false, info: false, beschriftung: true };
const MODI = ['grau', 'abstimmung', 'beides', 'sommer', 'regen', 'ende'];
const SCHRITTE = { grau: C.grau.schritte, abstimmung: C.abstimmung.schritte, beides: C.beides.schritte, sommer: C.sommer.schritte, regen: C.regen.schritte, ende: [] };

/* ---------- Abschnitt und Schritt ---------- */
function modus(m) {
  S.modus = m;
  S.schritt = 0;
  S.waerme = false;
  if (m !== 'abstimmung') S.wahl = null;
  anwenden(-1);
  anzeigen();
}
function schritt(i) {
  const vorher = S.schritt;
  S.schritt = i;
  anwenden(vorher);
  anzeigen();
}
function weiter(r) {
  if (S.modus === 'start') { if (r > 0) modus('grau'); return; }
  const n = SCHRITTE[S.modus].length;
  if (!n) return;
  const i = Math.max(0, Math.min(n - 1, S.schritt + r));
  if (i !== S.schritt) schritt(i);
}
function zuruecksetzen() { if (S.modus !== 'start') modus(S.modus); }

// 3D-Zustand je Abschnitt/Schritt. vorher = vorheriger Schritt im selben Abschnitt (-1 = neu betreten)
function anwenden(vorher) {
  const m = S.modus, i = S.schritt;
  welt.setzeWaerme(false);
  welt.setzeTiere(false);
  welt.setzeKinder(false);
  const grau = () => { welt.setzeZustand('grau'); welt.wasserSetzen({ neu: true }); };
  const gruen = (zisterne = 0.6) => { welt.setzeZustand('gruen'); welt.wasserSetzen({ neu: true, zisterne }); };

  if (m === 'start' || m === 'grau' || m === 'abstimmung') grau();
  else if (m === 'beides') {
    if (i === 0) grau();
    else if (vorher !== 1) { welt.wasserSetzen({ neu: true }); welt.verwandeln(); welt.wasserZiel({ zisterne: 0.6 }); }
    welt.setzeTiere(true); welt.setzeKinder(true);
  } else if (m === 'sommer') {
    if (i === 0) grau(); else gruen();
    welt.setzeKinder(i > 0);
    welt.setzeTiere(i === 2);
    welt.setzeWaerme(S.waerme);
  } else if (m === 'regen') {
    if (i === 0) { grau(); welt.wasserSetzen({ neu: true, regen: true }); }
    else if (i === 1) { gruen(0.3); welt.wasserSetzen({ neu: true, regen: true, zisterne: 0.3 }); }
    else {
      if (welt.zustand !== 'gruen') welt.setzeZustand('gruen');
      // direkt angesprungen: so tun, als hätte es gerade geregnet
      if (vorher !== 1 && vorher !== 2 && vorher !== 3) welt.wasserZiel({ mulde: i === 2 ? 1 : 0, tief: i === 2 ? 1 : 0, zisterne: 0.95 });
      welt.wasserSetzen({ regen: false, giessen: i === 3 });
      welt.setzeKinder(true);
    }
  } else if (m === 'ende') {
    gruen(0.8);
    welt.wasserZiel({ mulde: 0, tief: 0, zisterne: 0.8 });
    welt.setzeTiere(true); welt.setzeKinder(true);
  }
}

/* ---------- Anzeigen ---------- */
function knopf(text, aktion, aktiv = false, taste = null, extra = '') {
  return h('button', { type: 'button', class: 'sub ' + extra, 'aria-pressed': String(aktiv), onclick: (e) => { e.currentTarget.blur(); aktion(); } }, text, taste ? h('kbd', {}, taste) : null);
}

function anzeigen() {
  const m = S.modus, i = S.schritt;
  document.body.dataset.modus = m;
  document.querySelectorAll('#haupt [data-modus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modus === m)));
  $('#btnInfo').setAttribute('aria-pressed', String(S.info));
  $('#startbild').hidden = m !== 'start';

  // Titel und Frage
  const titel = { grau: C.grau.titel, abstimmung: C.abstimmung.titel, beides: C.beides.titel, sommer: C.sommer.titel, regen: C.regen.titel, ende: C.ende.titel }[m];
  $('#kopf').hidden = !titel;
  $('#titel').textContent = titel || '';
  const frage = m === 'grau' ? C.grau.fragen[i] : m === 'abstimmung' && i === 1 ? C.abstimmung.frage : m === 'sommer' ? C.sommer.frage : m === 'regen' && i === 0 ? C.regen.frage : '';
  $('#frage').hidden = !frage;
  $('#frage').textContent = frage;

  // Schrittleiste
  const sub = $('#sub');
  sub.innerHTML = '';
  (SCHRITTE[m] || []).forEach((name, k) => sub.append(knopf(name, () => schritt(k), k === i, null, k === i + 1 ? 'wichtig' : '')));
  if (m === 'sommer') sub.append(knopf(C.sommer.waerme.knopf, waermeUmschalten, S.waerme, 'W'));
  if (m === 'regen' || m === 'ende') sub.append(knopf('Beschriftungen', beschriftungUmschalten, S.beschriftung, 'L'));
  sub.hidden = !sub.children.length;

  // Tafel rechts
  const panel = $('#panel');
  panel.innerHTML = '';
  if (m === 'abstimmung') {
    panel.append(h('div', { class: 'abst' }, C.abstimmung.karten.map((k) =>
      h('button', { type: 'button', class: k.id, 'aria-pressed': String(S.wahl === k.id), onclick: (e) => { e.currentTarget.blur(); waehlen(k.id); } }, h('b', {}, k.id), h('span', {}, k.titel)))));
    if (S.wahl) panel.append(h('p', { class: 'entschieden' }, C.abstimmung.entschieden));
  } else if (m === 'beides') {
    panel.append(h('p', { class: 'loesung' }, C.beides.titel.replace('Die Lösung: ', 'Die Lösung:\n').toUpperCase()));
    if (i === 0) panel.append(h('button', { type: 'button', class: 'sub gross', onclick: (e) => { e.currentTarget.blur(); schritt(1); } }, '✨ ' + C.beides.knopf));
  } else if (m === 'sommer' && S.waerme) {
    panel.append(h('ul', { class: 'legende' }, C.sommer.waerme.legende.map(([k, t]) => h('li', {}, h('i', { class: k }), t))));
  } else if (m === 'regen') {
    panel.append(
      h('p', { class: 'regenstatus' + (i <= 1 ? ' an' : '') }, h('i'), i <= 1 ? 'Es regnet stark' : 'Regen vorbei'),
      h('div', { class: 'textkarte grau' + (i === 0 ? '' : ' blass') }, C.regen.versiegelt),
      h('div', { class: 'textkarte offen' + (i === 0 ? ' blass' : '') }, C.regen.offen),
    );
  } else if (m === 'ende') {
    panel.append(h('ul', { class: 'punkte' }, C.ende.punkte.map((t) => h('li', {}, t))), h('p', { class: 'satz' }, C.ende.satz));
  }
  panel.hidden = !panel.children.length;

  // Fußnote
  const fuss = m === 'regen' ? C.regen.hinweis : m === 'sommer' && S.waerme ? C.sommer.waerme.hinweis : '';
  $('#fussnote').hidden = !fuss;
  $('#fussnote').textContent = fuss;

  // Moderation
  $('#info').hidden = !S.info;
  $('#infoListe').innerHTML = '';
  for (const n of C.moderation[m] || []) $('#infoListe').append(h('li', {}, n));
}

function waehlen(id) { S.wahl = S.wahl === id ? null : id; anzeigen(); }
function beschriftungUmschalten() { S.beschriftung = !S.beschriftung; anzeigen(); }
function waermeUmschalten() { if (S.modus !== 'sommer') return; S.waerme = !S.waerme; welt.setzeWaerme(S.waerme); anzeigen(); }

/* ---------- Beschriftungen an 3D-Punkten ---------- */
const LABELS = [1, 2, 3, 4, 5].map((k) => $('#lbl' + k));
function beschriftungen() {
  const m = S.modus, i = S.schritt, L = C.regen.labels, liste = [];
  const fertigGruen = welt.zustand === 'gruen' && !welt.verwandlungLaeuft();
  if (m === 'beides' && i === 1 && fertigGruen) {
    const b = C.beides.labels;
    liste.push(['turm', b.spielen, ''], ['baeume', b.baeume, 'gruen'], ['wiese', b.wiese, 'gruen'], ['wild', b.wild, 'gruen']);
  } else if (m === 'sommer') {
    const b = C.sommer.labels;
    if (i === 0) liste.push(['stein', b.stein, 'warn']);
    if (i >= 1) liste.push(['schatten', b.schatten, 'gruen']);
    if (i === 2) liste.push(['tiere', b.tiere, 'gruen']);
  } else if (m === 'regen') {
    if (i === 0) liste.push(['abfluss', L.abfluss, 'wasser']);
    if (i === 1) liste.push(['tief', L.tief, 'wasser'], ['mulde', L.mulde, 'wasser'], ['zisterne', L.zisterne, 'wasser']);
    if (i === 2) liste.push(['tief', welt.wasser.gesperrt ? L.gesperrt : L.frei, welt.wasser.gesperrt ? 'warn' : 'gruen'], ['zisterne', L.zisterne, 'wasser']);
    if (i === 3) liste.push(['giessen', L.giessen, 'wasser'], ['zisterne', L.zisterne, 'wasser']);
  } else if (m === 'ende') {
    const [a, b, c, d] = C.ende.punkte;
    liste.push(['schatten', a, 'gruen'], ['tiere', b, 'gruen'], ['turm', c, ''], ['tief', d, 'wasser']);
  }
  if (S.beschriftung === false) liste.length = 0;                       // Schalter „Beschriftungen“ aus: Wasser ganz frei
  // Starkregen und Endbild: Schilder als Randlegende links mit feiner Linie zum Punkt – nichts liegt über dem Wasser
  const rand = m === 'regen' || m === 'ende';
  if (rand) { randlegende(liste); return; }
  linienSetzen([]);
  // Nur ändern, was sich geändert hat (kein Neu-Layout in jedem Bild); überlappende Schilder weichen nach oben aus
  const belegt = [];
  LABELS.forEach((el, k) => {
    const e = liste[k], pt = e && welt.bildpunkt(e[0]), st = LABEL_STAND[k];
    if (!pt) { if (st.sichtbar) { el.hidden = true; st.sichtbar = false; } return; }
    if (!st.sichtbar) { el.hidden = false; st.sichtbar = true; st.w = 0; }
    if (st.text !== e[1] || st.klasse !== e[2]) {
      el.textContent = e[1]; el.className = 'label ' + e[2];
      st.text = e[1]; st.klasse = e[2]; st.w = 0;
    }
    if (!st.w) { st.w = el.offsetWidth; st.h = el.offsetHeight; }
    let y = Math.round(pt.y);
    const x = Math.round(pt.x), rand = 6;
    for (let n = 0; n < 8; n++) {
      const hit = belegt.find((b) => x - st.w / 2 < b.r && x + st.w / 2 > b.l && y - st.h < b.u && y > b.o);
      if (!hit) break;
      y = Math.round(hit.o - rand);
    }
    belegt.push({ l: x - st.w / 2, r: x + st.w / 2, o: y - st.h, u: y });
    if (st.x !== x || st.y !== y) { el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; st.x = x; st.y = y; }
  });
}
const LABEL_STAND = LABELS.map(() => ({ text: '', klasse: '', sichtbar: false, w: 0, h: 0, x: NaN, y: NaN }));
let linienAlt = '';
function linienSetzen(linien) {
  const svg = $('#linien'), neu = JSON.stringify(linien);
  if (neu === linienAlt) return;
  linienAlt = neu;
  svg.innerHTML = linien.map(([x1, y1, x2, y2, farbe]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${farbe}" stroke-width="2"/><circle cx="${x2}" cy="${y2}" r="5" fill="#fff" stroke="${farbe}" stroke-width="2.5"/>`).join('');
}
const FARBE = { wasser: '#1d4ed8', gruen: '#15803d', warn: '#b45309', '': '#0f172a' };
function randlegende(liste) {
  const W = $('#welt').clientWidth, H = $('#welt').clientHeight, rand = Math.round(H * 0.025), abstand = Math.round(H * 0.085);
  const punkte = liste.map((e) => [e, welt.bildpunkt(e[0])]).filter(([, pt]) => pt).sort((a, b) => a[1].y - b[1].y);
  const linien = [];
  let y = Math.round(H * 0.3);
  LABELS.forEach((el, k) => {
    const st = LABEL_STAND[k], eintrag = punkte[k];
    if (!eintrag) { if (st.sichtbar) { el.hidden = true; st.sichtbar = false; } return; }
    const [e, pt] = eintrag;
    if (!st.sichtbar) { el.hidden = false; st.sichtbar = true; st.w = 0; }
    if (st.text !== e[1] || st.klasse !== 'rand ' + e[2]) { el.textContent = e[1]; el.className = 'label rand ' + e[2]; st.text = e[1]; st.klasse = 'rand ' + e[2]; st.w = 0; }
    if (!st.w) { st.w = el.offsetWidth; st.h = el.offsetHeight; }
    if (st.x !== rand || st.y !== y) { el.style.transform = `translate(${rand}px, ${y}px) translate(0, -50%)`; st.x = rand; st.y = y; }
    linien.push([rand + st.w, y, Math.round(pt.x), Math.round(pt.y), FARBE[e[2]] || FARBE['']]);
    y += abstand;
  });
  linienSetzen(linien);
}

/* ---------- Schleife ---------- */
function frame(now) {
  welt.render(now);
  beschriftungen();
  requestAnimationFrame(frame);
}

/* ---------- Vollbild, Tasten ---------- */
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
  start: () => modus('start'), ...Object.fromEntries(MODI.map((m) => [m, () => modus(m)])),
  reset: zuruecksetzen, info: () => { S.info = !S.info; anzeigen(); }, vollbild,
};
document.querySelectorAll('[data-aktion]').forEach((b) => b.addEventListener('click', (e) => { e.currentTarget.blur(); aktionen[b.dataset.aktion](); }));

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const map = { '0': 'start', 'Home': 'start', '1': 'grau', '2': 'abstimmung', '3': 'beides', '4': 'sommer', '5': 'regen', '6': 'ende', 'r': 'reset', 'i': 'info', 'f': 'vollbild' };
  if (map[k]) { e.preventDefault(); aktionen[map[k]](); return; }
  if ((k === 'a' || k === 'b') && S.modus === 'abstimmung') { e.preventDefault(); waehlen(k.toUpperCase()); return; }
  if (k === 'w') { e.preventDefault(); waermeUmschalten(); return; }
  if (k === 'l' && (S.modus === 'regen' || S.modus === 'ende')) { e.preventDefault(); beschriftungUmschalten(); return; }
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); weiter(1); return; }
  if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); weiter(-1); return; }
  if (k === 'Escape' && S.info) { S.info = false; anzeigen(); }
});

/* ---------- Start ---------- */
(async () => {
  document.title = C.titel;
  $('#startTitel').textContent = C.titel;
  $('#startUntertitel').textContent = C.untertitel;
  const welt3d = await import('./scene3d.js');
  if (!welt3d.webglMoeglich()) throw Object.assign(new Error(C.keinWebGL), { anzeigen: true });
  welt = new welt3d.Welt($('#welt'), C);
  new ResizeObserver(() => { welt.resize(); LABEL_STAND.forEach((s) => { s.w = 0; s.x = NaN; }); }).observe($('#welt'));
  modus('start');
  window.__natur = { S, welt: () => welt, modus, schritt, weiter, zuruecksetzen, waermeUmschalten, waehlen, beschriftungUmschalten, bild: (t) => { welt.render(t ?? performance.now()); beschriftungen(); } };
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
